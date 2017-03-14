#!/bin/bash

sudo apt-get install nodejs
sudo apt-get install npm
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
echo "Installing grunt"
sudo npm install -g grunt-cli
