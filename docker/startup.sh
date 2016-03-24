#!/bin/bash

cd /home
git clone https://github.com/nobita-isc/annotator-store.git
cd /home/annotator-store
cp annotator.cfg.example annotator.cfg

# start virtualenv
virtualenv pyenv
source pyenv/bin/activate
pip install -e .[flask]
python run.py

