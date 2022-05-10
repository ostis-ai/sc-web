#nodejs stage to build frontent 
FROM node:16-alpine AS web-buildenv

WORKDIR /ostis/sc-web   
#Install sc-web build-time dependencies
RUN npm install -g grunt-cli
COPY . .
#Build sc-web
RUN npm install && grunt build


FROM debian:bullseye-slim as runtime 
USER root

#install runtime dependencies
RUN apt update && apt --no-install-recommends -y install python3-pip python3 python3-rocksdb
RUN python3 -m pip install --no-cache-dir --default-timeout=100 future tornado sqlalchemy numpy configparser progress

COPY --from=web-buildenv /ostis/sc-web /ostis/sc-web
#This is necessary because we rely on a fallback kb.bin path ("../../kb.bin")
WORKDIR /ostis/sc-web/server

EXPOSE 8000
ENTRYPOINT [ "/usr/bin/python3", "/ostis/sc-web/server/app.py" ]
