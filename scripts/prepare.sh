echo -en '\E[47;31m'"\033[1mBuild sc-wer-core.js\033[0m\n"
tput sgr0

./prepare_js.sh

cd ../sc_web

echo -en '\E[47;31m'"\033[1mSync DB\033[0m\n"
tput sgr0
python manage.py syncdb

echo -en '\E[47;31m'"\033[1mMigrate DB\033[0m\n"
tput sgr0
python manage.py migrate
