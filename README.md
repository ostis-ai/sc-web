# About
Current repository contains web interface for ostis platform ([here](https://github.com/ostis-ai) you can find all ostis modules).

# Installation
## Using Docker
Running image:
```sh
docker run --rm -it -p 8000:8000 ostis/sc-web --server_host=... <any other arguments of app.py>
```
### Connecting to sc-server 
You will need to pass `--server_host=<your hostname>` flag to the container. 
- In case the `sc-server` is running on another machine or container, simply put its hostname in the template. 
- If you're running `sc-machine` locally, use [this guide](https://www.howtogeek.com/devops/how-to-connect-to-localhost-within-a-docker-container/) to set up connection to your host's `localhost`. Writing `--server_host=localhost` **will not work**. 

In non-production environment it's easier to pass `--network=host` flag to `docker run` command to connect to `sc-server` running locally.
## Installing manually
### Installing requirements:
* python3
* pip
* nodejs
* npm
* grunt-cli
* python modules: tornado, sqlalchemy, numpy, configparser, py-sc-client

You can install deps with

```sh
    pip3 install -r requirements.txt
    cd ./scripts
    ./install_deps_ubuntu.sh    #for debian based distros
```

### Building
To install current module you may use internal scripts. Run

```sh
    cd scripts
    ./install.sh
```

### Running
To run ostis web interface you should build knowledge base and run sc server. You can do it by running `./build_kb.sh` and `./run_sc_server.sh` in [ostis-web-platform](https://github.com/ostis-ai/ostis-web-platform) module. After that you should run `./run_scweb.sh` in */scripts* directory.
