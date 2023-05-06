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

Clone repo:

```sh
git clone https://github.com/ostis-ai/sc-web
cd sc-web
git submodule update --init --recursive
```

If you're using Ubuntu, you can install node and python runtimes using our script:

```sh
cd sc-web/scripts
./install_deps_ubuntu.sh
```

Otherwise, the following dependencies should be installed:

- python3
- pip
- nodejs
- npm
- grunt-cli
- python modules: tornado, sqlalchemy, numpy, configparser, py-sc-client

Node.js and Python libraries can be installed using the respective package managers

```sh
pip3 install -r requirements.txt
npm install
```

### Build the frontend

```sh
npm run build
```

### Run the server

Note: SC-Web backend requires `sc-server` to be up and running, check `./run_scweb.sh --help` for network configuration options.

Use the included script to launch the backend server:

```sh
cd sc-web/scripts
./run_scweb.sh`
```

The UI will listen at localhost:8000.

## Development notes

To run grunt in watch mode use:

```shell
npm run serve
```

Watch mode supports livereload. To enable livereload uncomment in `client/templates/common.html`

```diff
<!-- Enable livereload script for development -->
-<!--<script type="text/javascript" charset="utf-8" src="http://localhost:35729/livereload.js"></script>-->
+<script type="text/javascript" charset="utf-8" src="http://localhost:35729/livereload.js"></script>
```

### Documentation

Full documentation, including:

- core concepts
- rationale behind the sc-web
- system design
- software interfaces

is redistributed in a form of the [SCn-TeX document](https://github.com/ostis-ai/ostis-web-platform/blob/develop/docs/main.pdf) (always links to the latest version of the document).

**Alternatively**, you can build sc-web documentation only. To do that, refer to the [scn-latex-plugin](https://github.com/ostis-ai/scn-latex-plugin) documentation.
