// sc-element types
var sc_type_node            = 0x1
var sc_type_link            = 0x2
var sc_type_edge_common     = 0x4
var sc_type_arc_common      = 0x8
var sc_type_arc_access      = 0x10

// sc-element constant
var sc_type_const           = 0x20
var sc_type_var             = 0x40

// sc-element positivity
var sc_type_arc_pos         = 0x80
var sc_type_arc_neg         = 0x100
var sc_type_arc_fuz         = 0x200

// sc-element premanently
var sc_type_arc_temp        = 0x400
var sc_type_arc_perm        = 0x800

// struct node types
var sc_type_node_tuple          = (0x80)
var sc_type_node_struct         = (0x100)
var sc_type_node_role           = (0x200)
var sc_type_node_norole         = (0x400)
var sc_type_node_class          = (0x800)
var sc_type_node_abstract       = (0x1000)
var sc_type_node_material       = (0x2000)

var sc_type_arc_pos_const_perm  = (sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm)

// type mask
var sc_type_element_mask        = (sc_type_node | sc_type_link | sc_type_edge_common | sc_type_arc_common | sc_type_arc_access)
var sc_type_constancy_mask      = (sc_type_const | sc_type_var)
var sc_type_positivity_mask     = (sc_type_arc_pos | sc_type_arc_neg | sc_type_arc_fuz)
var sc_type_permanency_mask     = (sc_type_arc_perm | sc_type_arc_temp)
var sc_type_node_struct_mask    = (sc_type_node_tuple | sc_type_node_struct | sc_type_node_role | sc_type_node_norole | sc_type_node_class | sc_type_node_abstract | sc_type_node_material)
var sc_type_arc_mask            = (sc_type_arc_access | sc_type_arc_common | sc_type_edge_common)
