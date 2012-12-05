import os, sys
import socket, struct

from types import sctpCommandType, sctpResultCode



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
		data = self.sock.recv(12)
		cmdCode, cmdId, resCode, resSize, elType = struct.unpack('=BIBIH', data)
		if resCode != sctpResultCode.SCTP_RESULT_OK:
			return None
		
		return elType