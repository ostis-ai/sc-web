#!/bin/bash

nodeVersion=$(apt-cache policy nodejs | grep -oP "(?<=Candidate:\s)(.+)(?=)")
if [[ "${nodeVersion}" =~ ^8\.10\.0~dfsg-2ubuntu0\.[3-9] ]] # 8.10.0~dfsg-2ubuntu0.3+ conflicts with libcurl4-openssl-dev
then
	sudo apt-get install -y nodejs=8.10.0~dfsg-2ubuntu0.2 nodejs-dev=8.10.0~dfsg-2ubuntu0.2
else
	sudo apt-get install -y nodejs
fi

sudo apt-get install -y npm
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
echo "Installing grunt"
sudo npm install -g grunt-cli
