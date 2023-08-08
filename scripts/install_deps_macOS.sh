#!/usr/bin/env bash
set -eo pipefail

if [ -z "${SC_WEB_PATH}" ];
then
  source "$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)"/set_vars.sh
fi

brew install curl
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo chmod a+r /usr/share/keyrings/nodesource.gpg
brew update
brew install python3
brew install node

pip3 install -r "${SC_WEB_PATH}/requirements.txt"

cd "${SC_WEB_PATH}" && npm install
