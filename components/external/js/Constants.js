// sc-element types
var sc_type_node            = 0x1
var sc_type_node_link            = 0x2
var sc_type_common_edge     = 0x4
var sc_type_common_arc      = 0x8
var sc_type_membership_arc      = 0x10

// sc-element constant
var sc_type_const           = 0x20
var sc_type_var             = 0x40

// sc-element positivity
var sc_type_pos_arc         = 0x80
var sc_type_neg_arc         = 0x100
var sc_type_fuz_arc         = 0x200

// sc-element premanently
var sc_type_temp_arc        = 0x400
var sc_type_perm_arc        = 0x800

// struct node types
var sc_type_node_tuple          = (0x80)
var sc_type_node_structure         = (0x100)
var sc_type_node_role           = (0x200)
var sc_type_node_norole         = (0x400)
var sc_type_node_class          = (0x800)
var sc_type_node_abstract       = (0x1000)
var sc_type_node_material       = (0x2000)

var sc_type_const_perm_pos_arc  = (sc_type_membership_arc | sc_type_const | sc_type_pos_arc | sc_type_perm_arc)

// type mask
var sc_type_element_mask        = (sc_type_node | sc_type_node_link | sc_type_common_edge | sc_type_common_arc | sc_type_membership_arc)
var sc_type_constancy_mask      = (sc_type_const | sc_type_var)
var sc_type_positivity_mask     = (sc_type_pos_arc | sc_type_neg_arc | sc_type_fuz_arc)
var sc_type_permanency_mask     = (sc_type_perm_arc | sc_type_temp_arc)
var sc_type_node_structure_mask    = (sc_type_node_tuple | sc_type_node_structure | sc_type_node_role | sc_type_node_norole | sc_type_node_class | sc_type_node_abstract | sc_type_node_material)
var sc_type_arc_mask            = (sc_type_membership_arc | sc_type_common_arc | sc_type_common_edge)
