#nodejs stage to build frontent 
FROM node:16-alpine AS web-buildenv

WORKDIR /sc-web   
#Install sc-web build-time dependencies
COPY package.json package-lock.json ./
RUN npm install
#Build sc-web
COPY . .
RUN npm run build

FROM ubuntu:focal as runtime 
USER root

WORKDIR /sc-web
# dependencies
COPY --from=web-buildenv /sc-web/requirements.txt /sc-web/requirements.txt

# install runtime dependencies
# tini is a lightweight PID1 to forward interrupt signals
RUN apt update && apt --no-install-recommends -y install python3-pip python3 tini
RUN python3 -m pip install --no-cache-dir --default-timeout=100 -r requirements.txt

# the app itself
COPY --from=web-buildenv /sc-web/client /sc-web/client
COPY --from=web-buildenv /sc-web/server /sc-web/server

# Needed to populate KB on startup
COPY --from=web-buildenv /sc-web/components /sc-web/components
COPY --from=web-buildenv /sc-web/repo.path /sc-web/repo.path

# config
COPY --from=web-buildenv /sc-web/sc-web.ini /sc-web/sc-web.ini

WORKDIR /sc-web/server

EXPOSE 8000
ENTRYPOINT ["tini", "--", "/usr/bin/python3", "/sc-web/server/app.py" ]
