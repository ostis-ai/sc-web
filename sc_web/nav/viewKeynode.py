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
from sctp.client import sctpClient
from sctp.types import ScAddr
from sctp.types import ScElementType

def keynode(request, name):
	t = loader.get_template("home.html")
	
	sctp_client = sctpClient()
	sctp_client.initialize(settings.SCTP_HOST, settings.SCTP_PORT)
	
	addr = ScAddr(0, int(name))
	
	output = "<h3>%s</h3>" % name
	output += "Exist: %s<br/>" % str(sctp_client.check_element(addr))
	
	el_type = sctp_client.get_element_type(addr)
	s_type = ""
	if el_type & ScElementType.sc_type_node:
		s_type += "node "
	elif el_type & ScElementType.sc_type_arc_common:
		s_type += "arc_common "
	elif el_type & ScElementType.sc_type_edge_common:
		s_type += "edge "
	elif el_type & ScElementType.sc_type_arc_access:
		s_type += "arc_access "
	elif el_type & ScElementType.sc_type_link:
		s_type += "link "
	output += "Type: %s<br/>" % s_type
	
	content = sctp_client.get_link_content(addr)
	if content is not None:
		content = content.decode('utf-8')
	else:
		content = str(content)
	output += "Content: %s" % content
	
	c = Context({"data": output
				})
	return HttpResponse(t.render(c))
