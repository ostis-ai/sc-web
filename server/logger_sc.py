# -*- coding: utf-8 -*-

import logging
import configparser
import os


def init():
    config = configparser.ConfigParser()
    config.read(os.path.join(os.getcwd(), "log_config.ini"))

    debug = config["Default"]["Debug"]
    output_path = config["Default"]["Output_path"]

    logger = logging.getLogger()

    if debug == 'true':
        logger.setLevel(logging.DEBUG)

    # create console handler and set level to info
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter("%(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # create debug file handler and set level to debug
    handler = logging.FileHandler(os.path.join(os.getcwd(), output_path), "a")
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
