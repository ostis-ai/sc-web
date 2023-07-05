#!/usr/bin/env bash
set -eo pipefail

CURRENT_DIR=$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)
source "${CURRENT_DIR}/formats.sh"

if [ -z "${SC_WEB_PATH}" ];
then
  source "${CURRENT_DIR}/set_vars.sh"
fi

stage "Build sc-web"

cd "${SC_WEB_PATH}"
npm run build

stage "SC-web built successfully"
