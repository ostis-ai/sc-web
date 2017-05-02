# -*- coding: utf-8 -*-
"""
-----------------------------------------------------------------------------
This source file is part of OSTIS (Open Semantic Technology for Intelligent Systems)
For the latest info, see http://www.ostis.net

Copyright (c) 2012 OSTIS

OSTIS is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

OSTIS is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with OSTIS. If not, see <http://www.gnu.org/licenses/>.
-----------------------------------------------------------------------------
"""
import tornado.options
import decorators
from sctp.client import SctpClient

__all__ = (
    'new_sctp_client',
)


@decorators.method_logging
def new_sctp_client():
    sctp_client = SctpClient()
    sctp_client.initialize(tornado.options.options['sctp_host'], tornado.options.options['sctp_port'])
    return sctp_client


@decorators.class_logging
class SctpClientInstance:
    
    def __enter__(self):
        self.instance = new_sctp_client()
        return self.instance
    
    def __exit__(self, type, value, traceback):
        self.instance.shutdown()


