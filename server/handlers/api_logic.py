# -*- coding: utf-8 -*-

import base64
import hashlib
import logging
import time
import threading
import uuid
from typing import List, Dict

import tornado.web
from sc_client import client
from sc_client.constants import sc_type
from sc_client.models import \
    (
        ScTemplate,
        ScIdtfResolveParams,
        ScConstruction,
        ScLinkContent,
        ScLinkContentType,
        ScAddr,
        ScTemplateResult,
    )
from sc_client.sc_keynodes import ScKeynodes

import decorators
from keynodes import KeynodeSysIdentifiers
from .base import BaseHandler

__all__ = (
    'parse_menu_command',
    'find_cmd_result',
    'find_result',
    'find_translation',
    'check_command_finished',
    'append_to_system_elements',
)

logger = logging.getLogger()


@decorators.method_logging
def serialize_error(handler, code, message):
    handler.clear()
    handler.set_status(code)
    handler.finish(message)


@decorators.method_logging
def parse_menu_command(cmd_addr: ScAddr):
    """Parse specified command from sc-memory and
        return hierarchy map (with children), that represent it
        @param cmd_addr: sc-addr of command to parse
    """
    keynodes = ScKeynodes()

    # try to find command type
    cmd_type = 'unknown'
    template = ScTemplate()
    template.triple(
        keynodes[KeynodeSysIdentifiers.ui_user_command_class_atom.value],
        sc_type.VAR_PERM_POS_ARC,
        cmd_addr,
    )
    result = client.search_by_template(template)

    if result:
        cmd_type = 'cmd_atom'
    else:
        template = ScTemplate()
        template.triple(
            keynodes[KeynodeSysIdentifiers.ui_user_command_class_noatom.value],
            sc_type.VAR_PERM_POS_ARC,
            cmd_addr,
        )
        result = client.search_by_template(template)

        if result:
            cmd_type = 'cmd_noatom'

    attrs = {'cmd_type': cmd_type, 'id': cmd_addr.value}

    # try to find decomposition
    DECOMPOSITION_NODE = "_decomposition"
    template = ScTemplate()
    template.quintuple(
        (sc_type.VAR_NODE, DECOMPOSITION_NODE),
        sc_type.VAR_COMMON_ARC,
        cmd_addr,
        sc_type.VAR_PERM_POS_ARC,
        keynodes[KeynodeSysIdentifiers.nrel_ui_commands_decomposition.value],
    )
    result = client.search_by_template(template)
    if result:
        # iterate child commands
        decomposition_node = result[0].get(DECOMPOSITION_NODE)

        template = ScTemplate()
        template.triple(
            decomposition_node,
            sc_type.VAR_PERM_POS_ARC,
            sc_type.UNKNOWN
        )
        result = client.search_by_template(template)
        child_commands = []
        for item in result:
            child_structure = parse_menu_command(item.get(2))
            child_commands.append(child_structure)
        attrs["childs"] = child_commands

    return attrs


@decorators.method_logging
def find_atomic_commands(cmd_addr: ScAddr, commands: List[int]):
    """Parse specified command from sc-memory and
        return hierarchy map (with children), that represent it
        @param cmd_addr: sc-addr of command to parse
        @param commands: sc-addr of (non) atomic commands to parse
    """
    keynodes = ScKeynodes()

    # try to find command type
    template = ScTemplate()
    template.triple(
        keynodes[KeynodeSysIdentifiers.ui_user_command_class_atom.value],
        sc_type.VAR_PERM_POS_ARC,
        cmd_addr,
    )
    if client.search_by_template(template):
        commands.append(cmd_addr.value)

    # try to find decomposition
    DECOMPOSITION_NODE = "_decomposition"
    CHILD_NODE = "_child"
    template = ScTemplate()
    template.quintuple(
        (sc_type.VAR_NODE, DECOMPOSITION_NODE),
        sc_type.VAR_COMMON_ARC,
        cmd_addr,
        sc_type.VAR_PERM_POS_ARC,
        keynodes[KeynodeSysIdentifiers.nrel_ui_commands_decomposition.value],
    )
    template.triple(
        DECOMPOSITION_NODE,
        sc_type.VAR_PERM_POS_ARC,
        (sc_type.UNKNOWN, CHILD_NODE),
    )
    children = client.search_by_template(template)
    for child in children:
        find_atomic_commands(child.get(CHILD_NODE), commands)


@decorators.method_logging
def find_tooltip(addr: ScAddr, lang) -> str:
    keynodes = ScKeynodes()

    # try to find structure, where addr is key sc-element
    KEY_SC_ELEMENT = "_key_sc_element"
    template = ScTemplate()
    template.quintuple(
        (sc_type.VAR_NODE, KEY_SC_ELEMENT),
        sc_type.VAR_PERM_POS_ARC,
        addr,
        sc_type.VAR_PERM_POS_ARC,
        keynodes[KeynodeSysIdentifiers.rrel_key_sc_element.value],
    )
    result = client.search_by_template(template)

    if result:
        found_map = {}
        order_list = [keynodes[KeynodeSysIdentifiers.sc_definition.value],
                      keynodes[KeynodeSysIdentifiers.sc_explanation.value],
                      keynodes[KeynodeSysIdentifiers.sc_note.value]]

        for class_keynode in order_list:
            found_map[str(class_keynode)] = []

        for item in result:
            node = item.get(KEY_SC_ELEMENT)

            # check if it's a sc explanation
            explanation_template = ScTemplate()
            KEY_SC_ELEMENT_CLASS = "_class"
            explanation_template.triple(
                (sc_type.VAR_NODE, KEY_SC_ELEMENT_CLASS),
                sc_type.VAR_PERM_POS_ARC,
                node,
            )
            explanation_result = client.search_by_template(explanation_template)
            for exp_item in explanation_result:
                for class_keynode in order_list:
                    if exp_item.get(KEY_SC_ELEMENT_CLASS) == class_keynode:
                        found_map[str(exp_item)].append(node)

        for class_keynode in order_list:
            found_list = found_map[str(class_keynode)]
            for node in found_list:
                # find all translations
                translations_template = ScTemplate()
                TRANSLATION_NODE = "_node"
                translations_template.quintuple(
                    (sc_type.VAR_NODE, TRANSLATION_NODE),
                    sc_type.VAR_COMMON_ARC,
                    node,
                    sc_type.VAR_PERM_POS_ARC,
                    keynodes[KeynodeSysIdentifiers.nrel_sc_text_translation.value],
                )
                translations_result = client.search_by_template(
                    translations_template)

                for translation in translations_result:
                    # find translation to current language
                    TEXT_LINK = "_text_link"
                    items_template = ScTemplate()
                    items_template.triple(
                        translation.get(TRANSLATION_NODE),
                        sc_type.VAR_PERM_POS_ARC,
                        (sc_type.VAR_NODE_LINK, TEXT_LINK),
                    )
                    items_result = client.search_by_template(items_template)

                    for item in items_result:
                        text_link = item.get(TEXT_LINK)

                        lang_template = ScTemplate()
                        lang_template.triple(
                            lang,
                            sc_type.VAR_PERM_POS_ARC,
                            text_link,
                        )
                        if client.search_by_template(lang_template):
                            return client.get_link_content(text_link)[0].data

    return ""


@decorators.method_logging
def find_cmd_result(command_addr: ScAddr) -> List[ScTemplateResult]:
    keynodes = ScKeynodes()

    template = ScTemplate()
    template.quintuple(
        command_addr,
        sc_type.VAR_COMMON_ARC,
        sc_type.VAR_NODE_LINK,
        sc_type.VAR_PERM_POS_ARC,
        keynodes[KeynodeSysIdentifiers.ui_nrel_command_result.value],
    )
    return client.search_by_template(template)


@decorators.method_logging
def find_result(action_addr: ScAddr) -> List[ScTemplateResult]:
    def _get_result():
        keynodes = ScKeynodes()

        template = ScTemplate()
        template.quintuple(
            action_addr,
            sc_type.VAR_COMMON_ARC,
            sc_type.VAR_NODE,
            sc_type.VAR_PERM_POS_ARC,
            keynodes[KeynodeSysIdentifiers.action_nrel_result.value],
        )
        return client.search_by_template(template)

    wait_dt = 0.01
    begin_time = time.time()
    result = _get_result()
    while (((begin_time + tornado.options.options.action_result_wait_timeout) > time.time()) and result == None):
        time.sleep(wait_dt)
        result = _get_result()
    return result


@decorators.method_logging
def find_translation(construction_addr: ScAddr) -> List[ScTemplateResult]:
    keynodes = ScKeynodes()

    template = ScTemplate()
    template.quintuple(
        construction_addr,
        sc_type.VAR_COMMON_ARC,
        sc_type.VAR_NODE_LINK,
        sc_type.VAR_PERM_POS_ARC,
        keynodes[KeynodeSysIdentifiers.nrel_translation.value],
    )
    return client.search_by_template(template)


@decorators.method_logging
def find_translation_with_format(construction_addr, format_addr) -> ScAddr:
    translations = find_translation(construction_addr)

    if not translations:
        return ScAddr(0)

    for trans in translations:
        link_addr = trans.get(2)
        # check format
        template = ScTemplate()
        template.triple(
            link_addr,
            sc_type.VAR_COMMON_ARC,
            format_addr,
        )
        result = client.search_by_template(template)
        if result:
            return result[0].get(0)

    return ScAddr(0)


@decorators.method_logging
def get_by_system_identifier(idtf) -> ScAddr:
    links = client.search_links_by_contents(idtf)
    if links:
        for link in links:
            get_by_link_addr(link)
    return ScAddr(0)


@decorators.method_logging
def get_by_link_addr(link_addr) -> ScAddr:
    keynodes = ScKeynodes()

    template = ScTemplate()
    template.quintuple(
        sc_type.UNKNOWN,
        sc_type.VAR_COMMON_ARC,
        link_addr,
        sc_type.VAR_PERM_POS_ARC,
        keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value],
    )
    elements = client.search_by_template(template)
    if elements:
        return elements[0].get(0)

    return ScAddr(0)


@decorators.method_logging
def get_identifier_translated(addr: ScAddr, used_lang: ScAddr) -> str:
    keynodes = ScKeynodes()

    LINK = "_link"
    main_idtf_template = ScTemplate()
    main_idtf_template.quintuple(
        addr,
        sc_type.VAR_COMMON_ARC,
        (sc_type.NODE_LINK, LINK),
        sc_type.VAR_PERM_POS_ARC,
        keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value],
    )
    main_idtf_template.triple(
        used_lang,
        sc_type.VAR_PERM_POS_ARC,
        LINK,
    )
    result = client.search_by_template(main_idtf_template)
    if result:
        return client.get_link_content(result[0].get(LINK))[0].data

    # if identifier not found, then get system identifier
    return get_system_identifier(addr)


def get_system_identifier(addr: ScAddr):
    keynodes = ScKeynodes()
    LINK = "_link"

    sys_idtf_template = ScTemplate()
    sys_idtf_template.quintuple(
        addr,
        sc_type.VAR_COMMON_ARC,
        (sc_type.VAR_NODE_LINK, LINK),
        sc_type.VAR_PERM_POS_ARC,
        keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value]
    )
    result = client.search_by_template(sys_idtf_template)
    if result:
        return client.get_link_content(result[0].get(LINK))[0].data

    return ""


@decorators.method_logging
def get_by_identifier_translated(used_lang: ScAddr, idtf: str):
    keynodes_idtfs = []

    keynodes = ScKeynodes()
    keynodes_idtfs.append(keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value])
    keynodes_idtfs.append(keynodes[KeynodeSysIdentifiers.nrel_idtf.value])

    links = client.search_links_by_contents(idtf)
    for link in links:
        get_by_link_addr_translated(used_lang, link)


@decorators.method_logging
def get_by_link_addr_translated(used_lang: ScAddr, link: ScAddr) -> ScAddr:
    keynodes_idtfs = []

    keynodes = ScKeynodes()
    keynodes_idtfs.append(keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value])
    keynodes_idtfs.append(keynodes[KeynodeSysIdentifiers.nrel_idtf.value])

    ELEMENT_NODE = "_element"
    for keynode_idtf in keynodes_idtfs:
        template = ScTemplate()
        template.quintuple(
            (sc_type.UNKNOWN, ELEMENT_NODE),
            sc_type.VAR_COMMON_ARC,
            link,
            sc_type.VAR_PERM_POS_ARC,
            keynode_idtf
        )
        template.triple(
            used_lang,
            sc_type.VAR_PERM_POS_ARC,
            link
        )
        elements = client.search_by_template(template)
        if elements:
            return elements[0].get(ELEMENT_NODE)

    return ScAddr(0)


@decorators.method_logging
def check_command_finished(command_addr: ScAddr) -> bool:
    keynodes = ScKeynodes()

    template = ScTemplate()
    template.triple(
        keynodes[KeynodeSysIdentifiers.ui_command_finished.value],
        sc_type.VAR_PERM_POS_ARC,
        command_addr
    )
    return bool(client.search_by_template(template))


@decorators.method_logging
def check_command_failed(command_addr: ScAddr) -> bool:
    keynodes = ScKeynodes()

    template = ScTemplate()
    template.triple(
        keynodes[KeynodeSysIdentifiers.ui_command_failed.value],
        sc_type.VAR_PERM_POS_ARC,
        command_addr,
    )
    return bool(client.search_by_template(template))


@decorators.method_logging
def append_to_system_elements(keynode_system_element: ScAddr, el: ScAddr) -> None:
    construction = ScConstruction()
    construction.generate_connector(
        sc_type.CONST_PERM_POS_ARC, keynode_system_element, el)
    client.generate_elements(construction)


@decorators.method_logging
def get_languages_list() -> List[ScAddr]:
    keynodes = ScKeynodes()

    template = ScTemplate()
    template.triple(
        keynodes[KeynodeSysIdentifiers.languages.value],
        sc_type.VAR_PERM_POS_ARC,
        sc_type.VAR_NODE,
    )
    res_langs = client.search_by_template(template)

    langs = []
    for items in res_langs:
        langs.append(items.get(2))
    return langs


@decorators.method_logging
def do_command(cmd_addr: ScAddr, arguments: List[ScAddr], handler: BaseHandler):
    result = {}

    if cmd_addr.is_valid():
        keynodes = ScKeynodes()

        keynode_ui_rrel_commnad = keynodes[KeynodeSysIdentifiers.ui_rrel_commnad.value]
        keynode_ui_rrel_command_arguments = keynodes[KeynodeSysIdentifiers.ui_rrel_command_arguments.value]
        keynode_ui_command_generate_instance = keynodes[
            KeynodeSysIdentifiers.ui_command_generate_instance.value]
        keynode_ui_command_initiated = keynodes[KeynodeSysIdentifiers.ui_command_initiated.value]
        keynode_ui_nrel_command_result = keynodes[KeynodeSysIdentifiers.ui_nrel_command_result.value]
        keynode_nrel_authors = keynodes[KeynodeSysIdentifiers.nrel_authors.value]

        keynode_system_element = keynodes[KeynodeSysIdentifiers.system_element.value]
        keynode_nrel_ui_nrel_command_lang_template = keynodes[
            KeynodeSysIdentifiers.nrel_ui_nrel_command_lang_template.value]
        keynode_languages = keynodes[KeynodeSysIdentifiers.languages.value]
        keynode_nrel_main_idtf = keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value]

        # create command in sc-memory
        construction = ScConstruction()
        construction.generate_node(sc_type.CONST_NODE, 'inst_cmd_addr')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'inst_cmd_addr')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_ui_command_generate_instance, 'inst_cmd_addr', 'arc_1')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_1')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, 'inst_cmd_addr', cmd_addr, 'inst_cmd_arc')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'inst_cmd_arc')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_ui_rrel_commnad, 'inst_cmd_arc', 'arc_2')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_2')

        # create arguments
        construction.generate_node(sc_type.CONST_NODE, 'args_addr')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'args_addr')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, 'inst_cmd_addr', 'args_addr', 'args_arc')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'args_arc')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_ui_rrel_command_arguments, 'args_arc', 'arc_3')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_3')

        idx = 1
        for arg in arguments:
            arg_arc = 'arg_arc_%d' % idx
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, 'args_addr', arg, arg_arc)
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, arg_arc)

            idx_addr = client.resolve_keynodes(
                ScIdtfResolveParams(idtf='rrel_%d' % idx, type=None))[0]
            if not idx_addr.is_valid():
                return serialize_error(handler, 404, 'Error while create "create_instance" command')
            idx_arc_addr = 'idx_arc_addr_%d' % idx
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, idx_addr, arg_arc, idx_arc_addr)
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, idx_arc_addr)
            idx += 1

        # initialize command
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_ui_command_initiated, 'inst_cmd_addr')
        result = client.generate_elements(construction)
        inst_cmd_addr = result[construction.get_index('inst_cmd_addr')]

        wait_time = 0
        wait_dt = 0.1

        is_cmd_failed = False
        while True:
            time.sleep(wait_dt)
            wait_time += wait_dt
            if wait_time > tornado.options.options.event_wait_timeout:
                return serialize_error(handler, 404, 'Timeout waiting for "create_instance" command finished')
            is_cmd_finished = check_command_finished(inst_cmd_addr)

            if is_cmd_finished or is_cmd_failed:
                break

        if is_cmd_failed:
            return {}

        # get command result
        template = ScTemplate()
        template.quintuple(
            inst_cmd_addr,
            sc_type.VAR_COMMON_ARC,
            sc_type.VAR_NODE,
            sc_type.VAR_PERM_POS_ARC,
            keynode_ui_nrel_command_result
        )
        cmd_result = client.search_by_template(template)
        if cmd_result is None:
            return serialize_error(handler, 404, 'Can\'t find "create_instance" command result')

        cmd_result = cmd_result[0].get(2)

        # @todo support all possible commands

        sc_session = ScSession(handler)
        user_node = sc_session.get_sc_addr()
        if not user_node:
            return serialize_error(handler, 404, "Can't resolve user node")

        keynode_init_set = None
        keynode_action = keynodes[KeynodeSysIdentifiers.action.value]

        # try to find action node
        template = ScTemplate()
        template.quintuple(
            keynode_action,
            sc_type.VAR_PERM_POS_ARC,
            sc_type.VAR_NODE,
            sc_type.VAR_PERM_POS_ARC,
            cmd_result,
        )
        action = client.search_by_template(template)
        if action:
            instance_node = action[0].get(2)
            result_key = 'action'

            keynode_init_set = keynodes[KeynodeSysIdentifiers.action_initiated.value]

            construction = ScConstruction()
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, instance_node)
            client.generate_elements(construction)

            # generate main identifiers
            langs = get_languages_list()
            if langs:
                template = ScTemplate()
                template.quintuple(
                    cmd_addr,
                    sc_type.VAR_COMMON_ARC,
                    sc_type.VAR_NODE_LINK,
                    sc_type.VAR_PERM_POS_ARC,
                    keynode_nrel_ui_nrel_command_lang_template,
                )
                templates = client.search_by_template(template)
                generated = {}
                identifiers: Dict[str, Dict[str, str]] = {}

                # get identifiers
                for lang in langs:
                    identifiers[str(lang)] = {}
                    for a in arguments:
                        idtf_value = get_identifier_translated(a, lang)
                        if idtf_value:
                            identifiers[str(lang)][str(a)] = idtf_value

                for template_item in templates:
                    template = ScTemplate()
                    template.triple(
                        sc_type.VAR_NODE_CLASS,
                        sc_type.VAR_PERM_POS_ARC,
                        template_item.get(2),
                    )
                    input_arcs = client.search_by_template(template)
                    for arc in input_arcs:
                        for lang in langs:
                            if str(lang) not in generated and arc.get(0).value == lang.value:
                                lang_idtfs = identifiers[str(lang)]
                                # get content of link
                                data = client.get_link_content(
                                    template_item.get(2))[0].data
                                if data:
                                    for idx in range(len(arguments)):
                                        value = arguments[idx].value
                                        if str(arguments[idx]) in lang_idtfs:
                                            value = lang_idtfs[str(
                                                arguments[idx])]
                                        data = data.replace(
                                            u'$ui_arg_%d' % (idx + 1), str(value))

                                    # generate identifier
                                    construction = ScConstruction()
                                    construction.generate_link(
                                        sc_type.CONST_NODE_LINK,
                                        ScLinkContent(
                                            data, ScLinkContentType.STRING.value),
                                        'idtf_link')
                                    construction.generate_connector(
                                        sc_type.CONST_PERM_POS_ARC, lang, 'idtf_link')
                                    construction.generate_connector(
                                        sc_type.CONST_COMMON_ARC, instance_node, 'idtf_link', 'bin_arc')
                                    construction.generate_connector(
                                        sc_type.CONST_PERM_POS_ARC, keynode_nrel_main_idtf, 'bin_arc')
                                    client.generate_elements(construction)

                                    generated[str(lang)] = True

        else:  # check if command
            keynode_command = keynodes[KeynodeSysIdentifiers.command.value]
            template = ScTemplate()
            template.quintuple(
                keynode_command,
                sc_type.VAR_PERM_POS_ARC,
                sc_type.VAR_NODE,
                sc_type.VAR_PERM_POS_ARC,
                cmd_result
            )

            command = client.search_by_template(template)
            if command:
                instance_node = command[0].get(2)
                keynode_init_set = keynodes[KeynodeSysIdentifiers.command_initiated.value]

            result_key = 'command'

        # create author
        construction = ScConstruction()
        construction.generate_connector(
            sc_type.CONST_COMMON_ARC, instance_node, user_node, 'author_arc')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'author_arc')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_nrel_authors, 'author_arc', 'arc_1')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_1')

        # initiate instance
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_init_set, instance_node, 'arc_2')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_2')
        client.generate_elements(construction)

        result = {result_key: instance_node.value}
    return result


# -------------- work with session -------------------------
@decorators.class_logging
class ScSession:
    def __init__(self, handler):
        """Initialize session class with requests.user object
        """

        self.handler = handler

        self.user = handler.current_user
        self.session_key = handler.get_secure_cookie("session_key")
        self.keynodes = ScKeynodes()
        self.sc_addr = ScAddr(0)
        self.email = None

        user = handler.get_current_user()
        if user is not None:
            self.email = user.email

    def get_user_kb_node_by_email(self) -> ScAddr:
        if self is not None:
            links = client.search_links_by_contents(str(self.user.email))[0]
            if links and len(links) == 1:
                template = ScTemplate()
                template.quintuple(
                    sc_type.VAR_NODE,
                    sc_type.VAR_COMMON_ARC,
                    links[0],
                    sc_type.VAR_PERM_POS_ARC,
                    self.keynodes[KeynodeSysIdentifiers.nrel_email.value, sc_type.CONST_NODE_NON_ROLE],
                )
                search = client.search_by_template(template)
                return search[0].get(0)
        return ScAddr(0)

    def get_sc_addr(self) -> ScAddr:
        """Resolve sc-addr of session
        """
        if not self.sc_addr.is_valid():
            if self.user is not None:
                self.sc_addr = self._user_get_sc_addr()
                if not self.sc_addr.is_valid():
                    self.sc_addr = self._user_new()
            else:
                if self.session_key is None:
                    self.session_key = base64.b64encode(
                        uuid.uuid4().bytes + uuid.uuid4().bytes)
                    self.handler.set_secure_cookie(
                        "session_key", self.session_key)
                self.sc_addr = self._session_get_sc_addr()

            if not self.sc_addr.is_valid():
                self.sc_addr = self._session_new_sc_addr()

        # todo check user addr
        return self.sc_addr

    def get_used_language(self) -> ScAddr:
        """Returns sc-addr of currently used natural language
        """
        ui_nrel_user_used_language = self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_used_language.value, sc_type.CONST_NODE_NON_ROLE]
        template = ScTemplate()
        template.quintuple(
            self.get_sc_addr(),
            sc_type.VAR_COMMON_ARC,
            sc_type.VAR_NODE,
            sc_type.VAR_PERM_POS_ARC,
            ui_nrel_user_used_language,
        )
        results = client.search_by_template(template)

        if results:
            lang_addr = results[0].get(2)
            logger.info(f'User language: {get_system_identifier(lang_addr)}')
            return results[0].get(2)

        # setup russian mode by default
        _lang = self.keynodes[KeynodeSysIdentifiers.lang_ru.value, sc_type.CONST_NODE_CLASS]
        self.set_current_lang_mode(_lang)

        logger.info(f'User language: {KeynodeSysIdentifiers.lang_ru.value}')

        return _lang

    def get_default_ext_lang(self) -> ScAddr:
        """Returns sc-addr of default external language
        """
        default_ext_language = self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_default_ext_language.value, sc_type.CONST_NODE_NON_ROLE]
        template = ScTemplate()
        template.quintuple(
            self.get_sc_addr(),
            sc_type.VAR_COMMON_ARC,
            sc_type.VAR_NODE,
            sc_type.VAR_PERM_POS_ARC,
            default_ext_language,
        )
        result = client.search_by_template(template)
        if result:
            ext_lang_addr = result[0].get(2)
            logger.info(f'User ext language: {get_system_identifier(ext_lang_addr)}')
            return ext_lang_addr

        # setup default language
        _lang = self.keynodes[KeynodeSysIdentifiers.scn_code.value, sc_type.CONST_NODE]
        self.set_default_ext_lang(_lang)

        logger.info(f'User ext language: {KeynodeSysIdentifiers.scn_code.value}')

        return _lang

    def set_current_lang_mode(self, mode_addr) -> None:
        """Setup new language mode as current for this session
        """
        logger.info(f'Set lang {get_system_identifier(mode_addr)}')

        # try to find currently used mode and remove it
        used_language = self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_used_language.value, sc_type.CONST_NODE_NON_ROLE]
        template = ScTemplate()
        template.quintuple(
            self.get_sc_addr(),
            sc_type.VAR_COMMON_ARC,
            sc_type.VAR_NODE,
            sc_type.VAR_PERM_POS_ARC,
            used_language
        )
        search = client.search_by_template(template)
        if search:
            client.erase_elements(search[0].get(1))

        construction = ScConstruction()
        construction.generate_connector(
            sc_type.CONST_COMMON_ARC, self.get_sc_addr(), mode_addr, 'mode_edge')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, used_language, 'mode_edge')
        client.generate_elements(construction)

    def set_default_ext_lang(self, lang_addr) -> None:
        """Setup new default external language
        """
        logger.info(f'Set ext lang {get_system_identifier(lang_addr)}')

        # try to find default external language and remove it
        default_ext_language = self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_default_ext_language.value, sc_type.CONST_NODE_NON_ROLE]
        template = ScTemplate()
        template.quintuple(
            self.get_sc_addr(),
            sc_type.VAR_COMMON_ARC,
            sc_type.VAR_NODE,
            sc_type.VAR_PERM_POS_ARC,
            default_ext_language
        )
        results = client.search_by_template(template)
        if results:
            client.erase_elements(results[0].get(1))

        construction = ScConstruction()
        construction.generate_connector(
            sc_type.CONST_COMMON_ARC, self.get_sc_addr(), lang_addr, 'lang_edge')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, default_ext_language, 'lang_edge')
        client.generate_elements(construction)

    def _find_user_by_system_idtf(self, idtf) -> ScAddr:
        value = client.resolve_keynodes(
            ScIdtfResolveParams(idtf=idtf, type=None))[0]
        return value

    def _create_user_with_system_idtf(self, idtf) -> ScAddr:
        keynode_ui_user = self.keynodes[KeynodeSysIdentifiers.ui_user.value, sc_type.CONST_NODE]
        sys_idtf = self.keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value, sc_type.CONST_NODE_NON_ROLE]

        # create user node
        construction = ScConstruction()
        construction.generate_node(sc_type.CONST_NODE, 'user')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, keynode_ui_user, 'user')
        construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent(
            idtf, ScLinkContentType.STRING.value), 'idtf')
        construction.generate_connector(
            sc_type.CONST_COMMON_ARC, 'user', 'idtf', 'sys_idtf_edge')
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC, sys_idtf, 'sys_idtf_edge')
        result = client.generate_elements(construction)

        return result[construction.get_index('user')]

    def _session_new_sc_addr(self) -> ScAddr:
        return self._create_user_with_system_idtf("session::" + str(self.session_key))

    def _session_get_sc_addr(self) -> ScAddr:
        return self._find_user_by_system_idtf("session::" + str(self.session_key))

    def _user_hash(self) -> str:
        email = self.user.email
        return hashlib.sha256(email.encode()).hexdigest()

    def _user_new(self) -> ScAddr:
        return self._create_user_with_system_idtf("user::" + str(self._user_hash()))

    def _user_get_sc_addr(self) -> ScAddr:
        # try to find by email
        if self.email:
            user = self.get_user_kb_node_by_email()

            if user.is_valid():
                return user

        return self._find_user_by_system_idtf("user::" + str(self._user_hash()))
