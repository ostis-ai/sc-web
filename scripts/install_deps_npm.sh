#!/usr/bin/env bash
set -eo pipefail

SC_WEB_PATH="$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && cd .. && pwd)"

cd "${SC_WEB_PATH}" && npm install
