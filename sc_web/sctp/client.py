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

import os, sys
import socket, struct

from types import sctpCommandType, sctpResultCode
from sctp.types import ScAddr, sctpIteratorType



class sctpClient:
	
	def __init__(self):
		self.sock = None

	def initialize(self, host, port):
		"""Initialize network session with server
		@param host: Name of server host (str)
		@param port: connection listening port (int)  
		"""
		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.sock.connect((host, port))
	
	def shutdown(self):
		"""Close network session
		"""
		pass
	
	def get_link_content(self, link_addr):
		"""Get content of sc-link with specified sc-addr
		@param link_addr: sc-addr of sc-link to get content
		@return: If data was returned without any errors, then return it;
		otherwise return None    
		"""
		
		# send request
		params = struct.pack('=HH', link_addr.seg, link_addr.offset)
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_GET_LINK_CONTENT, 0, 0, len(params))
		alldata = data + params
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		
		if resCode != sctpResultCode.SCTP_RESULT_OK:
			return None
		
		content_data = None
		if resSize > 0:
			content_data = self.sock.recv(resSize) 
		
		return content_data

	def check_element(self, el_addr):
		"""Check if sc-element with specified sc-addr exist
		@param el_addr: sc-addr of element to check
		@return: If specified sc-element exist, then return True; otherwise return False 
		"""
		
		# send request
		params = struct.pack('=HH', el_addr.seg, el_addr.offset)
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_CHECK_ELEMENT, 0, 0, len(params))
		alldata = data + params
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		
		return resCode == sctpResultCode.SCTP_RESULT_OK
	
	def get_element_type(self, el_addr):
		"""Returns type of specified sc-element
		@param el_addr:	sc-addr of element to get type
		@return: If type got without any errors, then return it; otherwise return None 
		"""
		
		# send request
		params = struct.pack('=HH', el_addr.seg, el_addr.offset)
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_GET_ELEMENT_TYPE, 0, 0, len(params))
		alldata = data + params
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		if resCode != sctpResultCode.SCTP_RESULT_OK:
			return None
		
		data = self.sock.recv(2)
		elType = struct.unpack("=H", data)[0]
		
		return elType
	
	def create_node(self, el_type):
		"""Create new sc-node in memory with specified type
		@param el_type:	Type of node that would be created
		@return: If sc-node was created, then returns it sc-addr; otherwise return None 
		"""
		
		# send request
		params = struct.pack('=H', el_type)
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_CREATE_NODE, 0, 0, len(params))
		alldata = data + params
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		if resCode != sctpResultCode.SCTP_RESULT_OK:
			return None
		
		addr = ScAddr(0, 0)
		data = self.sock.recv(4)
		addr.seg, addr.offset = struct.unpack('=HH', data)
		
		return addr
	
	def create_link(self):
		"""Create new sc-link in memory
		@return: If sc-link was created, then returns it sc-addr; otherwise return None 
		"""
		# send request
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_CREATE_LINK, 0, 0, 0)
		alldata = data
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		if resCode != sctpResultCode.SCTP_RESULT_OK:
			return None
		
		addr = ScAddr(0, 0)
		data = self.sock.recv(4)
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
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_CREATE_ARC, 0, 0, len(params))
		alldata = data + params
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		if resCode != sctpResultCode.SCTP_RESULT_OK:
			return None
		
		addr = ScAddr(0, 0)
		data = self.sock.recv(4)
		addr.seg, addr.offset = struct.unpack('=HH', data)
		
		return addr
	
	def find_links_with_content(self, data):
		"""Find sc-links with specified content
		@param data: Content data for search
		@return: Returns list of sc-addrs of founded sc-links. If there are any error, then return None
		"""
		# send request
		params = struct.pack('=I%ds' % len(data), len(data), data)
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_FIND_LINKS, 0, 0, len(params))
		alldata = data + params
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		if resCode != sctpResultCode.SCTP_RESULT_OK or resSize < 4:
			return None
		
		res = []
		data = self.sock.recv(resSize)
		resCount = struct.unpack('=I', data[:4])[0]
		for i in xrange(resCount):
			addr = ScAddr(0, 0)
			data = data[4:]
			addr.seg, addr.offset = struct.unpack('=HH', data)
			res.append(addr)
		
		return res
	
	def iterate_elements(self, iterator_type, *args):
		"""Iterate element by specified template and return results
		"""
		params = None
		params_count = None
		if iterator_type == sctpIteratorType.SCTP_ITERATOR_3A_A_F:
			params_count = 3
			params = struct.pack('=BHHHH', iterator_type, args[0], args[1], args[2].seg, args[2].offset)
		elif iterator_type == sctpIteratorType.SCTP_ITERATOR_3F_A_A:
			params_count = 3
			params = struct.pack('=BHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2])
		elif iterator_type == sctpIteratorType.SCTP_ITERATOR_3F_A_F:
			params_count = 3
			params = struct.pack('=BHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2].seg, args[2].offset)
		elif iterator_type == sctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_A:
			params_count = 5
			params = struct.pack('=BHHHHHH', iterator_type, args[0], args[1], args[2].seg, args[2].offset, args[3], args[4])
		elif iterator_type == sctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F:
			params_count = 5
			params = struct.pack('=BHHHHHHH', iterator_type, args[0], args[1], args[2].seg, args[2].offset, args[3], args[4].seg, args[4].offset)
		elif iterator_type == sctpIteratorType.SCTP_ITERATOR_5_F_A_A_A_A:
			params_count = 5
			params = struct.pack('=BHHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2], args[3], args[4])
		elif iterator_type == sctpIteratorType.SCTP_ITERATOR_5_F_A_F_A_A:
			params_count = 5
			params = struct.pack('=BHHHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2].seg, args[2].offset, args[3], args[4])
		elif iterator_type == sctpIteratorType.SCTP_ITERATOR_5_F_A_F_A_F:
			params_count = 5
			params = struct.pack('=BHHHHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2].seg, args[2].offset, args[3], args[4].seg, args[4].offset)
		elif iterator_type == sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F:
			params_count = 5
			params = struct.pack('=BHHHHHHH', iterator_type, args[0].seg, args[0].offset, args[1], args[2], args[3], args[4].seg, args[4].offset)
		
		params_len = len(params)
		# send request	
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_ITERATE_ELEMENTS, 0, 0, params_len)
		alldata = data + params
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		if resCode != sctpResultCode.SCTP_RESULT_OK or resSize == 0:
			return None
		
		res_count_data = self.sock.recv(4)
		res_count = struct.unpack('=I', res_count_data)[0]
		
		if res_count == 0:
			return None
		
		results = []
		for idx in xrange(res_count):
			result_item = []
			for j in xrange(params_count):
				addr_data = self.sock.recv(4)
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
		data = struct.pack('=BBII', sctpCommandType.SCTP_CMD_FIND_ELEMENT_BY_SYSITDF, 0, 0, len(params))
		alldata = data + params
		
		self.sock.send(alldata)
		
		# recieve response
		data = self.sock.recv(10)
		cmdCode, cmdId, resCode, resSize = struct.unpack('=BIBI', data)
		if resCode != sctpResultCode.SCTP_RESULT_OK or resSize < 4:
			return None
		
		addr = ScAddr(0, 0)
		data = self.sock.recv(4)
		addr.seg, addr.offset = struct.unpack('=HH', data)
		
		return addr
