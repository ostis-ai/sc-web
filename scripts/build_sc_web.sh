#!/usr/bin/env bash
set -eo pipefail

CURRENT_DIR=$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)
source "${CURRENT_DIR}/formats.sh"

if [ -z "${SC_WEB_PATH}" ];
then
  source "${CURRENT_DIR}/set_vars.sh"
fi

stage "Build sc-web"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "${SC_WEB_PATH}"
NODE_MAJOR=16

nvm use ${NODE_MAJOR}
npm run build

stage "SC-web built successfully"
