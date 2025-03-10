// sc-element types
const sc_type_unknown = 0
const sc_type_node = 0x1
const sc_type_connector = 0x4000
const sc_type_common_edge = (sc_type_connector | 0x4)
const sc_type_arc = (sc_type_connector | 0x8000)
const sc_type_common_arc = (sc_type_arc | 0x8)
const sc_type_membership_arc = (sc_type_arc | 0x10)

// sc-element constant
const sc_type_const = 0x20
const sc_type_var = 0x40

// sc-arc actuality
const sc_type_actual_arc = (sc_type_membership_arc | 0x1000)
const sc_type_inactual_arc = (sc_type_membership_arc | 0x2000)

// sc-arc permanence
const sc_type_temp_arc = (sc_type_membership_arc | 0x400)
const sc_type_perm_arc = (sc_type_membership_arc | 0x800)

// sc-arc positivity
const sc_type_pos_arc = (sc_type_membership_arc | 0x80)
const sc_type_neg_arc = (sc_type_membership_arc | 0x100)

// fuzziness
const sc_type_fuz_arc = (sc_type_membership_arc | 0x200)

// semantic sc-node types
const sc_type_node_link = (sc_type_node | 0x2)
const sc_type_node_tuple = (sc_type_node | 0x80)
const sc_type_node_structure = (sc_type_node | 0x100)
const sc_type_node_role = (sc_type_node | 0x200)
const sc_type_node_non_role = (sc_type_node | 0x400)
const sc_type_node_class = (sc_type_node | 0x800)
const sc_type_node_superclass = (sc_type_node | 0x1000)
const sc_type_node_material = (sc_type_node | 0x2000)

const sc_type_const_pos_arc = (sc_type_const | sc_type_pos_arc)
const sc_type_const_neg_arc = (sc_type_const | sc_type_neg_arc)
const sc_type_const_fuz_arc = (sc_type_const | sc_type_fuz_arc)

const sc_type_const_perm_pos_arc = (sc_type_const | sc_type_perm_arc | sc_type_pos_arc)
const sc_type_const_perm_neg_arc = (sc_type_const | sc_type_perm_arc | sc_type_neg_arc)
const sc_type_const_temp_pos_arc = (sc_type_const | sc_type_temp_arc | sc_type_pos_arc)
const sc_type_const_temp_neg_arc = (sc_type_const | sc_type_temp_arc | sc_type_neg_arc)

const sc_type_const_actual_temp_pos_arc = (sc_type_const | sc_type_actual_arc | sc_type_temp_arc | sc_type_pos_arc)
const sc_type_const_actual_temp_neg_arc = (sc_type_const | sc_type_actual_arc | sc_type_temp_arc | sc_type_neg_arc)
const sc_type_const_inactual_temp_pos_arc = (sc_type_const | sc_type_inactual_arc | sc_type_temp_arc | sc_type_pos_arc)
const sc_type_const_inactual_temp_neg_arc = (sc_type_const | sc_type_inactual_arc | sc_type_temp_arc | sc_type_neg_arc)

const sc_type_var_perm_pos_arc = (sc_type_var | sc_type_perm_arc | sc_type_pos_arc)
const sc_type_var_perm_neg_arc = (sc_type_var | sc_type_perm_arc | sc_type_neg_arc)
const sc_type_var_temp_pos_arc = (sc_type_var | sc_type_temp_arc | sc_type_pos_arc)
const sc_type_var_temp_neg_arc = (sc_type_var | sc_type_temp_arc | sc_type_neg_arc)

const sc_type_var_actual_temp_pos_arc = (sc_type_var | sc_type_actual_arc | sc_type_temp_arc | sc_type_pos_arc)
const sc_type_var_actual_temp_neg_arc = (sc_type_var | sc_type_actual_arc | sc_type_temp_arc | sc_type_neg_arc)
const sc_type_var_inactual_temp_pos_arc = (sc_type_var | sc_type_inactual_arc | sc_type_temp_arc | sc_type_pos_arc)
const sc_type_var_inactual_temp_neg_arc = (sc_type_var | sc_type_inactual_arc | sc_type_temp_arc | sc_type_neg_arc)

const sc_type_var_fuz_arc = (sc_type_const | sc_type_fuz_arc)

const sc_type_const_common_arc = (sc_type_const | sc_type_common_arc)
const sc_type_var_common_arc = (sc_type_var | sc_type_common_arc)
const sc_type_const_common_edge = (sc_type_const | sc_type_common_edge)
const sc_type_var_common_edge = (sc_type_var | sc_type_common_edge)

const sc_type_const_node = (sc_type_const | sc_type_node)
const sc_type_const_node_link = (sc_type_const | sc_type_node | sc_type_node_link)
const sc_type_const_node_link_class = (sc_type_const | sc_type_node | sc_type_node_link | sc_type_node_class)
const sc_type_const_node_tuple = (sc_type_const | sc_type_node | sc_type_node_tuple)
const sc_type_const_node_structure = (sc_type_const | sc_type_node | sc_type_node_structure)
const sc_type_const_node_role = (sc_type_const | sc_type_node | sc_type_node_role)
const sc_type_const_node_non_role = (sc_type_const | sc_type_node | sc_type_node_non_role)
const sc_type_const_node_class = (sc_type_const | sc_type_node | sc_type_node_class)
const sc_type_const_node_superclass = (sc_type_const | sc_type_node | sc_type_node_superclass)
const sc_type_const_node_material = (sc_type_const | sc_type_node | sc_type_node_material)

const sc_type_var_node = (sc_type_var | sc_type_node)
const sc_type_var_node_link = (sc_type_var | sc_type_node | sc_type_node_link)
const sc_type_var_node_link_class = (sc_type_var | sc_type_node | sc_type_node_link | sc_type_node_class)
const sc_type_var_node_tuple = (sc_type_var | sc_type_node | sc_type_node_tuple)
const sc_type_var_node_structure = (sc_type_var | sc_type_node | sc_type_node_structure)
const sc_type_var_node_role = (sc_type_var | sc_type_node | sc_type_node_role)
const sc_type_var_node_non_role = (sc_type_var | sc_type_node | sc_type_node_non_role)
const sc_type_var_node_class = (sc_type_var | sc_type_node | sc_type_node_class)
const sc_type_var_node_superclass = (sc_type_var | sc_type_node | sc_type_node_superclass)
const sc_type_var_node_material = (sc_type_var | sc_type_node | sc_type_node_material)

// type mask
const sc_type_element_mask = (sc_type_node | sc_type_connector)
const sc_type_connector_mask = (sc_type_common_edge | sc_type_common_arc | sc_type_membership_arc)
const sc_type_arc_mask = (sc_type_common_arc | sc_type_membership_arc)

const sc_type_constancy_mask = (sc_type_const | sc_type_var)
const sc_type_actuality_mask = (sc_type_actual_arc | sc_type_inactual_arc)
const sc_type_permanency_mask = (sc_type_perm_arc | sc_type_temp_arc)
const sc_type_positivity_mask = (sc_type_pos_arc | sc_type_neg_arc)

const sc_type_membership_arc_mask = (sc_type_actuality_mask | sc_type_permanency_mask | sc_type_positivity_mask)
const sc_type_common_arc_mask = (sc_type_common_arc)
const sc_type_common_edge_mask = (sc_type_common_edge)

const sc_type_node_mask = (sc_type_node_link | sc_type_node_tuple | sc_type_node_structure | sc_type_node_role | sc_type_node_non_role
        | sc_type_node_class | sc_type_node_superclass | sc_type_node_material)
const sc_type_node_link_mask = (sc_type_node | sc_type_node_link | sc_type_node_class)
