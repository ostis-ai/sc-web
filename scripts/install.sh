#!/usr/bin/env bash
set -eo pipefail

CURRENT_DIR=$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)
source "${CURRENT_DIR}/formats.sh"

stage "Install dependencies"

"${CURRENT_DIR}/install_dependencies.sh"

"${CURRENT_DIR}/build_sc_web.sh"

stage "SC-web installed successfully"
