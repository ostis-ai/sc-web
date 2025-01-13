#!/usr/bin/env bash
set -eo pipefail

SC_WEB_PATH=$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd)

source "${SC_WEB_PATH}/.venv/bin/activate"
python3 "${SC_WEB_PATH}/server/app.py" "$@"
