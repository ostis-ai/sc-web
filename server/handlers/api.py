import tornado.web
import json
import redis

from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.logic import new_sctp_client
from sctp.types import ScAddr, SctpIteratorType, ScElementType

import api_logic as logic
import time
import base


def serialize_error(handler, code, message):
        handler.clear()
        handler.set_status(code)
        handler.finish(message)
# -------------------------------------------        

class Init(base.BaseHandler):
    @tornado.web.asynchronous
    def get(self):
        result = '{}'
    
        sctp_client = new_sctp_client()
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
                out_langs.append(items[2].to_id())

        # try to find available output natural languages
        langs = logic.get_languages_list(keynode_languages, sctp_client)
        langs_str = []
        for l in langs:
            langs_str.append(l.to_id())
        
        # get user sc-addr
        sc_session = logic.ScSession(self, sctp_client, keys)
        user_addr = sc_session.get_sc_addr()
        result = {'menu_commands': cmds,
                  'languages': langs_str,
                  'external_languages': out_langs,
                  'user': {
                            'sc_addr': user_addr.to_id(),
                            'is_authenticated': False,
                            'current_lang': sc_session.get_used_language().to_id(),
                            'default_ext_lang': sc_session.get_default_ext_lang().to_id()
                           }
        }
    
        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))
        
        
        
class CmdDo(base.BaseHandler):
    
    @tornado.web.asynchronous
    def post(self):
        result = '[]'
        sctp_client = new_sctp_client()

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
                    return serialize_error(404, "Invalid argument: %s" % arg)

            first = False
            idx += 1

        if (len(arguments) > 0) and (cmd_addr is not None):

            keys = Keynodes(sctp_client)

            keynode_ui_rrel_commnad = keys[KeynodeSysIdentifiers.ui_rrel_commnad]
            keynode_ui_rrel_command_arguments = keys[KeynodeSysIdentifiers.ui_rrel_command_arguments]
            keynode_ui_nrel_command_result = keys[KeynodeSysIdentifiers.ui_nrel_command_result]
            keynode_ui_command_generate_instance = keys[KeynodeSysIdentifiers.ui_command_generate_instance]
            keynode_ui_command_initiated = keys[KeynodeSysIdentifiers.ui_command_initiated]
            keynode_ui_command_finished = keys[KeynodeSysIdentifiers.ui_command_finished]
            keynode_ui_nrel_command_result = keys[KeynodeSysIdentifiers.ui_nrel_command_result]
            keynode_ui_user = keys[KeynodeSysIdentifiers.ui_user]
            keynode_nrel_authors = keys[KeynodeSysIdentifiers.nrel_authors]
            keynode_question_initiated = keys[KeynodeSysIdentifiers.question_initiated]
            keynode_question = keys[KeynodeSysIdentifiers.question]
            keynode_system_element = keys[KeynodeSysIdentifiers.system_element]
            keynode_nrel_ui_nrel_command_lang_template = keys[KeynodeSysIdentifiers.nrel_ui_nrel_command_lang_template]
            keynode_languages = keys[KeynodeSysIdentifiers.languages]
            keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf]

            # create command in sc-memory
            inst_cmd_addr = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            logic.append_to_system_elements(sctp_client, keynode_system_element, inst_cmd_addr)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_command_generate_instance, inst_cmd_addr)
            logic.append_to_system_elements(sctp_client, keynode_system_element, arc)

            inst_cmd_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, inst_cmd_addr, cmd_addr)
            logic.append_to_system_elements(sctp_client, keynode_system_element, inst_cmd_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_rrel_commnad, inst_cmd_arc)
            logic.append_to_system_elements(sctp_client, keynode_system_element, arc)

            # create arguments
            args_addr = sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
            logic.append_to_system_elements(sctp_client, keynode_system_element, args_addr)
            args_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, inst_cmd_addr, args_addr)
            logic.append_to_system_elements(sctp_client, keynode_system_element, args_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_rrel_command_arguments, args_arc)
            logic.append_to_system_elements(sctp_client, keynode_system_element, arc)

            idx = 1
            for arg in arguments:
                arg_arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, args_addr, arg)
                logic.append_to_system_elements(sctp_client, keynode_system_element, arg_arc)
                if arg_arc is None:
                    return serialize_error(self, 404, 'Error while create "create_instance" command')

                idx_addr = sctp_client.find_element_by_system_identifier(str(u'rrel_%d' % idx))
                if idx_addr is None:
                    return serialize_error(self, 404, 'Error while create "create_instance" command')
                idx += 1
                arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, idx_addr, arg_arc)
                logic.append_to_system_elements(sctp_client, keynode_system_element, arc)

            wait_time = 0
            wait_dt = 0.1
            
            # initialize command
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_command_initiated, inst_cmd_addr)

            cmd_finished = logic.check_command_finished(inst_cmd_addr, keynode_ui_command_finished, sctp_client)
            while cmd_finished is None:
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > tornado.options.options.event_wait_timeout:
                    return serialize_error(self, 404, 'Timeout waiting for "create_instance" command finished')
                cmd_finished = logic.check_command_finished(inst_cmd_addr, keynode_ui_command_finished, sctp_client)


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
                return serialize_error(self, 404, 'Can\'t find "create_instance" command result')

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
                return serialize_error(self, 404, "Can't find question node")

            question = question[0][2]

            logic.append_to_system_elements(sctp_client, keynode_system_element, question)
            
            # generate main identifiers
            langs = logic.get_languages_list(keynode_languages, sctp_client)
            if langs:
                templates = sctp_client.iterate_elements(
                    SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                    cmd_addr,
                    ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                    ScElementType.sc_type_link,
                    ScElementType.sc_type_arc_pos_const_perm,
                    keynode_nrel_ui_nrel_command_lang_template
                )
                if templates:
                    generated = {}
                    identifiers = {}
                    
                    # get identifiers
                    for l in langs:
                        identifiers[str(l)] = {}
                        for a in arguments:
                            idtf_value = logic.get_identifier_translated(a, l, keys, sctp_client)
                            if idtf_value:
                                identifiers[str(l)][str(a)] = idtf_value
                                
                    
                    for t in templates:
                        input_arcs = sctp_client.iterate_elements(
                                            SctpIteratorType.SCTP_ITERATOR_3A_A_F,
                                            ScElementType.sc_type_node | ScElementType.sc_type_const | ScElementType.sc_type_node_class,
                                            ScElementType.sc_type_arc_pos_const_perm,
                                            t[2])
                        if input_arcs:
                            for arc in input_arcs:
                                for l in langs:
                                    if not generated.has_key(str(l)) and arc[0] == l:
                                        lang_idtfs = identifiers[str(l)]
                                        # get content of link
                                        data = sctp_client.get_link_content(t[2]).decode('utf-8')
                                        if data:
                                            for idx in xrange(len(arguments)):
                                                value = arguments[idx].to_id()
                                                if lang_idtfs.has_key(str(arguments[idx])):
                                                    value = lang_idtfs[str(arguments[idx])]
                                                data = data.replace(u'$ui_arg_%d' % (idx + 1), value)
                                                
                                            
                                            # generate identifier
                                            idtf_link = sctp_client.create_link()
                                            sctp_client.set_link_content(idtf_link, str(data.encode('utf-8')))
                                            sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, l, idtf_link)
                                            
                                            bin_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                                             question, idtf_link)
                                            sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                                                                   keynode_nrel_main_idtf, bin_arc)
                                            
                                            generated[str(l)] = True

            # create author
            sc_session = logic.ScSession(self, sctp_client, keys)
            user_node = sc_session.get_sc_addr()
            if not user_node:
                return serialize_error(self, 404, "Can't resolve user node")
            
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)
            logic.append_to_system_elements(sctp_client, keynode_system_element, arc)

            author_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, question, user_node)
            logic.append_to_system_elements(sctp_client, keynode_system_element, author_arc)
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_nrel_authors, author_arc)
            logic.append_to_system_elements(sctp_client, keynode_system_element, arc)


            # initiate question
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_question_initiated, question)
            logic.append_to_system_elements(sctp_client, keynode_system_element, arc)

            # first of all we need to wait answer to this question
            #print sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, keynode_question_initiated, 0, 0)
            
            result = { 'question': question.to_id() }
            
        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))
        
        
class QuestionAnswerTranslate(base.BaseHandler):
    
    @tornado.web.asynchronous
    def post(self):
        sctp_client = new_sctp_client()

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
                return serialize_error(self, 404, 'Timeout waiting for answer')
            
            answer = logic.find_answer(question_addr, keynode_nrel_answer, sctp_client)
        
        if answer is None:
            return serialize_error(self, 404, 'Answer not found')
        
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
                    return serialize_error(self, 404, 'Timeout waiting for answer translation')
 
                translation = logic.find_translation_with_format(answer_addr, format_addr, keynode_nrel_format, keynode_nrel_translation, sctp_client)
                
            if translation is not None:
                result_link_addr = translation
    
        # if result exists, then we need to return it content
        if result_link_addr is not None:
            result = json.dumps({"link": result_link_addr.to_id()})
    
        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(result) 
        
        
class LinkContent(base.BaseHandler):
    
    @tornado.web.asynchronous
    def get(self):

        sctp_client = new_sctp_client()
    
        keys = Keynodes(sctp_client)
        keynode_nrel_format = keys[KeynodeSysIdentifiers.nrel_format]
        keynode_nrel_mimetype = keys[KeynodeSysIdentifiers.nrel_mimetype]
    
        # parse arguments
        addr = ScAddr.parse_from_string(self.get_argument('addr', None))
        if addr is None:
            return serialize_error(self, 404, 'Invalid arguments')
    
        result = sctp_client.get_link_content(addr)
        if result is None:
            return serialize_error(self, 404, 'Content not found')
    
        sctp_client.shutdown()
        self.set_header("Content-Type", logic.get_link_mime(addr, keynode_nrel_format, keynode_nrel_mimetype, sctp_client))
        self.finish(result)
        
        
class LinkFormat(base.BaseHandler):
    
    @tornado.web.asynchronous
    def post(self):
   
        sctp_client = new_sctp_client()

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
                result[arg.to_id()] = format[0][2].to_id()
            else:
                result[arg.to_id()] = keynode_format_txt.to_id()

        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))
        
        
        
class Languages(base.BaseHandler):
    
    @tornado.web.asynchronous
    def get(self):
        
        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        
        langs = logic.get_languages_list(keys[KeynodeSysIdentifiers.languages], sctp_client)
        
        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(langs))
    
    
class LanguageSet(base.BaseHandler):
    
    @tornado.web.asynchronous
    def post(self):
        lang_addr = ScAddr.parse_from_string(self.get_argument(u'lang_addr', None))
        
        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
    
        sc_session = logic.ScSession(self, sctp_client, keys)
        sc_session.set_current_lang_mode(lang_addr)
        
        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish()
    
class IdtfFind(base.BaseHandler):
    
    @tornado.web.asynchronous
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
        
        # first of all need to find system identifiers
        cursor = 0
        while True:
            reply = r.scan(cursor, u"idtf:*%s*" % substr, 200)
            if not reply or len(reply) == 0:
                break
            cursor = int(reply[0])
            if cursor == 0:
                break
            for idtf in reply[1]:
                if len(sys) == max_n and len(main) == max_n and len(common) == max_n:
                    break
                
                rep = r.get(idtf)
                utf = idtf.decode('utf-8')
                addr = ScAddr.parse_binary(rep)
                if utf.startswith(u"idtf:sys:") and len(sys) < max_n:
                    sys.append([addr.to_id(), utf[9:]])
                elif utf.startswith(u"idtf:main:") and len(main) < max_n:
                    main.append([addr.to_id(), utf[10:]])
                elif utf.startswith(u"idtf:common:") and len(common) < max_n:
                    common.append([addr.to_id(), utf[12:]])
                    

        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf]
        keynode_nrel_system_identifier = keys[KeynodeSysIdentifiers.nrel_system_identifier]
        keynode_nrel_idtf = keys[KeynodeSysIdentifiers.nrel_idtf]
                    
        result[keynode_nrel_system_identifier.to_id()] = sys
        result[keynode_nrel_main_idtf.to_id()] = main
        result[keynode_nrel_idtf.to_id()] = common
        
        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))
        
class IdtfResolve(base.BaseHandler):
    
    @tornado.web.asynchronous
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

        sctp_client = new_sctp_client()
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
        
        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))
        
        
class AddrResolve(base.BaseHandler):
    
    @tornado.web.asynchronous
    def post(self):
        
        sctp_client = new_sctp_client()

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

        res = {}
        for idtf in arguments:
            addr = sctp_client.find_element_by_system_identifier(str(idtf))
            if addr is not None:
                res[idtf] = addr.to_id()

        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(res))
        
        
class InfoTooltip(base.BaseHandler):
    
    @tornado.web.asynchronous
    def post(self):
        
        sctp_client = new_sctp_client()

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
            
        keys = Keynodes(sctp_client)
        sc_session = logic.ScSession(self, sctp_client, keys)

        res = {}
        for addr in arguments:
            tooltip = logic.find_tooltip(ScAddr.parse_from_string(addr), sctp_client, keys, sc_session.get_used_language())
            res[addr] = tooltip

        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(res))

    
    
class User(base.BaseHandler):
    
    @tornado.web.asynchronous
    def get(self):
        result = '{}'
    
        sctp_client = new_sctp_client()
        keys = Keynodes(sctp_client)
        
        # get user sc-addr
        sc_session = logic.ScSession(self, sctp_client, keys)
        user_addr = sc_session.get_sc_addr()
        result = {
                    'sc_addr': user_addr.to_id(),
                    'is_authenticated': False,
                    'current_lang': sc_session.get_used_language().to_id(),
                    'default_ext_lang': sc_session.get_default_ext_lang().to_id()
        }
    
        sctp_client.shutdown()
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))