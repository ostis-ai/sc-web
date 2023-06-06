#!/usr/bin/env bash
set -eo pipefail

"$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)"/install_deps_ubuntu.sh
