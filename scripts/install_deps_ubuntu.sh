#!/usr/bin/env bash
set -eo pipefail

if [ -z "${SC_WEB_PATH}" ];
then
  source "$(cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd)"/set_vars.sh
fi

packages=(
  python3
  python3-pip
  nodejs
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

sudo apt-get install curl
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo chmod a+r /usr/share/keyrings/nodesource.gpg
sudo apt-get update
sudo apt-get install --no-install-recommends -y "${packages[@]}"
sudo apt-get autoremove
