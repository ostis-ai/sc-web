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

import json
import time

from django.views.generic.base import TemplateView

from sctp.logic import new_sctp_client

__all__ = (
    'HomeView',
    'StatView',
    'ScgView',
)


class HomeView(TemplateView):
    template_name = 'home.html'


class StatView(TemplateView):
    template_name = 'stat.html'

    def get_context_data(self, **kwargs):
        context = super(StatView, self).get_context_data(**kwargs)

        sctp_client = new_sctp_client()
        stat_data = sctp_client.get_statistics(0, time.time())

        data = []  # ['Nodes', 'Arcs', 'Links', 'Live nodes', 'Live arcs', 'Live links', 'Empty', 'Connections', 'Commands', 'Command errors']
        for item in stat_data:
            data.append([
                item.time,
                item.nodeCount,
                item.arcCount,
                item.linksCount,
                item.liveNodeCount,
                item.liveArcCount,
                item.liveLinkCount,
                item.emptyCount,
                item.connectionsCount,
                item.commandsCount,
                item.commandErrorsCount,
            ])

        memory_data_str = json.dumps(data)

        context.update({
            'memory_data': memory_data_str,
        })

        return context


class ScgView(TemplateView):
    template_name = 'scg.html'


# NOT USED, IF YOWU WANT TO USE IT, YOU SHOUD REFETOR THIS VIEW TO TEMPLATE VIEW AND ADD IT TO URL.PY
# def keynode(request, name):
#     t = loader.get_template("home.html")

#     sctp_client = SctpClient()
#     sctp_client.initialize(settings.SCTP_HOST, settings.SCTP_PORT)

#     arg_idtf = str(name.encode('utf-8'))
#     arg_addr = sctp_client.find_element_by_system_identifier(arg_idtf)

#     output = ""
#     if arg_addr is None:
#         output = "Error: sc-element with system identifier %s doesn't exist" % name
#     else:

#         # resolve keynodes
#         keys = Keynodes(sctp_client)

#         keynode_question = keys[KeynodeSysIdentifiers.question]
#         keynode_question_initiated = keys[KeynodeSysIdentifiers.question_initiated]
#         keynode_ui_user = keys[KeynodeSysIdentifiers.ui_user]
#         keynode_nrel_answer = keys[KeynodeSysIdentifiers.question_nrel_answer]
#         keynode_nrel_author = keys[KeynodeSysIdentifiers.nrel_author]
#         keynode_format_scs = keys[KeynodeSysIdentifiers.format_scs]
#         keynode_ui_nrel_user_answer_formats = keys[KeynodeSysIdentifiers.ui_nrel_user_answer_formats]
#         keynode_nrel_translation = keys[KeynodeSysIdentifiers.nrel_translation]

#         # create question in sc-memory
#         question_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
#         sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_question, question_node)
#         sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, question_node, arg_addr)



#         # create author
#         user_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
#         sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)

#         author_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question_node, user_node)
#         sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_nrel_author, author_arc)

#         # create otput formats set
#         output_formats_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
#         sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, output_formats_node, keynode_format_scs)

#         format_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question_node, output_formats_node)
#         sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_nrel_user_answer_formats, format_arc)

#         # initiate question
#         sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_question_initiated, question_node)

#         # first of all we need to wait answer to this question
#         #print sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, keynode_question_initiated, 0, 0)

#         answer = findAnswer(question_node, keynode_nrel_answer, sctp_client)
#         while answer is None:
#             time.sleep(0.1)
#             answer = findAnswer(question_node, keynode_nrel_answer, sctp_client)

#         answer_addr = answer[0][2]
#         translation = findTranslation(answer_addr, keynode_nrel_translation, sctp_client)
#         while translation is None:
#             time.sleep(0.1)
#             translation = findTranslation(answer_addr, keynode_nrel_translation, sctp_client)

#         # get output string
#         translation_addr = translation[0][2]
#         output = sctp_client.get_link_content(translation_addr)
#         output = output.replace('\n', '<br/>')

#         res = sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, arg_addr, 0, 0)
#         if res is None:
#             output += "must be: 0"
#         else:
#             output += "must be: %d" % len(res)

#     c = Context({"data": output
#                 })
#     return HttpResponse(t.render(c))
