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

from keynodes import KeynodeSysIdentifiers, Keynodes
from sctp.types import SctpIteratorType, ScElementType

from django.db.backends.dummy.base import DatabaseError

__all__ = (
    'parse_menu_command',
    'find_cmd_result',
    'find_answer',
    'find_translation',
    'check_command_finished',
    'append_to_system_elements',
)


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
    cmd_type = 'unknown'
    if sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                    keynode_ui_user_command_atom,
                                    ScElementType.sc_type_arc_pos_const_perm,
                                    cmd_addr) is not None:
        cmd_type = 'cmd_atom'
    elif sctp_client.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                      keynode_ui_user_command_noatom,
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
        keynode_nrel_decomposition
    )
    if decomp is not None:

        # iterate child commands
        childs = sctp_client.iterate_elements(
            SctpIteratorType.SCTP_ITERATOR_3F_A_A,
            decomp[0][0],
            ScElementType.sc_type_arc_pos_const_perm,
            ScElementType.sc_type_node | ScElementType.sc_type_const
        )
        if childs is not None:
            child_commands = []
            for item in childs:
                child_structure = parse_menu_command(item[2], sctp_client, keys)
                child_commands.append(child_structure)
            attrs["childs"] = child_commands

    return attrs


def find_cmd_result(command_addr, keynode_ui_nrel_command_result, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
        command_addr,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        ScElementType.sc_type_link,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_ui_nrel_command_result
    )


def find_answer(question_addr, keynode_nrel_answer, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
        question_addr,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        ScElementType.sc_type_node | ScElementType.sc_type_const,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_nrel_answer
    )


def find_translation(construction_addr, keynode_nrel_translation, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
        construction_addr,
        ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
        ScElementType.sc_type_link,
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_nrel_translation
    )
    
def find_translation_with_format(construction_addr, format_addr, keynode_nrel_format, keynode_nrel_translation, sctp_client):
    
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


def check_command_finished(command_addr, keynode_command_finished, sctp_client):
    return sctp_client.iterate_elements(
        SctpIteratorType.SCTP_ITERATOR_3F_A_F,
        keynode_command_finished,
        ScElementType.sc_type_arc_pos_const_perm,
        command_addr
    )


def append_to_system_elements(sctp_client, keynode_system_element, el):
    sctp_client.create_arc(
        ScElementType.sc_type_arc_pos_const_perm,
        keynode_system_element,
        el
    )
    
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
            langs.append(items[2].to_id())
                
    return langs

# -------------- work with session -------------------------
class ScSession:
    
    def __init__(self, user, session, sctp_client, keynodes):
        """Initialize session class with requets.user object
        """
        self.user = user
        self.session = session
        self.sctp_client = sctp_client
        self.keynodes = keynodes
        self.sc_addr = None
        
    def get_sc_addr(self):
        """Resolve sc-addr of session
        """
        if not self.sc_addr:
            if self.user.is_authenticated():
                self.sc_addr = self._user_get_sc_addr()
                if not self.sc_addr:
                    self.sc_addr = self._user_new()
            else:
                if not self.session.session_key:
                    self.session.save()
                self.sc_addr = self._session_get_sc_addr()
                if not self.sc_addr:
                    self.sc_addr = self._session_new_sc_addr()
                
            # check sc-addr
            #if not self.sctp_client.check_element(self.sc_addr):
                
            
            
        # todo check user addr
        return self.sc_addr
    
    def get_used_language(self):
        """Returns sc-addr of currently used natural language
        """
        results = self.sctp_client.iterate_elements(
                                               SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                               self.get_sc_addr(),
                                               ScElementType.sc_type_arc_common | ScElementType.sc_type_const,
                                               ScElementType.sc_type_node,
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
                                               ScElementType.sc_type_node,
                                               ScElementType.sc_type_arc_pos_const_perm,
                                               self.keynodes[KeynodeSysIdentifiers.ui_nrel_user_default_ext_language]
                                            )
        
        if results:
            return results[0][2]
        
        # setup scn mode by default
        _lang = self.keynodes[KeynodeSysIdentifiers.scn_code]
        self.set_default_ext_lang(_lang)
        
        return _lang
    
    def set_current_lang_mode(self, mode_addr):
        """Setup new language mode as current for this session
        """
        # try to find currently used mode and remove it
        results = self.sctp_client.iterate_elements(
                                               SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                               self.sc_addr,
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
                                               self.sc_addr,
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
        return self._create_user_with_system_idtf("session::" + str(self.session.session_key))
    
    def _session_get_sc_addr(self):
        return self._find_user_by_system_idtf("session::" + str(self.session.session_key))

    def _user_new(self):
        return self._create_user_with_system_idtf("user::" + str(self.user.username))

    def _user_get_sc_addr(self):
        return self._find_user_by_system_idtf("user::" + str(self.user.username))


