/* --- src/scs.js --- */
var SCs = SCs || { version: "0.1.0" };

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

$(document).ready(function() {
    SCs.Connectors[sc_type_edge_common] = {f: "<>", b: "<>"};
    SCs.Connectors[sc_type_arc_common] = {f: ">", b: "<"};
    SCs.Connectors[sc_type_arc_access] = {f: "..>", b: "<.."};
    SCs.Connectors[sc_type_edge_common | sc_type_const] = {f: "<=>", b: "<=>"};
    SCs.Connectors[sc_type_edge_common | sc_type_var] = {f: "_<=>", b: "_<=>"};
    SCs.Connectors[sc_type_arc_common | sc_type_const] = {f: "=>", b: "<="};
    SCs.Connectors[sc_type_arc_common | sc_type_var] = {f: "_=>", b: "_<="};
    SCs.Connectors[sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm] = {f: "->", b: "<-"};
    SCs.Connectors[sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_perm] = {f: "-|>", b: "<|-"};
    SCs.Connectors[sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_perm] = {f: "-/>", b: "</-"};
    SCs.Connectors[sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_temp] = {f: "~>", b: "<~"};
    SCs.Connectors[sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_temp] = {f: "~|>", b: "<|~"};
    SCs.Connectors[sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_temp] = {f: "~/>", b: "</~"};
    SCs.Connectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm] = {f: "_->", b: "_<-"};
    SCs.Connectors[sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_perm] = {f: "_-|>", b: "_<|-"};
    SCs.Connectors[sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_perm] = {f: "_-/>", b: "_</-"};
    SCs.Connectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_temp] = {f: "_~>", b: "_<~"};
    SCs.Connectors[sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_temp] = {f: "_~|>", b: "_<|~"};
    SCs.Connectors[sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_temp] = {f: "_~/>", b: "_</~"};


    SCs.SCnConnectors[sc_type_edge_common] = {f: "↔", b: "↔"};
    SCs.SCnConnectors[sc_type_arc_common] = {f: "→", b: "←"};
    SCs.SCnConnectors[sc_type_arc_access] = {f: "..∍", b: "∊.."};
    SCs.SCnConnectors[sc_type_edge_common | sc_type_const] = {f: "⇔", b: "⇔"};
    SCs.SCnConnectors[sc_type_edge_common | sc_type_var] = {f: "⇐⇒", b: "⇐⇒"};
    SCs.SCnConnectors[sc_type_arc_common | sc_type_const] = {f: "⇒", b: "⇐"};
    SCs.SCnConnectors[sc_type_arc_common | sc_type_var] = {f: "_⇒", b: "_⇐"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm] = {f: "∍", b: "∊"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_perm] = {f: "∌", b: "∉"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_perm] = {f: "/∍", b: "∊/"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_temp] = {f: "~∍", b: "∊~"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_temp] = {f: "~∌", b: "∉~"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_temp] = {f: "~/∍", b: "∊/~"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm] = {f: "_∍", b: "_∊"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_perm] = {f: "_∌", b: "_∉"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_perm] = {f: "_/∍", b: "_∊/"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_temp] = {f: "_~∍", b: "_∊~"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_temp] = {f: "_~∌", b: "_∉~"};
    SCs.SCnConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_temp] = {f: "_~/∍", b: "_∊/~"};
});


/* --- src/scs-viewer.js --- */
SCs.Viewer = function() {
    
    this.sandbox = null;
    this.containerId = null;
    this.getKeynode = null;
    this.tree = null;
    this.output = null;


    this.init = function(sandbox, keynode_func) {
        this.sandbox = sandbox;
        this.containerId = '#' + sandbox.container;
        this.getKeynode = keynode_func;

        this.tree = new SCs.SCnTree();
        this.tree.init(null, keynode_func);
        
        this.output = new SCs.SCnOutput();
        this.output.init(this.tree, sandbox.container, this.getKeynode, this.sandbox.generateWindowContainer);
    };
    
    this.appendData = function(data) {
        var self = this;
        this.tree.build(data.keywords, data.triples);
        $(self.containerId).html($(self.containerId).html() + self.output.toHtml());
    };

    this.getAddrs = function() {
        return this.tree.addrs;
    };

    this.getLinks = function() {
        return this.output.sc_links;
    };

};



/* --- src/scs-output.js --- */
SCs.Output = function() {
};

SCs.Output.prototype = {
    
    init: function(tree) {
        this.tree = tree;
    },

    
};


/* --- src/scs-types.js --- */



/* --- src/scn-output.js --- */
SCs.SCnOutput = function() {
};

SCs.SCnOutput.prototype = {
    
    init: function(tree, container, keynode_func, gen_window_func) {
        this.tree = tree;
        this.container = container;
        this.sc_links = [];
        this.linkCounter = 0;
        this.getKeynode = keynode_func;
        this.generateWindow = gen_window_func;
        new SCs.Highlighter(container).init();
    },

    /*! Returns string that contains html representation of scn-text
     */
    toHtml: function() {
        this.determineSets();
        this.treeSort();
        this.treeMerge();

        var output = '';

        for (idx in this.tree.nodes) {
            output += this.treeNodeHtml(this.tree.nodes[idx]);
        }

        return output;
    },

    /*! Returns string that contains html representation of scn-tree node
     */
    treeNodeHtml: function(treeNode) {
        var output = '';
        var offset = 0;

        var self = this;
        function childsToHtml() {
            var output = '';
            for (idx in treeNode.childs) {
                if (treeNode.childs[idx].isSetElement) continue;
                output += self.treeNodeHtml(treeNode.childs[idx]);
            }
            return output;
        }

        if (treeNode.type == SCs.SCnTreeNodeType.Keyword) {
            output = '<div class="scs-scn-field scs-scn-field-root"><div class="scs-scn-keyword">' + this.treeNodeElementHtml(treeNode, true) + '</div>';

            if (treeNode.element.type & sc_type_link) {
                output += '<div class="scs-scn-field"><div class="scs-scn-field-marker scs-scn-element">=</div>'
                        //+ '' //sc_addr="' + treeNode.element.addr + '">'
                        + this.treeNodeElementHtml(treeNode);
                        + '</div>';
            }
            output += childsToHtml();
             
            var contourTree = this.tree.subtrees[treeNode.element.addr];
            if (contourTree) {
                output += '<div class="scs-scn-field-marker scs-scn-element">=</div>'
                        + '<div class="scs-scn-element sc-contour scs-scn-field">' //sc_addr="' + treeNode.element.addr + '">'
                        + this.subtreeToHtml(contourTree)
                        + '</div>';
            }

            output += '</div>';
        } else {
            var marker = SCs.SCnConnectors[treeNode.predicate.type];
            marker = treeNode.backward ? marker.b : marker.f;
            if (treeNode.isSetElement) {
                marker = SCs.SCnBallMarker;
            }
            
            if (!treeNode.mergePrev) {
                output = '<div class="scs-scn-field">';
                output += '<div class="scs-scn-field-marker scs-scn-element">' + marker + '</div>';
            }

            if (treeNode.attrs.length > 0 && !treeNode.mergePrev) {
                output += '<div>';
                for (idx in treeNode.attrs) {
                    var attr = treeNode.attrs[idx];
                    var sep = '∶';
                    if (attr.a.type & sc_type_var) {
                        sep = '∷';
                    }
                    output += '<a href="#" class="scs-scn-element scs-scn-highlighted" sc_addr="' + attr.n.addr + '">' + attr.n.addr + '</a>' + '<span>' + sep + '</span>';
                }
                output += '</div>';
            }

            if (treeNode.mergePrev || treeNode.mergeNext) {
                output += '<div style="padding-left: 20px"><div class="scs-scn-field-marker scs-scn-element">' + SCs.SCnBallMarker + '</div></div>';
                output += '<div style="padding-left: 40px">';
            } else {
                output += '<div style="padding-left: 20px">';
            }

            if (!treeNode.isSet) {
                var contourTree = this.tree.subtrees[treeNode.element.addr];
                if (contourTree) {
                    output += '<div class="scs-scn-element sc-contour scs-scn-field scs-scn-highlighted" sc_addr="' + treeNode.element.addr + '">'
                            + this.subtreeToHtml(contourTree) + '</div>';
                } else {
                    output += this.treeNodeElementHtml(treeNode);
                }
                output += childsToHtml();
            } else {
                output += '{';
                for (idx in treeNode.childs) {
                    if (!treeNode.childs[idx].isSetElement) continue;
                    output += self.treeNodeHtml(treeNode.childs[idx]);
                }
                output += '}';
                output += childsToHtml();
            }
            if (!treeNode.mergePrev)
                output += '</div>';
            output += '</div>';
        }

        

        return output;
    },

    treeNodeElementHtml: function(treeNode, isKeyword) {

        if (!isKeyword && treeNode.element.type & sc_type_link) {
            var containerId = this.container + '_' + this.linkCounter;
            this.linkCounter++;
            this.sc_links[containerId] = treeNode.element.addr;
            return this.generateWindow(containerId, "scs-scn-field", "scs-scn-highlighted scs-scn-element", treeNode.element.addr);
            //return '<div class="scs-scn-element sc-content scs-scn-field scs-scn-highlighted" id="' + containerId + '" sc_addr="' + treeNode.element.addr + '">' + '</div>';
        }

        if (treeNode.element.type & sc_type_arc_mask) {
            var einfo = this.tree.getEdgeInfo(treeNode.element.addr);
            if (einfo) {
                var marker = SCs.SCnConnectors[treeNode.element.type];
                return '(<a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted" sc_addr="' + einfo.source.addr + '">' + einfo.source.addr + '</a>\
                        <a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted scs-scn-connector" sc_addr="' + treeNode.element.addr + '">'
                        + marker.f + '</a>\
                        <a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted" sc_addr="' + einfo.target.addr + '">' + einfo.target.addr + '</a>)';
            }
        }
        
        return '<a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted" sc_addr="' + treeNode.element.addr + '">' + treeNode.element.addr + '</a>';
    },

    subtreeToHtml: function(subtree) {
        var scnOutput = new SCs.SCnOutput();
        scnOutput.init(subtree, this.container, this.getKeynode);
        scnOutput.linkCounter = this.linkCounter;
        scnOutput.generateWindow = this.generateWindow;

        var res = scnOutput.toHtml();
        this.linkCounter = scnOutput.linkCounter;
        for (j in scnOutput.sc_links) {
            this.sc_links[j] = scnOutput.sc_links[j];
        }
        return res;
    },

    /*! Sort tree elements
     */
    treeSort: function() {
        var queue = [];
        for (idx in this.tree.nodes) {
            queue.push(this.tree.nodes[idx]);
        }

        // prepare order map
        var orderMap = {}; 
        for (var idx = 0; idx < SCs.SCnSortOrder.length; ++idx) {
            var addr = this.getKeynode(SCs.SCnSortOrder[idx]);
            if (addr)
                orderMap[addr] = idx + 1;
        }
        

        function sortCompare(a, b) {
            // determine order by attributes
            function minOrderAttr(attrs) {

                // sort attributes by names
                function compareAttr(a, b) {
                    return a.n.addr < b.n.addr;
                }
                attrs.sort(compareAttr);

                var res = null;
                for (i in attrs) {
                    var v = orderMap[attrs[i].n.addr];
                    if (!v) {
						v = SCs.SCnSortOrder.length;
					}
					if (attrs[i].n.type & sc_type_node_role) {
						if (v === null) {
							v = 0;
						}
						v += 10;
					}
                    if (!res || (v && v < res)) {
                        res = v;
                    }
                }
                return (res === null) ? ((attrs.length > 0) ? (SCs.SCnSortOrder.length + 1) : null) : (res + 1);
            }
            
            function joinAttrs(attrs) {
				var res = '';
				for (a in attrs) {
					res += attrs[a].n.addr;
				}
				return res;
			}
            
            if (a.parent && b.parent) {
                if (a.parent != b.parent) throw "Not equal parents";
                if (a.parent.isSet) {
                    var oA = a.parent.setOrder[a.element.addr];
                    var oB = a.parent.setOrder[b.element.addr];

                    if (oA && oB) {
						return oA - oB;
                    } else {
                        if (!oA && oB) {
							return 1;
						}
                        if (!oB && oA) {
							return -1;
						}
                    }
                    
                    return 0;
                }
            }
            
            var orderA = minOrderAttr(a.attrs);
            var orderB = minOrderAttr(b.attrs);
            
            if (orderA && orderB) {
                var d = orderA - orderB;
                if (d !== 0) {
					return d;
				}
				
				return joinAttrs(a.attrs) < joinAttrs(b.attrs);
            } else {
                if (!orderA && orderB) {
					return 1;
				}
                if (!orderB && orderA) {
					return -1;
				}
            }

            // order by attribute addrs (simple compare, without semantic)
            // order by subject node addrs
            // order by arc type
            
            return a.element.addr < b.element.addr;
        }

        while (queue.length > 0) {
            var node = queue.shift();

            node.childs.sort(sortCompare);
            for (idx in node.childs) {
                queue.push(node.childs[idx]);
            }
        }
    },

    /*! Merge tree nodes by levels using attributes
     */
    treeMerge: function() {
        var queue = [];
        for (idx in this.tree.nodes) {
            queue.push(this.tree.nodes[idx]);
        }

        function compareAttrs(a1, a2) {
            if (a1.length != a2.length) return false;
            for (var i = 0; i < a1.length; ++i) {
                if (a1[i].n.addr != a2[i].n.addr)
                    return false;
            }
            return true;
        }

        while (queue.length > 0) {
            var node = queue.shift();

            if (node.childs.length > 0) {
                queue.push(node.childs[0]);
            }
            for (var idx = 1; idx < node.childs.length; ++idx) {
                var n1 = node.childs[idx - 1];
                var n2 = node.childs[idx];
                
                if (n1.attrs.length == 0 || n2.attrs.length == 0) continue;
                if (n1.backward != n2.backward) continue;

                if (compareAttrs(n1.attrs, n2.attrs)) {
                    n1.mergeNext = true;
                    n2.mergePrev = true;
                }
                queue.push(n2);
            }
        }
    },

    /*! Determine all sets in tree and prepare them for visualization
     */
    determineSets: function() {

        // collect all possible order attributes list
        var orderKeys = [this.getKeynode('nrel_section_base_order')];
        var orderAttrs = [];
        for (idx in this.tree.triples) {
            var tpl = this.tree.triples[idx];
            for (key in orderKeys) {
                if (tpl[0].addr == orderKeys[key]) {
                    orderAttrs.push(tpl);
                    break;
                }
            }
        }
        
        var queue = [];
        for (idx in this.tree.nodes) {
            queue.push(this.tree.nodes[idx]);
        }

        while (queue.length > 0) {
            var node = queue.shift();

            for (idx in node.childs)
                queue.push(node.childs[idx]);

            if (node.type == SCs.SCnTreeNodeType.Keyword) continue;
            if (!(node.element.type & sc_type_node_tuple)) continue;

            // find all child nodes of set
            var elements = [];
            var idx = 0;
            while (idx < node.childs.length) {
                var child = node.childs[idx];
                if (child.predicate.type == sc_type_arc_pos_const_perm) {
                    elements = elements.concat(node.childs.splice(idx, 1));
                } else {
                    idx++;
                }
            }

            node.setOrder = {};

            function checkInElements(addr) {
                for (j in elements) {
                    if (elements[j].element.addr == addr) {
                        return true;
                    }
                }
                return false;
            }
            // TODO: optimize that code
            // try to determine order of elements in set
            var orderTriples = [];
            for (idx in this.tree.triples) {
                var tpl = this.tree.triples[idx];
                
                if (tpl[1].type != (sc_type_arc_common | sc_type_const)) continue;
                if (!checkInElements(tpl[0].addr) || !checkInElements(tpl[2].addr)) continue;
                
                // determine if it's order relation
                var found = false;
                for (attr in orderAttrs) {
                    var a = orderAttrs[attr];
                    if (a[2].addr == tpl[1].addr) {
                        found = true;
                        a.ignore = true;
                        break;
                    }
                }

                if (!found) continue;
                
                // now change odred elements. create order map
                node.setOrder[tpl[0].addr] = tpl[2].addr;
                tpl.ignore = true;
                orderTriples.push(tpl);
            }

            // reorganize setOder
            var setOrder = node.setOrder;
            node.setOrder = {};
            var values = [];
            for (key in setOrder) {
                values.push(setOrder[key]);
            }
            var src = null;
            for (key in setOrder) {
                if (values.indexOf(key) < 0) {
                    src = key;
                    break;
                }
            }
            var i = 1;
            while (src) {
                node.setOrder[src] = i;
                i++;
                src = setOrder[src];
            }

            // insert set elements at the begin of childs
            for (idx in elements) {
                elements[idx].isSetElement = true;
                node.childs.unshift(elements[idx]);
            }

            // rebuild tree, we need to find place for triples, that was sub-trees for order relations
            for (idx in orderTriples) {
                var tpl = orderTriples[idx];
                this.tree.destroySubTree(tpl.scn.treeNode);
            }
            

            node.isSet = elements.length > 0;
        }
    },

};


/* --- src/scn-tree.js --- */
SCs.SCnTree = function() {
    
};

SCs.SCnTree.prototype = {
    
    init: function(contourAddr, keynode_func) {
        this.nodes = [];
        this.addrs = [];    // array of sc-addrs
        this.links = [];
        this.triples = [];
        this.usedLinks = {};
        this.subtrees = {}; // dictionary of subtrees (contours)
        this.contourAddr = contourAddr;    // sc-addr of contour, that structure build with this tree
        this.getKeynode = keynode_func;
    },
    
    /**
     * Append new addr into sc-addrs list
     */
    _appendAddr: function(el) {
        if (!(el.type & sc_type_link) && this.addrs.indexOf(el.addr) < 0) {
            this.addrs.push(el.addr);
        }
    },
    
    /** Determine all subtrees in triples
     */
    determineSubTrees: function() {
        // collect subtree elements
        var subtrees = {};
        var idx = 0;

        var tu = new TripleUtils();

        for (t in this.triples)
            tu.appendTriple(this.triples[t]);
        
        function isElementExist(st, addr) {
            for (j in st.elements) {
                if (st.elements[j].el.addr == addr)
                    return true;
            }
            return false;
        }

        while (idx < this.triples.length) {
            var tpl = this.triples[idx];
            
            if ((tpl[1].type != sc_type_arc_pos_const_perm) || !(tpl[0].type & sc_type_node_struct) || (tpl[0].addr == this.contourAddr)) {
                idx++;
                continue;
            }
            
            // check if there are any input/output arcs
            tpl.ignore = true;
            for (k in this.triples) {
                if (this.triples[k][0].addr == tpl[1].addr || this.triples[k][2].addr == tpl[1].addr) {
                    tpl.ignore = false;
                    break;
                }
            }

            var st = subtrees[tpl[0].addr];
            if (st) {
                if (!isElementExist(st, tpl[2].addr))
                    st.elements.push({el: tpl[2], tpl: tpl});
            } else {
                subtrees[tpl[0].addr] = {el: tpl[0], elements: [{el: tpl[2], tpl: tpl}], triples: []};
            }
            
            idx++;
        }
        
        // we have elements, so we need to find all triples, where all element exist in subtree contour
        idx = 0;
        while (idx < this.triples.length) {
            var tpl = this.triples[idx];
            var used = false;
            for (addr in subtrees) {
                var st = subtrees[addr];
                
                if (!isElementExist(st, tpl[0].addr) || !isElementExist(st, tpl[1].addr) || !isElementExist(st, tpl[2].addr)) {
                    continue;
                }
                
                st.triples = st.triples.concat(this.triples.splice(idx, 1));
                used = true;
                break;
            }
            
            if (!used)
                idx++;
        }
        
        // if subtree has no any elements, then merge it back to main tree
        var delKeys = [];
        for (addr in subtrees) {
            if (subtrees[addr].elements.length < 3) {
                delKeys.push(addr);
            }
        }
        
        for (idx in delKeys) {
            var st = subtrees[delKeys[idx]];
            this.triples = this.triples.concat(st.triples);
            delete subtrees[delKeys[idx]];
        }
        
        var self = this;
        
        // build tree objects
        for (addr in subtrees) {
            var subtree = subtrees[addr];
            var tree = new SCs.SCnTree();
            tree.init(subtree.el.addr, this.getKeynode);

            // now we need to find keynodes for subtree
            var key_key = this.getKeynode('rrel_key_sc_element');
            var keywordsList = [];
            var keywords = tu.find5_f_a_a_a_f(addr, 
                sc_type_arc_pos_const_perm,
                0,
                sc_type_arc_pos_const_perm,
                key_key);
            if (keywords) {
                // try to find order
                var klist = [];
                var elements = {};
                var orderMap = {};
                var orderMapReverse = {};
                for (k in keywords) {
                    var a = keywords[k][1].addr;
                    klist.push(a);
                    elements[a] = keywords[k][2];
                }
                
                var order_key = this.getKeynode('nrel_key_sc_element_base_order');
                for (var i = 0; i < klist.length; i++) {
                    for (var j = 0; j < klist.length; j++) {

                        if (i === j) continue;

                        var result = tu.find5_f_a_f_a_f(klist[i],
                            sc_type_arc_common | sc_type_const,
                            klist[j],
                            sc_type_arc_pos_const_perm,
                            order_key);
                        if (result) {
                            orderMap[klist[i]] = klist[j];
                            orderMapReverse[klist[j]] = klist[i];
                        }
                    }
                }

                // now we need to apply order if it exist
                var ordered = {};
                var order_start = null;
                for (o in orderMap) {
                    var v = orderMap[o];
                    if (!orderMapReverse[v]) {
                        order_start = v;
                        break;
                    }
                }
                
                // fill keywords list
                while (order_start) {
                    keywordsList.push(elements[order_start]);
                    order_start = orderMap[order_start];
                }

                for (var i = 0; i < klist.length; i++) {
                    if (keywordsList.indexOf(klist[i]) < 0) {
                        keywordsList.push(elements[klist[i]]);
                    }
                }
            }
            
            // determine keywords by input/output arcs number
            if (keywordsList.length == 0) {
                var keywords = {};
                function addArc(el, value) {
                        
                    var n = value;
                    if (el.type & (sc_type_arc_mask | sc_type_link)) 
                        n += -2; // minimize priority of arcs
                        
                    if (keywords[el.addr]) 
                        keywords[el.addr].priority += n;
                    else 
                        keywords[el.addr] = {el: el, priority: n};
                }
                
                //---
                for (idx in subtree.triples) {
                    var tpl = subtree.triples[idx];
                    var n = 1;
                    
                    if (tpl[2].type & sc_type_arc_mask | tpl[0].type & sc_type_link)
                        n -= 1; // minimize priority of nodes, that has output/input arcs to other arcs or links
                    if (tpl[2].type & sc_type_link || tpl[0].type & sc_type_link)
                        n -= 1; // minimize priority of nodes, that has output/input arcs to links
                    if (tpl[1].type & (sc_type_arc_common | sc_type_edge_common))
                        n += 1;

                    if (tpl[0].addr != addr)
                        addArc(tpl[0], n);
                    if (tpl[2].addr != addr)
                        addArc(tpl[2], n);
                }
                
                var maxValue = -1;
                for (a in keywords) {
                    var el = keywords[a];
                    if (el.priority > maxValue) {
                        keywordsList = [el.el];
                        maxValue = el.priority;
                    }
                }
            }

            this.subtrees[addr] = tree;
            tree.build(keywordsList, subtree.triples);
            this.addrs = this.addrs.concat(tree.addrs);
        }
    },
    
    /*! Builds tree based on array of triples
     * @param {Array} keyords Array of keywords
     * @param {Array} triples Array of triples
     */
    build: function(keywords, triples) {

        var queue = [];
        this.triples = this.triples.concat(triples);
        
        // first of all we need to create root nodes for all keywords
        for (i in keywords) {
            var node = new SCs.SCnTreeNode();
            
            node.type = SCs.SCnTreeNodeType.Keyword;
            node.element = keywords[i];
            node.level = -1;
            
            this.nodes.push(node);
            queue.push(node);

            this._appendAddr(keywords[i]);
        }
        
        this.determineSubTrees();

        // collect triples to process
        this.triples_process = [];
        for (t in this.triples) {
            var tpl = this.triples[t];
            if (!tpl.output && !tpl.ignore)
                this.triples_process.push(tpl); 
        }
        this.buildLevels(queue, this.triples_process);
    },
    
    buildLevels: function(queue, triples) {
    
        while (queue.length > 0) {
            var node = queue.shift();

            // stop tree building after input sc_type_arc_pos_const_perm to sc_type_link
            if ((node.parent)
                && (node.parent.element.type & sc_type_link) 
                && (node.predicate.type == sc_type_arc_pos_const_perm)
                && (node.backward)
                ) {
                continue;
            }
            

            // try to find triple that can be added as child to tree node
            var idx = 0;
            while (idx < triples.length) {
                var tpl = triples[idx];
                var found = false;
                var backward = false;

                // collect all sc-addrs (do not collect addrs of edges in triples, because addrs used to resolve identifiers)
                this._appendAddr(tpl[0]);
                this._appendAddr(tpl[2]);
                
                if (!tpl.output && !tpl.ignore) {
                    // arc attributes
                    if (node.type == SCs.SCnTreeNodeType.Sentence) {
                        if ((tpl[0].type & (sc_type_node_role | sc_type_node_norole)) 
                                && (tpl[1].type & sc_type_arc_pos_const_perm | sc_type_var)
                                && tpl[2].addr == node.predicate.addr) {
                            node.attrs.push({n: tpl[0], a: tpl[1], triple: tpl});
                            tpl.output = true;
                            
                            //this._appendAddr(tpl[0]);
                        }
                    }
                    
                    var predicate = null, el = null;
                    if (tpl[0].addr == node.element.addr) {
                        predicate = tpl[1];
                        el = tpl[2];
                        found = true;
                    }
                    
                    if (tpl[2].addr == node.element.addr) {
                        predicate = tpl[1];
                        el = tpl[0];
                        found = true;
                        backward = true;
                    }
                    
                    if (found && !this.usedLinks[el.addr]) {
                        var nd = new SCs.SCnTreeNode();
            
                        nd.type = SCs.SCnTreeNodeType.Sentence;
                        nd.element = el;
                        nd.predicate = predicate;
                        nd.level = node.level + 1;
                        nd.parent = node;
                        nd.backward = backward;
                        tpl.scn = { treeNode: nd };

                        if (el.type & sc_type_link) {
                            this.usedLinks[el.addr] = el;
                        }
                        
                        node.childs.push(nd);
                        nd.triple = tpl;
                        tpl.output = true;
    
                        triples.splice(idx, 1);
                        
                        queue.push(nd);
                    } else 
                        ++idx;
                } else 
                    ++idx;
            }
        }
    },
    
    /*! Destroy whole node sub-trees of specified node.
     * @param {Object} node Node to destroy
     */
    destroySubTree: function(node) {
        var queue = [node];
        
        while (queue.length > 0) {
            var n = queue.shift();
            for (idx in n.childs) {
                queue.push(n.childs[idx]);
            }
            
            // remove from parent
            if (n.parent) {
                for (idx in n.parent.childs) {
                    var i = n.parent.childs.indexOf(n);
                    if (i >= 0) {
                        n.parent.childs.splice(i, 1);
                    }
                }
            }
            
            for (idx in n.attrs) {
                n.attrs[idx].triple.ouput = false;
            }
            
            n.triple.output = false;
            n.triple = null;
            n.parent = null;
            
            for (idx in node.childs) {
                queue.push(node.childs[idx]);
            }
            node.childs.splice(0, node.childs.length);
        }
    },
    
    /*! Returns information about specified edge.
     * Returned object has such properties:
     * - source - source element
     * - target - target element
     * - edge - edge element
     * If there are no info about specified edge, then returns null
     */
    getEdgeInfo: function(addr) {
        for (i in this.triples) {
            var tpl = this.triples[i];
            if (tpl[1].addr == addr)
                return {edge: tpl[1], source: tpl[0], target: tpl[2]};
        }
        return null;
    }
    
};


// ----------------------------------------
SCs.SCnTreeNodeType = {
    Keyword: 1,
    Sentence: 2
};

SCs.SCnTreeNode = function() {
    this.type = SCs.SCnTreeNodeType.Sentence;
    this.element = null;
    this.childs = new Array();   // list of child sentences for subject
    this.attrs = new Array();   // list of attributes
    this.predicate = null;      // sc-addr of arc
    this.backward = false;      // backwards flag for predicates
    this.level = -1;             // tree level
    this.parent = null;         // parent tree node
};

SCs.SCnTreeNode.prototype = {
    
};


/* --- src/scn-highlighter.js --- */
SCs.Highlighter = function(parent) {

	var elementQueue = [];
	var parentSelector = '#' + parent;

	var _elementEnter = function(event) {

		var elementToClearHover = _getLastElementInQueue();
		if (elementToClearHover) {
			jQuery(elementToClearHover).removeClass("scs-scn-hovered");
		}

		var elementToHover = event.currentTarget;
		elementQueue.push(elementToHover);
		jQuery(elementToHover).addClass("scs-scn-hovered");
	};

	var _elementLeave = function(event) {

		elementQueue.pop();
		jQuery(event.currentTarget).removeClass("scs-scn-hovered");

		var elementToHover = _getLastElementInQueue();
		if (elementToHover) {
			jQuery(elementToHover).addClass("scs-scn-hovered");
		}
	};

	var _getLastElementInQueue = function() {

		return elementQueue[elementQueue.length - 1];
	};

	return {
		init : function() {

			var selectableClassExpr = "." + "scs-scn-highlighted";
			var hoveredClassExpr = "." + "scs-scn-hovered";
			jQuery(parentSelector).delegate(selectableClassExpr, 'mouseenter',
					jQuery.proxy(_elementEnter, this));
			jQuery(parentSelector).delegate(selectableClassExpr, 'mouseleave',
					jQuery.proxy(_elementLeave, this));
		},
	};
};

/* --- src/scs-component.js --- */
SCsComponent = {
    ext_lang: 'scs_code',
    formats: ['format_scs_json'],
    factory: function(sandbox) {
        return new SCsViewer(sandbox);
    },
    getRequestKeynodes: function() {
        var keynodes = ['nrel_section_base_order', 'rrel_key_sc_element', 'nrel_key_sc_element_base_order'];
        return keynodes.concat(SCs.SCnSortOrder);
    }
};

var SCsViewer = function(sandbox) {
    this.objects = new Array();
    this.addrs = new Array();
    this.sc_links = {}; // map of sc-link objects key:addr, value: object
    this.data = null
    
    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;
    
    // ---- window interface -----
    this.receiveData = function(data) {
        this.data = data;
        this.viewer.appendData(data);
        
        var dfd = new jQuery.Deferred();
        
        $.when(this.sandbox.createViewersForScLinks(this.viewer.getLinks())).then(
                            function() {
                                dfd.resolve();
                            }, 
                            function() {
                                dfd.reject();
                            });
        return dfd.promise();
    };
    
    this.updateTranslation = function(namesMap) {
        // apply translation
        $(SCWeb.ui.Core.selectorWindowScAddr(this.container)).each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if (!$(element).hasClass('sc-content') && !$(element).hasClass('sc-contour') && !$(element).hasClass('scs-scn-connector')) {
                if(namesMap[addr]) {
                    $(element).text(namesMap[addr]);
                } else {
                    
                        $(element).html('<b>...</b>');
                }
            }
        });
    };
    
    this.getObjectsToTranslate = function() {
        return this.viewer.getAddrs();
    };


    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
    this.sandbox.eventApplyTranslation = $.proxy(this.updateTranslation, this);
    
    this.viewer = new SCs.Viewer();
    this.viewer.init(sandbox, $.proxy(sandbox.getKeynode, sandbox));
    
    this.sandbox.updateContent();
};

var SCsConnectors = {};

$(document).ready(function() {
    
    SCsConnectors[sc_type_arc_pos_const_perm] = "->";
    SCsConnectors[sc_type_edge_common | sc_type_const] = "==";
    SCsConnectors[sc_type_edge_common | sc_type_var] = "_==";
    SCsConnectors[sc_type_arc_common | sc_type_const] = "=>";
    SCsConnectors[sc_type_arc_common | sc_type_var] = "_=>";
    SCsConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm] = "_->";
});


SCWeb.core.ComponentManager.appendComponentInitialize(SCsComponent);


