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
import redis


from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.logic import new_sctp_client
from sctp.types import ScAddr, SctpIteratorType, ScElementType

from api.logic import (
    parse_menu_command, find_answer, find_translation,
    check_command_finished, append_to_system_elements,
    find_translation_with_format, get_link_mime, get_languages_list,
    find_tooltip
)
import api.logic as logic

__all__ = (
    'get_identifier',
    'get_menu_commands',
    'do_command',
    'available_output_langs',
    'available_idtf_langs',
    'sc_addrs',
    'link_format',
    'link_content',
)


def serialize_error(status, message):
    return HttpResponse(json.dumps({'status': status, 'message': message}), status=status)

def init(request):
    result = '{}'
    if request.is_ajax():

        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        keynode_ui_main_menu = keys[KeynodeSysIdentifiers.ui_main_menu]
        keynode_ui_external_languages = keys[KeynodeSysIdentifiers.ui_external_languages]
        keynode_languages = keys[KeynodeSysIdentifiers.languages]

        # try to find main menu node
        cmds = parse_menu_command(keynode_ui_main_menu, sctp_client, keys)
        if cmds is None:
            print 'There are no main menu in knowledge base'
            cmds = {}

        # try to find available output languages
        res_out_langs = sctp_client.iterate_elements(
            SctpIteratorType.SCTP_ITERATOR_3F_A_A,
            keynode_ui_external_languages,
            ScElementType.sc_type_arc_pos_const_perm,
            ScElementType.sc_type_node | ScElementType.sc_type_const
        )

        out_langs = []
        if (res_out_langs is not None):
            for items in res_out_langs:
                out_langs.append(items[2].to_id())

        # try to find available output natural languages
        langs = get_languages_list(keynode_languages, sctp_client)
        
        # get user sc-addr
        sc_session = logic.ScSession(request.user, request.session, sctp_client, keys)
        user_addr = sc_session.get_sc_addr()
        result = {'menu_commands': cmds,
                  'languages': langs,
                  'external_languages': out_langs,
                  'user': {
                            'sc_addr': user_addr.to_id(),
                            'is_authenticated': request.user.is_authenticated(),
                            'current_lang': sc_session.get_used_language().to_id(),
                            'default_ext_lang': sc_session.get_default_ext_lang().to_id()
                           }
        }

        result = json.dumps(result)

    return HttpResponse(result, 'application/json')



# -----------------------------------------
@csrf_exempt
def idtf_resolve(request):
    result = None
    if request.is_ajax():
        # get arguments
        idx = 1
        arguments = []
        arg = ''
        while arg is not None:
            arg = request.POST.get(u'%d_' % idx, None)
            if arg is not None:
                arguments.append(arg)
            idx += 1

        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf]
        keynode_nrel_system_identifier = keys[KeynodeSysIdentifiers.nrel_system_identifier]
        
        sc_session = logic.ScSession(request.user, request.session, sctp_client, keys)
        used_lang = sc_session.get_used_language()
        
        

        result = {}
        # get requested identifiers for arguments
        for addr_str in arguments:
            addr = ScAddr.parse_from_string(addr_str)   
            if addr is None:
                print 'Can\'t parse sc-addr from argument: %s' % addr_str
                return serialize_error(404, 'Can\'t parse sc-addr from argument: %s' % addr_str)
            found = False

            identifier = sctp_client.iterate_elements(
                                                      SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                                      addr,
                                                      ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                      ScElementType.sc_type_link,
                                                      ScElementType.sc_type_arc_pos_const_perm,
                                                      keynode_nrel_main_idtf
                                                      )
            idtf_value = None
            if identifier is not None:
                for res in identifier:
                    idtf_addr = res[2]
                    
                    # check if founded main identifier is for used language
                    langs = sctp_client.iterate_elements(
                                                         SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                                         used_lang,
                                                         ScElementType.sc_type_arc_pos_const_perm,
                                                         idtf_addr
                                                         )
                    if langs is not None:
                        # get identifier value
                        idtf_value = sctp_client.get_link_content(idtf_addr)
                        idtf_value = idtf_value.decode('utf-8')
                        found = True
                        result[addr_str] = idtf_value

            # if identifier not found, then get system identifier
            if not found:
                identifier = sctp_client.iterate_elements(
                                                          SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                                          addr,
                                                          ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                          ScElementType.sc_type_link,
                                                          ScElementType.sc_type_arc_pos_const_perm,
                                                          keynode_nrel_system_identifier
                                                          )
                if identifier is not None:
                    idtf_value = sctp_client.get_link_content(identifier[0][2])
                    idtf_value = idtf_value.decode('utf-8')
            
                    result[addr_str] = idtf_value
            
        result = json.dumps(result)

    return HttpResponse(result, 'application/json')

def idtf_find(request):
    result = None
    if request.is_ajax():
        # get arguments
        substr = request.GET.get('substr', None)
        
        # connect to redis an try to find identifiers
        r = redis.StrictRedis(host = settings.REDIS_HOST, port = settings.REDIS_PORT, db = settings.REDIS_DB)
        result = {}
        sys = []
        main = []
        # first of all need to find system identifiers
        cursor = 0
        while len(sys) < settings.IDTF_SEARCH_LIMIT or len(main) < settings.IDTF_SEARCH_LIMIT:
            reply = r.scan(cursor, u"idtf:*%s*" % substr, 200)
            if not reply or len(reply) == 0:
                break
            cursor = int(reply[0])
            if cursor == 0:
                break
            for idtf in reply[1]:
                if len(sys) == settings.IDTF_SEARCH_LIMIT and len(main) == settings.IDTF_SEARCH_LIMIT:
                    break
                
                rep = r.get(idtf)
                utf = idtf.decode('utf-8')
                addr = ScAddr.parse_binary(rep)
                if utf.startswith(u"idtf:sys:") and len(sys) < settings.IDTF_SEARCH_LIMIT:
                    sys.append([addr.to_id(), utf[9:]])
                elif utf.startswith(u"idtf:main:") and len(main) < settings.IDTF_SEARCH_LIMIT:
                    main.append([addr.to_id(), utf[10:]])        

        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)    
        keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf]
        keynode_nrel_system_identifier = keys[KeynodeSysIdentifiers.nrel_system_identifier]
                    
        result[keynode_nrel_system_identifier.to_id()] = sys
        result[keynode_nrel_main_idtf.to_id()] = main
        
        result = json.dumps(result)

    return HttpResponse(result, 'application/json')

@csrf_exempt
def cmd_do(request):
    result = '[]'
    if request.is_ajax():
        sctp_client = new_sctp_client()

        cmd_addr = ScAddr.parse_from_string(request.POST.get(u'cmd', None))
        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg = ScAddr.parse_from_string(request.POST.get(u'%d_' % idx, None))
            if arg is not None:
                # check if sc-element exist
                if sctp_client.check_element(arg):
                    arguments.append(arg)
                else:
                    return serialize_error(404, "Invalid argument: %s" % arg)

            first = False
            idx += 1

        if (len(arguments) > 0) and (cmd_addr is not None):

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
            #keynode_ui_displayed_answer = keys[KeynodeSysIdentifiers.ui_displayed_answer]
            keynode_nrel_authors = keys[KeynodeSysIdentifiers.nrel_authors]
            #keynode_ui_nrel_user_answer_formats = keys[KeynodeSysIdentifiers.ui_nrel_user_answer_formats]
            #keynode_nrel_translation = keys[KeynodeSysIdentifiers.nrel_translation]
            #keynode_nrel_answer = keys[KeynodeSysIdentifiers.question_nrel_answer]
            keynode_question_initiated = keys[KeynodeSysIdentifiers.question_initiated]
            keynode_question = keys[KeynodeSysIdentifiers.question]
            keynode_system_element = keys[KeynodeSysIdentifiers.system_element]

            # create command in sc-memory
            inst_cmd_addr = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            append_to_system_elements(sctp_client, keynode_system_element, inst_cmd_addr)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_command_generate_instance, inst_cmd_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

            inst_cmd_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, inst_cmd_addr, cmd_addr)
            append_to_system_elements(sctp_client, keynode_system_element, inst_cmd_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_rrel_commnad, inst_cmd_arc)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

            # create arguments
            args_addr = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            append_to_system_elements(sctp_client, keynode_system_element, args_addr)
            args_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, inst_cmd_addr, args_addr)
            append_to_system_elements(sctp_client, keynode_system_element, args_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_rrel_command_arguments, args_arc)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

            idx = 1
            for arg in arguments:
                arg_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, args_addr, arg)
                append_to_system_elements(sctp_client, keynode_system_element, arg_arc)
                if arg_arc is None:
                    return serialize_error(404, 'Error while create "create_instance" command')

                idx_addr = sctp_client.find_element_by_system_identifier(str(u'rrel_%d' % idx))
                if idx_addr is None:
                    return serialize_error(404, 'Error while create "create_instance" command')
                idx += 1
                arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, idx_addr, arg_arc)
                append_to_system_elements(sctp_client, keynode_system_element, arc)

            wait_time = 0
            wait_dt = 0.1
            
            # initialize command
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_command_initiated, inst_cmd_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

            cmd_finished = check_command_finished(inst_cmd_addr, keynode_ui_command_finished, sctp_client)
            while cmd_finished is None:
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > settings.EVENT_WAIT_TIMEOUT:
                    return serialize_error(404, 'Timeout waiting for "create_instance" command finished')
                cmd_finished = check_command_finished(inst_cmd_addr, keynode_ui_command_finished, sctp_client)


            # get command result
            cmd_result = sctp_client.iterate_elements(
                SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                inst_cmd_addr,
                ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                ScElementType.sc_type_node | ScElementType.sc_type_const,
                ScElementType.sc_type_arc_pos_const_perm,
                keynode_ui_nrel_command_result
            )
            if cmd_result is None:
                return serialize_error(404, 'Can\'t find "create_instance" command result')

            cmd_result = cmd_result[0][2]

            # @todo support all possible commands
            # try to find question node
            question = sctp_client.iterate_elements(
                SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                keynode_question,
                ScElementType.sc_type_arc_pos_const_perm,
                ScElementType.sc_type_node | ScElementType.sc_type_const,
                ScElementType.sc_type_arc_pos_const_perm,
                cmd_result
            )
            if question is None:
                return serialize_error(404, "Can't find question node")

            question = question[0][2]

            append_to_system_elements(sctp_client, keynode_system_element, question)

            # create author
            sc_session = logic.ScSession(request.user, request.session, sctp_client, keys)
            user_node = sc_session.get_sc_addr()
            if not user_node:
                return serialize_error(404, "Can't resolve user node")
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

            author_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question, user_node)
            append_to_system_elements(sctp_client, keynode_system_element, author_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_nrel_authors, author_arc)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

            # create output formats set
            '''output_formats_node = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            append_to_system_elements(sctp_client, keynode_system_element, output_formats_node)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, output_formats_node, output_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

            format_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question, output_formats_node)
            append_to_system_elements(sctp_client, keynode_system_element, format_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_nrel_user_answer_formats, format_arc)
            append_to_system_elements(sctp_client, keynode_system_element, arc)'''

            # initiate question
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_question_initiated, question)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

            # first of all we need to wait answer to this question
            #print sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, keynode_question_initiated, 0, 0)
            
            result = { 'question': question.to_id() }
            
        result = json.dumps(result)
    
    return HttpResponse(result, 'application/json')

@csrf_exempt
def question_answer_translate(request):
    
    if request.is_ajax():
        sctp_client = new_sctp_client()

        question_addr = ScAddr.parse_from_string(request.POST.get(u'question', None))
        format_addr = ScAddr.parse_from_string(request.POST.get(u'format', None))
        
        keys = Keynodes(sctp_client)
        keynode_nrel_answer = keys[KeynodeSysIdentifiers.question_nrel_answer]
        keynode_nrel_translation = keys[KeynodeSysIdentifiers.nrel_translation]
        keynode_nrel_format = keys[KeynodeSysIdentifiers.nrel_format]
        keynode_system_element = keys[KeynodeSysIdentifiers.system_element]
        
        # try to find answer for the question
        wait_time = 0
        wait_dt = 0.1
        
        answer = find_answer(question_addr, keynode_nrel_answer, sctp_client)
        while answer is None:
            time.sleep(wait_dt)
            wait_time += wait_dt
            if wait_time > settings.EVENT_WAIT_TIMEOUT:
                return serialize_error(404, 'Timeout waiting for answer')
            answer = find_answer(question_addr, keynode_nrel_answer, sctp_client)
        
        if answer is None:
            return serialize_error(404, 'Answer not found')
        
        answer_addr = answer[0][2]
        
        result_link_addr = None
        
        # try to find translation to specified format
        result_link_addr = find_translation_with_format(answer_addr, format_addr, keynode_nrel_format, keynode_nrel_translation, sctp_client)
        
        # if link addr not found, then run translation of answer to specified format
        if result_link_addr is None:
            trans_cmd_addr = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            append_to_system_elements(sctp_client, keynode_system_element, trans_cmd_addr)
            
            arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, trans_cmd_addr, answer_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
            
            arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keys[KeynodeSysIdentifiers.ui_rrel_source_sc_construction], arc_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
            
            arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, trans_cmd_addr, format_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
            
            arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keys[KeynodeSysIdentifiers.ui_rrel_output_format], arc_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
            
            # add into translation command set
            arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keys[KeynodeSysIdentifiers.ui_command_translate_from_sc], trans_cmd_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
            
            # initialize command
            arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keys[KeynodeSysIdentifiers.ui_command_initiated], trans_cmd_addr)
            append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
            
            # now we need to wait translation result
            wait_time = 0
            translation = find_translation_with_format(answer_addr, format_addr, keynode_nrel_format, keynode_nrel_translation, sctp_client)
            while translation is None:
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > settings.EVENT_WAIT_TIMEOUT:
                    return serialize_error(404, 'Timeout waiting for answer translation')
 
                translation = find_translation_with_format(answer_addr, format_addr, keynode_nrel_format, keynode_nrel_translation, sctp_client)
                
            if translation is not None:
                result_link_addr = translation
    
        # if result exists, then we need to return it content
        if result_link_addr is not None:
            result = json.dumps({"link": result_link_addr.to_id()})
    
            return HttpResponse(result, 'application/json')
    
    return serialize_error(404, "Can't make translation")

@csrf_exempt
def sc_addrs(request):
    result = '[]'
    if request.is_ajax():
        sctp_client = new_sctp_client()

        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg_str = u'%d_' % idx
            arg = request.POST.get(arg_str, None)
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

@csrf_exempt
def link_format(request):
    result = '{}'
    if request.is_ajax():
        sctp_client = new_sctp_client()

        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg_str = u'%d_' % idx
            arg = ScAddr.parse_from_string(request.POST.get(arg_str, None))
            if arg is not None:
                arguments.append(arg)
            first = False
            idx += 1

        keys = Keynodes(sctp_client)
        keynode_nrel_format = keys[KeynodeSysIdentifiers.nrel_format]
        keynode_format_txt = keys[KeynodeSysIdentifiers.format_txt]

        result = {}
        for arg in arguments:

            # try to resolve format
            format = sctp_client.iterate_elements(
                SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                arg,
                ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                ScElementType.sc_type_node | ScElementType.sc_type_const,
                ScElementType.sc_type_arc_pos_const_perm,
                keynode_nrel_format
            )
            if format is not None:
                result[arg.to_id()] = format[0][2].to_id()
            else:
                result[arg.to_id()] = keynode_format_txt.to_id()

        result = json.dumps(result)

    return HttpResponse(result, 'application/json')

def link_content(request):
    result = '{}'

    sctp_client = new_sctp_client()

    keys = Keynodes(sctp_client)
    keynode_nrel_format = keys[KeynodeSysIdentifiers.nrel_format]
    keynode_nrel_mimetype = keys[KeynodeSysIdentifiers.nrel_mimetype]

    # parse arguments
    addr = ScAddr.parse_from_string(request.GET.get('addr', None))
    if addr is None:
        return serialize_error(404, 'Invalid arguments')

    result = sctp_client.get_link_content(addr)
    if result is None:
        return serialize_error(404, 'Content not found')

    return HttpResponse(result, get_link_mime(addr, keynode_nrel_format, keynode_nrel_mimetype, sctp_client) + '; charset=UTF-8')

def get_languages(request):
    result = []
    if request.is_ajax():
        
        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        
        langs = get_languages_list(keys[KeynodeSysIdentifiers.languages], sctp_client)
        
        result = json.dumps(langs)
        
    return HttpResponse(result, 'application/json')

@csrf_exempt
def set_language(request):
    
    if (request.is_ajax()):
        
        lang_addr = ScAddr.parse_from_string(request.POST.get(u'lang_addr', None))
        
        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        
        sc_session = logic.ScSession(request.user, request.session, sctp_client, keys)
        sc_session.set_current_lang_mode(lang_addr)
        
        result = json.dumps('')
    
    return HttpResponse(result, 'application/json')
    
@csrf_exempt
def info_tooltip(request):
    result = '[]'
    if request.is_ajax():
        sctp_client = new_sctp_client()

        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg_str = u'%d_' % idx
            arg = request.POST.get(arg_str, None)
            if arg is not None:
                arguments.append(arg)
            first = False
            idx += 1
            
        keys = Keynodes(sctp_client)
        sc_session = logic.ScSession(request.user, request.session, sctp_client, keys)

        res = {}
        for addr in arguments:
            tooltip = find_tooltip(ScAddr.parse_from_string(addr), sctp_client, keys, sc_session.get_used_language())
            res[addr] = tooltip

        result = json.dumps(res)

    return HttpResponse(result, 'application/json')