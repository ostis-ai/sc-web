# -*- coding: utf-8 -*-

import base64
import logging
import uuid

logger = logging.getLogger()


def get_secret():
    global SECRET_KEY
    try:
        SECRET_KEY
    except NameError as ne:
        logger.warning(ne)
        SECRET_FILE = 'secret.txt'
        try:
            SECRET_KEY = open(SECRET_FILE).read().strip()
        except IOError as ioe:
            logger.warning(ioe)
            try:
                import random
                SECRET_KEY = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
                secret = open(SECRET_FILE, 'wb')
                secret.write(SECRET_KEY)
                secret.close()
            except IOError:
                Exception('Please create a %s file with random characters to generate your secret key!' % SECRET_FILE)

    return SECRET_KEY
