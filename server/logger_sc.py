# -*- coding: utf-8 -*-

import logging
import configparser
import os

DEFAULT_MAX_BYTES = 100000
DEFAULT_OUTPUT_PATH = 'server_log.log'
DEFAULT_BACKUP_COUNT = 5


def init():
    config = configparser.ConfigParser()
    config.read(os.path.join(os.getcwd(), "log_config.ini"))

    output_path = config["Default"]["output_path"] if "output_path" in config["Default"] else DEFAULT_OUTPUT_PATH
    max_bytes = int(config["Default"]["max_bytes"]) if "max_bytes" in config["Default"] else DEFAULT_MAX_BYTES
    backup_count = int(config["Default"]["backup_count"]) if "backup_count" in config["Default"] else DEFAULT_BACKUP_COUNT

    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)
    logger.disabled = str(config["Default"]["activate"]).lower() != 'true' if "activate" in config["Default"] else False

    # create console handler and set level to info
    handler = logging.handlers.RotatingFileHandler(output_path, maxBytes=max_bytes, backupCount=backup_count)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter("%(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # create debug file handler and set level to debug
    handler = logging.handlers.RotatingFileHandler(output_path, maxBytes=max_bytes, backupCount=backup_count)
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
