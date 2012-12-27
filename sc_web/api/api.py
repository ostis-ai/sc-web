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
from sctp.types import ScAddr, sctpIteratorType, ScElementType
from sctp.client import sctpClient
from keynodes import KeynodeSysIdentifiers
import keynodes
import settings, json
import time

def get_identifier(request):
	
	result = None
	if request.is_ajax() or True:
		lang_code = request.GET.get(u'language', '')
		# get arguments
		idx = 1
		arguments = []
		arg = ''
		while arg is not None:
			arg = request.GET.get(u'arg_%d' % idx, None)
			if arg is not None:
				arguments.append(arg)
			idx += 1
		
		sctp_client = sctpClient()
		sctp_client.initialize(settings.SCTP_HOST, settings.SCTP_PORT)
		
		# first of all we need to resolve language relation
		lang_str = 'nrel_main_%s_idtf' % lang_code
		lang_relation_keynode = sctp_client.find_element_by_system_identifier(str(lang_str.encode('utf-8')))
		if lang_relation_keynode is None:
			print "Can't resolve keynode for language '%s'" % str(lang_code)
			return HttpResponse(None)
		
		result = {}
		# get requested identifiers for arguments
		for addr_str in arguments:
			addr = ScAddr.parse_from_string(addr_str)
			if addr is None:
				print "Can't parse sc-addr from argument: %s" % addr_str
				return HttpResponse(None)
			
			
			identifier = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F, 
														addr,
														ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
														ScElementType.sc_type_link,
														ScElementType.sc_type_arc_pos_const_perm,
														lang_relation_keynode)
			idtf_value = None
			if identifier is not None:
				idtf_addr = identifier[0][2]
				
				# get identifier value
				idtf_value = sctp_client.get_link_content(idtf_addr)
				idtf_value = idtf_value.decode('utf-8')
			
			result[addr_str] = idtf_value
			
		result = json.dumps(result)
				
	return HttpResponse(result, 'application/json')


# -------------------------------------------
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
def init_command(request):
	result = "[]"
	if request.is_ajax() or True:
		#result = u'[{"type": "node", "id": "1", "identifier": "node1"},' \
		#		 u'{"type": "arc", "id": "2", "begin": "1", "end": "3"},' \
		#		 u'{"type": "node", "id": "3", "identifier": "node2"}]'
		sctp_client = sctpClient()
		sctp_client.initialize(settings.SCTP_HOST, settings.SCTP_PORT)
		
		idtf = request.GET.get(u'idtf', None)
		idtf_addr = None
		
		idtf = str(idtf.encode('utf-8'))
		idtf_addr = sctp_client.find_element_by_system_identifier(idtf)
		
		if idtf_addr is not None:
			
			keynode_question = keynodes.getKeynodeBySystemIdentifier(KeynodeSysIdentifiers.question, sctp_client)
			keynode_question_initiated = keynodes.getKeynodeBySystemIdentifier(KeynodeSysIdentifiers.question_initiated, sctp_client)
			keynode_ui_user = keynodes.getKeynodeBySystemIdentifier(KeynodeSysIdentifiers.ui_user, sctp_client)
			keynode_nrel_answer = keynodes.getKeynodeBySystemIdentifier(KeynodeSysIdentifiers.question_nrel_answer, sctp_client)
			keynode_nrel_author = keynodes.getKeynodeBySystemIdentifier(KeynodeSysIdentifiers.nrel_author, sctp_client)
			keynode_format_scg_json = keynodes.getKeynodeBySystemIdentifier(KeynodeSysIdentifiers.format_scg_json, sctp_client)
			keynode_ui_nrel_user_answer_formats = keynodes.getKeynodeBySystemIdentifier(KeynodeSysIdentifiers.ui_nrel_user_answer_formats, sctp_client)
			keynode_nrel_translation = keynodes.getKeynodeBySystemIdentifier(KeynodeSysIdentifiers.nrel_translation, sctp_client)
			
			# create question in sc-memory
			question_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
			sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_question, question_node)
			sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, question_node, idtf_addr)
			
			
			
			# create author
			user_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
			sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)
			
			author_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question_node, user_node)
			sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_nrel_author, author_arc)		
			
			# create otput formats set
			output_formats_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
			sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, output_formats_node, keynode_format_scg_json)
			
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
			result = sctp_client.get_link_content(translation_addr)
		
	
	return HttpResponse(result, 'application/json')