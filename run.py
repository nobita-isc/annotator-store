#!/usr/bin/env python
"""
run.py: A simple example app for using the Annotator Store blueprint

This file creates and runs a Flask[1] application which mounts the Annotator
Store blueprint at its root. It demonstrates how the major components of the
Annotator Store (namely the 'store' blueprint, the annotation model and the
auth and authz helper modules) fit together, but it is emphatically NOT
INTENDED FOR PRODUCTION USE.

[1]: http://flask.pocoo.org
"""

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

# sha256 hash of the string
# 'Manga Annotation Application will bring us a bright future'
APP_KEY = 'd0e1bce08234f4c822f469bb576318e46e651e29baa03735bfe1e0146c390e7d'
# sha256 hash of the string 'congdongvietnhat@vietnam123'
SECRET_KEY = '7817b11e9ff77f249ab76e722e145f40b1def75e376f220c649254456c6ccace'

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

    @app.before_request
    def before_request(request):
        # Setting authentication
        # Getting current user and checking for permission
        if current_app.config['AUTH_ON']:
            g.auth = auth.Authenticator(lambda x: auth.Consumer(APP_KEY, SECRET_KEY))

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
