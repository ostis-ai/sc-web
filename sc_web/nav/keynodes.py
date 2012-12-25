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

class KeynodeSysIdentifiers:
    
    nrel_system_identifier = 'nrel_system_identifier'
    nrel_translation = 'nrel_translation'
    nrel_author = 'nrel_author'
    
    question = 'question'
    question_nrel_answer = 'question_nrel_answer'
    question_initiated = 'question_initiated'
    question_search_all_output_arcs = 'question_search_all_output_arcs'
    
    ui_user = 'ui_user'
    ui_nrel_user_answer_formats = 'ui_nrel_user_answer_formats'
    
    format_scs = 'format_scs'
    
def getKeynodeBySystemIdentifier(sys_idtf, client):
    """Returns keynode sc-addr, by system identifier
    @param sys_idtf: System identifier of keynode
    @param client: sctpClient object to connect
    @return: If keynode founded, then return sc-addr of founded keynode; otherwise return None   
    """
    assert client is not None
    return client.find_element_by_system_identifier(sys_idtf)