# SC-Web
## About
SC-Web is an intelligent knowledge base user interface. Currently, it is a part of the [OSTIS Web Platform](https://github.com/ostis-ai/ostis-web-platform). 

The long term idea of this project is to create a universal rendering mechanism for interfaces defined inside knowledge bases.

## Demo

![sc-web-demo](https://github.com/ostis-ai/ostis-project/raw/main/docs/sc-web-demo.gif)

## Quick start

We provide the `ostis/sc-web` Docker image to simplify the integration of this UI with existing OSTIS-systems.

```sh
# Connect to remote sc-server (or another Docker container)
docker run --rm -it -p 8000:8000 ostis/sc-web:latest --server_host=<ip or hostname>
# Connect to server hosted on localhost
docker run --rm -it --network=host ostis/sc-web:latest
```

## Installation

  If you're using Ubuntu, you can install dependencies using our script:

  ```sh
  cd sc-web/scripts
  ./install_deps_ubuntu.sh
  pip3 install -r requirements.txt
  npm install
  ```

  Otherwise, the following dependencies should be installed:

  - python3
  - pip
  - nodejs
  - npm
  - grunt-cli
  - python modules: tornado, sqlalchemy, numpy, configparser, py-sc-client

  ### Building

```sh
npm run build
```

  ### Running

  SC-Web requires `sc-server` to be up and running.
  
Use included scripts to launch the server:

```sh
cd sc-web/scripts
./run_scweb.sh`
``` 

The UI will listen at localhost:8000.
