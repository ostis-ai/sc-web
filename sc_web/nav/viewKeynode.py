# -*- coding: utf-8 -*-
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
