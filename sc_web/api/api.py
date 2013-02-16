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
from keynodes import KeynodeSysIdentifiers, Keynodes
import base64
import keynodes
import settings, json
import time


def newSctpClient():
    sctp_client = sctpClient()
    sctp_client.initialize(settings.SCTP_HOST, settings.SCTP_PORT)
    return sctp_client
    
def serialize_error(status, message):
    return HttpResponse(json.dumps({'status': status, 'message': message}), status=status)

#######################


def get_identifier(request):
    
    result = None
    if request.is_ajax():
        lang_code = ScAddr.parse_from_string(request.GET.get(u'language', None))
        
        if lang_code is None:
            print "Invalid sc-addr of language"
            return HttpResponse(None)
        
        # get arguments
        idx = 1
        arguments = []
        arg = ''
        while arg is not None:
            arg = request.GET.get(u'%d_' % idx, None)
            if arg is not None:
                arguments.append(arg)
            idx += 1
        
        sctp_client = newSctpClient()
        
        keys = Keynodes(sctp_client)
        keynode_ui_nrel_idtf_language_relation = keys[KeynodeSysIdentifiers.ui_nrel_idtf_language_relation]
        
        # first of all we need to resolve language relation
        lang_relation_keynode = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                                            lang_code,
                                                            ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                            ScElementType.sc_type_node | ScElementType.sc_type_const,
                                                            ScElementType.sc_type_arc_pos_const_perm,
                                                            keynode_ui_nrel_idtf_language_relation) 
        if lang_relation_keynode is None:
            print "Can't resolve keynode for language '%s'" % str(lang_code)
            return HttpResponse(None)
        
        lang_relation_keynode = lang_relation_keynode[0][2]
        
        result = {}
        # get requested identifiers for arguments
        for addr_str in arguments:
            addr = ScAddr.parse_from_string(addr_str)
            if addr is None:
                print "Can't parse sc-addr from argument: %s" % addr_str
                return serialize_error(404, "Can't parse sc-addr from argument: %s" % addr_str)
            
            
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

# --------------------------------------------------
def parse_menu_command(cmd_addr, sctp_client, keys):
    """Parse specified command from sc-memory and
    return hierarchy map (with childs), that represent it
    @param cmd_addr: sc-addr of command to parse
    @param sctp_client: sctp client object to work with sc-memory
    @param keys: keynodes object. Used just to prevent new instance creation 
    """
    keynode_ui_user_command_atom = keys[KeynodeSysIdentifiers.ui_user_command_atom]
    keynode_ui_user_command_noatom = keys[KeynodeSysIdentifiers.ui_user_command_noatom]
    keynode_nrel_decomposition = keys[KeynodeSysIdentifiers.nrel_decomposition]
    
    # try to find command type
    cmd_type = "unknown"
    if sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                    keynode_ui_user_command_atom,
                                    ScElementType.sc_type_arc_pos_const_perm,
                                    cmd_addr) is not None:
        cmd_type = "cmd_atom"
    elif sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                      keynode_ui_user_command_noatom,
                                      ScElementType.sc_type_arc_pos_const_perm,
                                      cmd_addr) is not None:
        cmd_type = "cmd_noatom"
    
    attrs = {}
    attrs["cmd_type"] = cmd_type
    attrs["id"] = cmd_addr.to_id()
    
    
    # try to find decomposition
    decomp = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                                          ScElementType.sc_type_node | ScElementType.sc_type_const,
                                          ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                          cmd_addr,
                                          ScElementType.sc_type_arc_pos_const_perm,
                                          keynode_nrel_decomposition)
    if decomp is not None:
        
        # iterate child commands
        childs = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_A,
                                              decomp[0][0],
                                              ScElementType.sc_type_arc_pos_const_perm,
                                              ScElementType.sc_type_node | ScElementType.sc_type_const)
        if childs is not None:
            child_commands = []
            for item in childs:
                child_structure = parse_menu_command(item[2], sctp_client, keys)
                child_commands.append(child_structure)
            attrs["childs"] = child_commands
    
    return attrs    

def get_menu_commands(request):
    
    result = "[]"
    if request.is_ajax():
        
        sctp_client = sctpClient()
        sctp_client.initialize(settings.SCTP_HOST, settings.SCTP_PORT)
        
        keys = Keynodes(sctp_client)
        
        keynode_ui_main_menu = keys[KeynodeSysIdentifiers.ui_main_menu]
        
        # try to find main menu node
        result = parse_menu_command(keynode_ui_main_menu, sctp_client, keys)
        if result is None:
            print "There are no main menu in knowledge base"
            result = "[]"
        else:
            result = json.dumps(result)
    
    return HttpResponse(result, 'application/json')

# -------------------------------------------
def findCmdResult(command_addr, keynode_ui_nrel_command_result, sctp_client):
    return sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                        command_addr,
                                        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                        ScElementType.sc_type_link,
                                        ScElementType.sc_type_arc_pos_const_perm,
                                        keynode_ui_nrel_command_result)
    
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
    
def checkCommandFinished(command_addr, keynode_command_finished, sctp_client):
    return sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                        keynode_command_finished,
                                        ScElementType.sc_type_arc_pos_const_perm,
                                        command_addr)

def appendToSystemElements(sctp_client, keynode_system_element, el):
    sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_system_element, el)

def doCommand(request):
    result = "[]"
    if request.is_ajax():
        #result = u'[{"type": "node", "id": "1", "identifier": "node1"},' \
        #        u'{"type": "arc", "id": "2", "begin": "1", "end": "3"},' \
        #        u'{"type": "node", "id": "3", "identifier": "node2"}]'
        sctp_client = newSctpClient()
        
        cmd_addr = ScAddr.parse_from_string(request.GET.get(u'cmd', None))
        output_addr = ScAddr.parse_from_string(request.GET.get(u'output', None))
        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg = ScAddr.parse_from_string(request.GET.get(u'%d_' % idx, None))
            if arg is not None:
                # check if sc-element exist
                if sctp_client.check_element(arg):
                    arguments.append(arg)
                else:
                    return serialize_error(404, "Invalid agument: %s" % arg)
                    
            first = False
            idx += 1
                
        if (len(arguments) > 0) and (cmd_addr is not None) and (output_addr is not None):
            
            keys = Keynodes(sctp_client)

            keynode_ui_rrel_commnad = keys[KeynodeSysIdentifiers.ui_rrel_commnad]
            keynode_ui_rrel_command_arguments = keys[KeynodeSysIdentifiers.ui_rrel_command_arguments]
            keynode_ui_nrel_command_result = keys[KeynodeSysIdentifiers.ui_nrel_command_result]
            keynode_ui_user_command_question = keys[KeynodeSysIdentifiers.ui_user_command_question]
            keynode_ui_command_generate_instance = keys[KeynodeSysIdentifiers.ui_command_generate_instance]
            keynode_ui_command_initiated = keys[KeynodeSysIdentifiers.ui_command_initiated]
            keynode_ui_command_finished = keys[KeynodeSysIdentifiers.ui_command_finished]
            keynode_ui_nrel_command_result = keys[KeynodeSysIdentifiers.ui_nrel_command_result]
            keynode_ui_user = keys[KeynodeSysIdentifiers.ui_user]
            keynode_nrel_authors = keys[KeynodeSysIdentifiers.nrel_authors]
            keynode_ui_nrel_user_answer_formats = keys[KeynodeSysIdentifiers.ui_nrel_user_answer_formats]
            keynode_nrel_translation = keys[KeynodeSysIdentifiers.nrel_translation]
            keynode_nrel_answer = keys[KeynodeSysIdentifiers.question_nrel_answer]
            keynode_question_initiated = keys[KeynodeSysIdentifiers.question_initiated]
            keynode_question = keys[KeynodeSysIdentifiers.question]
            keynode_system_element = keys[KeynodeSysIdentifiers.system_element]

            
            # create command in sc-memory
            inst_cmd_addr = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            appendToSystemElements(sctp_client, keynode_system_element, inst_cmd_addr)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_command_generate_instance, inst_cmd_addr)
            appendToSystemElements(sctp_client, keynode_system_element, arc)
            
            inst_cmd_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, inst_cmd_addr, cmd_addr)
            appendToSystemElements(sctp_client, keynode_system_element, inst_cmd_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_rrel_commnad, inst_cmd_arc)
            appendToSystemElements(sctp_client, keynode_system_element, arc)
            
            # create arguments
            args_addr = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            appendToSystemElements(sctp_client, keynode_system_element, args_addr)
            args_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, inst_cmd_addr, args_addr)
            appendToSystemElements(sctp_client, keynode_system_element, args_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_rrel_command_arguments, args_arc)
            appendToSystemElements(sctp_client, keynode_system_element, arc)
            
            idx = 1
            for arg in arguments:
                arg_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, args_addr, arg)
                appendToSystemElements(sctp_client, keynode_system_element, arg_arc)
                if arg_arc is None:
                    return serialize_error(404, "Error while create 'create_instance' command")
                
                idx_addr = sctp_client.find_element_by_system_identifier(str(u'rrel_%d' % idx))
                if idx_addr is None:
                    return serialize_error(404, "Error while create 'create_instance' command")
                idx += 1
                arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, idx_addr, arg_arc)
                appendToSystemElements(sctp_client, keynode_system_element, arc)

            wait_time = 0
            wait_dt = 0.1
            # initialize command
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_command_initiated, inst_cmd_addr)
            appendToSystemElements(sctp_client, keynode_system_element, arc)
            
            cmd_finished = checkCommandFinished(inst_cmd_addr, keynode_ui_command_finished, sctp_client)
            while cmd_finished is None:
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > settings.EVENT_WAIT_TIMEOUT:
                    return serialize_error(404, "Timeout waiting for 'create_instance' command finished")
                cmd_finished = checkCommandFinished(inst_cmd_addr, keynode_ui_command_finished, sctp_client)
                
            
            # get command result
            cmd_result = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                                        inst_cmd_addr,
                                                        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                        ScElementType.sc_type_node | ScElementType.sc_type_const,
                                                        ScElementType.sc_type_arc_pos_const_perm,
                                                        keynode_ui_nrel_command_result)
            if cmd_result is None:
                return serialize_error(404, "Can't find 'create_instance' command result")
            
            cmd_result = cmd_result[0][2]
            
            # @todo support all possible commands
            # try to find question node
            question = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                                    keynode_question,
                                                    ScElementType.sc_type_arc_pos_const_perm,
                                                    ScElementType.sc_type_node | ScElementType.sc_type_const,
                                                    ScElementType.sc_type_arc_pos_const_perm,
                                                    cmd_result)
            if question is None:
                return serialize_error(404, "Can't find question node")
            
            question = question[0][2]
            
            # create author
            user_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            appendToSystemElements(sctp_client, keynode_system_element, user_node)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)
            appendToSystemElements(sctp_client, keynode_system_element, arc)
            
            author_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question, user_node)
            appendToSystemElements(sctp_client, keynode_system_element, author_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_nrel_authors, author_arc)
            appendToSystemElements(sctp_client, keynode_system_element, arc)       
            
            # create output formats set
            output_formats_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            appendToSystemElements(sctp_client, keynode_system_element, output_formats_node)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, output_formats_node, output_addr)
            appendToSystemElements(sctp_client, keynode_system_element, arc)
            
            format_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question, output_formats_node)
            appendToSystemElements(sctp_client, keynode_system_element, format_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_nrel_user_answer_formats, format_arc)
            appendToSystemElements(sctp_client, keynode_system_element, arc)
            
            # initiate question
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_question_initiated, question)
            appendToSystemElements(sctp_client, keynode_system_element, arc)
            
            # first of all we need to wait answer to this question
            #print sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_A, keynode_question_initiated, 0, 0)
            
            wait_time = 0
            answer = findAnswer(question, keynode_nrel_answer, sctp_client)
            while answer is None:
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > settings.EVENT_WAIT_TIMEOUT:
                    return serialize_error(404, "Timeout waiting for answer")
                answer = findAnswer(question, keynode_nrel_answer, sctp_client)
            
            wait_time = 0
            answer_addr = answer[0][2]
            translation = findTranslation(answer_addr, keynode_nrel_translation, sctp_client)
            while translation is None:
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > settings.EVENT_WAIT_TIMEOUT:
                    return serialize_error(404, "Timeout waiting for answer translation")
                
                translation = findTranslation(answer_addr, keynode_nrel_translation, sctp_client)
                
            # get output string
            translation_addr = translation[0][2]
            result = sctp_client.get_link_content(translation_addr);
        
    
    return HttpResponse(result, 'application/json')

def available_output_langs(request):
    """Returns list of available output languages
    """
    result = "[]"
    if request.is_ajax():
        sctp_client = newSctpClient()
        
        keys = Keynodes(sctp_client)
        
        keynode_ui_output_languages = keys[KeynodeSysIdentifiers.ui_output_languages]
        res = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_A,
                                            keynode_ui_output_languages,
                                            ScElementType.sc_type_arc_pos_const_perm,
                                            ScElementType.sc_type_node | ScElementType.sc_type_const)
        if (res is not None):
            result = []
            for items in res:
                result.append(items[2].to_id())
                
            result = json.dumps(result)
        
    return HttpResponse(result, 'application/json')


def available_idtf_langs(request):
    """Returns list of available identifier languages
    """
    result = "[]"
    if request.is_ajax():
        sctp_client = newSctpClient()
        
        keys = Keynodes(sctp_client)
        
        keynode_ui_idtf_languages = keys[KeynodeSysIdentifiers.ui_idtf_languages]
        res = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_3F_A_A,
                                            keynode_ui_idtf_languages,
                                            ScElementType.sc_type_arc_pos_const_perm,
                                            ScElementType.sc_type_node | ScElementType.sc_type_const)
        if (res is not None):
            result = []
            for items in res:
                result.append(items[2].to_id())
                
            result = json.dumps(result)
        
    return HttpResponse(result, 'application/json')

def scAddrs(request):
    
    result = "[]"
    if request.is_ajax():
        sctp_client = newSctpClient()
        
        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg_str = u'%d_' % idx
            arg = request.GET.get(arg_str, None)
            if arg is not None:
                arguments.append(arg)
            first = False
            idx += 1
        
        res = {}
        for idtf in arguments:
            addr = sctp_client.find_element_by_system_identifier(str(idtf))
            if addr is not None:
                res[idtf] = addr.to_id()
        
        result = json.dumps(res)
        
    return HttpResponse(result, 'application/json')


def linkFormat(request):
    result = '{}'
    if request.is_ajax():
        sctp_client = newSctpClient()
        
        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg_str = u'%d_' % idx
            arg = ScAddr.parse_from_string(request.GET.get(arg_str, None))
            if arg is not None:
                arguments.append(arg)
            first = False
            idx += 1
                       
        keys = Keynodes(sctp_client)
        keynode_nrel_format = keys[KeynodeSysIdentifiers.nrel_format]
        
        result = {}
        for arg in arguments:
            
            # try to resolve format
            format = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                                  arg,
                                                  ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                  ScElementType.sc_type_node | ScElementType.sc_type_const,
                                                  ScElementType.sc_type_arc_pos_const_perm,
                                                  keynode_nrel_format)
            if format is not None:
                result[arg.to_id()] = format[0][2].to_id()
                
                
        result = json.dumps(result)
                 
    
    return HttpResponse(result, 'application/json')

def linkContent(request):
    result = '{}'
    if True: #request.is_ajax():
        sctp_client = newSctpClient()
        
        keys = Keynodes(sctp_client)
        keynode_nrel_format = keys[KeynodeSysIdentifiers.nrel_format]
        keynode_nrel_mimetype = keys[KeynodeSysIdentifiers.nrel_mimetype] 
        
        # parse arguments
        addr = ScAddr.parse_from_string(request.GET.get('addr', None))
        if addr is None:
            return serialize_error(404, "Invalid arguments")
        
        result = sctp_client.get_link_content(addr)
        if result is None:
            return serialize_error(404, "Content not found")
        
        mimetype_str = u'text/plain'
        # determine format and mimetype
        format = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                              addr,
                                              ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                              ScElementType.sc_type_node | ScElementType.sc_type_const,
                                              ScElementType.sc_type_arc_pos_const_perm,
                                              keynode_nrel_format)
        if format is not None:           
            # fetermine mimetype
            mimetype = sctp_client.iterate_elements(sctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                                    format[0][2],
                                                    ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                    ScElementType.sc_type_link,
                                                    ScElementType.sc_type_arc_pos_const_perm,
                                                    keynode_nrel_mimetype)
            if mimetype is not None:
                mime_value = sctp_client.get_link_content(mimetype[0][2])
                if mime_value is not None:
                    mimetype_str = mime_value
    
    return HttpResponse(result, mimetype_str)