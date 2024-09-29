var SCs = SCs || {version: "0.1.0"};

SCs.Connectors = {};
SCs.SCnConnectors = {};
SCs.SCnSortOrder = [,
    'nrel_section_base_order',
    'nrel_main_idtf',
    'nrel_system_identifier',
    'nrel_idtf',
    'nrel_section_decomposition',
    'rrel_key_sc_element',
    'nrel_logo',
    'nrel_location'
];

SCs.SCnBallMarker = '●';

$(document).ready(function () {
    SCs.Connectors[sc_type_common_edge] = {f: "<>", b: "<>"};
    SCs.Connectors[sc_type_common_arc] = {f: ">", b: "<"};
    SCs.Connectors[sc_type_membership_arc] = {f: "..>", b: "<.."};
    SCs.Connectors[sc_type_common_edge | sc_type_const] = {f: "<=>", b: "<=>"};
    SCs.Connectors[sc_type_common_edge | sc_type_var] = {f: "_<=>", b: "_<=>"};
    SCs.Connectors[sc_type_common_arc | sc_type_const] = {f: "=>", b: "<="};
    SCs.Connectors[sc_type_common_arc | sc_type_var] = {f: "_=>", b: "_<="};
    SCs.Connectors[sc_type_membership_arc | sc_type_const | sc_type_pos_arc | sc_type_perm_arc] = {f: "->", b: "<-"};
    SCs.Connectors[sc_type_membership_arc | sc_type_const | sc_type_neg_arc | sc_type_perm_arc] = {f: "-|>", b: "<|-"};
    SCs.Connectors[sc_type_membership_arc | sc_type_const | sc_type_fuz_arc | sc_type_perm_arc] = {f: "-/>", b: "</-"};
    SCs.Connectors[sc_type_membership_arc | sc_type_const | sc_type_pos_arc | sc_type_temp_arc] = {f: "~>", b: "<~"};
    SCs.Connectors[sc_type_membership_arc | sc_type_const | sc_type_neg_arc | sc_type_temp_arc] = {f: "~|>", b: "<|~"};
    SCs.Connectors[sc_type_membership_arc | sc_type_const | sc_type_fuz_arc | sc_type_temp_arc] = {f: "~/>", b: "</~"};
    SCs.Connectors[sc_type_var | sc_type_membership_arc | sc_type_pos_arc | sc_type_perm_arc] = {f: "_->", b: "_<-"};
    SCs.Connectors[sc_type_var | sc_type_membership_arc | sc_type_neg_arc | sc_type_perm_arc] = {f: "_-|>", b: "_<|-"};
    SCs.Connectors[sc_type_var | sc_type_membership_arc | sc_type_fuz_arc | sc_type_perm_arc] = {f: "_-/>", b: "_</-"};
    SCs.Connectors[sc_type_var | sc_type_membership_arc | sc_type_pos_arc | sc_type_temp_arc] = {f: "_~>", b: "_<~"};
    SCs.Connectors[sc_type_var | sc_type_membership_arc | sc_type_neg_arc | sc_type_temp_arc] = {f: "_~|>", b: "_<|~"};
    SCs.Connectors[sc_type_var | sc_type_membership_arc | sc_type_fuz_arc | sc_type_temp_arc] = {f: "_~/>", b: "_</~"};


    SCs.SCnConnectors[sc_type_common_edge] = {f: "↔", b: "↔"};
    SCs.SCnConnectors[sc_type_common_arc] = {f: "→", b: "←"};
    SCs.SCnConnectors[sc_type_membership_arc] = {f: "..∍", b: "∊.."};
    SCs.SCnConnectors[sc_type_common_edge | sc_type_const] = {f: "⇔", b: "⇔"};
    SCs.SCnConnectors[sc_type_common_edge | sc_type_var] = {f: "⇐⇒", b: "⇐⇒"};
    SCs.SCnConnectors[sc_type_common_arc | sc_type_const] = {f: "⇒", b: "⇐"};
    SCs.SCnConnectors[sc_type_common_arc | sc_type_var] = {f: "_⇒", b: "_⇐"};
    SCs.SCnConnectors[sc_type_membership_arc | sc_type_const | sc_type_pos_arc | sc_type_perm_arc] = {f: "∍", b: "∊"};
    SCs.SCnConnectors[sc_type_membership_arc | sc_type_const | sc_type_neg_arc | sc_type_perm_arc] = {f: "∌", b: "∉"};
    SCs.SCnConnectors[sc_type_membership_arc | sc_type_const | sc_type_fuz_arc | sc_type_perm_arc] = {f: "/∍", b: "∊/"};
    SCs.SCnConnectors[sc_type_membership_arc | sc_type_const | sc_type_pos_arc | sc_type_temp_arc] = {f: "~∍", b: "∊~"};
    SCs.SCnConnectors[sc_type_membership_arc | sc_type_const | sc_type_neg_arc | sc_type_temp_arc] = {f: "~∌", b: "∉~"};
    SCs.SCnConnectors[sc_type_membership_arc | sc_type_const | sc_type_fuz_arc | sc_type_temp_arc] = {f: "~/∍", b: "∊/~"};
    SCs.SCnConnectors[sc_type_var | sc_type_membership_arc | sc_type_pos_arc | sc_type_perm_arc] = {f: "_∍", b: "_∊"};
    SCs.SCnConnectors[sc_type_var | sc_type_membership_arc | sc_type_neg_arc | sc_type_perm_arc] = {f: "_∌", b: "_∉"};
    SCs.SCnConnectors[sc_type_var | sc_type_membership_arc | sc_type_fuz_arc | sc_type_perm_arc] = {f: "_/∍", b: "_∊/"};
    SCs.SCnConnectors[sc_type_var | sc_type_membership_arc | sc_type_pos_arc | sc_type_temp_arc] = {f: "_~∍", b: "_∊~"};
    SCs.SCnConnectors[sc_type_var | sc_type_membership_arc | sc_type_neg_arc | sc_type_temp_arc] = {f: "_~∌", b: "_∉~"};
    SCs.SCnConnectors[sc_type_var | sc_type_membership_arc | sc_type_fuz_arc | sc_type_temp_arc] = {f: "_~/∍", b: "_∊/~"};
});
