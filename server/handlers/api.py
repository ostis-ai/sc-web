# -*- coding: utf-8 -*-

from typing import List
import logging
import os

import tornado.web
import json

from sc_client import client
from sc_client.constants import sc_type
from sc_client.models import ScTemplate, ScAddr, ScConstruction
from sc_client.sc_keynodes import ScKeynodes

import decorators

from keynodes import KeynodeSysIdentifiers

from . import api_logic as logic
import time
from . import base

# -------------------------------------------

logger = logging.getLogger()


class ContextMenu(base.BaseHandler):
    # @tornado.web.asynchronous
    def get(self):
        keynodes = ScKeynodes()
        keynode_ui_main_menu = keynodes[KeynodeSysIdentifiers.ui_main_menu.value]

        # try to find main menu node
        cmds = []
        logic.find_atomic_commands(keynode_ui_main_menu, cmds)

        logger.debug(f'Result: {cmds}')
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(cmds))


class CmdDo(base.BaseHandler):
    # @tornado.web.asynchronous
    def post(self):
        cmd_addr = ScAddr(int(self.get_argument(u'cmd', None)))
        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or arg is not None:
            arg = self.get_argument(u'%d_' % idx, None)
            if arg is not None:
                arg = ScAddr(int(arg))
                # check if sc-element exist
                if client.get_elements_types(arg)[0].is_valid():
                    arguments.append(arg)
                else:
                    return logic.serialize_error(404, "Invalid argument: %s" % arg)
            first = False
            idx += 1

        result = logic.do_command(cmd_addr, arguments, self)
        if result is not None:
            logger.debug(f'Result: {result}')
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))


class ActionResultTranslate(base.BaseHandler):
    # @tornado.web.asynchronous
    def post(self):
        action_addr = ScAddr(int(self.get_argument(u'action', None)))
        format_addr = ScAddr(int(self.get_argument(u'format', None)))

        lang_arg = self.get_argument(u'lang', None)
        if lang_arg:
            lang_addr = ScAddr(int(lang_arg))

        keynodes = ScKeynodes()
        keynode_system_element = keynodes[KeynodeSysIdentifiers.system_element.value]
        ui_rrel_source_sc_construction = keynodes[KeynodeSysIdentifiers.ui_rrel_source_sc_construction.value]
        ui_rrel_user_lang = keynodes[KeynodeSysIdentifiers.ui_rrel_user_lang.value]
        ui_command_translate_from_sc = keynodes[KeynodeSysIdentifiers.ui_command_translate_from_sc.value]
        ui_command_initiated = keynodes[KeynodeSysIdentifiers.ui_command_initiated.value]

        # try to find result for the action
        wait_time = 0
        wait_dt = 0.1

        result = logic.find_result(action_addr)
        while not result:
            time.sleep(wait_dt)
            wait_time += wait_dt
            if wait_time > tornado.options.options.event_wait_timeout:
                return logic.serialize_error(self, 404, 'Timeout waiting for result')

            result = logic.find_result(action_addr)

        if not result:
            return logic.serialize_error(self, 404, 'Result not found')

        result_addr = result[0].get(2)

        # try to find translation to specified format
        result_link_addr = logic.find_translation_with_format(result_addr, format_addr)

        # if link addr not found, then run translation of result to specified format
        result = {}
        if not result_link_addr.is_valid():
            construction = ScConstruction()
            construction.generate_node(sc_type.CONST_NODE, 'trans_cmd_addr')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'trans_cmd_addr')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, 'trans_cmd_addr', result_addr, 'arc_addr')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_addr')
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, ui_rrel_source_sc_construction, 'arc_addr', 'arc_addr_2')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_addr_2')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, 'trans_cmd_addr', format_addr, 'arc_addr_3')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_addr_3')

            if lang_addr:
                construction.generate_connector(sc_type.CONST_PERM_POS_ARC, 'trans_cmd_addr', lang_addr, 'arc_addr_4')
                construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_addr_4')

            ui_rrel_output_format = keynodes[KeynodeSysIdentifiers.ui_rrel_output_format.value]
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, ui_rrel_output_format, 'arc_addr_3', 'arc_addr_3_edge')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_addr_3_edge')
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, ui_rrel_user_lang, 'arc_addr_4', 'arc_addr_4_edge')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_addr_4_edge')
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, ui_command_translate_from_sc, 'trans_cmd_addr', 'arc_addr_5')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_addr_5')
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, ui_command_initiated, 'trans_cmd_addr', 'arc_addr_6')
            construction.generate_connector(sc_type.CONST_PERM_POS_ARC, keynode_system_element, 'arc_addr_6')

            result = client.generate_elements(construction)

            # now we need to wait translation result
            wait_time = 0
            translation = logic.find_translation_with_format(result_addr, format_addr)
            while not translation.is_valid():
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > tornado.options.options.event_wait_timeout:
                    return logic.serialize_error(self, 404, 'Timeout waiting for result translation')

                translation = logic.find_translation_with_format(result_addr, format_addr)

            if translation is not None:
                result_link_addr = translation

        # if result exists, then we need to return it content
        if result_link_addr is not None:
            result = json.dumps({"link": result_link_addr.value})

        logger.debug(f'Result: {result}')
        self.set_header("Content-Type", "application/json")
        self.finish(result)


@decorators.class_logging
class Languages(base.BaseHandler):
    # @tornado.web.asynchronous
    def get(self):
        langs = logic.get_languages_list()

        logger.debug(f'Result: {langs}')
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(langs))


@decorators.class_logging
class LanguageSet(base.BaseHandler):
    # @tornado.web.asynchronous
    def post(self):
        lang_addr = ScAddr(int(self.get_argument(u'lang_addr', None)))

        sc_session = logic.ScSession(self)
        sc_session.set_current_lang_mode(lang_addr)

        self.finish()


@decorators.class_logging
class InfoTooltip(base.BaseHandler):
    # @tornado.web.asynchronous
    def post(self):

        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or arg is not None:
            arg_str = u'%d_' % idx
            arg = self.get_argument(arg_str, None)
            if arg is not None:
                arguments.append(arg)
            first = False
            idx += 1

            sc_session = logic.ScSession(self)

            result = {}
            for addr in arguments:
                tooltip = logic.find_tooltip(ScAddr(int(addr)), sc_session.get_used_language())
                result[addr] = tooltip

            logger.debug(f'Result: {result}')
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))


@decorators.class_logging
class User(base.BaseHandler):
    _keynodes = ScKeynodes()

    # @tornado.web.asynchronous
    def get(self):
        # get user sc-addr
        sc_session = logic.ScSession(self)
        user_addr = sc_session.get_sc_addr()

        if sc_session.email:
            is_authenticated = True
        else:
            is_authenticated = False

        roles = []

        if is_authenticated:
            user_kb_node = sc_session.get_user_kb_node_by_email()
            if user_kb_node.is_valid():
                roles = self.get_user_roles(user_kb_node)

        result = {
            'sc_addr': user_addr.value,
            'is_authenticated': is_authenticated,
            'current_lang': sc_session.get_used_language().value,
            'default_ext_lang': sc_session.get_default_ext_lang().value,
            'email': sc_session.email,
            'roles': roles
        }

        logger.debug(f'Result: {result}')
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(result))

    def get_user_roles(self, user_kb_node: ScAddr) -> List[str]:
        roles = [KeynodeSysIdentifiers.nrel_authorised_user.value]

        manager_template = ScTemplate()
        manager_template.quintuple(
            sc_type.VAR_NODE,
            sc_type.VAR_COMMON_ARC,
            user_kb_node,
            sc_type.VAR_PERM_POS_ARC,
            self._keynodes[KeynodeSysIdentifiers.nrel_manager.value]
        )
        is_manager_role_exist = bool(client.search_by_template(manager_template))

        admin_template = ScTemplate()
        admin_template.quintuple(
            sc_type.VAR_NODE,
            sc_type.VAR_COMMON_ARC,
            user_kb_node,
            sc_type.VAR_PERM_POS_ARC,
            self._keynodes[KeynodeSysIdentifiers.nrel_administrator.value]
        )
        is_admin_role_exist = bool(client.search_by_template(manager_template))

        expert_template = ScTemplate()
        expert_template.quintuple(
            sc_type.VAR_NODE,
            sc_type.VAR_COMMON_ARC,
            user_kb_node,
            sc_type.VAR_PERM_POS_ARC,
            self._keynodes[KeynodeSysIdentifiers.nrel_expert.value]
        )
        is_expert_role_exist = bool(client.search_by_template(expert_template))

        if is_admin_role_exist:
            roles.append(KeynodeSysIdentifiers.nrel_administrator.value)
        if is_manager_role_exist:
            roles.append(KeynodeSysIdentifiers.nrel_manager.value)
        if is_expert_role_exist:
            roles.append(KeynodeSysIdentifiers.nrel_expert.value)

        return roles
