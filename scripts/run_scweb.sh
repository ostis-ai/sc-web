#!/bin/bash

cd ../server/
CONFIG_FILE_PATH="../../sc-machine/config/sc-machine.ini"
if [ $# -ne 0 ]; then
    CONFIG_FILE_PATH=$1
fi
echo $CONFIG_FILE_PATH
# python3 app.py --cfg=$CONFIG_FILE_PATH
cd -
