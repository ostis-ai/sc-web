#!/bin/bash
APP_ROOT_PATH=$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd)

python3 "$APP_ROOT_PATH"/server/app.py "$@"
