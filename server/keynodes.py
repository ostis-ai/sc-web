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

class Keynodes:
    
    def __init__(self, sctp_client):
        self.sctp_client = sctp_client
        self.keys = {}
        
    def __getitem__(self, name):
        
        value = None
        try:
            value = self.keys[name]
        except:
            value = self.sctp_client.find_element_by_system_identifier(str(name.encode('utf-8')))
            if value is None:
                raise Exception("Can't resolve keynode '%s'" % name)
            else:
                self.keys[name] = value
        return value

class KeynodeSysIdentifiers:
    
    nrel_system_identifier = 'nrel_system_identifier'
    nrel_main_idtf = 'nrel_main_idtf'
    nrel_idtf = 'nrel_idtf'
    nrel_translation = 'nrel_translation'
    nrel_decomposition = 'nrel_decomposition'
    nrel_authors = 'nrel_authors'
    nrel_format = 'nrel_format'
    nrel_mimetype = 'nrel_mimetype'
    nrel_email = 'nrel_email'
    
    rrel_key_sc_element = 'rrel_key_sc_element'
    sc_definition = 'sc_definition'
    sc_explanation = 'sc_explanation'
    sc_note = 'sc_note'
    
    nrel_sc_text_translation = 'nrel_sc_text_translation'
    nrel_ui_commands_decomposition = 'nrel_ui_commands_decomposition'
    nrel_ui_nrel_command_lang_template = 'ui_nrel_command_lang_template'
    
    question = 'question'
    question_nrel_answer = 'nrel_answer'
    question_initiated = 'question_initiated'
    question_search_all_output_arcs = 'question_search_all_output_arcs'
    
    command = 'command'
    command_initiated = 'command_initiated'
    
    ui_user = 'ui_user'
    ui_user_registered = 'ui_user_registered'
    ui_main_menu = 'ui_main_menu'
    ui_user_command_class_atom = 'ui_user_command_class_atom'
    ui_user_command_class_noatom = 'ui_user_command_class_noatom'
    ui_external_languages = 'ui_external_languages'
    ui_rrel_command_arguments = 'ui_rrel_command_arguments'
    ui_rrel_commnad = 'ui_rrel_command'
    ui_nrel_command_result = 'ui_nrel_command_result'
    ui_nrel_user_answer_formats = 'ui_nrel_user_answer_formats'
    
    ui_command_generate_instance = 'ui_command_generate_instance'
    ui_command_translate_from_sc = 'ui_command_translate_from_sc'
    
    ui_command_initiated = 'ui_command_initiated'
    ui_command_failed = 'ui_command_failed'
    ui_command_finished = 'ui_command_finished'
    ui_displayed_answer = 'ui_displayed_answer'
    
    ui_nrel_user_used_language = 'ui_nrel_user_used_language'
    ui_nrel_user_default_ext_language = 'ui_nrel_user_default_ext_language'
    
    ui_rrel_source_sc_construction = 'ui_rrel_source_sc_construction'
    ui_rrel_output_format = 'ui_rrel_output_format'
    
    
    # languages
    languages = 'languages'
    lang_ru = 'lang_ru'
    lang_en = 'lang_en'
    
    # external languages
    scg_code = 'scg_code'
    scs_code = 'scs_code'
    scn_code = 'scn_code'
    
    # formats
    format_scs = 'format_scs'
    format_scg_json = 'format_scg_json'
    format_scn_json = 'format_scn_json'
    format_txt = 'format_txt'
    
    system_element = 'system_element'
    