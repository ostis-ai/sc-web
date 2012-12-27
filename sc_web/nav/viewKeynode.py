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
import time
from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.client import sctpClient
from sctp.types import ScAddr, sctpIteratorType
from sctp.types import ScElementType


def findAnswer(question_addr, keynode_nrel_answer, sctp_client):
	return sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
										question_addr,
										ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
										ScElementType.sc_type_node | ScElementType.sc_type_const,
										ScElementType.sc_type_arc_pos_const_perm,
										keynode_nrel_answer)
	
def findTranslation(construction_addr, keynode_nrel_translation, sctp_client):
	return sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
										construction_addr,
										ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
										ScElementType.sc_type_link,
										ScElementType.sc_type_arc_pos_const_perm,
										keynode_nrel_translation)
			

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
		keys = Keynodes(sctp_client)
		
		keynode_question = keys[KeynodeSysIdentifiers.question]
		keynode_question_initiated = keys[KeynodeSysIdentifiers.question_initiated]
		keynode_ui_user = keys[KeynodeSysIdentifiers.ui_user]
		keynode_nrel_answer = keys[KeynodeSysIdentifiers.question_nrel_answer]
		keynode_nrel_author = keys[KeynodeSysIdentifiers.nrel_author]
		keynode_format_scs = keys[KeynodeSysIdentifiers.format_scs]
		keynode_ui_nrel_user_answer_formats = keys[KeynodeSysIdentifiers.ui_nrel_user_answer_formats]
		keynode_nrel_translation = keys[KeynodeSysIdentifiers.nrel_translation]
		
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
		
		# first of all we need to wait answer to this question
		#print sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_A, keynode_question_initiated, 0, 0)
		
		answer = findAnswer(question_node, keynode_nrel_answer, sctp_client)
		while answer is None:
			time.sleep(0.1)
			answer = findAnswer(question_node, keynode_nrel_answer, sctp_client)
		
		answer_addr = answer[0][2]
		translation = findTranslation(answer_addr, keynode_nrel_translation, sctp_client)
		while translation is None:
			time.sleep(0.1)
			translation = findTranslation(answer_addr, keynode_nrel_translation, sctp_client)
			
		# get output string
		translation_addr = translation[0][2]
		output = sctp_client.get_link_content(translation_addr)
		output = output.replace('\n', '<br/>')
		
		res = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_A, arg_addr, 0, 0)
		if res is None:
			output += "must be: 0"
		else:
			output += "must be: %d" % len(res)
	
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

def scg(request):
	t = loader.get_template("scg.html")
	
	c = Context({})
	return HttpResponse(t.render(c))
	
