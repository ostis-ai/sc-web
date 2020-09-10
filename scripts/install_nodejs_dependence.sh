#!/bin/bash

sudo apt-get install -y npm
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
echo "Installing grunt"
sudo npm install -g grunt-cli
