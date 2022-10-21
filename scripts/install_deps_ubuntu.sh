#!/usr/bin/env bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo chmod a+r /usr/share/keyrings/nodesource.gpg
sudo apt update
sudo apt install --no-install-recommends -y python3 python3-pip nodejs
