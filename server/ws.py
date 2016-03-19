# -*- coding: utf-8 -*-

import tornado.options
import tornado.websocket
import struct
import socket
import time
import json
import thread

import db
import handlers.base as base
import sctp.types
import sctp.logic

from sctp.types import ScAddr

clients = []

class SocketProxy:
    
    result_header_fmt = '=BIBI'
    command_header_fmt = '=BBII'
    
    def __init__(self, on_message, write_rights = True):
        self.on_message = on_message

        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            host = tornado.options.options['sctp_host']
            port = tornado.options.options['sctp_port']
            self.sock.connect((host, port))
        except Exception, e:
            print "can't connect to %s:%d. Exception type is %s" % (host, port, `e`)

        self.registered_events = []
        self.recieved_events = []
        self.events_lock = thread.allocate_lock()
        self.write_rights = write_rights

    def destroy(self):
        self.sock.close()
        
    def events_callback(self, event_id, addr, arg):
        self.events_lock.acquire()
        self.recieved_events.append((event_id, addr.to_id(), arg.to_id()))
        self.events_lock.release()
        
    def receiveData(self, dataSize):
        res = ''
        while (len(res) < dataSize):
            data = self.sock.recv(dataSize - len(res))
            res += data
            time.sleep(0.001)
        assert len(res) == dataSize
        
        return res

    def send(self, message):

        data = str(message)
        # get cmd code
        cmdCode, flag, cmdId, size = struct.unpack_from('=BBII', data)

        # @todo authorised users only
        if cmdCode == sctp.types.SctpCommandType.SCTP_CMD_CHECK_ELEMENT or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_FIND_ELEMENT_BY_SYSITDF or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_GET_ELEMENT_TYPE or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_GET_ARC or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_GET_LINK_CONTENT or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_ITERATE_ELEMENTS or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_ITERATE_CONSTRUCTION or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_EVENT_CREATE or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_EVENT_DESTROY or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_EVENT_EMIT or \
        (self.write_rights and (cmdCode == sctp.types.SctpCommandType.SCTP_CMD_CREATE_NODE or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_CREATE_ARC or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_CREATE_LINK or \
        cmdCode == sctp.types.SctpCommandType.SCTP_CMD_SET_LINK_CONTENT)):
            # send data to socket
            self.sock.sendall(data)
            # wait answer and send it backward to client
            data = self.receiveData(10)
            cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
            resultData = self.receiveData(resSize)

            self.on_message(data + resultData)
        else:
            resultData = struct.pack('=BIBI', cmdCode, cmdId, sctp.types.SctpResultCode.SCTP_RESULT_NORIGHTS, 0)
            self.on_message(resultData)


class SocketHandler(tornado.websocket.WebSocketHandler):

    header_size = 10
    edit_commands = [sctp.types.SctpCommandType.SCTP_CMD_CREATE_ARC,
                     sctp.types.SctpCommandType.SCTP_CMD_CREATE_LINK,
                     sctp.types.SctpCommandType.SCTP_CMD_CREATE_NODE,
                     sctp.types.SctpCommandType.SCTP_CMD_ERASE_ELEMENT,
                     sctp.types.SctpCommandType.SCTP_CMD_SET_LINK_CONTENT,
                     sctp.types.SctpCommandType.SCTP_CMD_SET_SYSIDTF]

    def open(self):
        if self not in clients:
            clients.append(self)
        
        key = self.get_secure_cookie(base.BaseHandler.cookie_user_key, None, 1)
        
        database = db.DataBase()
        canEdit = True
        u = database.get_user_by_key(key)
        if u:
            canEdit = base.User._canEdit(database.get_user_role(u).rights)
        
        self.proxy = SocketProxy(self.socket_write, canEdit)

    def on_close(self):
        if self in clients:
            clients.remove(self)
            self.proxy.destroy()
            
    def on_message(self, message):
        self.proxy.send(message)
        
    def socket_write(self, message):
        self.write_message(message, True)

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}
        