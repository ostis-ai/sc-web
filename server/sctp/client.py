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

import socket
import struct
import time
import decorators
import thread, threading

from sctp.types import ScAddr, SctpIteratorType, ScStatItem, SctpCommandType, SctpResultCode

__all__ = (
    'SctpClient',
)


@decorators.class_logging
class EventStruct:
    
    def __init__(self, event_id, event_type, addr, callback):
        self.event_id = event_id
        self.addr = addr
        self._event_type = event_type
        self.callback = callback


@decorators.class_logging
class SctpClient:
    
    def __init__(self):
        self.sock = None
        self.events = {}
                
    def __del__(self):
        self.shutdown()    
                
    def receiveData(self, dataSize):
        res = ''
        while (len(res) < dataSize):
            data = self.sock.recv(dataSize - len(res))
            res += data
            time.sleep(0.001)
        assert len(res) == dataSize
        
        return res 

    def initialize(self, host, port):
        """Initialize network session with server
        @param host: Name of server host (str)
        @param port: connection listening port (int)
        """
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            self.sock.connect((host, port))
        except Exception, e:
            print "can't connect to %s:%d. Exception type is %s" % (host, port, `e`)
        
    def shutdown(self):
        """Close network session
        """
        for event_id in self.events.keys():
            self.event_destroy(event_id)
        self.events = {}
        self.sock.close()
            
    def erase_element(self, el_addr):
        """Erase element with specified sc-addr
        @param el_addr sc-addr of sc-element to remove
        @return If sc-element erased, then return True; otherwise return False
        """
        # send request
        params = struct.pack('=HH', el_addr.seg, el_addr.offset)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_ERASE_ELEMENT, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)

        return resCode == SctpResultCode.SCTP_RESULT_OK

    def get_link_content(self, link_addr):
        """Get content of sc-link with specified sc-addr
        @param link_addr: sc-addr of sc-link to get content
        @return: If data was returned without any errors, then return it;
        otherwise return None
        """

        # send request
        params = struct.pack('=HH', link_addr.seg, link_addr.offset)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_GET_LINK_CONTENT, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)

        if resCode != SctpResultCode.SCTP_RESULT_OK:
            return None

        content_data = None
        if resSize > 0:
            content_data = self.receiveData(resSize)

        return content_data

    def check_element(self, el_addr):
        """Check if sc-element with specified sc-addr exist
        @param el_addr: sc-addr of element to check
        @return: If specified sc-element exist, then return True; otherwise return False
        """

        # send request
        params = struct.pack('=HH', el_addr.seg, el_addr.offset)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_CHECK_ELEMENT, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)

        return resCode == SctpResultCode.SCTP_RESULT_OK

    def get_element_type(self, el_addr):
        """Returns type of specified sc-element
        @param el_addr: sc-addr of element to get type
        @return: If type got without any errors, then return it; otherwise return None
        """

        # send request
        params = struct.pack('=HH', el_addr.seg, el_addr.offset)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_GET_ELEMENT_TYPE, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK:
            return None

        data = self.receiveData(2)
        elType = struct.unpack("=H", data)[0]

        return elType
    
    def get_arc(self, arc):
        """Returns sc-addr of arc element begin
        @param arc sc-addr of arc to get beign
        @return If there are no any errors, then returns sc-addr of arc begin; 
        otherwise returns None
        """
        # send request
        params = struct.pack('=HH', arc.seg, arc.offset)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_GET_ARC, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK:
            return None

        addr = ScAddr(0, 0)
        data = self.receiveData(4)
        addr.seg, addr.offset = struct.unpack('=HH', data)
        
        addr2 = ScAddr(0, 0)
        data = self.receiveData(4)
        addr2.seg, addr2.offset = struct.unpack('=HH', data)

        return (addr, addr2)
    
    def create_node(self, el_type):
        """Create new sc-node in memory with specified type
        @param el_type: Type of node that would be created
        @return: If sc-node was created, then returns it sc-addr; otherwise return None
        """

        # send request
        params = struct.pack('=H', el_type)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_CREATE_NODE, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK:
            return None

        addr = ScAddr(0, 0)
        data = self.receiveData(4)
        addr.seg, addr.offset = struct.unpack('=HH', data)

        return addr

    def create_link(self):
        """Create new sc-link in memory
        @return: If sc-link was created, then returns it sc-addr; otherwise return None
        """
        # send request
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_CREATE_LINK, 0, 0, 0)
        alldata = data

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK:
            return None

        addr = ScAddr(0, 0)
        data = self.receiveData(4)
        addr.seg, addr.offset = struct.unpack('=HH', data)

        return addr

    def create_arc(self, arc_type, begin_addr, end_addr):
        """Create new arc in sc-memory with specified type and begin, end elements
        @param arc_type: Type of sc-arc
        @param begin_addr: sc-addr of begin arc element
        @param end_addr: sc-addr of end arc element
        @return: If sc-arc was created, then returns it sc-addr; otherwise return None
        """
        # send request
        params = struct.pack('=HHHHH', arc_type, begin_addr.seg, begin_addr.offset, end_addr.seg, end_addr.offset)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_CREATE_ARC, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK:
            return None

        addr = ScAddr(0, 0)
        data = self.receiveData(4)
        addr.seg, addr.offset = struct.unpack('=HH', data)

        return addr

    def find_links_with_content(self, data):
        """Find sc-links with specified content
        @param data: Content data for search
        @return: Returns list of sc-addrs of founded sc-links. If there are any error, then return None
        """
        # send request
        params = struct.pack('=I%ds' % len(data), len(data), data)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_FIND_LINKS, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK or resSize < 4:
            return None

        res = []
        data = self.receiveData(resSize)
        resCount = struct.unpack('=I', data[:4])[0]
        for i in xrange(resCount):
            addr = ScAddr(0, 0)
            data = data[4:]
            addr.seg, addr.offset = struct.unpack('=HH', data[:4])
            res.append(addr)

        return res
    
    def set_link_content(self, addr, data):
        """Find sc-links with specified content
        @param addr: sc-addr of sc-link
        @param data: Content data 
        @return: If link content changed, then return True; otherwise return False
        """
        # send request
        params = struct.pack('=HHI%ds' % len(data), addr.seg, addr.offset, len(data), data)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_SET_LINK_CONTENT, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode == SctpResultCode.SCTP_RESULT_OK:
            return True

        return False

    def iterate_elements(self, iterator_type, *args):
        """Iterate element by specified template and return results
        """
        params = None
        params_count = None
        if iterator_type == SctpIteratorType.SCTP_ITERATOR_3A_A_F:
            params_count = 3
            params = struct.pack('=BHHHH', iterator_type, args[0], args[1], args[2].seg, args[2].offset)
        elif iterator_type == SctpIteratorType.SCTP_ITERATOR_3F_A_A:
            params_count = 3
            params = struct.pack('=BHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2])
        elif iterator_type == SctpIteratorType.SCTP_ITERATOR_3F_A_F:
            params_count = 3
            params = struct.pack('=BHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2].seg, args[2].offset)
        elif iterator_type == SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_A:
            params_count = 5
            params = struct.pack('=BHHHHHH', iterator_type, args[0], args[1], args[2].seg, args[2].offset, args[3], args[4])
        elif iterator_type == SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F:
            params_count = 5
            params = struct.pack('=BHHHHHHH', iterator_type, args[0], args[1], args[2].seg, args[2].offset, args[3], args[4].seg, args[4].offset)
        elif iterator_type == SctpIteratorType.SCTP_ITERATOR_5_F_A_A_A_A:
            params_count = 5
            params = struct.pack('=BHHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2], args[3], args[4])
        elif iterator_type == SctpIteratorType.SCTP_ITERATOR_5_F_A_F_A_A:
            params_count = 5
            params = struct.pack('=BHHHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2].seg, args[2].offset, args[3], args[4])
        elif iterator_type == SctpIteratorType.SCTP_ITERATOR_5_F_A_F_A_F:
            params_count = 5
            params = struct.pack('=BHHHHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2].seg, args[2].offset, args[3], args[4].seg, args[4].offset)
        elif iterator_type == SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F:
            params_count = 5
            params = struct.pack('=BHHHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2], args[3], args[4].seg, args[4].offset)

        params_len = len(params)
        # send request
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_ITERATE_ELEMENTS, 0, 0, params_len)
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK or resSize == 0:
            return None

        res_count_data = self.receiveData(4)
        res_count = struct.unpack('=I', res_count_data)[0]

        if res_count == 0:
            return None

        results = []
        for idx in xrange(res_count):
            result_item = []
            for j in xrange(params_count):
                addr_data = self.receiveData(4)
                addr = ScAddr(0, 0)
                addr.seg, addr.offset = struct.unpack('=HH', addr_data)
                result_item.append(addr)

            results.append(result_item)


        return results

    def find_element_by_system_identifier(self, idtf_data):
        """Find sc-element by it system identifier
        @param idtf_data: Identifier data for search
        @return: Returns sc-addrs of founded sc-element.
        If there are any error or sc-element wasn't found, then return None
        """
        # send request
        params = struct.pack('=I%ds' % len(idtf_data), len(idtf_data), idtf_data)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_FIND_ELEMENT_BY_SYSITDF, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK or resSize < 4:
            return None

        addr = ScAddr(0, 0)
        data = self.receiveData(4)
        addr.seg, addr.offset = struct.unpack('=HH', data)

        return addr
    
    def set_system_identifier(self, addr, idtf_data):
        """Set new system identifier for sc-element
        @param idtf_data: Identifier data 
        @return: If identifier changed, then return True; otherwise return False
        """
        # send request
        params = struct.pack('=HHI%ds' % len(idtf_data), addr.seg, addr.offset, len(idtf_data), idtf_data)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_SET_SYSIDTF, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        return resCode == SctpResultCode.SCTP_RESULT_OK
        
    def get_statistics(self, beg_time, end_time):
        """Returns statistics from sctp server, for a specified time range.
        (http://docs.python.org/2/library/time.html)
        @param beg_time: Time structure, that contains range begin
        @param end_time: Time structure, that contains range end
        @return: Returns sorted list of statistics info
        """
        # send request
        params = struct.pack('=QQ', beg_time * 1000, end_time * 1000)
        data = struct.pack('=BBII', SctpCommandType.SCTP_CMD_STATISTICS, 0, 0, len(params))
        alldata = data + params

        self.sock.send(alldata)

        # receive response
        data = self.receiveData(10)
        cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
        if resCode != SctpResultCode.SCTP_RESULT_OK or resSize < 4:
            return None

        # read number of stat items
        data = self.receiveData(4)
        items_count = struct.unpack('=I', data)[0]

        # read items
        result = []
        item_struct = '=QQQQQQQQQQQB'
        item_struct_size = struct.calcsize(item_struct)
        for idx in xrange(items_count):
            data = self.receiveData(item_struct_size)

            item = ScStatItem()

            item_tuple = struct.unpack(item_struct, data)

            item.time = item_tuple[0]
            item.nodeCount = item_tuple[1]
            item.arcCount = item_tuple[2]
            item.linksCount = item_tuple[3]
            item.liveNodeCount = item_tuple[4]
            item.liveArcCount = item_tuple[5]
            item.liveLinkCount = item_tuple[6]
            item.emptyCount = item_tuple[7]
            item.connectionsCount = item_tuple[8]
            item.commandsCount = item_tuple[9]
            item.commandErrorsCount = item_tuple[10]
            item.isInitStat = (item_tuple[11] != 0)

            result.append(item)

        return result
