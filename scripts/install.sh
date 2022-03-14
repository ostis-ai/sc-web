./install_deps.sh
npm install
grunt build

echo "Copy server.conf\n"
mv ../server.conf ../server
