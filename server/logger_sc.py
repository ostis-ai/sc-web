# -*- coding: utf-8 -*-

import configparser
import logging
import os

DEFAULT_MAX_BYTES = 100000
DEFAULT_SERVER_LOG_DIR = os.path.realpath(f'{os.path.dirname(os.path.realpath(__file__))}/../logs/sc-server.log')
DEFAULT_BACKUP_COUNT = 5


def init():
    config = configparser.ConfigParser()
    config.read(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../sc-web.ini"))

    group = config["sc-web"]

    server_log_dir = os.path.realpath(f'{os.path.dirname(os.path.realpath(__file__))}/../{group["server_log_dir"]}') \
        if "server_log_dir" in group else DEFAULT_SERVER_LOG_DIR
    max_bytes = int(group["max_bytes"]) if "max_bytes" in group else DEFAULT_MAX_BYTES
    backup_count \
        = int(group["backup_count"]) if "backup_count" in group else DEFAULT_BACKUP_COUNT

    logger = logging.getLogger()
    logger.setLevel(group["log_level_console"])
    logger.disabled = str(group["activate_logging"]).lower() != 'true' if "activate_logging" in group else False

    dir_name = os.path.dirname(server_log_dir)

    if dir_name and not os.path.exists(dir_name):
        logger.info(f'Generating {dir_name} ...')
        os.makedirs(dir_name, exist_ok=True)

    # create console handler and set level to info
    handler = logging.handlers.RotatingFileHandler(server_log_dir, maxBytes=max_bytes, backupCount=backup_count)
    handler.setLevel(group["log_level_console"])
    formatter = logging.Formatter("%(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # create debug file handler and set level to debug
    handler = logging.handlers.RotatingFileHandler(server_log_dir, maxBytes=max_bytes, backupCount=backup_count)
    handler.setLevel(group["log_level_file"])
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
