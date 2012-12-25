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
import settings, json

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
