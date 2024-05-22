#!/usr/bin/env bash
set -eo pipefail

if [ -z "${SC_WEB_PATH}" ];
then
  source "$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)"/set_vars.sh
fi

source "${SC_WEB_PATH}/.venv/bin/activate"
python3 "${SC_WEB_PATH}/server/app.py" "$@"
