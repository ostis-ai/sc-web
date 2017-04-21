# -*- coding: utf-8 -*-

import uuid, base64, hashlib, time

import tornado.web

from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.types import SctpIteratorType, ScElementType
import decorators

__all__ = (
    'parse_menu_command',
    'find_cmd_result',
    'find_answer',
    'find_translation',
    'check_command_finished',
    'append_to_system_elements',
)


@decorators.method_logging
def serialize_error(handler, code, message):
        handler.clear()
        handler.set_status(code)
        handler.finish(message)


@decorators.method_logging
def parse_menu_command(cmd_addr, sctp_client, keys):
    """Parse specified command from sc-memory and
        return hierarchy map (with childs), that represent it
        @param cmd_addr: sc-addr of command to parse
        @param sctp_client: sctp client object to work with sc-memory
        @param keys: keynodes object. Used just to prevent new instance creation
    """
    keynode_ui_user_command_class_atom = keys[KeynodeSysIdentifiers.ui_user_command_class_atom]
    keynode_ui_user_command_class_noatom = keys[KeynodeSysIdentifiers.ui_user_command_class_noatom]
    keynode_nrel_ui_commands_decomposition = keys[KeynodeSysIdentifiers.nrel_ui_commands_decomposition]

    # try to find command type
    cmd_type = 'unknown'
    if sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                    keynode_ui_user_command_class_atom,
                                    ScElementType.sc_type_arc_pos_const_perm,
                                    cmd_addr) is not None:
        cmd_type = 'cmd_atom'
    elif sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                      keynode_ui_user_command_class_noatom,
                                      ScElementType.sc_type_arc_pos_const_perm,
                                      cmd_addr) is not None:
        cmd_type = 'cmd_noatom'
    
    attrs = {}
    attrs['cmd_type'] = cmd_type
    attrs['id'] = cmd_addr.to_id()

    # try to find decomposition
    decomp = sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
        ScElementType.sc_type_node | ScElementType.sc_type_const,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        cmd_addr,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_nrel_ui_commands_decomposition
    )
    if decomp is not None:

        # iterate child commands
        childs = sctp_client.iterate_elements(
            SctpIteratorType.SCTP_ITERATOR_3F_A_A,
            decomp[0][0],
            ScElementType.sc_type_arc_pos_const_perm,
            0
        )
        if childs is not None:
            child_commands = []
            for item in childs:
                child_structure = parse_menu_command(item[2], sctp_client, keys)
                child_commands.append(child_structure)
            attrs["childs"] = child_commands

    return attrs


@decorators.method_logging
def find_atomic_commands(cmd_addr, sctp_client, keys, commands):
    """Parse specified command from sc-memory and
        return hierarchy map (with childs), that represent it
        @param cmd_addr: sc-addr of command to parse
        @param sctp_client: sctp client object to work with sc-memory
        @param keys: keynodes object. Used just to prevent new instance creation
    """
    keynode_ui_user_command_class_atom = keys[KeynodeSysIdentifiers.ui_user_command_class_atom]
    keynode_ui_user_command_class_noatom = keys[KeynodeSysIdentifiers.ui_user_command_class_noatom]
    keynode_nrel_ui_commands_decomposition = keys[KeynodeSysIdentifiers.nrel_ui_commands_decomposition]

    # try to find command type
    if sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                    keynode_ui_user_command_class_atom,
                                    ScElementType.sc_type_arc_pos_const_perm,
                                    cmd_addr) is not None:
    
        commands.append(cmd_addr.to_id())
    
    # try to find decomposition
    decomp = sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
        ScElementType.sc_type_node | ScElementType.sc_type_const,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        cmd_addr,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_nrel_ui_commands_decomposition
    )
    if decomp is not None:

        # iterate child commands
        childs = sctp_client.iterate_elements(
            SctpIteratorType.SCTP_ITERATOR_3F_A_A,
            decomp[0][0],
            ScElementType.sc_type_arc_pos_const_perm,
            0
        )
        if childs is not None:
            child_commands = []
            for item in childs:
                find_atomic_commands(item[2], sctp_client, keys, commands)
    
        

@decorators.method_logging
def find_tooltip(addr, sctp_client, keys, lang):
    
    # try to find structure, where addr is key sc-element
    key_struct = sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
        ScElementType.sc_type_node | ScElementType.sc_type_const,
        ScElementType.sc_type_arc_pos_const_perm,
        addr,
        ScElementType.sc_type_arc_pos_const_perm,
        keys[KeynodeSysIdentifiers.rrel_key_sc_element]
    )
    
    if key_struct:
        found_map = {}
        order_list = [keys[KeynodeSysIdentifiers.sc_definition],
                      keys[KeynodeSysIdentifiers.sc_explanation],
                      keys[KeynodeSysIdentifiers.sc_note]]
        
        for t in order_list:
            found_map[str(t)] = []
        
        for res in key_struct:
            node = res[0]
            # check if it's an sc explanation
            check = sctp_client.iterate_elements(
                SctpIteratorType.SCTP_ITERATOR_3A_A_F,
                ScElementType.sc_type_node | ScElementType.sc_type_const,
                ScElementType.sc_type_arc_pos_const_perm,
                node
            )
            if check:
                for c in check:
                    for t in order_list:
                        if c[0] == t:
                            found_map[str(t)].append(node)
                
        for o in order_list:
            found_list = found_map[str(o)]
            for node in found_list:
                # find all translations
                translations = sctp_client.iterate_elements(
                    SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                    ScElementType.sc_type_node | ScElementType.sc_type_const,
                    ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                    node,
                    ScElementType.sc_type_arc_pos_const_perm,
                    keys[KeynodeSysIdentifiers.nrel_sc_text_translation]
                )
                if translations:
                    for t in translations:
                        # find translation to current language
                        items = sctp_client.iterate_elements(
                            SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                            t[0],
                            ScElementType.sc_type_arc_pos_const_perm,
                            ScElementType.sc_type_link
                        )
                        if items:
                            for i in items:
                                check2 = sctp_client.iterate_elements(
                                    SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                    lang,
                                    ScElementType.sc_type_arc_pos_const_perm,
                                    i[2]
                                )
                                if check2:
                                    return sctp_client.get_link_content(i[2])
        
    
    return None


@decorators.method_logging
def find_cmd_result(command_addr, keynode_ui_nrel_command_result, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
        command_addr,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        ScElementType.sc_type_link,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_ui_nrel_command_result
    )


@decorators.method_logging
def find_answer(question_addr, keynode_nrel_answer, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
        question_addr,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        ScElementType.sc_type_node | ScElementType.sc_type_const,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_nrel_answer
    )


@decorators.method_logging
def find_translation(construction_addr, keynode_nrel_translation, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
        construction_addr,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        ScElementType.sc_type_link,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_nrel_translation
    )


@decorators.method_logging
def find_translation_with_format(construction_addr, format_addr, keynode_nrel_format, keynode_nrel_translation,
                                 sctp_client):
    translations = find_translation(construction_addr, keynode_nrel_translation, sctp_client)
    
    if translations is None:
        return None
    
    for trans in translations:
        link_addr = trans[2]
        # check format
        fmt = sctp_client.iterate_elements(
                                           SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                           link_addr,
                                           ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                           format_addr
                                           )
        if fmt is not None:
            return fmt[0][0]

    return None


@decorators.method_logging
def get_identifier_translated(addr, used_lang, keys, sctp_client):
    keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf]
    keynode_nrel_system_identifier = keys[KeynodeSysIdentifiers.nrel_system_identifier]
        
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
                return idtf_value

    # if identifier not found, then get system identifier
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
        return idtf_value
    
    return None


@decorators.method_logging
def get_by_identifier_translated(used_lang, keys, sctp_client, idtf):
    
    keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf]
    
    links = sctp_client.find_links_with_content(idtf)
    if links:
        for l in links:
            elements = sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                                            0,
                                            ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                            l,
                                            ScElementType.sc_type_arc_pos_const_perm,
                                            keynode_nrel_main_idtf)
            if elements is not None:
                # check if founded main identifier is for used language
                langs = sctp_client.iterate_elements(
                                                     SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                                     used_lang,
                                                     ScElementType.sc_type_arc_pos_const_perm,
                                                     l
                                                     )
                if langs is not None:
                    return elements[0][0]

    return sctp_client.find_element_by_system_identifier(idtf)


@decorators.method_logging
def check_command_finished(command_addr, keynode_command_finished, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_3F_A_F,
        keynode_command_finished,
        ScElementType.sc_type_arc_pos_const_perm,
        command_addr
    )


@decorators.method_logging
def check_command_failed(command_addr, keynode_command_failed, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_3F_A_F,
        keynode_command_failed,
        ScElementType.sc_type_arc_pos_const_perm,
        command_addr
    )


@decorators.method_logging
def append_to_system_elements(sctp_client, keynode_system_element, el):
    sctp_client.create_arc(
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_system_element,
        el
    )


@decorators.method_logging
def get_link_mime(link_addr, keynode_nrel_format, keynode_nrel_mimetype, sctp_client):
    mimetype_str = u'text/plain'
    # determine format and mimetype
    format = sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
        link_addr,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        ScElementType.sc_type_node | ScElementType.sc_type_const,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_nrel_format
    )
    if format is not None:
        # fetermine mimetype
        mimetype = sctp_client.iterate_elements(
            SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
            format[0][2],
            ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
            ScElementType.sc_type_link,
            ScElementType.sc_type_arc_pos_const_perm,
            keynode_nrel_mimetype
        )
        if mimetype is not None:
            mime_value = sctp_client.get_link_content(mimetype[0][2])
            if mime_value is not None:
                mimetype_str = mime_value
                
    return mimetype_str


@decorators.method_logging
def get_languages_list(keynode_languages, sctp_client):
    res_langs = sctp_client.iterate_elements(
            SctpIteratorType.SCTP_ITERATOR_3F_A_A,
            keynode_languages,
            ScElementType.sc_type_arc_pos_const_perm,
            ScElementType.sc_type_node | ScElementType.sc_type_const
        )
    langs = []
    if (res_langs is not None):
        for items in res_langs:
            langs.append(items[2])
                
    return langs


@decorators.method_logging
def do_command(sctp_client, keys, cmd_addr, arguments, handler):
    result = {}
     
    
    if cmd_addr is not None:

        keynode_ui_rrel_commnad = keys[KeynodeSysIdentifiers.ui_rrel_commnad]
        keynode_ui_rrel_command_arguments = keys[KeynodeSysIdentifiers.ui_rrel_command_arguments]
        keynode_ui_nrel_command_result = keys[KeynodeSysIdentifiers.ui_nrel_command_result]
        keynode_ui_command_generate_instance = keys[KeynodeSysIdentifiers.ui_command_generate_instance]
        keynode_ui_command_initiated = keys[KeynodeSysIdentifiers.ui_command_initiated]
        keynode_ui_command_finished = keys[KeynodeSysIdentifiers.ui_command_finished]
        #keynode_ui_command_failed = keys[KeynodeSysIdentifiers.ui_command_failed]
        keynode_ui_nrel_command_result = keys[KeynodeSysIdentifiers.ui_nrel_command_result]
        keynode_ui_user = keys[KeynodeSysIdentifiers.ui_user]
        keynode_nrel_authors = keys[KeynodeSysIdentifiers.nrel_authors]

        keynode_system_element = keys[KeynodeSysIdentifiers.system_element]
        keynode_nrel_ui_nrel_command_lang_template = keys[KeynodeSysIdentifiers.nrel_ui_nrel_command_lang_template]
        keynode_languages = keys[KeynodeSysIdentifiers.languages]
        keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf]

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
                return serialize_error(handler, 404, 'Error while create "create_instance" command')

            idx_addr = sctp_client.find_element_by_system_identifier(str(u'rrel_%d' % idx))
            if idx_addr is None:
                return serialize_error(handler, 404, 'Error while create "create_instance" command')
            idx += 1
            arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, idx_addr, arg_arc)
            append_to_system_elements(sctp_client, keynode_system_element, arc)

        wait_time = 0
        wait_dt = 0.1
        
        # initialize command
        arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_command_initiated, inst_cmd_addr)

        cmd_finished = False
        cmd_failed = False
        while True:
            time.sleep(wait_dt)
            wait_time += wait_dt
            if wait_time > tornado.options.options.event_wait_timeout:
                return serialize_error(handler, 404, 'Timeout waiting for "create_instance" command finished')
            cmd_finished = check_command_finished(inst_cmd_addr, keynode_ui_command_finished, sctp_client)
            #cmd_failed = check_command_failed(inst_cmd_addr, keynode_ui_command_failed, sctp_client)            
            
            if cmd_finished or cmd_failed:
                break;
            
        if cmd_failed:
            return { }

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
            return serialize_error(handler, 404, 'Can\'t find "create_instance" command result')

        cmd_result = cmd_result[0][2]

        # @todo support all possible commands
        
        sc_session = ScSession(handler, sctp_client, keys)
        user_node = sc_session.get_sc_addr()
        if not user_node:
            return serialize_error(handler, 404, "Can't resolve user node")
        
        keynode_init_set = None
        keynode_question = keys[KeynodeSysIdentifiers.question]
        
        # try to find question node
        question = sctp_client.iterate_elements(
            SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
            keynode_question,
            ScElementType.sc_type_arc_pos_const_perm,
            ScElementType.sc_type_node | ScElementType.sc_type_const,
            ScElementType.sc_type_arc_pos_const_perm,
            cmd_result
        )
        if question:
            instance_node = question[0][2]
            result_key = 'question'
            
            keynode_init_set = keys[KeynodeSysIdentifiers.question_initiated]

            append_to_system_elements(sctp_client, keynode_system_element, instance_node)
        
            # generate main identifiers
            langs = get_languages_list(keynode_languages, sctp_client)
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
                            idtf_value = get_identifier_translated(a, l, keys, sctp_client)
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
                                                                             instance_node, idtf_link)
                                            sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm,
                                                                   keynode_nrel_main_idtf, bin_arc)
                                            
                                            generated[str(l)] = True
            
        else: # check if command
            
            keynode_command = keys[KeynodeSysIdentifiers.command]
            
            command = sctp_client.iterate_elements(
                SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                keynode_command,
                ScElementType.sc_type_arc_pos_const_perm,
                ScElementType.sc_type_node | ScElementType.sc_type_const,
                ScElementType.sc_type_arc_pos_const_perm,
                cmd_result
            )
            
            if command:
                instance_node = command[0][2]
                keynode_init_set = keys[KeynodeSysIdentifiers.command_initiated]
                
            result_key = 'command'
            

        # create author    
#         arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)
#         append_to_system_elements(sctp_client, keynode_system_element, arc)

        author_arc = sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, instance_node, user_node)
        append_to_system_elements(sctp_client, keynode_system_element, author_arc)
        arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_nrel_authors, author_arc)
        append_to_system_elements(sctp_client, keynode_system_element, arc)

        # initiate instance
        arc = sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_init_set, instance_node)
        append_to_system_elements(sctp_client, keynode_system_element, arc)

        result = { result_key: instance_node.to_id() }
            
    return result

# -------------- work with session -------------------------
@decorators.class_logging
class ScSession:
    
    def __init__(self, handler, sctp_client, keynodes):
        """Initialize session class with requets.user object
        """
        
        self.handler = handler
        
        self.user = handler.current_user
        self.session_key = handler.get_secure_cookie("session_key")
        self.sctp_client = sctp_client
        self.keynodes = keynodes
        self.sc_addr = None
        self.email = None
        
        user = handler.get_current_user()
        if user is not None:
            self.email = user.email
        
    def get_sc_addr(self):
        """Resolve sc-addr of session
        """
        if not self.sc_addr:
            if self.user:
                self.sc_addr = self._user_get_sc_addr()
                if not self.sc_addr:
                    self.sc_addr = self._user_new()
            else:
                if not self.session_key:
                    self.session_key = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
                    self.handler.set_secure_cookie("session_key", self.session_key)
                self.sc_addr = self._session_get_sc_addr()
                if not self.sc_addr:
                    self.sc_addr = self._session_new_sc_addr()
            
        # todo check user addr
        return self.sc_addr
    
    def get_used_language(self):
        """Returns sc-addr of currently used natural language
        """
        results = self.sctp_client.iterate_elements(
                                               SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                               self.get_sc_addr(),
                                               ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                               ScElementType.sc_type_node | ScElementType.sc_type_const,
                                               ScElementType.sc_type_arc_pos_const_perm,
                                               self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_used_language]
                                            )
        
        if results:
            return results[0][2]
        
        # setup russian mode by default
        _lang = self.keynodes[KeynodeSysIdentifiers.lang_ru]
        self.set_current_lang_mode(_lang)
        
        return _lang
    
    def get_default_ext_lang(self):
        """Returns sc-addr of default external language
        """
        results = self.sctp_client.iterate_elements(
                                               SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                               self.get_sc_addr(),
                                               ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                               ScElementType.sc_type_node | ScElementType.sc_type_const,
                                               ScElementType.sc_type_arc_pos_const_perm,
                                               self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_default_ext_language]
                                            )
        
        if results:
            return results[0][2]
        
        # setup default language
        _lang = self.keynodes[KeynodeSysIdentifiers.scs_code]
        self.set_default_ext_lang(_lang)
        
        return _lang
    
    def set_current_lang_mode(self, mode_addr):
        """Setup new language mode as current for this session
        """
        # try to find currently used mode and remove it
        results = self.sctp_client.iterate_elements(
                                               SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                               self.get_sc_addr(),
                                               ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                               ScElementType.sc_type_node | ScElementType.sc_type_const,
                                               ScElementType.sc_type_arc_pos_const_perm,
                                               self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_used_language]
                                            )
        
        if results:
            self.sctp_client.erase_element(results[0][1])
                
        
        arc = self.sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, self.get_sc_addr(), mode_addr)
        self.sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_used_language], arc)
        
    def set_default_ext_lang(self, lang_addr):
        """Setup new default external language
        """
        # try to find default external language and remove it
        results = self.sctp_client.iterate_elements(
                                               SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                               self.get_sc_addr(),
                                               ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                               ScElementType.sc_type_node | ScElementType.sc_type_const,
                                               ScElementType.sc_type_arc_pos_const_perm,
                                               self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_default_ext_language]
                                            )
        
        if results:
            self.sctp_client.erase_element(results[0][1])
        
        arc = self.sctp_client.create_arc(ScElementType.sc_type_arc_common | ScElementType.sc_type_const, self.get_sc_addr(), lang_addr)
        self.sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_default_ext_language], arc)

    def _find_user_by_system_idtf(self, idtf):
        value = self.sctp_client.find_element_by_system_identifier(str(idtf.encode('utf-8')))
        return value
    
    def _create_user_with_system_idtf(self, idtf):
        keynode_ui_user = self.keynodes[KeynodeSysIdentifiers.ui_user]
        
        # create user node
        user_node = self.sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
        self.sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)
        
        res = self.sctp_client.set_system_identifier(user_node, str(idtf.encode('utf-8')))
        
        return user_node

    def _session_new_sc_addr(self):
        return self._create_user_with_system_idtf("session::" + str(self.session_key))
    
    def _session_get_sc_addr(self):
        return self._find_user_by_system_idtf("session::" + str(self.session_key))
    
    def _user_hash(self):
       return hashlib.sha256(self.user.email).hexdigest()
        
    def _user_new(self):
        return self._create_user_with_system_idtf("user::" + str(self._user_hash()))

    def _user_get_sc_addr(self):
        
        # try to find by email
        if (self.email is not None) and (len(self.email)) > 0:
            links = self.sctp_client.find_links_with_content(str(self.email))
            if links and len(links) == 1:
                user = self.sctp_client.iterate_elements(
                                               SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                                               ScElementType.sc_type_node | ScElementType.sc_type_const,
                                               ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                               links[0],
                                               ScElementType.sc_type_arc_pos_const_perm,
                                               self.keynodes[KeynodeSysIdentifiers.nrel_email]
                                            )
                
                if user:
                    return user[0][0]                
        
        return self._find_user_by_system_idtf("user::" + str(self._user_hash()))
