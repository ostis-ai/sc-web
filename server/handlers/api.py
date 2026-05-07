# -*- coding: utf-8 -*-

from typing import List
import logging
import os

import tornado.web
import json
import re

from sc_client import client
from sc_client.constants import sc_type
from sc_client.models import ScTemplate, ScAddr, ScConstruction, ScIdtfResolveParams
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

        logger.debug(f"Result: {cmds}")
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(cmds))


class CmdDo(base.BaseHandler):
    # @tornado.web.asynchronous
    def post(self):
        cmd_addr = ScAddr(int(self.get_argument("cmd", None)))
        # parse arguments
        first = True
        arg = None
        arguments = []
        idx = 0
        while first or arg is not None:
            arg = self.get_argument("%d_" % idx, None)
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
            logger.debug(f"Result: {result}")
            self.set_header("Content-Type", "application/json")
            self.finish(json.dumps(result))


class ActionResultTranslate(base.BaseHandler):
    # @tornado.web.asynchronous
    def post(self):
        action_addr = ScAddr(int(self.get_argument("action", None)))
        format_addr = ScAddr(int(self.get_argument("format", None)))

        lang_arg = self.get_argument("lang", None)
        if lang_arg:
            lang_addr = ScAddr(int(lang_arg))

        keynodes = ScKeynodes()
        keynode_system_element = keynodes[KeynodeSysIdentifiers.system_element.value]
        ui_rrel_source_sc_construction = keynodes[
            KeynodeSysIdentifiers.ui_rrel_source_sc_construction.value
        ]
        ui_rrel_user_lang = keynodes[KeynodeSysIdentifiers.ui_rrel_user_lang.value]
        ui_command_translate_from_sc = keynodes[
            KeynodeSysIdentifiers.ui_command_translate_from_sc.value
        ]
        ui_command_initiated = keynodes[
            KeynodeSysIdentifiers.ui_command_initiated.value
        ]

        # try to find result for the action
        wait_time = 0
        wait_dt = 0.1

        result = logic.find_result(action_addr)
        while not result:
            time.sleep(wait_dt)
            wait_time += wait_dt
            if wait_time > tornado.options.options.event_wait_timeout:
                return logic.serialize_error(self, 404, "Timeout waiting for result")

            result = logic.find_result(action_addr)

        if not result:
            return logic.serialize_error(self, 404, "Result not found")

        result_addr = result[0].get(2)

        # try to find translation to specified format
        result_link_addr = logic.find_translation_with_format(result_addr, format_addr)

        # if link addr not found, then run translation of result to specified format
        result = {}
        if not result_link_addr.is_valid():
            construction = ScConstruction()
            construction.generate_node(sc_type.CONST_NODE, "trans_cmd_addr")
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, "trans_cmd_addr"
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, "trans_cmd_addr", result_addr, "arc_addr"
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, "arc_addr"
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC,
                ui_rrel_source_sc_construction,
                "arc_addr",
                "arc_addr_2",
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, "arc_addr_2"
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, "trans_cmd_addr", format_addr, "arc_addr_3"
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, "arc_addr_3"
            )

            if lang_addr:
                construction.generate_connector(
                    sc_type.CONST_PERM_POS_ARC,
                    "trans_cmd_addr",
                    lang_addr,
                    "arc_addr_4",
                )
                construction.generate_connector(
                    sc_type.CONST_PERM_POS_ARC, keynode_system_element, "arc_addr_4"
                )

            ui_rrel_output_format = keynodes[
                KeynodeSysIdentifiers.ui_rrel_output_format.value
            ]
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC,
                ui_rrel_output_format,
                "arc_addr_3",
                "arc_addr_3_edge",
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, "arc_addr_3_edge"
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC,
                ui_rrel_user_lang,
                "arc_addr_4",
                "arc_addr_4_edge",
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, "arc_addr_4_edge"
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC,
                ui_command_translate_from_sc,
                "trans_cmd_addr",
                "arc_addr_5",
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, "arc_addr_5"
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC,
                ui_command_initiated,
                "trans_cmd_addr",
                "arc_addr_6",
            )
            construction.generate_connector(
                sc_type.CONST_PERM_POS_ARC, keynode_system_element, "arc_addr_6"
            )

            result = client.generate_elements(construction)

            # now we need to wait translation result
            wait_time = 0
            translation = logic.find_translation_with_format(result_addr, format_addr)
            while not translation.is_valid():
                time.sleep(wait_dt)
                wait_time += wait_dt
                if wait_time > tornado.options.options.event_wait_timeout:
                    return logic.serialize_error(
                        self, 404, "Timeout waiting for result translation"
                    )

                translation = logic.find_translation_with_format(
                    result_addr, format_addr
                )

            if translation is not None:
                result_link_addr = translation

        # if result exists, then we need to return it content
        if result_link_addr is not None:
            result = json.dumps({"link": result_link_addr.value})

        logger.debug(f"Result: {result}")
        self.set_header("Content-Type", "application/json")
        self.finish(result)


@decorators.class_logging
class Languages(base.BaseHandler):
    # @tornado.web.asynchronous
    def get(self):
        langs = logic.get_languages_list()

        logger.debug(f"Result: {langs}")
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(langs))


@decorators.class_logging
class LanguageSet(base.BaseHandler):
    # @tornado.web.asynchronous
    def post(self):
        lang_addr = ScAddr(int(self.get_argument("lang_addr", None)))

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
            arg_str = "%d_" % idx
            arg = self.get_argument(arg_str, None)
            if arg is not None:
                arguments.append(arg)
            first = False
            idx += 1

            sc_session = logic.ScSession(self)

            result = {}
            for addr in arguments:
                tooltip = logic.find_tooltip(
                    ScAddr(int(addr)), sc_session.get_used_language()
                )
                result[addr] = tooltip

            logger.debug(f"Result: {result}")
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
            "sc_addr": user_addr.value,
            "is_authenticated": is_authenticated,
            "current_lang": sc_session.get_used_language().value,
            "default_ext_lang": sc_session.get_default_ext_lang().value,
            "email": sc_session.email,
            "roles": roles,
        }

        logger.debug(f"Result: {result}")
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
            self._keynodes[KeynodeSysIdentifiers.nrel_manager.value],
        )
        is_manager_role_exist = bool(client.search_by_template(manager_template))

        admin_template = ScTemplate()
        admin_template.quintuple(
            sc_type.VAR_NODE,
            sc_type.VAR_COMMON_ARC,
            user_kb_node,
            sc_type.VAR_PERM_POS_ARC,
            self._keynodes[KeynodeSysIdentifiers.nrel_administrator.value],
        )
        is_admin_role_exist = bool(client.search_by_template(manager_template))

        expert_template = ScTemplate()
        expert_template.quintuple(
            sc_type.VAR_NODE,
            sc_type.VAR_COMMON_ARC,
            user_kb_node,
            sc_type.VAR_PERM_POS_ARC,
            self._keynodes[KeynodeSysIdentifiers.nrel_expert.value],
        )
        is_expert_role_exist = bool(client.search_by_template(expert_template))

        if is_admin_role_exist:
            roles.append(KeynodeSysIdentifiers.nrel_administrator.value)
        if is_manager_role_exist:
            roles.append(KeynodeSysIdentifiers.nrel_manager.value)
        if is_expert_role_exist:
            roles.append(KeynodeSysIdentifiers.nrel_expert.value)

        return roles


class KbSearch(base.BaseHandler):
    def post(self):
        data = self.request.body
        if data:
            try:
                json_data = json.loads(data)
                query = json_data.get("query", "")
                lang = json_data.get("lang", "ru")
            except:
                query = self.get_argument("query", "")
                lang = self.get_argument("lang", "ru")
        else:
            query = self.get_argument("query", "")
            lang = self.get_argument("lang", "ru")

        if not query:
            self.set_header("Content-Type", "application/json")
            self.finish(
                json.dumps({"success": False, "found": False, "error": "Empty query"})
            )
            return

        keynodes = ScKeynodes()
        nrel_answer = keynodes["nrel_answer"]

        def fix_common_query_typos(text: str) -> str:
            if not text:
                return text
            lower = text.lower()
            replacements = (
                ("окретсность", "окрестность"),
                ("окрестностию", "окрестность"),
                ("сематническ", "семантическ"),
                ("идетификатор", "идентификатор"),
                ("системный идетификатор", "системный идентификатор"),
                ("библиотек компонентов", "библиотека компонентов"),
                ("библиотек компонент", "библиотека компонентов"),
            )
            out = text
            for wrong, right in replacements:
                if wrong in lower:
                    out = re.sub(re.escape(wrong), right, out, flags=re.IGNORECASE)
                    lower = out.lower()
            # Normalize SC element spellings to one canonical form.
            out = re.sub(r"\bsc\s+элемент\b", "sc-элемент", out, flags=re.IGNORECASE)
            return out

        query_trimmed = fix_common_query_typos(query.strip())
        normalized_query_for_rewrite = query_trimmed.lower().rstrip("?.!").strip()
        query_rewrites = {
            "что такое семантика": "что такое semantic code",
            "семантика": "semantic code",
            "что такое объединение": "что такое множество",
            "объединение": "множество",
            "что такое sc элемент": "что такое sc-элемент",
            "sc элемент": "sc-элемент",
        }
        query_trimmed = query_rewrites.get(normalized_query_for_rewrite, query_trimmed)
        query_lower = query_trimmed.lower().strip()
        used_lang = (
            keynodes[KeynodeSysIdentifiers.lang_en.value]
            if str(lang).lower().startswith("en")
            else keynodes[KeynodeSysIdentifiers.lang_ru.value]
        )

        candidates = []
        for candidate in [query_trimmed, query_lower, query_trimmed.rstrip("?.!"), query_lower.rstrip("?.!")]:
            if candidate and candidate not in candidates:
                candidates.append(candidate)

        # Add normalized form for "what is ..." questions.
        normalized_query = query_lower.rstrip("?.!")
        for prefix in ["что такое ", "what is "]:
            if normalized_query.startswith(prefix):
                short_form = normalized_query[len(prefix):].strip()
                if short_form and short_form not in candidates:
                    candidates.append(short_form)

        # Backend aliases for common AskAI terms to avoid UI-related false matches.
        aliases = {
            "ostis": ["метасистема ostis", "ostis metasystem"],
            "ims": ["интеллектуальная метасистема", "intelligent management system"],
            "остис": ["метасистема ostis"],
            "семантика": ["sc-код", "семантическая окрестность"],
            "что такое семантика": [
                "что такое sc-код",
                "что такое семантическая окрестность",
                "семантическая окрестность",
            ],
            "множество": ["set"],
            "что такое множество": ["set", "что такое set"],
            "объединение": ["union"],
            "что такое объединение": ["union", "что такое union"],
            "пересечение": ["intersection"],
            "что такое пересечение": ["intersection", "что такое intersection"],
            "semantic code": ["sc-код", "что такое sc-код"],
            "what is semantic code": ["what is sc-code", "sc-code"],
            "sc memory": ["sc-память", "что такое sc-память"],
            "what is sc memory": ["what is sc-memory", "sc-memory"],
            "sc элемент": ["sc-элемент", "sc_element", "что такое sc-элемент"],
            "что такое sc элемент": ["что такое sc-элемент", "sc-элемент", "sc_element"],
            "sc-элемент": ["sc_element", "sc element"],
            "что такое sc-элемент": ["sc-элемент", "sc_element", "sc element"],
        }
        for candidate in list(candidates):
            key = candidate.lower().strip()
            for alias in aliases.get(key, []):
                if alias not in candidates:
                    candidates.append(alias)
        normalized_candidates = {candidate.lower().strip() for candidate in candidates}

        _focus_raw = query_lower.rstrip("?.!")
        focus_phrase = _focus_raw
        for _pfx in ("что такое ", "what is "):
            if focus_phrase.startswith(_pfx):
                focus_phrase = focus_phrase[len(_pfx):].strip()
                break
        _focus_sw = {
            "что",
            "такое",
            "what",
            "is",
            "the",
            "это",
            "по",
            "на",
            "в",
            "и",
            "или",
            "как",
            "для",
        }
        focus_tokens = [
            t
            for t in re.split(r"[\s,;:]+", focus_phrase)
            if len(t) > 3 and t.lower() not in _focus_sw
        ]

        _answer_relation_addrs_cache = None

        def get_answer_relation_addrs():
            nonlocal _answer_relation_addrs_cache
            if _answer_relation_addrs_cache is not None:
                return _answer_relation_addrs_cache
            relation_names = [
                "nrel_answer",
                "nrel_definition",
                "nrel_explanation",
                "nrel_note",
                "nrel_sc_text_translation",
            ]
            rels = []
            for relation_name in relation_names:
                try:
                    relation_addr = keynodes.resolve(relation_name)
                    if relation_addr and relation_addr.is_valid() and relation_addr.value != 0:
                        rels.append(relation_addr)
                except Exception:
                    continue
            if nrel_answer and nrel_answer.is_valid() and nrel_answer.value != 0:
                rels = [nrel_answer] + [r for r in rels if r.value != nrel_answer.value]
            _answer_relation_addrs_cache = rels
            return rels

        def fetch_answer_for_entity(entity_addr):
            if not entity_addr or not entity_addr.is_valid() or entity_addr.value == 0:
                return None
            ANSWER_LINK = "_ans_link"
            for relation_keynode in get_answer_relation_addrs():
                answer_template = ScTemplate()
                answer_template.quintuple(
                    entity_addr,
                    sc_type.VAR_COMMON_ARC,
                    (sc_type.NODE_LINK, ANSWER_LINK),
                    sc_type.VAR_PERM_POS_ARC,
                    relation_keynode,
                )
                answer_result = client.search_by_template(answer_template)
                if not answer_result:
                    continue
                answer_link = answer_result[0].get(ANSWER_LINK)
                if not answer_link or not answer_link.is_valid() or answer_link.value == 0:
                    continue
                try:
                    content = client.get_link_content(answer_link)
                    if content and len(content) > 0:
                        answer_text = content[0].data
                        if answer_text:
                            return answer_text
                except Exception as e:
                    logger.warning(f"Failed to get link content: {e}")
            try:
                tooltip = logic.find_tooltip(entity_addr, used_lang)
                if not (tooltip and len(str(tooltip).strip()) > 8):
                    lang_en = keynodes[KeynodeSysIdentifiers.lang_en.value]
                    tooltip = logic.find_tooltip(entity_addr, lang_en)
                if tooltip and len(str(tooltip).strip()) > 8:
                    return str(tooltip).strip()
            except Exception as e:
                logger.warning(f"find_tooltip failed: {e}")
            return None

        def resolve_entity_by_sys_idtf(sys_name: str):
            try:
                addr = keynodes.resolve(sys_name)
                if addr and addr.is_valid() and addr.value != 0:
                    return addr
            except Exception:
                pass
            try:
                resolved = client.resolve_keynodes(ScIdtfResolveParams(idtf=sys_name))
                if resolved and len(resolved) > 0:
                    addr = resolved[0]
                    if addr and addr.is_valid() and addr.value != 0:
                        return addr
            except Exception:
                pass
            return None

        anchor_entity_by_focus = {
            "системный идентификатор": ("system_sc_identifier",),
            "семантическая окрестность": ("semantic_neighborhood",),
            "семантика": ("section_sc_code",),
            "sc-память": ("sc_memory",),
            "sc-элемент": ("sc_element",),
            "sc элемент": ("sc_element",),
            "sc_element": ("sc_element",),
            "sc element": ("sc_element",),
            "sc memory": ("sc_memory",),
            "sc-memory": ("sc_memory",),
            "sc-код": ("section_sc_code",),
            "sc code": ("section_sc_code",),
            "sc-code": ("section_sc_code",),
            "semantic code": ("section_sc_code",),
            "множество": ("set",),
            "объединение": ("union",),
            "пересечение": ("intersection",),
            "база знаний": ("section_structure_of_knowledge_base_model",),
            "myself": ("ui_user", "myself"),
            "библиотека компонентов": (
                "library_of_reusable_components_interfaces",
                "section_concept_of_reusable_component_interface",
            ),
            "решатель задач метасистемы ostis": ("problem_solver_Metasystem",),
        }

        def find_entities_by_exact_main_idtf(norm: str):
            norm = (norm or "").lower().rstrip("*").rstrip("?.!").strip()
            if len(norm) < 3:
                return []
            FIND_EL = "_find_el"
            FIND_LINK = "_find_link"
            tmpl = ScTemplate()
            tmpl.quintuple(
                (sc_type.UNKNOWN, FIND_EL),
                sc_type.VAR_COMMON_ARC,
                (sc_type.NODE_LINK, FIND_LINK),
                sc_type.VAR_PERM_POS_ARC,
                keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value],
            )
            tmpl.triple(
                used_lang,
                sc_type.VAR_PERM_POS_ARC,
                FIND_LINK,
            )
            res = client.search_by_template(tmpl)
            matches = []
            for it in res or []:
                la = it.get(FIND_LINK)
                if not la or not la.is_valid():
                    continue
                cc = client.get_link_content(la)
                if not cc:
                    continue
                raw = str(cc[0].data).strip()
                cmpv = raw.lower().rstrip("*").rstrip("?.!").strip()
                if cmpv == norm or cmpv.startswith(norm + " "):
                    el = it.get(FIND_EL)
                    if el and el.is_valid() and el.value != 0:
                        starred = raw.rstrip().endswith("*")
                        matches.append((starred, el, raw))

            if not matches:
                return []
            # Prefer plain main idtf (e.g. system_sc_identifier) over starred relation titles.
            if "*" not in norm:
                plain = [m for m in matches if not m[0]]
                starred = [m for m in matches if m[0]]
                matches = plain + starred
            return [m[1] for m in matches]

        def find_entity_by_exact_main_idtf(norm: str):
            entities = find_entities_by_exact_main_idtf(norm)
            return entities[0] if entities else None

        def find_entity_for_focus_phrase(phrase: str):
            norm = (phrase or "").strip().lower().rstrip("*").strip()
            if len(norm) < 4:
                return None
            el = find_entity_by_exact_main_idtf(norm)
            if el:
                return el
            for sys_idtf in anchor_entity_by_focus.get(norm, ()):
                el = resolve_entity_by_sys_idtf(sys_idtf)
                if el:
                    return el
            # Avoid expensive keynode resolution for natural-language phrases.
            if re.match(r"^[a-z0-9_-]+$", norm):
                el = resolve_entity_by_sys_idtf(norm)
                if el:
                    return el
            return None

        def normalize_idtf_like_question(text: str) -> str:
            value = (text or "").lower().strip()
            value = value.rstrip("?.!")
            for prefix in ("что такое ", "what is "):
                if value.startswith(prefix):
                    value = value[len(prefix):].strip()
            value = re.sub(r"\s+", " ", value)
            return value

        def get_main_idtf_label(entity_addr, language_addr):
            if not entity_addr or not entity_addr.is_valid() or entity_addr.value == 0:
                return None
            IDTF_LINK = "_idtf_link"
            idtf_template = ScTemplate()
            idtf_template.quintuple(
                entity_addr,
                sc_type.VAR_COMMON_ARC,
                (sc_type.NODE_LINK, IDTF_LINK),
                sc_type.VAR_PERM_POS_ARC,
                keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value],
            )
            idtf_template.triple(
                language_addr,
                sc_type.VAR_PERM_POS_ARC,
                IDTF_LINK,
            )
            idtf_result = client.search_by_template(idtf_template)
            if not idtf_result:
                return None
            for item in idtf_result:
                link_addr = item.get(IDTF_LINK)
                if not link_addr or not link_addr.is_valid() or link_addr.value == 0:
                    continue
                content = client.get_link_content(link_addr)
                if not content:
                    continue
                label = str(content[0].data).strip()
                if label:
                    return label
            return None

        question_addr = None
        question_candidates = []
        query_norm_for_fallback = normalize_idtf_like_question(query_trimmed)
        focus_norm_for_fallback = normalize_idtf_like_question(focus_phrase)

        # Deterministic shortcuts for fragile aliases that otherwise fall into UI-noise neighbors.
        direct_entity_by_query = {
            "что такое sc элемент": ("askai_q_sc_element", "sc_element"),
            "что такое sc-элемент": ("askai_q_sc_element", "sc_element"),
            "sc элемент": ("askai_q_sc_element", "sc_element"),
            "sc-элемент": ("askai_q_sc_element", "sc_element"),
        }
        direct_sys_idtfs = direct_entity_by_query.get(query_norm_for_fallback)
        if direct_sys_idtfs:
            for direct_sys_idtf in direct_sys_idtfs:
                direct_entity = resolve_entity_by_sys_idtf(direct_sys_idtf)
                direct_answer = fetch_answer_for_entity(direct_entity) if direct_entity else None
                if direct_answer and str(direct_answer).strip():
                    self.set_header("Content-Type", "application/json")
                    self.finish(
                        json.dumps(
                            {
                                "success": True,
                                "found": True,
                                "answer": str(direct_answer).strip(),
                                "low_quality": False,
                            }
                        )
                    )
                    return
            # Try exact "что такое ..." question node in KB when system idtf is missing.
            direct_question_entity = find_entity_by_exact_main_idtf(
                f"что такое {query_norm_for_fallback}"
            )
            direct_question_answer = (
                fetch_answer_for_entity(direct_question_entity)
                if direct_question_entity
                else None
            )
            if direct_question_answer and str(direct_question_answer).strip():
                self.set_header("Content-Type", "application/json")
                self.finish(
                    json.dumps(
                        {
                            "success": True,
                            "found": True,
                            "answer": str(direct_question_answer).strip(),
                            "low_quality": False,
                        }
                    )
                )
                return

        # 1) Try to resolve by system identifier.
        try:
            resolved = keynodes.resolve(query_lower)
            if resolved and resolved.is_valid() and resolved.value != 0:
                question_addr = resolved
                question_candidates.append(resolved)
        except:
            question_addr = None

        if (
            not question_addr
            or not question_addr.is_valid()
            or question_addr.value == 0
        ):
            # 2) Find by translated main idtf structure:
            # element <-common_arc- link <-lang and <-nrel_main_idtf(common_arc)
            ELEMENT = "_element"
            IDTF_LINK = "_idtf_link"
            idtf_template = ScTemplate()
            idtf_template.quintuple(
                (sc_type.UNKNOWN, ELEMENT),
                sc_type.VAR_COMMON_ARC,
                (sc_type.NODE_LINK, IDTF_LINK),
                sc_type.VAR_PERM_POS_ARC,
                keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value],
            )
            idtf_template.triple(
                used_lang,
                sc_type.VAR_PERM_POS_ARC,
                IDTF_LINK,
            )
            idtf_result = client.search_by_template(idtf_template)

            if idtf_result:
                best_match = None
                best_score = -1
                scored_matches = []
                stop_words = {"что", "такое", "what", "is", "the"}
                for item in idtf_result:
                    link_addr = item.get(IDTF_LINK)
                    if not link_addr or not link_addr.is_valid():
                        continue
                    content = client.get_link_content(link_addr)
                    if not content:
                        continue
                    link_text = str(content[0].data).lower().strip()

                    # Exact match has the highest priority.
                    if link_text in normalized_candidates:
                        best_match = item.get(ELEMENT)
                        best_score = 10_000
                        break

                    # Fuzzy scoring for wording differences, but only with meaningful tokens.
                    score = 0
                    for candidate in normalized_candidates:
                        if candidate in link_text:
                            score = max(score, len(candidate) + 200)
                        if link_text in candidate:
                            score = max(score, len(link_text) + 120)

                        candidate_tokens = set(
                            token
                            for token in candidate.split()
                            if len(token) > 3 and token not in stop_words
                        )
                        link_tokens = set(
                            token
                            for token in link_text.split()
                            if len(token) > 3 and token not in stop_words
                        )
                        if candidate_tokens and link_tokens:
                            overlap = candidate_tokens.intersection(link_tokens)
                            if overlap:
                                score = max(score, len(overlap) * 200)

                            # Morphology-friendly prefix overlap (e.g., семантика vs семантики).
                            for c_token in candidate_tokens:
                                c_prefix = c_token[:5]
                                if len(c_prefix) < 4:
                                    continue
                                if any(
                                    l_token.startswith(c_prefix) or c_token.startswith(l_token[:5])
                                    for l_token in link_tokens
                                    if len(l_token) >= 4
                                ):
                                    score = max(score, 130)

                    # Avoid matching UI phrases where only a shared prefix overlaps the question
                    # (e.g. "семантика" vs "семантических окрестностей").
                    if focus_tokens and score < 10_000:
                        require_word_boundary = len(focus_tokens) <= 4 and all(
                            len(ft) >= 6 for ft in focus_tokens
                        )
                        if require_word_boundary:
                            boundary_ok = True
                            for ft in focus_tokens:
                                if len(ft) < 6:
                                    continue
                                if not re.search(
                                    r"\b" + re.escape(ft) + r"\b", link_text, re.IGNORECASE
                                ):
                                    boundary_ok = False
                                    break
                            if not boundary_ok:
                                score = min(score, 99)

                    if score > best_score:
                        best_score = score
                        best_match = item.get(ELEMENT)
                    if score >= 130:
                        scored_matches.append((score, item.get(ELEMENT)))

                # Keep fuzzy match only when score is meaningful (at least one overlap rule matched).
                if best_score >= 130 and best_match and best_match.is_valid() and best_match.value != 0:
                    question_addr = best_match
                    question_candidates.append(best_match)

                # Save other high-scored candidates for semantic answer extraction fallback.
                if scored_matches:
                    scored_matches.sort(key=lambda x: x[0], reverse=True)
                    for _, match_addr in scored_matches:
                        if (
                            match_addr
                            and match_addr.is_valid()
                            and match_addr.value != 0
                            and all(existing.value != match_addr.value for existing in question_candidates)
                        ):
                            question_candidates.append(match_addr)

        if (
            question_addr
            and question_addr.is_valid()
            and question_addr.value != 0
            and all(existing.value != question_addr.value for existing in question_candidates)
        ):
            question_candidates.insert(0, question_addr)

        if question_candidates:
            stop_words = {
                "что",
                "такое",
                "это",
                "для",
                "как",
                "или",
                "и",
                "в",
                "на",
                "по",
                "the",
                "what",
                "is",
            }
            query_tokens = {
                token
                for token in query_lower.replace("?", " ").replace(".", " ").split()
                if len(token) > 3 and token not in stop_words
            }

            relation_names = [
                "nrel_answer",
                "nrel_definition",
                "nrel_explanation",
                "nrel_note",
                "nrel_sc_text_translation",
            ]

            # Resolve available relation keynodes in current KB.
            relation_keynodes = []
            for relation_name in relation_names:
                try:
                    relation_addr = keynodes.resolve(relation_name)
                    if relation_addr and relation_addr.is_valid() and relation_addr.value != 0:
                        relation_keynodes.append(relation_addr)
                except Exception:
                    continue

            # Keep the legacy relation as guaranteed first priority.
            if nrel_answer and nrel_answer.is_valid() and nrel_answer.value != 0:
                relation_keynodes = [nrel_answer] + [
                    rel for rel in relation_keynodes if rel.value != nrel_answer.value
                ]

            def get_relation_text(entity_addr, allow_tooltip: bool = True):
                ANSWER_LINK = "_answer_link"
                for relation_keynode in relation_keynodes:
                    answer_template = ScTemplate()
                    answer_template.quintuple(
                        entity_addr,
                        sc_type.VAR_COMMON_ARC,
                        (sc_type.NODE_LINK, ANSWER_LINK),
                        sc_type.VAR_PERM_POS_ARC,
                        relation_keynode,
                    )
                    answer_result = client.search_by_template(answer_template)
                    if not answer_result:
                        continue

                    answer_link = answer_result[0].get(ANSWER_LINK)
                    if not answer_link or not answer_link.is_valid() or answer_link.value == 0:
                        continue

                    try:
                        content = client.get_link_content(answer_link)
                        if content and len(content) > 0:
                            answer_text = content[0].data
                            if answer_text:
                                return answer_text
                    except Exception as e:
                        logger.warning(f"Failed to get link content: {e}")
                if allow_tooltip:
                    try:
                        tooltip = logic.find_tooltip(entity_addr, used_lang)
                        if not (tooltip and len(str(tooltip).strip()) > 8):
                            lang_en = keynodes[KeynodeSysIdentifiers.lang_en.value]
                            tooltip = logic.find_tooltip(entity_addr, lang_en)
                        if tooltip and len(str(tooltip).strip()) > 8:
                            return str(tooltip).strip()
                    except Exception as e:
                        logger.warning(f"find_tooltip failed: {e}")
                return None

            def get_neighbor_nodes(entity_addr):
                neighbors = []
                NEIGHBOR = "_neighbor"
                outgoing_template = ScTemplate()
                outgoing_template.triple(
                    entity_addr,
                    sc_type.VAR_PERM_POS_ARC,
                    (sc_type.NODE, NEIGHBOR),
                )
                incoming_template = ScTemplate()
                incoming_template.triple(
                    (sc_type.NODE, NEIGHBOR),
                    sc_type.VAR_PERM_POS_ARC,
                    entity_addr,
                )

                for template in [outgoing_template, incoming_template]:
                    result = client.search_by_template(template)
                    if not result:
                        continue
                    for item in result:
                        neighbor = item.get(NEIGHBOR)
                        if (
                            neighbor
                            and neighbor.is_valid()
                            and neighbor.value != 0
                            and all(existing.value != neighbor.value for existing in neighbors)
                        ):
                            neighbors.append(neighbor)
                return neighbors

            def cleanup_text(text):
                cleaned = str(text).replace("</br>", " ").replace("<br>", " ").replace("</p>", " ").replace("<p>", " ")
                return " ".join(cleaned.split()).strip()

            def is_definition_like(text):
                if not text:
                    return False
                normalized = cleanup_text(text)
                lower = normalized.lower()
                if len(normalized) < 80:
                    return False
                if lower.startswith(("проверить ", "команда ", "класс пользовательских команд")):
                    return False
                return True

            def get_relevant_link_snippet(entity_addr):
                LINK = "_raw_link"
                ARC = "_arc"
                RELATION = "_relation"
                template = ScTemplate()
                template.quintuple(
                    entity_addr,
                    (sc_type.VAR_COMMON_ARC, ARC),
                    (sc_type.NODE_LINK, LINK),
                    sc_type.VAR_PERM_POS_ARC,
                    (sc_type.NODE, RELATION),
                )
                template.triple(
                    used_lang,
                    sc_type.VAR_PERM_POS_ARC,
                    LINK,
                )
                links_result = client.search_by_template(template)
                if not links_result:
                    return None

                best_text = None
                best_score = 0
                query_prefixes = {
                    token[:5] for token in query_tokens if len(token) >= 4
                }
                for item in links_result[:80]:
                    link_addr = item.get(LINK)
                    if not link_addr or not link_addr.is_valid() or link_addr.value == 0:
                        continue
                    try:
                        content = client.get_link_content(link_addr)
                    except Exception as e:
                        logger.warning(f"Failed to get raw link content: {e}")
                        continue
                    if not content or len(content) == 0:
                        continue

                    raw_text = cleanup_text(content[0].data)
                    if len(raw_text) < 100:
                        continue
                    text_tokens = {
                        token.strip(",:;.!?()[]{}\"'").lower()
                        for token in raw_text.split()
                        if len(token) > 3
                    }
                    overlap = query_tokens.intersection(text_tokens)
                    text_prefixes = {
                        token[:5] for token in text_tokens if len(token) >= 4
                    }
                    prefix_overlap = query_prefixes.intersection(text_prefixes)
                    if not overlap and not prefix_overlap:
                        continue

                    score = (
                        len(overlap) * 12
                        + len(prefix_overlap) * 8
                        + min(len(raw_text), 300) // 60
                    )
                    if score > best_score:
                        best_score = score
                        # Return a concise snippet.
                        best_text = raw_text[:420].rstrip()

                if best_text and best_score >= 14:
                    return best_text + ("..." if len(best_text) >= 420 else "")
                return None

            is_definition_query = query_lower.startswith("что такое ") or query_lower.startswith("what is ")

            if is_definition_query:
                strict_core = normalize_idtf_like_question(query_trimmed)
                strict_forms = [
                    strict_core,
                    strict_core.replace("-", " "),
                    strict_core.replace(" ", "-"),
                    f"что такое {strict_core}",
                    f"что такое {strict_core.replace('-', ' ')}",
                    f"что такое {strict_core.replace(' ', '-')}",
                ]
                seen_forms = set()
                for form in strict_forms:
                    form_norm = (form or "").lower().rstrip("?.!").strip()
                    if not form_norm or form_norm in seen_forms:
                        continue
                    seen_forms.add(form_norm)
                    for entity in find_entities_by_exact_main_idtf(form_norm):
                        strict_answer = get_relation_text(entity, allow_tooltip=False)
                        if strict_answer:
                            self.set_header("Content-Type", "application/json")
                            self.finish(
                                json.dumps(
                                    {
                                        "success": True,
                                        "found": True,
                                        "answer": cleanup_text(strict_answer),
                                        "low_quality": False,
                                    }
                                )
                            )
                            return

            top_candidates = question_candidates[:10]

            # Pass 1: only high-quality direct answers.
            for question_candidate in top_candidates:
                answer_text = get_relation_text(question_candidate)
                if answer_text:
                    answer_text = cleanup_text(answer_text)
                    self.set_header("Content-Type", "application/json")
                    self.finish(
                        json.dumps(
                            {
                                "success": True,
                                "found": True,
                                "answer": answer_text,
                                "low_quality": False,
                            }
                        )
                    )
                    return

            if is_definition_query:
                self.set_header("Content-Type", "application/json")
                self.finish(
                    json.dumps(
                        {
                            "success": True,
                            "found": False,
                            "error": "Definition not found by strict KB relations",
                        }
                    )
                )
                return

            # Pass 2: relation text from close semantic neighbors.
            for question_candidate in top_candidates:
                for neighbor in get_neighbor_nodes(question_candidate)[:25]:
                    neighbor_text = get_relation_text(neighbor)
                    if neighbor_text and is_definition_like(neighbor_text):
                        neighbor_text = cleanup_text(neighbor_text)
                        self.set_header("Content-Type", "application/json")
                        self.finish(
                            json.dumps(
                                {
                                    "success": True,
                                    "found": True,
                                    "answer": neighbor_text,
                                    "low_quality": True,
                                }
                            )
                        )
                        return

            # Pass 3: best-matching snippets from candidate links.
            for question_candidate in top_candidates:
                snippet_text = get_relevant_link_snippet(question_candidate)
                if snippet_text:
                    self.set_header("Content-Type", "application/json")
                    self.finish(
                        json.dumps(
                            {
                                "success": True,
                                "found": True,
                                "answer": snippet_text,
                                "low_quality": True,
                            }
                        )
                    )
                    return

            # Pass 4: best-matching snippets from neighbor links.
            for question_candidate in top_candidates:
                for neighbor in get_neighbor_nodes(question_candidate)[:25]:
                    snippet_text = get_relevant_link_snippet(neighbor)
                    if snippet_text:
                        self.set_header("Content-Type", "application/json")
                        self.finish(
                            json.dumps(
                                {
                                    "success": True,
                                    "found": True,
                                    "answer": snippet_text,
                                    "low_quality": True,
                                }
                            )
                        )
                        return

            # Fallback: provide closest concepts from KB when definition links are absent.
            related_concepts = []
            related_concepts_normalized = set()
            NODE_IDTF_LINK = "_node_idtf_link"
            for question_candidate in question_candidates[:8]:
                node_idtf_template = ScTemplate()
                node_idtf_template.quintuple(
                    question_candidate,
                    sc_type.VAR_COMMON_ARC,
                    (sc_type.NODE_LINK, NODE_IDTF_LINK),
                    sc_type.VAR_PERM_POS_ARC,
                    keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value],
                )
                node_idtf_template.triple(
                    used_lang,
                    sc_type.VAR_PERM_POS_ARC,
                    NODE_IDTF_LINK,
                )
                node_idtf_result = client.search_by_template(node_idtf_template)
                if not node_idtf_result:
                    continue
                for item in node_idtf_result:
                    idtf_link = item.get(NODE_IDTF_LINK)
                    if not idtf_link or not idtf_link.is_valid() or idtf_link.value == 0:
                        continue
                    idtf_content = client.get_link_content(idtf_link)
                    if not idtf_content:
                        continue
                    idtf_text = str(idtf_content[0].data).strip()
                    if not idtf_text:
                        continue

                    # Normalize fallback list: remove HTML tails/noisy duplicates and technical labels.
                    idtf_clean = idtf_text.replace("</br>", " ").replace("<br>", " ").strip()
                    if "." in idtf_clean:
                        idtf_clean = idtf_clean.split(".", 1)[0].strip()
                    if not idtf_clean:
                        continue
                    if len(idtf_clean) < 5:
                        continue

                    lower_clean = idtf_clean.lower()
                    if lower_clean in {"компонент библиотеки"}:
                        continue

                    norm_key = " ".join(lower_clean.split())
                    normalized_clean = normalize_idtf_like_question(idtf_clean)
                    if normalized_clean in {
                        query_norm_for_fallback,
                        focus_norm_for_fallback,
                    }:
                        continue
                    if norm_key in related_concepts_normalized:
                        continue
                    related_concepts_normalized.add(norm_key)
                    related_concepts.append(idtf_clean)
                    if len(related_concepts) >= 5:
                        break
                if len(related_concepts) >= 5:
                    break

            if related_concepts:
                # Prefer answering the actual focus phrase (e.g. "системный идентификатор")
                # even when fuzzy match initially landed on a different node.
                el_focus_retry = find_entity_for_focus_phrase(focus_phrase)
                if el_focus_retry and el_focus_retry.is_valid() and el_focus_retry.value != 0:
                    ans_focus_retry = fetch_answer_for_entity(el_focus_retry)
                    if ans_focus_retry:
                        ans_focus_retry = " ".join(
                            str(ans_focus_retry)
                            .replace("</br>", " ")
                            .replace("<br>", " ")
                            .replace("</p>", " ")
                            .replace("<p>", " ")
                            .split()
                        ).strip()
                        self.set_header("Content-Type", "application/json")
                        self.finish(
                            json.dumps(
                                {
                                    "success": True,
                                    "found": True,
                                    "answer": ans_focus_retry,
                                    "low_quality": False,
                                }
                            )
                        )
                        return
                    focus_label_retry = get_main_idtf_label(el_focus_retry, used_lang)
                    if focus_label_retry and len(str(focus_label_retry).strip()) >= 3:
                        self.set_header("Content-Type", "application/json")
                        self.finish(
                            json.dumps(
                                {
                                    "success": True,
                                    "found": True,
                                    "answer": f"Понятие найдено в базе знаний: {str(focus_label_retry).strip()}.",
                                    "low_quality": True,
                                }
                            )
                        )
                        return

                def related_concept_rank(name: str) -> int:
                    n = name.lower().rstrip("*").strip()
                    f = focus_phrase.lower().strip()
                    if not n or not f:
                        return 0
                    score_r = 0
                    if n == f:
                        score_r += 5000
                    elif n.rstrip("*").strip() == f:
                        score_r += 4900
                    elif n.startswith(f) or f.startswith(n.rstrip("*").strip()):
                        score_r += 2500
                    else:
                        for w in f.split():
                            lw = w.strip()
                            if len(lw) > 3 and lw in n:
                                score_r += len(lw) * 12
                    if name.rstrip().endswith("*"):
                        score_r -= 40
                    return score_r

                ranked_labels = sorted(
                    related_concepts, key=related_concept_rank, reverse=True
                )
                tried_addr = {qc.value for qc in top_candidates}
                for name in ranked_labels[:8]:
                    el_alt = find_entity_by_exact_main_idtf(
                        name.lower().rstrip("*").strip()
                    )
                    if (
                        not el_alt
                        or not el_alt.is_valid()
                        or el_alt.value == 0
                        or el_alt.value in tried_addr
                    ):
                        continue
                    tried_addr.add(el_alt.value)
                    alt_answer = fetch_answer_for_entity(el_alt)
                    if alt_answer:
                        alt_answer = cleanup_text(alt_answer)
                        self.set_header("Content-Type", "application/json")
                        self.finish(
                            json.dumps(
                                {
                                    "success": True,
                                    "found": True,
                                    "answer": alt_answer,
                                    "low_quality": False,
                                }
                            )
                        )
                        return

                self.set_header("Content-Type", "application/json")
                self.finish(
                    json.dumps(
                        {
                            "success": True,
                            "found": True,
                            "answer": "Явное определение по этому запросу не найдено. Ближайшие понятия в базе: "
                            + ", ".join(related_concepts)
                            + ".",
                            "low_quality": True,
                        }
                    )
                )
                return

            self.set_header("Content-Type", "application/json")
            el_focus_direct = find_entity_for_focus_phrase(focus_phrase)
            if (
                el_focus_direct
                and el_focus_direct.is_valid()
                and el_focus_direct.value != 0
            ):
                focus_answer = fetch_answer_for_entity(el_focus_direct)
                if focus_answer:
                    focus_answer = cleanup_text(focus_answer)
                    self.finish(
                        json.dumps(
                            {
                                "success": True,
                                "found": True,
                                "answer": focus_answer,
                                "low_quality": False,
                            }
                        )
                    )
                    return
                focus_label = get_main_idtf_label(el_focus_direct, used_lang)
                if focus_label and len(str(focus_label).strip()) >= 3:
                    self.finish(
                        json.dumps(
                            {
                                "success": True,
                                "found": True,
                                "answer": f"Понятие найдено в базе знаний: {str(focus_label).strip()}.",
                                "low_quality": True,
                            }
                        )
                    )
                    return
            self.finish(
                json.dumps(
                    {
                        "success": True,
                        "found": False,
                        "error": "Question found but no answer",
                    }
                )
            )
            return

        # Exact main idtf match on the whole question focus (after typo fixes), if fuzzy path missed it.
        fp_lookup = focus_phrase.strip().lower()
        if len(fp_lookup) >= 4:
            el_focus = find_entity_for_focus_phrase(fp_lookup)
            if el_focus and el_focus.is_valid() and el_focus.value != 0:
                ans_focus = fetch_answer_for_entity(el_focus)
                if ans_focus:
                    ans_focus = " ".join(
                        str(ans_focus)
                        .replace("</br>", " ")
                        .replace("<br>", " ")
                        .replace("</p>", " ")
                        .replace("<p>", " ")
                        .split()
                    ).strip()
                    self.set_header("Content-Type", "application/json")
                    self.finish(
                        json.dumps(
                            {
                                "success": True,
                                "found": True,
                                "answer": ans_focus,
                                "low_quality": False,
                            }
                        )
                    )
                    return
                focus_label = get_main_idtf_label(el_focus, used_lang)
                if not focus_label:
                    try:
                        focus_label = logic.find_tooltip(el_focus, used_lang)
                    except Exception:
                        focus_label = None
                if focus_label and len(str(focus_label).strip()) >= 3:
                    self.set_header("Content-Type", "application/json")
                    self.finish(
                        json.dumps(
                            {
                                "success": True,
                                "found": True,
                                "answer": f"Понятие найдено в базе знаний: {str(focus_label).strip()}.",
                                "low_quality": True,
                            }
                        )
                    )
                    return

        self.set_header("Content-Type", "application/json")
        self.finish(
            json.dumps({"success": True, "found": False, "error": "Question not found"})
        )
