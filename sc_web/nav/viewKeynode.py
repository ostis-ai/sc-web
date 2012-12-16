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

from django.http import HttpResponse
from django.template import Context
from django.template import Context, loader
import settings
import keynodes
from keynodes import KeynodeSysIdentifiers
from sctp.client import sctpClient
from sctp.types import ScAddr
from sctp.types import ScElementType


def resolveKeynodes(identifiers, sctp_client):
	"""Resolve sc-element by their identifiers, and return map
	of names to their sc-addrs
	@param identifiers: List of system identifiers
	@param sctp_client: sctp client object to connect to knowledge base
	@return: Returns map where keys are identifiers and values are sc-addr objects 
	"""
	res = {}
	for idtf in identifiers:
		# try to initiate question
		addr = keynodes.getKeynodeBySystemIdentifier(str(idtf.encode('utf-8')), sctp_client)
		res[idtf] = addr
		
	return res
			

def keynode(request, name):
	t = loader.get_template("home.html")
	
	sctp_client = sctpClient()
	sctp_client.initialize(settings.SCTP_HOST, settings.SCTP_PORT)
	
	arg_idtf = str(name.encode('utf-8'))
	arg_addr = sctp_client.find_element_by_system_identifier(arg_idtf)
	
	output = ""
	if arg_addr is None:
		output = "Error: sc-element with system identifier %s doesn't exist" % name
	else:
		
		# resolve keynodes
		_keyn = resolveKeynodes([KeynodeSysIdentifiers.question,
								KeynodeSysIdentifiers.question_initiated,
								KeynodeSysIdentifiers.ui_user,
								KeynodeSysIdentifiers.question_nrel_answer,
								KeynodeSysIdentifiers.nrel_author,
								KeynodeSysIdentifiers.format_scs,
								KeynodeSysIdentifiers.ui_nrel_user_answer_formats,
								], sctp_client)
		
		keynode_question = _keyn[KeynodeSysIdentifiers.question]
		keynode_question_initiated = _keyn[KeynodeSysIdentifiers.question_initiated]
		keynode_ui_user = _keyn[KeynodeSysIdentifiers.ui_user]
		keynode_nrel_answer = _keyn[KeynodeSysIdentifiers.question_nrel_answer]
		keynode_nrel_author = _keyn[KeynodeSysIdentifiers.nrel_author]
		keynode_format_scs = _keyn[KeynodeSysIdentifiers.format_scs]
		keynode_ui_nrel_user_answer_formats = _keyn[KeynodeSysIdentifiers.ui_nrel_user_answer_formats]
		
		# create question in sc-memory
		question_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
		sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_question, question_node)
		sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, question_node, arg_addr)
		
		
		
		# create author
		user_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
		sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)
		
		author_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question_node, user_node)
		sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_nrel_author, author_arc)		
		
		# create otput formats set
		output_formats_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
		sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, output_formats_node, keynode_format_scs)
		
		format_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question_node, output_formats_node)
		sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_nrel_user_answer_formats, format_arc)
		
		# initiate question
		sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_question_initiated, question_node)
	
#	data = str(name.encode('utf-8'))
#	res = sctp_client.find_element_by_system_identifier(data)
#	output = "Result: "
#	if res is None:
#		output += str(res)
#	else:
#		output += "%d, %d <br/>" % (res.seg, res.offset)
#		
#	res = sctp_client.find_links_with_content(data)
#	output += "<br/><br/>Result: "
#	if res is None:
#		output += str(res)
#	else:
#		for addr in res:
#			output += "%d, %d <br/>" % (addr.seg, addr.offset)
	
#	addr = ScAddr(0, int(name))
#	
#	output = "<h3>%s</h3>" % name
#	output += "Exist: %s<br/>" % str(sctp_client.check_element(addr))
#	
#	el_type = sctp_client.get_element_type(addr)
#	s_type = ""
#	if el_type & ScElementType.sc_type_node:
#		s_type += "node "
#	elif el_type & ScElementType.sc_type_arc_common:
#		s_type += "arc_common "
#	elif el_type & ScElementType.sc_type_edge_common:
#		s_type += "edge "
#	elif el_type & ScElementType.sc_type_arc_access:
#		s_type += "arc_access "
#	elif el_type & ScElementType.sc_type_link:
#		s_type += "link "
#	output += "Type: %s<br/>" % s_type
#	
#	content = sctp_client.get_link_content(addr)
#	if content is not None:
#		content = content.decode('utf-8')
#	else:
#		content = str(content)
#	output += "Content: %s" % content
	
	c = Context({"data": output
				})
	return HttpResponse(t.render(c))
