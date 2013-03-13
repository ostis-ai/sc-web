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
from sctp.client import sctpClient
import settings, json, time

def stat(request):
	
	sctp_client = sctpClient()
	sctp_client.initialize(settings.SCTP_HOST, settings.SCTP_PORT)
	
	stat_data = sctp_client.get_statistics(0, time.time())
	
	data = [] #['Nodes', 'Arcs', 'Links', 'Live nodes', 'Live arcs', 'Live links', 'Empty', 'Connections', 'Commands', 'Command errors']
	for item in stat_data:
				
		data.append([item.time,
					item.nodeCount,
					item.arcCount, 
	                item.linksCount, 
	                item.liveNodeCount,
	                item.liveArcCount,
	                item.liveLinkCount,
	                item.emptyCount,
	                item.connectionsCount,
	                item.commandsCount,
	                item.commandErrorsCount
					])
		
	memory_data_str = json.dumps(data)
	
	t = loader.get_template("stat.html")
	return HttpResponse(t.render(Context({'memory_data': memory_data_str})))
