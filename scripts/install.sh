#!/usr/bin/env bash
set -eo pipefail

CURRENT_DIR=$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)
source "${CURRENT_DIR}/formats.sh"

stage "Installation"

"${CURRENT_DIR}/install_deps_ubuntu.sh"

"${CURRENT_DIR}/build_sc_web.sh"
