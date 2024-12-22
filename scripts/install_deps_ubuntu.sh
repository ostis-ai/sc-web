#!/usr/bin/env bash
set -eo pipefail

SCRIPTS_PATH="$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)"

packages=(
  python3
  python3-pip
  python3-venv
)

if ! command -v apt> /dev/null 2>&1;
then
  RED='\033[22;31m'
  NC='\033[0m' # No Color
  echo -e "${RED}[ERROR] Apt command not found. Debian-based distros are the only officially supported.
Please install the following packages by yourself:
  ${packages[*]}
At the end run the following commands:
  ${SC_WEB_PATH}/scripts/install_deps_npm.sh
  ${SC_WEB_PATH}/scripts/install_deps_python.sh${NC}"
  exit 1
fi

sudo apt-get install -y ca-certificates curl gnupg
sudo apt-get update
sudo apt-get install --no-install-recommends -y "${packages[@]}"
sudo apt-get autoremove

export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

NODE_MAJOR=16

nvm install ${NODE_MAJOR} 
nvm use ${NODE_MAJOR} 

"${SCRIPTS_PATH}/install_deps_npm.sh"
"${SCRIPTS_PATH}/install_deps_python.sh"
