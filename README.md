# sc-web

## About

sc-web is an intelligent user interface. Currently, it is a part of the [OSTIS Web Platform](https://github.com/ostis-ai/ostis-web-platform).

The long term idea of this project is to create a universal rendering mechanism for interfaces defined inside knowledge bases.

## Demo

![sc-web-demo](docs/images/sc-web-demo.gif)

## Quick start

We provide the `ostis/sc-web` Docker image to simplify the integration of this UI with existing ostis-systems.

```sh
# Connect to remote sc-server (or another Docker container)
docker run --rm -it -p 8000:8000 ostis/sc-web:latest --server_host=<ip or hostname>
# Connect to server hosted on localhost
docker run --rm -it --network=host ostis/sc-web:latest
```

## Installation

Clone repo:

```sh
git clone https://github.com/ostis-ai/sc-web --recursive
cd sc-web
```

If you're using Ubuntu or macOS, you can install node and python runtimes using our script:

```sh
./scripts/install_dependencies.sh
```

After installing dependencies, you need to reopen the terminal and make sure that you use the specific version of nodejs. Otherwise, use the following command:

```sh
nvm use 16
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
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
npm install
```

### Build the frontend

```sh
npm run build
```

### Run the server

Note: sc-web backend requires `sc-machine` to be up and running, check `source .venv/bin/activate && python3 server/app.py --help` for network configuration options.

To launch the backend server, run:

```sh
source .venv/bin/activate
python3 server/app.py
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
