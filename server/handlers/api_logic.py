# -*- coding: utf-8 -*-

import uuid, base64, hashlib, time

import tornado.web
from sc_client import client
from sc_client.constants.sc_types import ScType, NODE_VAR, EDGE_ACCESS_VAR_POS_PERM, EDGE_D_COMMON_VAR, LINK_VAR, NODE, \
    EDGE_ACCESS_CONST_POS_PERM, LINK, EDGE_D_COMMON_CONST, NODE_CONST, NODE_VAR_CLASS, LINK_CONST, UNKNOWN
from sc_client.models import ScTemplate, ScIdtfResolveParams, ScConstruction, ScLinkContent, ScLinkContentType

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
def find_atomic_commands(cmd_addr, keys, commands):
    """Parse specified command from sc-memory and
        return hierarchy map (with childs), that represent it
        @param cmd_addr: sc-addr of command to parse
        @param sctp_client: sctp client object to work with sc-memory
        @param keys: keynodes object. Used just to prevent new instance creation
    """
    keynode_ui_user_command_class_atom = keys[KeynodeSysIdentifiers.ui_user_command_class_atom.value]
    keynode_nrel_ui_commands_decomposition = keys[KeynodeSysIdentifiers.nrel_ui_commands_decomposition.value]

    # try to find command type
    template = ScTemplate()
    template.triple(
        keynode_ui_user_command_class_atom,
        EDGE_ACCESS_VAR_POS_PERM,
        cmd_addr
    )
    if client.template_search(template):
        commands.append(cmd_addr.value)

    # try to find decomposition
    template = ScTemplate()
    template.triple_with_relation(
        [NODE_VAR, 'decomposition'],
        EDGE_D_COMMON_VAR,
        cmd_addr,
        EDGE_ACCESS_VAR_POS_PERM,
        keynode_nrel_ui_commands_decomposition
    )
    template.triple(
        'decomposition',
        EDGE_ACCESS_VAR_POS_PERM,
        [UNKNOWN, 'child']
    )
    children = client.template_search(template)
    for child in children:
        find_atomic_commands(child.get('child'), keys, commands)


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
def find_answer(question_addr, keynode_nrel_answer):
    template = ScTemplate()
    template.triple_with_relation(
        question_addr,
        EDGE_D_COMMON_VAR,
        NODE_VAR,
        EDGE_ACCESS_VAR_POS_PERM,
        keynode_nrel_answer
    )
    return client.template_search(template)


@decorators.method_logging
def find_translation(construction_addr, keynode_nrel_translation):
    template = ScTemplate()
    template.triple_with_relation(
        construction_addr,
        EDGE_D_COMMON_VAR,
        LINK_VAR,
        EDGE_ACCESS_VAR_POS_PERM,
        keynode_nrel_translation
    )
    return client.template_search(template)


@decorators.method_logging
def find_translation_with_format(construction_addr, format_addr, keynode_nrel_format, keynode_nrel_translation):
    translations = find_translation(construction_addr, keynode_nrel_translation)

    if not translations:
        return None

    for trans in translations:
        link_addr = trans.get(2)
        # check format
        template = ScTemplate()
        template.triple(
            link_addr,
            EDGE_D_COMMON_VAR,
            format_addr
        )
        fmt = client.template_search(template)
        if fmt:
            return fmt[0].get(0)

    return None


@decorators.method_logging
def get_by_system_identifier(sctp_client, idtf):
    links = sctp_client.find_links_with_content(idtf)
    if links:
        for link in links:
            get_by_link_addr(link)
    return None


@decorators.method_logging
def get_by_link_addr(keys, sctp_client, link_addr):
    keynode_nrel_system_identifier = keys[KeynodeSysIdentifiers.nrel_system_identifier]
    elements = sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
        0,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        link_addr,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_nrel_system_identifier
    )
    if elements is not None:
        return elements[0][0]

    return None


@decorators.method_logging
def get_identifier_translated(addr, used_lang, keys):
    keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf.value]
    keynode_nrel_system_identifier = keys[KeynodeSysIdentifiers.nrel_system_identifier.value]

    main_idtf_template = ScTemplate()
    main_idtf_template.triple_with_relation(
        addr,
        EDGE_D_COMMON_VAR,
        [LINK_VAR, 'link'],
        EDGE_ACCESS_VAR_POS_PERM,
        keynode_nrel_main_idtf
    )
    main_idtf_template.triple(
        used_lang,
        EDGE_ACCESS_VAR_POS_PERM,
        'link'
    )
    result = client.template_search(main_idtf_template)
    for t in result:
        return client.get_link_content(t.get('link'))[0].data

    # if identifier not found, then get system identifier
    sys_idtf_template = ScTemplate()
    sys_idtf_template.triple_with_relation(
        addr,
        EDGE_D_COMMON_VAR,
        [LINK_VAR, 'link'],
        EDGE_ACCESS_VAR_POS_PERM,
        keynode_nrel_system_identifier
    )
    result = client.template_search(sys_idtf_template)
    for t in result:
        return client.get_link_content(t.get('link'))[0].data

    return None


@decorators.method_logging
def get_by_identifier_translated(used_lang, keys, sctp_client, idtf):
    keynode_idtfs = []
    keynode_idtfs.append(keys[KeynodeSysIdentifiers.nrel_main_idtf])
    keynode_idtfs.append(keys[KeynodeSysIdentifiers.nrel_idtf])

    links = sctp_client.find_links_with_content(idtf)
    if links:
        for link in links:
            get_by_link_addr_translated(used_lang, keys, sctp_client, link)

    return None


@decorators.method_logging
def get_by_link_addr_translated(used_lang, keys, sctp_client, link):
    keynode_idtfs = []
    keynode_idtfs.append(keys[KeynodeSysIdentifiers.nrel_main_idtf])
    keynode_idtfs.append(keys[KeynodeSysIdentifiers.nrel_idtf])

    for keynode_idtf in keynode_idtfs:
        elements = sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5_A_A_F_A_F,
                                                0,
                                                ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                                link,
                                                ScElementType.sc_type_arc_pos_const_perm,
                                                keynode_idtf)

        if elements is not None:
            # check if founded main identifier is for used language
            langs = sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                                 used_lang,
                                                 ScElementType.sc_type_arc_pos_const_perm,
                                                 link)
            if langs is not None:
                return elements[0][0]

    return None


@decorators.method_logging
def check_command_finished(command_addr, keynode_command_finished):
    template = ScTemplate()
    template.triple(
        keynode_command_finished,
        EDGE_ACCESS_VAR_POS_PERM,
        command_addr
    )
    return client.template_search(template)


@decorators.method_logging
def check_command_failed(command_addr, keynode_command_failed):
    template = ScTemplate()
    template.triple(
        keynode_command_failed,
        EDGE_ACCESS_VAR_POS_PERM,
        command_addr
    )
    return client.template_search(template)


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
def get_languages_list(keynode_languages):
    template = ScTemplate()
    template.triple(
        keynode_languages,
        EDGE_ACCESS_VAR_POS_PERM,
        NODE_VAR
    )
    res_langs = client.template_search(template)
    langs = []
    for items in res_langs:
        langs.append(items.get(2))
    return langs


@decorators.method_logging
def do_command(keys, cmd_addr, arguments, handler):
    result = {}

    if cmd_addr is not None:

        keynode_ui_rrel_commnad = keys[KeynodeSysIdentifiers.ui_rrel_commnad.value]
        keynode_ui_rrel_command_arguments = keys[KeynodeSysIdentifiers.ui_rrel_command_arguments.value]
        keynode_ui_nrel_command_result = keys[KeynodeSysIdentifiers.ui_nrel_command_result.value]
        keynode_ui_command_generate_instance = keys[KeynodeSysIdentifiers.ui_command_generate_instance.value]
        keynode_ui_command_initiated = keys[KeynodeSysIdentifiers.ui_command_initiated.value]
        keynode_ui_command_finished = keys[KeynodeSysIdentifiers.ui_command_finished.value]
        keynode_ui_nrel_command_result = keys[KeynodeSysIdentifiers.ui_nrel_command_result.value]
        keynode_ui_user = keys[KeynodeSysIdentifiers.ui_user.value]
        keynode_nrel_authors = keys[KeynodeSysIdentifiers.nrel_authors.value]

        keynode_system_element = keys[KeynodeSysIdentifiers.system_element.value]
        keynode_nrel_ui_nrel_command_lang_template = keys[KeynodeSysIdentifiers.nrel_ui_nrel_command_lang_template.value]
        keynode_languages = keys[KeynodeSysIdentifiers.languages.value]
        keynode_nrel_main_idtf = keys[KeynodeSysIdentifiers.nrel_main_idtf.value]

        # create command in sc-memory
        construction = ScConstruction()
        construction.create_node(NODE_CONST, 'inst_cmd_addr')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'inst_cmd_addr')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_ui_command_generate_instance, 'inst_cmd_addr',
                                 'arc_1')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'arc_1')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, 'inst_cmd_addr', cmd_addr, 'inst_cmd_arc')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'inst_cmd_arc')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_ui_rrel_commnad, 'inst_cmd_arc', 'arc_2')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'arc_2')

        # create arguments
        construction.create_node(NODE_CONST, 'args_addr')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'args_addr')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, 'inst_cmd_addr', 'args_addr', 'args_arc')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'args_arc')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_ui_rrel_command_arguments, 'args_arc', 'arc_3')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'arc_3')

        idx = 1
        for arg in arguments:
            arg_arc = 'arg_arc_%d' % idx
            construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, 'args_addr', arg, arg_arc)
            construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, arg_arc)

            idx_addr = client.resolve_keynodes(ScIdtfResolveParams(idtf='rrel_%d' % idx, type=None))[0]
            if not idx_addr.is_valid():
                return serialize_error(handler, 404, 'Error while create "create_instance" command')
            idx_arc_addr = 'idx_arc_addr_%d' % idx
            construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, idx_addr, arg_arc, idx_arc_addr)
            construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, idx_arc_addr)
            idx += 1

        # initialize command
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_ui_command_initiated, 'inst_cmd_addr')
        result = client.create_elements(construction)
        inst_cmd_addr = result[construction.get_index('inst_cmd_addr')]

        wait_time = 0
        wait_dt = 0.1

        cmd_finished = False
        cmd_failed = False
        while True:
            time.sleep(wait_dt)
            wait_time += wait_dt
            if wait_time > tornado.options.options.event_wait_timeout:
                return serialize_error(handler, 404, 'Timeout waiting for "create_instance" command finished')
            cmd_finished = check_command_finished(inst_cmd_addr, keynode_ui_command_finished)

            if cmd_finished or cmd_failed:
                break

        if cmd_failed:
            return {}

        # get command result
        template = ScTemplate()
        template.triple_with_relation(
            inst_cmd_addr,
            EDGE_D_COMMON_VAR,
            NODE_VAR,
            EDGE_ACCESS_VAR_POS_PERM,
            keynode_ui_nrel_command_result
        )
        cmd_result = client.template_search(template)
        if cmd_result is None:
            return serialize_error(handler, 404, 'Can\'t find "create_instance" command result')

        cmd_result = cmd_result[0].get(2)

        # @todo support all possible commands

        sc_session = ScSession(handler, keys)
        user_node = sc_session.get_sc_addr()
        if not user_node:
            return serialize_error(handler, 404, "Can't resolve user node")

        keynode_init_set = None
        keynode_question = keys[KeynodeSysIdentifiers.question.value]

        # try to find question node
        template = ScTemplate()
        template.triple_with_relation(
            keynode_question,
            EDGE_ACCESS_VAR_POS_PERM,
            NODE_VAR,
            EDGE_ACCESS_VAR_POS_PERM,
            cmd_result
        )
        question = client.template_search(template)
        if question:
            instance_node = question[0].get(2)
            result_key = 'question'

            keynode_init_set = keys[KeynodeSysIdentifiers.question_initiated.value]

            construction = ScConstruction()
            construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, instance_node)
            client.create_elements(construction)

            # generate main identifiers
            langs = get_languages_list(keynode_languages)
            if langs:
                template = ScTemplate()
                template.triple_with_relation(
                    cmd_addr,
                    EDGE_D_COMMON_VAR,
                    LINK_VAR,
                    EDGE_ACCESS_VAR_POS_PERM,
                    keynode_nrel_ui_nrel_command_lang_template
                )
                templates = client.template_search(template)
                if templates:
                    generated = {}
                    identifiers = {}

                    # get identifiers
                    for l in langs:
                        identifiers[str(l)] = {}
                        for a in arguments:
                            idtf_value = get_identifier_translated(a, l, keys)
                            if idtf_value:
                                identifiers[str(l)][str(a)] = idtf_value

                    for t in templates:
                        template = ScTemplate()
                        template.triple(
                            NODE_VAR_CLASS,
                            EDGE_ACCESS_VAR_POS_PERM,
                            t.get(2)
                        )
                        input_arcs = client.template_search(template)
                        if input_arcs:
                            for arc in input_arcs:
                                for l in langs:
                                    if str(l) not in generated and arc.get(0).is_equal(l):
                                        lang_idtfs = identifiers[str(l)]
                                        # get content of link
                                        data = client.get_link_content(t.get(2))[0].data
                                        if data:
                                            for idx in range(len(arguments)):
                                                value = arguments[idx].value
                                                if str(arguments[idx]) in lang_idtfs:
                                                    value = lang_idtfs[str(arguments[idx])]
                                                data = data.replace(u'$ui_arg_%d' % (idx + 1), value)

                                            # generate identifier
                                            construction = ScConstruction()
                                            construction.create_link(LINK_CONST,
                                                                     ScLinkContent(data,
                                                                                   ScLinkContentType.STRING.value),
                                                                     'idtf_link')
                                            construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, l, 'idtf_link')
                                            construction.create_edge(EDGE_D_COMMON_CONST, instance_node, 'idtf_link',
                                                                     'bin_arc')
                                            construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_nrel_main_idtf,
                                                                     'bin_arc')
                                            client.create_elements(construction)

                                            generated[str(l)] = True

        else:  # check if command

            keynode_command = keys[KeynodeSysIdentifiers.command.value]
            template = ScTemplate()
            template.triple_with_relation(
                keynode_command,
                EDGE_ACCESS_VAR_POS_PERM,
                NODE_VAR,
                EDGE_ACCESS_VAR_POS_PERM,
                cmd_result
            )

            command = client.template_search(template)
            if command:
                instance_node = command[0].get(2)
                keynode_init_set = keys[KeynodeSysIdentifiers.command_initiated.value]

            result_key = 'command'

        # create author
        construction = ScConstruction()
        construction.create_edge(EDGE_D_COMMON_CONST, instance_node, user_node, 'author_arc')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'author_arc')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_nrel_authors, 'author_arc', 'arc_1')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'arc_1')

        # initiate instance
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_init_set, instance_node, 'arc_2')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_system_element, 'arc_2')
        client.create_elements(construction)

        result = {result_key: instance_node.value}

    return result


# -------------- work with session -------------------------
@decorators.class_logging
class ScSession:

    def __init__(self, handler, keynodes):
        """Initialize session class with requets.user object
        """

        self.handler = handler

        self.user = handler.current_user
        self.session_key = handler.get_secure_cookie("session_key")
        self.keynodes = keynodes
        self.sc_addr = None
        self.email = None

        user = handler.get_current_user()
        if user is not None:
            self.email = user.email

    def get_user_kb_node_by_email(self):
        if self.user is not None:
            links = client.get_links_by_content(str(self.user.email))[0]
            if links and len(links) == 1:
                template = ScTemplate()
                template.triple_with_relation(
                    NODE_VAR,
                    EDGE_D_COMMON_VAR,
                    links[0],
                    EDGE_ACCESS_VAR_POS_PERM,
                    self.keynodes[KeynodeSysIdentifiers.nrel_email.value]
                )
                search = client.template_search(template)
                return search[0].get(0)
        return None

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
        ui_nrel_user_used_language = self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_used_language.value]
        template = ScTemplate()
        template.triple_with_relation(
            self.get_sc_addr(),
            EDGE_D_COMMON_VAR,
            NODE_VAR,
            EDGE_ACCESS_VAR_POS_PERM,
            ui_nrel_user_used_language
        )
        results = client.template_search(template)

        if results:
            return results[0].get(2)

        # setup russian mode by default
        _lang = self.keynodes[KeynodeSysIdentifiers.lang_ru]
        self.set_current_lang_mode(_lang)

        return _lang

    def get_default_ext_lang(self):
        """Returns sc-addr of default external language
        """
        default_ext_language = self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_default_ext_language.value]
        template = ScTemplate()
        template.triple_with_relation(
            self.get_sc_addr(),
            EDGE_D_COMMON_VAR,
            NODE_VAR,
            EDGE_ACCESS_VAR_POS_PERM,
            default_ext_language
        )
        result = client.template_search(template)
        if result:
            return result[0].get(2)

        # setup default language
        _lang = self.keynodes[KeynodeSysIdentifiers.scn_code]
        self.set_default_ext_lang(_lang)

        return _lang

    def set_current_lang_mode(self, mode_addr):
        """Setup new language mode as current for this session
        """
        # try to find currently used mode and remove it
        used_language = self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_used_language.value]
        template = ScTemplate()
        template.triple_with_relation(
            self.get_sc_addr(),
            EDGE_D_COMMON_VAR,
            NODE_VAR,
            EDGE_ACCESS_VAR_POS_PERM,
            used_language
        )
        search = client.template_search(template)
        if search:
            self.sctp_client.erase_element(search[0].get(1))

        construction = ScConstruction()
        construction.create_edge(EDGE_D_COMMON_CONST, self.get_sc_addr(), mode_addr, 'mode_edge')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, used_language, 'mode_edge')
        client.create_elements(construction)


    def set_default_ext_lang(self, lang_addr):
        """Setup new default external language
        """
        # try to find default external language and remove it
        default_ext_language = self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_default_ext_language.value]
        template = ScTemplate()
        template.triple_with_relation(
            self.get_sc_addr(),
            EDGE_D_COMMON_VAR,
            NODE_VAR,
            EDGE_ACCESS_VAR_POS_PERM,
            default_ext_language
        )
        results = client.template_search(template)
        if results:
            client.delete_elements(results[0].get(1))

        construction = ScConstruction()
        construction.create_edge(EDGE_D_COMMON_CONST, self.get_sc_addr(), lang_addr, 'lang_edge')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, default_ext_language, 'lang_edge')
        client.create_elements(construction)

    def _find_user_by_system_idtf(self, idtf):
        value = client.resolve_keynodes(ScIdtfResolveParams(idtf=idtf, type=None))[0]
        return value

    def _create_user_with_system_idtf(self, idtf):
        keynode_ui_user = self.keynodes[KeynodeSysIdentifiers.ui_user.value]
        sys_idtf = self.keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value]

        # create user node
        user_node = self.sctp_client.create_node(ScElementType.sc_type_node | ScElementType.sc_type_const)
        self.sctp_client.create_arc(ScElementType.sc_type_arc_pos_const_perm, keynode_ui_user, user_node)

        construction = ScConstruction()
        construction.create_node(NODE_CONST, 'user')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, keynode_ui_user, 'user')
        construction.create_link(LINK, ScLinkContent(idtf, ScLinkContentType.STRING.value), 'idtf')
        construction.create_edge(EDGE_D_COMMON_VAR, 'user', 'idtf', 'sys_idtf_edge')
        construction.create_edge(EDGE_ACCESS_CONST_POS_PERM, sys_idtf, 'sys_idtf_edge')
        result = client.create_elements(construction)

        return result[construction.get_index('user')]

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
            user = self.get_user_kb_node_by_email()

            if user:
                return user

        return self._find_user_by_system_idtf("user::" + str(self._user_hash()))
