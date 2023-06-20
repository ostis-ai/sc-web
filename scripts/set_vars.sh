#!/usr/bin/env bash
set -eo pipefail

APP_ROOT_PATH=$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd)

export APP_ROOT_PATH="${APP_ROOT_PATH}"
export SC_WEB_PATH="${APP_ROOT_PATH}"
export SCRIPTS_PATH="${SC_WEB_PATH}"/scripts
