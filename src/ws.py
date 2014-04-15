import tornado.options
import tornado.websocket
import struct
import socket
import time
import json
import sctp.types
import sctp.logic
import sockjs.tornado

clients = []

class SocketProxy:
    
    result_header_fmt = '=BIBI'
    command_header_fmt = '=BBII'
    
    def __init__(self, on_message):
        self.on_message = on_message
        self.sctp_client = sctp.logic.new_sctp_client()
        
    def destroy(self):
        self.sock.close()
         
    def send(self, message):
        
        cmd = json.loads(message)
        
        cmdCode = cmd['cmdCode']
        
        def response_message(resCode, res):
            if res is not None:
                self.on_message(json.dumps({'resCode': resCode, 'result': res}))
            else:
                self.on_message(json.dumps({'resCode': resCode}))
        
        if cmdCode == sctp.types.SctpCommandType.SCTP_CMD_CHECK_ELEMENT:
            resCode = sctp.types.SctpResultCode.SCTP_RESULT_FAIL
            if self.sctp_client.check_element(sctp.types.ScAddr.parse_from_string(cmd['args'][0])):
                resCode = sctp.types.SctpResultCode.SCTP_RESULT_OK
                           
            response_message(resCode, None)
            
        elif cmdCode == sctp.types.SctpCommandType.SCTP_CMD_FIND_ELEMENT_BY_SYSITDF:
            res = self.sctp_client.find_element_by_system_identifier(str(cmd['args'][0]))
            resCode = sctp.types.SctpResultCode.SCTP_RESULT_FAIL
            if res is not None:
                resCode = sctp.types.SctpResultCode.SCTP_RESULT_OK
                
            response_message(resCode, res.to_id())
            
        elif cmdCode == sctp.types.SctpCommandType.SCTP_CMD_GET_ELEMENT_TYPE:
            res = self.sctp_client.get_element_type(sctp.types.ScAddr.parse_from_string(cmd['args'][0]))
            resCode = sctp.types.SctpResultCode.SCTP_RESULT_FAIL
            if res is not None:
                resCode = sctp.types.SctpResultCode.SCTP_RESULT_OK
            
            response_message(resCode, res)
            
        elif cmdCode == sctp.types.SctpCommandType.SCTP_CMD_GET_LINK_CONTENT:
            res = self.sctp_client.get_link_content(sctp.types.ScAddr.parse_from_string(cmd['args'][0]))
            resCode = sctp.types.SctpResultCode.SCTP_RESULT_FAIL
            if res is not None:
                resCode = sctp.types.SctpResultCode.SCTP_RESULT_OK
                
            response_message(resCode, res)
        
        
    def receiveData(self, dataSize):
        res = ''
        while (len(res) < dataSize):
            data = self.sock.recv(dataSize - len(res))
            res += data
            time.sleep(0.0001)
        assert len(res) == dataSize
        
        return res

class SocketHandler(sockjs.tornado.SockJSConnection):

    header_size= 10
    edit_commands = [sctp.types.SctpCommandType.SCTP_CMD_CREATE_ARC,
                     sctp.types.SctpCommandType.SCTP_CMD_CREATE_LINK,
                     sctp.types.SctpCommandType.SCTP_CMD_CREATE_NODE,
                     sctp.types.SctpCommandType.SCTP_CMD_ERASE_ELEMENT,
                     sctp.types.SctpCommandType.SCTP_CMD_SET_LINK_CONTENT,
                     sctp.types.SctpCommandType.SCTP_CMD_SET_SYSIDTF,
                     sctp.types.SctpCommandType.SCTP_CMD_SHUTDOWN]

    def on_open(self, info):
        if self not in clients:
            clients.append(self)
            
        self.buffer = None
        self.proxy = SocketProxy(self.socket_write)

    def on_close(self):
        if self in clients:
            clients.remove(self)
            
    def on_message(self, message):
        self.proxy.send(message)
        
    def socket_write(self, message):
        self.send(message)
        