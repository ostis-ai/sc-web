#!/bin/bash

cd ../server/
if [ $# -ne 0 ]; then
    python3 app.py --cfg=$1
else
    python3 app.py
fi
cd -
