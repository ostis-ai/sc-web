#!/usr/bin/env bash
set -eo pipefail

if [ -z "${SC_WEB_PATH}" ];
then
  source "$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)"/set_vars.sh
fi

brew install python3 node

pip3 install -r "${SC_WEB_PATH}/requirements.txt"

cd "${SC_WEB_PATH}" && npm install
