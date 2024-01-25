#!/usr/bin/env bash
set -eo pipefail

CURRENT_DIR=$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Installation\v${NC}"

"${CURRENT_DIR}/install_deps_ubuntu.sh"

echo -e "${BLUE}\vDeps\v${NC}"

pip3 install -r "${CURRENT_DIR}/../requirements.txt" && npm install

"${CURRENT_DIR}/build_sc_web.sh"