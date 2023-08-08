#!/usr/bin/env bash
set -eo pipefail

if [ -z "${SC_WEB_PATH}" ];
then
  source "$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)"/set_vars.sh
fi

sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo chmod a+r /usr/share/keyrings/nodesource.gpg
sudo apt-get update
sudo apt-get install --no-install-recommends -y python3 python3-pip nodejs
sudo apt-get autoremove

pip3 install -r "${SC_WEB_PATH}/requirements.txt"

cd "${SC_WEB_PATH}" && npm install
