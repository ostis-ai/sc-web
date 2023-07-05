#!/usr/bin/env bash
set -eo pipefail

YELLOW='\033[01;33m'
NC='\033[0m' # No Color
echo -e "${YELLOW}[WARNING] This script was deprecated in sc-web 0.8.0.
Please, use scripts/build_sc_web.sh instead. It will be removed in sc-web 0.9.0.${NC}"

npm install
npm run build
