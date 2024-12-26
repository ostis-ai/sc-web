#!/usr/bin/env bash
set -eo pipefail

SC_WEB_PATH="$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd)"

python3 -m venv "${SC_WEB_PATH}/.venv"
source "${SC_WEB_PATH}/.venv/bin/activate"
pip3 install wheel setuptools
pip3 install -r "${SC_WEB_PATH}/requirements.txt"
