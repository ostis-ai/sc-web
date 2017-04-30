# -*- coding: utf-8 -*-

import tornado.web
import logging
from functools import wraps
import tornado.options

def requestAdmin(method):
    def wrapper(self, *args, **kwargs):
        if self.current_user and self.current_user.canAdmin():
            return method(self, *args, **kwargs)

        raise tornado.web.HTTPError(401)

    return wrapper


def method_logging(func):
        @wraps(func)
        def wrapper(*argv):
            logging.debug("- %s" % "call method " + func.func_code.co_name + " in: " +
                          func.func_code.co_filename + " line: " + str(func.func_code.co_firstlineno))
            return func(*argv)

        return wrapper


def class_logging(cls):
        for name, method in cls.__dict__.iteritems():
            if not name.startswith('_') and not type(method) is int:
                setattr(cls, name, method_logging(method))
        return cls
