# -*- coding: utf-8 -*-

import base64
import uuid
import tornado.options
import os

def get_secret():
    try:
        SECRET_KEY
    except NameError:
        
        SECRET_FILE = 'secret.txt'
        try:
            global SECRET_KEY
            SECRET_KEY = open(SECRET_FILE).read().strip()
        except IOError:
            try:
                import random
                SECRET_KEY = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
                secret = file(SECRET_FILE, 'w')
                secret.write(SECRET_KEY)
                secret.close()
            except IOError:
                Exception('Please create a %s file with random characters to generate your secret key!' % SECRET_FILE)
                
    return SECRET_KEY
