import tornado.options
import tornado.websocket
import struct
import socket
import time
import json
import sctp.types
import sctp.logic
import sockjs.tornado
import thread

clients = []

class SocketProxy:
    
    result_header_fmt = '=BIBI'
    command_header_fmt = '=BBII'
    
    def __init__(self, on_message):
        self.on_message = on_message
        self.sctp_client = sctp.logic.new_sctp_client()
        self.registered_events = []
        self.recieved_events = []
        self.events_lock = thread.allocate_lock()
                
    def destroy(self):
        self.sock.close()
        
    def events_callback(self, event_id, addr, arg):
        self.events_lock.acquire()
        self.recieved_events.append((event_id, addr, arg))
        self.events_lock.release()
         
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
            
        elif cmdCode == sctp.types.SctpCommandType.SCTP_CMD_ITERATE_ELEMENTS:
            resCode = sctp.types.SctpResultCode.SCTP_RESULT_FAIL
            res = None
            itType = cmd['args'][0]
            args = cmd['args'][1:]
            if itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_3A_A_F:
                res = self.sctp_client.iterate_elements(itType, 
                                                        args[0], args[1], 
                                                        sctp.types.ScAddr.parse_from_string(args[2]))
                
            elif itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_3F_A_A:
                res = self.sctp_client.iterate_elements(itType, 
                                                        sctp.types.ScAddr.parse_from_string(args[0]), 
                                                        args[1], 
                                                        args[2])
                
            elif itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_3F_A_F:
                res = self.sctp_client.iterate_elements(itType, 
                                                        sctp.types.ScAddr.parse_from_string(args[0]), 
                                                        args[1], 
                                                        sctp.types.ScAddr.parse_from_string(args[2]))
                
            elif itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_A:
                res = self.sctp_client.iterate_elements(itType, 
                                                        args[0],
                                                        args[1],
                                                        sctp.types.ScAddr.parse_from_string(args[2]),
                                                        args[3],
                                                        args[4])
            elif itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F:
                res = self.sctp_client.iterate_elements(itType,
                                                        args[0],
                                                        args[1],
                                                        sctp.types.ScAddr.parse_from_string(args[2]),
                                                        args[3],
                                                        sctp.types.ScAddr.parse_from_string(args[4]))
            elif itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_5_F_A_A_A_A:
                res = self.sctp_client.iterate_elements(itType,
                                                        sctp.types.ScAddr.parse_from_string(args[0]),
                                                        args[1],
                                                        args[2],
                                                        args[3],
                                                        args[4])
            elif itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_5_F_A_F_A_A:
                res = self.sctp_client.iterate_elements(itType,
                                                        sctp.types.ScAddr.parse_from_string(args[0]),
                                                        args[1],
                                                        sctp.types.ScAddr.parse_from_string(args[2]),
                                                        args[3],
                                                        args[4])
            elif itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_5_F_A_F_A_F:
                res = self.sctp_client.iterate_elements(itType,
                                                        sctp.types.ScAddr.parse_from_string(args[0]),
                                                        args[1],
                                                        sctp.types.ScAddr.parse_from_string(args[2]),
                                                        args[3],
                                                        sctp.types.ScAddr.parse_from_string(args[4]))
            elif itType == sctp.types.SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F:
                res = self.sctp_client.iterate_elements(itType,
                                                        sctp.types.ScAddr.parse_from_string(args[0]),
                                                        args[1],
                                                        args[2],
                                                        args[3],
                                                        sctp.types.ScAddr.parse_from_string(args[4]))
            
            sres = []
            if res is not None:
                resCode = sctp.types.SctpResultCode.SCTP_RESULT_OK
                
                # convert sc-addrs to string id's
                for r in res:
                    new_data = []
                    for v in r:
                        if isinstance(v, sctp.types.ScAddr):
                            new_data.append(v.to_id())
                        else:
                            new_data.append(v)
                            
                    sres.append(new_data)
                
            response_message(resCode, sres)
            
        elif cmdCode == sctp.types.SctpCommandType.SCTP_CMD_EVENT_CREATE:
            eventType = cmd['args'][0]
            addr = cmd['args'][1]
            
            eventId = self.sctp_client.event_create(eventType, addr, self.events_callback)
            if eventId == None:
                response_message(sctp.types.SctpResultCode.SCTP_RESULT_FAIL, None)
            else:
                response_message(sctp.types.SctpResultCode.SCTP_RESULT_OK, eventId)
                self.registered_events.append(eventId)
        
        elif cmdCode == sctp.types.SctpCommandType.SCTP_CMD_EVENT_DESTROY:
            eventId = cmd['args'][0]
            res = sctp.types.SctpResultCode.SCTP_RESULT_FAIL
            if self.sctp_client.event_destroy(eventId):
                res = sctp.types.SctpResultCode.SCTP_RESULT_OK
                self.registered_events.remove(eventId)
            response_message(res, None)
        
        elif cmdCode == sctp.types.SctpCommandType.SCTP_CMD_EVENT_EMIT:
            self.events_lock.acquire()
            events = self.recieved_events
            self.recieved_events = []
            self.events_lock.release()
            
            result = []
            for evt in events:
                if evt[0] in self.registered_events:
                    result.append(evt)
            
            response_message(sctp.types.SctpResultCode.SCTP_RESULT_OK, result)        
            
        
        
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
        