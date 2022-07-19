## About
Current repository contains web interface for ostis platform ([here](https://github.com/ostis-ai) you can find all ostis modules).

## Installation
### Installing requirements:
* python3
* pip
* nodejs
* npm
* grunt-cli
* python modules: tornado, sqlalchemy, python-rocksdb, progress, numpy, configparser

You can install deps with

```shell
    pip3 install -r requirements.txt
    cd ./scripts
    ./install_deps_ubuntu.sh    #for debian based distros
```

### Building
To install current module you may use internal scripts. Run

```shell
    cd scripts
    ./install.sh
```

### Running
To run ostis web interface you should build knowledge base and run sc server. You can do it by running `./build_kb.sh` and `./run_sc_server.sh` in [ostis-web-platform](https://github.com/ostis-ai/ostis-web-platform) module. After that you should run `./run_scweb.sh` in */scripts* directory.
