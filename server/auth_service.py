# -*- coding: utf-8 -*-
import logging
from sc_client import client
from sc_client.constants import sc_type
from sc_client.models import ScAddr, ScConstruction, ScLinkContent, ScLinkContentType, ScTemplate
from sc_client.sc_keynodes import ScKeynodes
from keynodes import KeynodeSysIdentifiers
from sc_client.models import ScIdtfResolveParams

logger = logging.getLogger()

class AuthService:
    USERS_ROOT_NODE_IDTF = "sys_users_root"
    USERS_SECTION_NODE_IDTF = "sys_users_section"

    def __init__(self):
        self._keynodes = ScKeynodes()
        logger.info("AuthService initialized with lazy keynode resolution.")

    def _resolve_node_by_idtf(self, idtf: str, relation_key: str = "nrel_main_idtf") -> int:
        """Robustly resolve a node address by its IDTF content."""
        try:
            links_results = client.search_links_by_contents(idtf)
            if not links_results:
                return 0
            
            links = []
            for item in links_results:
                if isinstance(item, list): links.extend(item)
                else: links.append(item)
            
            # Get relation identifier string
            rel_idtf = getattr(KeynodeSysIdentifiers, relation_key).value
            
            # Try to get relation address from cache
            rel_addr = self._keynodes[rel_idtf]
            
            # If cache is 0 or invalid, resolve it directly from the KB
            # Use .value for ScAddr objects to avoid TypeError with int
            rel_val = rel_addr.value if isinstance(rel_addr, ScAddr) else rel_addr
            if not rel_val or rel_val == 0:
                res = client.resolve_keynodes(ScIdtfResolveParams(idtf=rel_idtf, type=None))
                if res and res[0].is_valid():
                    rel_addr = res[0]
                else:
                    return 0
            
            for link in links:
                if not link: continue
                link_addr = link if isinstance(link, ScAddr) else ScAddr(link)
                template = ScTemplate()
                template.quintuple(
                    (sc_type.VAR_NODE, "node"),
                    sc_type.VAR_COMMON_ARC,
                    link_addr,
                    sc_type.VAR_PERM_POS_ARC,
                    rel_addr
                )
                res = client.search_by_template(template)
                if res and len(res) > 0:
                    res_obj = res[0].get("node")
                    return res_obj.value if res_obj else 0
        except Exception as e:
            logger.error(f"Error resolving node by idtf {idtf}: {e}")
        return 0

    def _ensure_keynode(self, key_idtf: str, sc_type_val=sc_type.CONST_NODE_NON_ROLE) -> ScAddr:
        """Ensure a keynode exists in the KB; create it if not found."""
        res = client.resolve_keynodes(ScIdtfResolveParams(idtf=key_idtf, type=None))
        if res and res[0].is_valid():
            return res[0]
        
        logger.info(f'Keynode {key_idtf} not found, creating it...')
        construction = ScConstruction()
        construction.generate_node(sc_type.CONST_NODE, 'kn_node')
        construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent(key_idtf, ScLinkContentType.STRING), 'kn_link')
        construction.generate_connector(sc_type.CONST_COMMON_ARC, 'kn_node', 'kn_link', 'kn_arc')
        
        # Try to link to nrel_main_idtf if it exists
        try:
            main_idtf = self._keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value]
            if main_idtf:
                construction.generate_connector(sc_type.CONST_PERM_POS_ARC, main_idtf, 'kn_arc')
        except:
            pass
            
        result = client.generate_elements(construction)
        return result[construction.get_index('kn_node')]

    def ensure_system_nodes(self):
        """Guarantees that all critical system nodes are present in the KB."""
        logger.info("Ensuring critical system nodes exist...")
        critical_nodes = {
            KeynodeSysIdentifiers.nrel_email.value: sc_type.CONST_NODE_NON_ROLE,
            KeynodeSysIdentifiers.nrel_main_idtf.value: sc_type.CONST_NODE_NON_ROLE,
            KeynodeSysIdentifiers.nrel_system_identifier.value: sc_type.CONST_NODE_NON_ROLE,
            KeynodeSysIdentifiers.ui_user.value: sc_type.CONST_NODE_CLASS,
            KeynodeSysIdentifiers.nrel_registered_user.value: sc_type.CONST_NODE_NON_ROLE,
            KeynodeSysIdentifiers.nrel_authorised_user.value: sc_type.CONST_NODE_NON_ROLE,
            KeynodeSysIdentifiers.ui_main_menu.value: sc_type.CONST_NODE,
            KeynodeSysIdentifiers.nrel_decomposition.value: sc_type.CONST_NODE_NON_ROLE,
        }
        for idtf, type_val in critical_nodes.items():
            self._ensure_keynode(idtf, type_val)

    def _get_arc_addr(self, src: ScAddr, rel: ScAddr, dst: ScAddr) -> int:
        """Find the address of an arc between src and dst with relation rel."""
        try:
            template = ScTemplate()
            template.quintuple(
                src,
                (sc_type.VAR_COMMON_ARC, "arc"),
                dst,
                sc_type.VAR_PERM_POS_ARC,
                rel
            )
            res = client.search_by_template(template)
            if res and len(res) > 0:
                # ScTemplateResult has a get method that takes one argument
                arc_addr_obj = res[0].get("arc")
                return arc_addr_obj.value if arc_addr_obj else 0
        except Exception as e:
            logger.error(f"Error finding arc address: {e}")
        return 0

    def get_user_sc_addr(self, email: str) -> int:
        """Get the sc_addr of a user by their email safely."""
        logger.debug(f'Get user sc_addr by email: {email}')
        try:
            links_results = client.search_links_by_contents(email)
            if not links_results:
                return 0
            
            # Flatten the list of lists if necessary
            links = []
            for item in links_results:
                if isinstance(item, list):
                    links.extend(item)
                else:
                    links.append(item)
            
            logger.info(f'Found links for email {email}: {links}')
            
            kn_email_addr = self._keynodes[KeynodeSysIdentifiers.nrel_email.value]
            logger.info(f'nrel_email keynode addr: {kn_email_addr}')

            # Iterate through ALL found links to find the one connected to a user node
            for link_addr in links:
                if not link_addr:
                    continue
                
                # Ensure link_addr is an ScAddr object for the template
                actual_link_addr = link_addr if isinstance(link_addr, ScAddr) else ScAddr(link_addr)
                logger.info(f'Checking link_addr: {actual_link_addr}')
                
                template = ScTemplate()
                template.quintuple(
                    (sc_type.VAR_NODE, "user_node"),
                    sc_type.VAR_COMMON_ARC,
                    actual_link_addr,
                    sc_type.VAR_PERM_POS_ARC,
                    kn_email_addr
                )
                res = client.search_by_template(template)
                logger.info(f'Search result for link {actual_link_addr}: {res}')
                
                if res and len(res) > 0:
                    res_obj = res[0].get("user_node")
                    return res_obj.value if res_obj else 0
        except Exception as e:
            logger.error(f"Error getting user sc_addr by email {email}: {e}", exc_info=True)
            
        return 0

    def create_kb_user(self, email: str, username: str) -> ScAddr:
        logger.debug('Creating ui user node at kb ...')
        
        # Resolve keynodes with explicit types
        try:
            kn_ui_user = self._keynodes[KeynodeSysIdentifiers.ui_user.value, sc_type.CONST_NODE_CLASS]
            kn_sys_idtf = self._keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value, sc_type.CONST_NODE_NON_ROLE]
            kn_main_idtf = self._keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value, sc_type.CONST_NODE_NON_ROLE]
            kn_lang_ru = self._keynodes[KeynodeSysIdentifiers.lang_ru.value, sc_type.CONST_NODE_CLASS]
            kn_email = self._keynodes[KeynodeSysIdentifiers.nrel_email.value, sc_type.CONST_NODE_NON_ROLE]
        except Exception as e:
            logger.error(f"Error during keynode resolution: {e}")
            # Fallback to basic access
            kn_ui_user = self._keynodes[KeynodeSysIdentifiers.ui_user.value]
            kn_sys_idtf = self._keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value]
            kn_main_idtf = self._keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value]
            kn_lang_ru = self._keynodes[KeynodeSysIdentifiers.lang_ru.value]
            kn_email = self._keynodes[KeynodeSysIdentifiers.nrel_email.value]
        
        construction = ScConstruction()
        
        # 1. Create node and assign class ui_user
        construction.generate_node(sc_type.CONST_NODE, 'user_node')
        construction.generate_connector(sc_type.CONST_PERM_POS_ARC, kn_ui_user, 'user_node')
        
        # 2. System identifier
        sys_idtf = email.split('@')[0]
        construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent(sys_idtf, ScLinkContentType.STRING), 'sys_idtf_link')
        construction.generate_connector(sc_type.CONST_COMMON_ARC, 'user_node', 'sys_idtf_link', 'bin_arc_sys_idtf')
        construction.generate_connector(sc_type.CONST_PERM_POS_ARC, kn_sys_idtf, 'bin_arc_sys_idtf')
        
        # 3. Main identifier
        construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent(username, ScLinkContentType.STRING), 'main_idtf_link')
        construction.generate_connector(sc_type.CONST_COMMON_ARC, 'user_node', 'main_idtf_link', 'bin_arc_main_idtf')
        construction.generate_connector(sc_type.CONST_PERM_POS_ARC, kn_main_idtf, 'bin_arc_main_idtf')
        construction.generate_connector(sc_type.CONST_PERM_POS_ARC, kn_lang_ru, 'main_idtf_link')
        
        # 4. Email link
        construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent(email, ScLinkContentType.STRING), 'email_link')
        construction.generate_connector(sc_type.CONST_COMMON_ARC, 'user_node', 'email_link', 'bin_arc_email')
        construction.generate_connector(sc_type.CONST_PERM_POS_ARC, kn_email, 'bin_arc_email')
        
        result = client.generate_elements(construction)
        return result[construction.get_index('user_node')]

    def _link_user_to_root(self, root_node: ScAddr, user_node: ScAddr) -> None:
        """Links a user node to the root users list via nrel_decomposition if not already linked."""
        try:
            user_node_obj = user_node if isinstance(user_node, ScAddr) else ScAddr(user_node)
            kn_decomp = self._keynodes[KeynodeSysIdentifiers.nrel_decomposition.value]
            
            if self._get_arc_addr(root_node, kn_decomp, user_node_obj) == 0:
                construction = ScConstruction()
                construction.generate_connector(sc_type.CONST_COMMON_ARC, root_node, user_node_obj, 'user_link')
                construction.generate_connector(
                    sc_type.CONST_PERM_POS_ARC, 
                    kn_decomp, 
                    'user_link'
                )
                result = client.generate_elements(construction)
                logger.info(f'Linked user {user_node_obj} to root section. Result: {result}')
            else:
                logger.info(f'User {user_node_obj} already linked to root section.')
        except Exception as e:
            logger.error(f'Failed to link user {user_node} to root section: {e}')

    def register_user(self, email: str, username: str) -> ScAddr:
        logger.debug(f'Registering user {username} ({email}) in KB')
        user_node = self.create_kb_user(email, username)
        self.mark_user_registered(user_node)
        
        # Ensure the user is linked to the users root list immediately
        root_node_addr = self._resolve_node_by_idtf(self.USERS_ROOT_NODE_IDTF, relation_key="nrel_system_identifier")
        if root_node_addr != 0:
            self._link_user_to_root(ScAddr(root_node_addr), user_node)
        else:
            logger.error(f"Could not find {self.USERS_ROOT_NODE_IDTF} to link new user {username}")
            
        return user_node


    def mark_user_registered(self, user_node: ScAddr) -> None:
        logger.debug('Mark user as registered in kb')
        construction = ScConstruction()
        construction.generate_connector(
            sc_type.VAR_COMMON_ARC,
            self._keynodes[KeynodeSysIdentifiers.Myself.value, sc_type.CONST_NODE],
            user_node,
            'bin_arc_registered'
        )
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC,
            self._keynodes[KeynodeSysIdentifiers.nrel_registered_user.value, sc_type.CONST_NODE_NON_ROLE],
            'bin_arc_registered'
        )
        client.generate_elements(construction)

    def authorise_user_in_kb(self, user_node: ScAddr) -> None:
        logger.debug('Authorise user in kb')
        construction = ScConstruction()
        construction.generate_connector(
            sc_type.VAR_COMMON_ARC,
            self._keynodes[KeynodeSysIdentifiers.Myself.value, sc_type.CONST_NODE],
            user_node,
            'bin_arc_authorised'
        )
        construction.generate_connector(
            sc_type.CONST_PERM_POS_ARC,
            self._keynodes[KeynodeSysIdentifiers.nrel_authorised_user.value, sc_type.CONST_NODE_NON_ROLE],
            'bin_arc_authorised'
        )
        client.generate_elements(construction)

    def authorise_user_in_kb_by_email(self, email: str) -> None:
        user_addr = self.get_user_sc_addr(email)
        if user_addr != 0:
            self.authorise_user_in_kb(ScAddr(user_addr))
        else:
            logger.error(f"User with email {email} not found in KB for authorisation")

    def unregister_user(self, email: str) -> None:
        logger.debug(f'Unregister user {email} from kb')
        user_addr = self.get_user_sc_addr(email)
        if user_addr == 0:
            logger.warning(f'User {email} not found in KB, nothing to unregister')
            return
        
        try:
            src = self._keynodes[KeynodeSysIdentifiers.Myself.value, sc_type.CONST_NODE]
            rel = self._keynodes[KeynodeSysIdentifiers.nrel_registered_user.value, sc_type.CONST_NODE_NON_ROLE]
            dst = ScAddr(user_addr)
            
            arc_addr = self._get_arc_addr(src, rel, dst)
            if arc_addr != 0:
                client.erase_elements(ScAddr(arc_addr))
                logger.info(f'User {email} unregistered from KB')
            else:
                logger.warning(f'Registration arc for user {email} not found')
        except Exception as e:
            logger.error(f'Failed to unregister user {email} from KB: {e}')

    def _cleanup_user_nodes(self, users):
        """Purge corrupted state: remove UI-command arcs and erroneous decomposition ONLY from user nodes."""
        logger.info("Cleaning up corrupted UI-command state from user nodes...")
        
        kn_ui_decomp = self._keynodes[KeynodeSysIdentifiers.nrel_ui_commands_decomposition.value]
        kn_decomp = self._keynodes[KeynodeSysIdentifiers.nrel_decomposition.value]
        kn_ui_cmd_class_noatom = self._keynodes[KeynodeSysIdentifiers.ui_user_command_class_noatom.value]
        kn_ui_cmd_class_atom = self._keynodes[KeynodeSysIdentifiers.ui_user_command_class_atom.value]

        for user in users:
            user_addr_val = self.get_user_sc_addr(user.email)
            if user_addr_val == 0:
                continue
            
            user_addr = ScAddr(user_addr_val)
            try:
                # 1. Remove UI-command decomposition arcs where user is the source
                template_ui_decomp = ScTemplate()
                template_ui_decomp.quintuple(
                    user_addr,
                    sc_type.VAR_COMMON_ARC,
                    sc_type.UNKNOWN,
                    sc_type.VAR_PERM_POS_ARC,
                    kn_ui_decomp
                )
                res_ui_decomp = client.search_by_template(template_ui_decomp)
                if res_ui_decomp:
                    for item in res_ui_decomp:
                        arc_addr = item.get(1)
                        if arc_addr:
                            client.erase_elements(arc_addr if isinstance(arc_addr, ScAddr) else ScAddr(arc_addr))
                
                # 2. Remove UI-command classes specifically from this user node
                for kn_class in [kn_ui_cmd_class_noatom, kn_ui_cmd_class_atom]:
                    template_class = ScTemplate()
                    template_class.quintuple(
                        kn_class,
                        sc_type.VAR_COMMON_ARC,
                        user_addr,
                        sc_type.VAR_PERM_POS_ARC,
                        kn_class
                    )
                    res_class = client.search_by_template(template_class)
                    if res_class:
                        for item in res_class:
                            arc_addr = item.get(1)
                            if arc_addr:
                                client.erase_elements(arc_addr if isinstance(arc_addr, ScAddr) else ScAddr(arc_addr))
                
                # 3. Remove logical decomposition arcs where user is the source (fixing 'user-as-root' bug)
                template_decomp = ScTemplate()
                template_decomp.quintuple(
                    user_addr,
                    sc_type.VAR_COMMON_ARC,
                    sc_type.UNKNOWN,
                    sc_type.VAR_PERM_POS_ARC,
                    kn_decomp
                )
                res_decomp = client.search_by_template(template_decomp)
                if res_decomp:
                    for item in res_decomp:
                        arc_addr = item.get(1)
                        if arc_addr:
                            client.erase_elements(arc_addr if isinstance(arc_addr, ScAddr) else ScAddr(arc_addr))
                            
            except Exception as e:
                logger.error(f"Error cleaning up user {user.email}: {e}")


    def sync_users_from_db(self, users):
        logger.info(f'Starting sync of {len(users)} users from DB to KB...')
        
        # 0. Ensure all critical system nodes exist before starting
        try:
            self.ensure_system_nodes()
        except Exception as e:
            logger.error(f"Critical error ensuring system nodes: {e}")
            # We continue, but some operations might fail
            
        # First, clean up corrupted state where users might be acting as roots
        self._cleanup_user_nodes(users)
        
        try:
            # 1. Resolve or Create the Section Class (Analogous to guide_section)
            # Try robust resolution first
            section_class_addr = self._resolve_node_by_idtf('user_section_class')
            if section_class_addr != 0:
                section_class = ScAddr(section_class_addr)
                logger.info(f'Found existing user_section_class: {section_class}')
            else:
                logger.info('user_section_class not found, creating it...')
                construction = ScConstruction()
                construction.generate_node(sc_type.CONST_NODE, 'class_node')
                construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent('user_section_class', ScLinkContentType.STRING), 'class_link')
                construction.generate_connector(sc_type.CONST_COMMON_ARC, 'class_node', 'class_link', 'class_arc')
                
                main_idtf = self._keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value]
                if main_idtf:
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, main_idtf, 'class_arc')
                
                # Assign base class ui_user as a base
                kn_base_class = self._keynodes[KeynodeSysIdentifiers.ui_user.value]
                if kn_base_class:
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, kn_base_class, 'class_node')
                
                result = client.generate_elements(construction)
                section_class = result[construction.get_index('class_node')]
                logger.info(f'Successfully created user_section_class: {section_class}')

            # 2. Resolve or Create User Section Root
            section_node_addr = self._resolve_node_by_idtf(self.USERS_SECTION_NODE_IDTF)
            if section_node_addr != 0:
                section_node = ScAddr(section_node_addr)
            else:
                logger.info(f'{self.USERS_SECTION_NODE_IDTF} node not found, creating it...')
                construction = ScConstruction()
                construction.generate_node(sc_type.CONST_NODE, 'section_node')
                
                # System IDTF
                construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent(self.USERS_SECTION_NODE_IDTF, ScLinkContentType.STRING), 'sys_idtf')
                construction.generate_connector(sc_type.CONST_COMMON_ARC, 'section_node', 'sys_idtf', 'arc_sys')
                
                sys_id_kn = self._keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value]
                if sys_id_kn:
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, sys_id_kn, 'arc_sys')
                
                # Main IDTF
                construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent("Раздел пользователей", ScLinkContentType.STRING), 'main_idtf')
                construction.generate_connector(sc_type.CONST_COMMON_ARC, 'section_node', 'main_idtf', 'arc_main')
                
                main_id_kn = self._keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value]
                if main_id_kn:
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, main_id_kn, 'arc_main')
                
                # Assign to Section Class
                if section_class:
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, section_class, 'section_node')
                
                # Link Section to Main Menu using LOGICAL decomposition
                kn_main_menu = self._keynodes[KeynodeSysIdentifiers.ui_main_menu.value]
                kn_decomp = self._keynodes[KeynodeSysIdentifiers.nrel_decomposition.value]
                if kn_main_menu and kn_decomp:
                    construction.generate_connector(sc_type.CONST_COMMON_ARC, kn_main_menu, 'section_node', 'menu_arc')
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, kn_decomp, 'menu_arc')
                
                result = client.generate_elements(construction)
                section_node = result[construction.get_index('section_node')]
                logger.info(f'Successfully created {self.USERS_SECTION_NODE_IDTF} node: {section_node}')

            # 3. Resolve or Create Users Root (The List)
            root_node_addr = self._resolve_node_by_idtf(self.USERS_ROOT_NODE_IDTF)
            if root_node_addr != 0:
                root_node = ScAddr(root_node_addr)
            else:
                logger.info(f'{self.USERS_ROOT_NODE_IDTF} node not found, creating it...')
                construction = ScConstruction()
                construction.generate_node(sc_type.CONST_NODE, 'root_node')
                
                # System IDTF
                construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent(self.USERS_ROOT_NODE_IDTF, ScLinkContentType.STRING), 'sys_idtf')
                construction.generate_connector(sc_type.CONST_COMMON_ARC, 'root_node', 'sys_idtf', 'arc_sys')
                
                sys_id_kn = self._keynodes[KeynodeSysIdentifiers.nrel_system_identifier.value]
                if sys_id_kn:
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, sys_id_kn, 'arc_sys')
                
                # Main IDTF
                construction.generate_link(sc_type.CONST_NODE_LINK, ScLinkContent("Список пользователей", ScLinkContentType.STRING), 'main_idtf')
                construction.generate_connector(sc_type.CONST_COMMON_ARC, 'root_node', 'main_idtf', 'arc_main')
                
                main_id_kn = self._keynodes[KeynodeSysIdentifiers.nrel_main_idtf.value]
                if main_id_kn:
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, main_id_kn, 'arc_main')
                
                # Assign to Section Class
                if section_class:
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, section_class, 'root_node')
                
                # Link List to Section via LOGICAL decomposition
                kn_decomp = self._keynodes[KeynodeSysIdentifiers.nrel_decomposition.value]
                if section_node and kn_decomp:
                    construction.generate_connector(sc_type.CONST_COMMON_ARC, section_node, 'root_node', 'section_to_list_arc')
                    construction.generate_connector(sc_type.CONST_PERM_POS_ARC, kn_decomp, 'section_to_list_arc')
                
                result = client.generate_elements(construction)
                root_node = result[construction.get_index('root_node')]
                logger.info(f'Successfully created {self.USERS_ROOT_NODE_IDTF} node: {root_node}')
                
        except Exception as e:
            logger.error(f'Error resolving/creating user section/root: {e}')
            return
        
        for user in users:



            email = user.email
            username = user.login
            user_addr = self.get_user_sc_addr(email)
            
            if user_addr == 0:
                logger.info(f'User {username} ({email}) not found in KB, creating...')
                try:
                    user_addr_obj = self.create_kb_user(email, username)
                    user_addr = user_addr_obj.value
                    user.sc_addr = user_addr
                    self.mark_user_registered(user_addr_obj)
                    logger.info(f'Successfully created user node for {username}.')
                except Exception as e:
                    logger.error(f'Failed to create KB user for {username}: {e}')
                    continue
            
            try:
                addr_obj = ScAddr(user_addr) if isinstance(user_addr, int) else user_addr
                
                # Check if decomposition arc already exists to avoid duplicates
                kn_decomp = self._keynodes[KeynodeSysIdentifiers.nrel_decomposition.value]
                if self._get_arc_addr(root_node, kn_decomp, addr_obj) == 0:
                    construction = ScConstruction()
                    construction.generate_connector(sc_type.CONST_COMMON_ARC, root_node, addr_obj, 'user_link')
                    construction.generate_connector(
                        sc_type.CONST_PERM_POS_ARC, 
                        kn_decomp, 
                        'user_link'
                    )
                    client.generate_elements(construction)
                    logger.debug(f'Linked user {username} to root section.')
                else:
                    logger.debug(f'User {username} already linked to root section.')
            except Exception as e:
                logger.error(f'Failed to link user {username} to root section: {e}')
        
        logger.info('User synchronization complete.')

    def logout_user_from_kb(self, email: str) -> None:
        user_addr = self.get_user_sc_addr(email)
        if user_addr != 0:
            try:
                src = self._keynodes[KeynodeSysIdentifiers.Myself.value, sc_type.CONST_NODE]
                rel = self._keynodes[KeynodeSysIdentifiers.nrel_authorised_user.value, sc_type.CONST_NODE_NON_ROLE]
                dst = ScAddr(user_addr)
                
                arc_addr = self._get_arc_addr(src, rel, dst)
                if arc_addr != 0:
                    client.erase_elements(ScAddr(arc_addr))
                    logger.info(f"User {email} logged out from KB")
                else:
                    logger.warning(f"Authorisation arc for user {email} not found")
            except Exception as e:
                logger.error(f"Failed to logout user {email} from KB: {e}")
