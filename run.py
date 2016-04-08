#!/usr/bin/env python
from __future__ import print_function

import os
import logging
import sys
import time

from flask import Flask, g, current_app
import elasticsearch
from annotator import es, annotation, auth, authz, document, store

logging.basicConfig(format='%(asctime)s %(process)d %(name)s [%(levelname)s] '
                           '%(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    level=logging.INFO)
logging.getLogger('elasticsearch').setLevel(logging.WARN)
logging.getLogger('urllib3').setLevel(logging.WARN)
log = logging.getLogger('annotator')

here = os.path.dirname(__file__)

def main(argv):
    app = Flask(__name__)

    cfg_file = 'annotator.cfg'
    if len(argv) == 2:
        cfg_file = argv[1]

    cfg_path = os.path.join(here, cfg_file)

    try:
        app.config.from_pyfile(cfg_path)
    except IOError:
        print("Could not find config file %s" % cfg_path, file=sys.stderr)
        print("Perhaps copy annotator.cfg.example to annotator.cfg",
              file=sys.stderr)
        sys.exit(1)

    if app.config.get('ELASTICSEARCH_HOST') is not None:
        es.host = app.config['ELASTICSEARCH_HOST']

    # We do need to set this one (the other settings have fine defaults)
    default_index = app.name
    es.index = app.config.get('ELASTICSEARCH_INDEX', default_index)

    if app.config.get('AUTHZ_ON') is not None:
        es.authorization_enabled = app.config['AUTHZ_ON']

    CONSUMER_KEY = os.environ.get('CONSUMER_KEY', 'consumer-key')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'secret-key')

    @app.before_request
    def before_request():
        # Setting authentication
        # Getting current user and checking for permission
        if current_app.config['AUTH_ON']:
            g.auth = auth.Authenticator(lambda x: auth.Consumer(CONSUMER_KEY, SECRET_KEY))

        # Setting authorization
        if current_app.config['AUTHZ_ON']:
            g.authorize = authz.authorize

    app.register_blueprint(store.store)

    # Expose address for external access (ANY BIND)
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 80))
    app.run(host=host, port=port)

if __name__ == '__main__':
    main(sys.argv)
