# -*- coding: utf-8 -*-

import tornado.web
import json
import redis
import decorators

from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.logic import SctpClientInstance
from sctp.types import ScAddr, SctpIteratorType, ScElementType

import api_logic as logic
import time
import base



# -------------------------------------------        


@decorators.class_logging
class Init(base.BaseHandler):
    #@tornado.web.asynchronous
    def get(self):
        result = '{}'
    
        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)
            keynode_ui_main_menu = keys[KeynodeSysIdentifiers.ui_main_menu]
            keynode_ui_external_languages = keys[KeynodeSysIdentifiers.ui_external_languages]
            keynode_languages = keys[KeynodeSysIdentifiers.languages]
    
            # try to find main menu node
            cmds = logic.parse_menu_command(keynode_ui_main_menu, sctp_client, keys)
            if cmds is None:
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
                    out_langs.append(items[2].to_int())
    
            # try to find available output natural languages
            langs = logic.get_languages_list(keynode_languages, sctp_client)
            langs_str = []
            for l in langs:
                langs_str.append(l.to_int())
            
            # get user sc-addr
            sc_session = logic.ScSession(self, sctp_client, keys)
            user_addr = sc_session.get_sc_addr()
            result = {'menu_commands': cmds,
                      'languages': langs_str,
                      'external_languages': out_langs,
                      'user': {
                                'sc_addr': user_addr.to_int(),
                                'is_authenticated': False,
                                'current_lang': sc_session.get_used_language().to_int(),
                                'default_ext_lang': sc_session.get_default_ext_lang().to_int()
                               }
            }
        
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))
        
        
class ContextMenu(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def get(self):
         with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)
            keynode_ui_main_menu = keys[KeynodeSysIdentifiers.ui_main_menu]
            keynode_ui_external_languages = keys[KeynodeSysIdentifiers.ui_external_languages]
            keynode_languages = keys[KeynodeSysIdentifiers.languages]
    
            # try to find main menu node
            cmds = []
            logic.find_atomic_commands(keynode_ui_main_menu, sctp_client, keys, cmds)
                
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(cmds))
        
        
class CmdDo(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def post(self):
        result = '[]'
        
        with SctpClientInstance() as sctp_client:
            cmd_addr = ScAddr.parse_from_string(self.get_argument(u'cmd', None))
            # parse arguments
            first = True
            arg = None
            arguments = []
            idx = 0
            while first or (arg is not None):
                arg = ScAddr.parse_from_string(self.get_argument(u'%d_' % idx, None))
                if arg is not None:
                    # check if sc-element exist
                    if sctp_client.check_element(arg):
                        arguments.append(arg)
                    else:
                        return logic.serialize_error(404, "Invalid argument: %s" % arg)
    
                first = False
                idx += 1

            keys = Keynodes(sctp_client)
            result = logic.do_command(sctp_client, keys, cmd_addr, arguments, self)
                 
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))
        
        
class QuestionAnswerTranslate(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def post(self):
        with SctpClientInstance() as sctp_client:

            question_addr = ScAddr.parse_from_string(self.get_argument(u'question', None))
            format_addr = ScAddr.parse_from_string(self.get_argument(u'format', None))
            
            keys = Keynodes(sctp_client)
            keynode_nrel_answer = keys[KeynodeSysIdentifiers.question_nrel_answer]
            keynode_nrel_translation = keys[KeynodeSysIdentifiers.nrel_translation]
            keynode_nrel_format = keys[KeynodeSysIdentifiers.nrel_format]
            keynode_system_element = keys[KeynodeSysIdentifiers.system_element]
            
            # try to find answer for the question
            wait_time = 0
            wait_dt = 0.1
            
            answer = logic.find_answer(question_addr, keynode_nrel_answer, sctp_client)
            while answer is None:
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > tornado.options.options.event_wait_timeout:
                    return logic.serialize_error(self, 404, 'Timeout waiting for answer')
                
                answer = logic.find_answer(question_addr, keynode_nrel_answer, sctp_client)
            
            if answer is None:
                return logic.serialize_error(self, 404, 'Answer not found')
            
            answer_addr = answer[0][2]
            
            # try to find translation to specified format
            result_link_addr = logic.find_translation_with_format(answer_addr, format_addr, keynode_nrel_format, keynode_nrel_translation, sctp_client)
            
            # if link addr not found, then run translation of answer to specified format
            if result_link_addr is None:
                trans_cmd_addr = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
                logic.append_to_system_elements(sctp_client, keynode_system_element, trans_cmd_addr)
                
                arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, trans_cmd_addr, answer_addr)
                logic.append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
                
                arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keys[KeynodeSysIdentifiers.ui_rrel_source_sc_construction], arc_addr)
                logic.append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
                
                arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, trans_cmd_addr, format_addr)
                logic.append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
                
                arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keys[KeynodeSysIdentifiers.ui_rrel_output_format], arc_addr)
                logic.append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
                
                # add into translation command set
                arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keys[KeynodeSysIdentifiers.ui_command_translate_from_sc], trans_cmd_addr)
                logic.append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
                
                # initialize command
                arc_addr = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keys[KeynodeSysIdentifiers.ui_command_initiated], trans_cmd_addr)
                logic.append_to_system_elements(sctp_client, keynode_system_element, arc_addr)
                
                # now we need to wait translation result
                wait_time = 0
                translation = logic.find_translation_with_format(answer_addr, format_addr, keynode_nrel_format, keynode_nrel_translation, sctp_client)
                while translation is None:
                    time.sleep(wait_dt)
                    wait_time += wait_dt
                    if wait_time > tornado.options.options.event_wait_timeout:
                        return logic.serialize_error(self, 404, 'Timeout waiting for answer translation')
     
                    translation = logic.find_translation_with_format(answer_addr, format_addr, keynode_nrel_format, keynode_nrel_translation, sctp_client)
                    
                if translation is not None:
                    result_link_addr = translation
        
            # if result exists, then we need to return it content
            if result_link_addr is not None:
                result = json.dumps({"link": result_link_addr.to_int()})
        
            self.set_header("Content-Type", "application/json")
            self.finish(result) 
        
        
class LinkContent(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def get(self):

        with SctpClientInstance() as sctp_client:
    
            keys = Keynodes(sctp_client)
            keynode_nrel_format = keys[KeynodeSysIdentifiers.nrel_format]
            keynode_nrel_mimetype = keys[KeynodeSysIdentifiers.nrel_mimetype]
        
            # parse arguments
            addr = ScAddr.parse_from_string(self.get_argument('addr', None))        
            if addr is None:
                return logic.serialize_error(self, 404, 'Invalid arguments')
        
            result = sctp_client.get_link_content(addr)
            if result is None:
                return logic.serialize_error(self, 404, 'Content not found')
        
            self.set_header("Content-Type", logic.get_link_mime(addr, keynode_nrel_format, keynode_nrel_mimetype, sctp_client))
            self.finish(result)
        
        
class LinkFormat(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def post(self):
   
        with SctpClientInstance() as sctp_client:

            # parse arguments
            first = True
            arg = None
            arguments = []
            idx = 0
            while first or (arg is not None):
                arg_str = u'%d_' % idx
                arg = ScAddr.parse_from_string(self.get_argument(arg_str, None))
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
                    result[arg.to_int()] = format[0][2].to_int()
                else:
                    result[arg.to_int()] = keynode_format_txt.to_int()
    
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))


@decorators.class_logging
class Languages(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def get(self):
        
        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)
            
            langs = logic.get_languages_list(keys[KeynodeSysIdentifiers.languages], sctp_client)
            
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(langs))


@decorators.class_logging
class LanguageSet(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def post(self):
        lang_addr = ScAddr.parse_from_string(self.get_argument(u'lang_addr', None))
        
        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)
        
            sc_session = logic.ScSession(self, sctp_client, keys)
            sc_session.set_current_lang_mode(lang_addr)
            
            self.finish()


@decorators.class_logging
class IdtfFind(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def get(self):
        result = None
    
    
        # get arguments
        substr = self.get_argument('substr', None)
        
        # connect to redis an try to find identifiers
        r = redis.StrictRedis(host = tornado.options.options.redis_host, 
                              port = tornado.options.options.redis_port,
                              db = tornado.options.options.redis_db_idtf)
        result = {}
        sys = []
        main = []
        common = []
        max_n = tornado.options.options.idtf_serach_limit
        
        def appendSorted(array, data):
            if len(array) > 0:
                idx = 0
                inserted = False
                for idx in xrange(len(array)):
                    if len(array[idx][1]) > len(data[1]):
                        array.insert(idx, data)
                        inserted = True
                        break;
                    idx = idx + 1
                
                if not inserted and len(array) < max_n:
                    array.append(data)
                
                if (len(array) > max_n):
                    array.pop()
            else:
                array.append(data)
        
        # first of all need to find system identifiers
        cursor = 0
        while True:
            reply = r.scan(cursor, u"idtf:*%s*" % substr, 1000)
            if not reply or len(reply) == 0:
                break
            cursor = int(reply[0])
            
            for idtf in reply[1]:
                if len(sys) == max_n and len(main) == max_n and len(common) == max_n:
                    break
                
                rep = r.get(idtf)
                utf = idtf.decode('utf-8')
                addr = ScAddr.parse_binary(rep)
                if utf.startswith(u"idtf:sys:") and len(sys) < max_n:
                    appendSorted(sys, [addr.to_int(), utf[9:]])
                elif utf.startswith(u"idtf:main:") and len(main) < max_n:
                    appendSorted(main, [addr.to_int(), utf[10:]])
                elif utf.startswith(u"idtf:common:") and len(common) < max_n:
                    appendSorted(common, [addr.to_int(), utf[12:]])

            if cursor == 0:
                break
                                
        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)
            keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf]
            keynode_nrel_system_identifier = keys[KeynodeSysIdentifiers.nrel_system_identifier]
            keynode_nrel_idtf = keys[KeynodeSysIdentifiers.nrel_idtf]
                        
            result['sys'] = sys
            result['main'] = main
            result['common'] = common
            
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))


@decorators.class_logging
class IdtfResolve(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def post(self):
        result = None

        # get arguments
        idx = 1
        arguments = []
        arg = ''
        while arg is not None:
            arg = self.get_argument(u'%d_' % idx, None)
            if arg is not None:
                arguments.append(arg)
            idx += 1

        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)
            
            sc_session = logic.ScSession(self, sctp_client, keys)
            used_lang = sc_session.get_used_language()
            
    
            result = {}
            # get requested identifiers for arguments
            for addr_str in arguments:
                addr = ScAddr.parse_from_string(addr_str)
                if addr is None:
                    self.clear()
                    self.set_status(404)
                    self.finish('Can\'t parse sc-addr from argument: %s' % addr_str)
                
                found = False
    
                idtf_value = logic.get_identifier_translated(addr, used_lang, keys, sctp_client)
                if idtf_value:
                    result[addr_str] = idtf_value
            
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))


@decorators.class_logging
class AddrResolve(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def post(self):

        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg_str = u'%d_' % idx
            arg = self.get_argument(arg_str, None)
            if arg is not None:
                arguments.append(arg)
            first = False
            idx += 1

        with SctpClientInstance() as sctp_client:
            res = {}
            for idtf in arguments:
                addr = sctp_client.find_element_by_system_identifier(str(idtf))
                if addr is not None:
                    res[idtf] = addr.to_int()
    
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(res))


@decorators.class_logging
class InfoTooltip(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def post(self):

        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or (arg is not None):
            arg_str = u'%d_' % idx
            arg = self.get_argument(arg_str, None)
            if arg is not None:
                arguments.append(arg)
            first = False
            idx += 1
            
        with SctpClientInstance() as sctp_client:
                
            keys = Keynodes(sctp_client)
            sc_session = logic.ScSession(self, sctp_client, keys)
    
            res = {}
            for addr in arguments:
                tooltip = logic.find_tooltip(ScAddr.parse_from_string(addr), sctp_client, keys, sc_session.get_used_language())
                res[addr] = tooltip
    
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(res))


@decorators.class_logging
class User(base.BaseHandler):
    
    #@tornado.web.asynchronous
    def get(self):
        result = '{}'
    
        with SctpClientInstance() as sctp_client:
            keys = Keynodes(sctp_client)
            
            # get user sc-addr
            sc_session = logic.ScSession(self, sctp_client, keys)
            user_addr = sc_session.get_sc_addr()
            result = {
                        'sc_addr': user_addr.to_int(),
                        'is_authenticated': False,
                        'current_lang': sc_session.get_used_language().to_int(),
                        'default_ext_lang': sc_session.get_default_ext_lang().to_int()
            }
        
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))