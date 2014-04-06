import tornado.options
import tornado.websocket
import struct
import socket
import time
import sctp.types
import sctp.logic

clients = []

class SocketProxy:
    
    result_header_fmt = '=BIBI'
    command_header_fmt = '=BBII'
    
    def __init__(self, on_message):
        self.on_message = on_message
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        
        host = tornado.options.options['sctp_host']
        port = tornado.options.options['sctp_port']
        try:
            self.sock.connect((host, port))
        except Exception, e:
            print "can't connect to %s:%d. Exception type is %s" % (host, port, `e`)
            self.sock = None
        
    def destroy(self):
        self.sock.close()
         
    def send(self, message):
        self.sock.sendall(message)
        
        # now we need to read header of request
        header = self.receiveData(struct.calcsize(self.result_header_fmt))
        cmdCode, cmdId, resCode, resSize = struct.unpack(self.result_header_fmt, header)
        
        data = self.receiveData(resSize)
        self.on_message(header + data)        
        
    def receiveData(self, dataSize):
        res = ''
        while (len(res) < dataSize):
            data = self.sock.recv(dataSize - len(res))
            res += data
            time.sleep(0.0001)
        assert len(res) == dataSize
        
        return res

class SocketHandler(tornado.websocket.WebSocketHandler):

    header_size= 10
    edit_commands = [sctp.types.SctpCommandType.SCTP_CMD_CREATE_ARC,
                     sctp.types.SctpCommandType.SCTP_CMD_CREATE_LINK,
                     sctp.types.SctpCommandType.SCTP_CMD_CREATE_NODE,
                     sctp.types.SctpCommandType.SCTP_CMD_ERASE_ELEMENT,
                     sctp.types.SctpCommandType.SCTP_CMD_SET_LINK_CONTENT,
                     sctp.types.SctpCommandType.SCTP_CMD_SET_SYSIDTF,
                     sctp.types.SctpCommandType.SCTP_CMD_SHUTDOWN]

    def open(self):
        if self not in clients:
            clients.append(self)
            
        self.buffer = None
        self.proxy = SocketProxy(self.on_message)

    def on_close(self):
        if self in clients:
            clients.remove(self)
            
    def on_message(self, message):
        
        if self.buffer is None:
            self.buffer = message
        else:
            self.buffer = self.buffer + message
                
        # need to read header, and skip command that are trying to write data to sctp server
        cmdCode, flags, cmdId, size = struct.unpack(self.command_header_fmt, self.buffer)
        if cmdCode in self.edit_commands:
            self.write(struct.pack(self.result_header_fmt, cmdCode, cmdId, sctp.types.SctpResultCode.SCTP_RESULT_FAIL, 0))
            self.buffer = self.buffer[struct.calcsize(self.command_header_fmt) + size:]
        else:
            pass
            
        self.flush()