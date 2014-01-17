/* --- src/scs.js --- */
var SCs = SCs || { version: "0.1.0" };

SCs.Connectors = {};
SCs.SCnConnectors = {};
SCs.SCnSortOrder = [,
                'nrel_main_idtf',
                'nrel_system_identifier',
                'nrel_idtf',
                'nrel_section_base_order',
                'nrel_section_decomposition'
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

};

SCs.Viewer.prototype = {

    init: function(container, keynode_func) {
        this.containerId = '#' + container;
        this.getKeynode = keynode_func;

        this.tree = new SCs.SCnTree();
        this.tree.init();
        
        this.output = new SCs.SCnOutput();
        this.output.init(this.tree, container, this.getKeynode);
    },
    
    /*! Append new scs-data to visualize
     */
    appendData: function(data) {
        this.tree.build(data.keywords, data.triples);
        $(this.containerId).html($(this.containerId).html() + this.output.toHtml());
    },

    getAddrs: function() {
        return this.tree.addrs;
    },

    getLinks: function() {
        return this.output.sc_links;
    }

};


/* --- src/scs-output.js --- */
SCs.Output = function() {
};

SCs.Output.prototype = {
    
    init: function(tree) {
        this.tree = tree;
    },

    
};


/* --- src/scn-output.js --- */
SCs.SCnOutput = function() {
};

SCs.SCnOutput.prototype = {
    
    init: function(tree, container, keynode_func) {
        this.tree = tree;
        this.container = container;
        this.sc_links = [];
        this.linkCounter = 0;
        this.getKeynode = keynode_func;
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
            output = '<div class="scs-scn-field"><div class="scn-keyword"><a href="#" class="scs-scn-element" sc_addr="' + treeNode.element.addr + '">' + treeNode.element.addr + '</a></div>';
            output += childsToHtml();
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
                    output += '<a href="#" class="scs-scn-element" sc_addr="' + attr.n.addr + '">' + attr.n.addr + '</a>' + '<span>' + sep + '</span>';
                }
                output += '</div>';
            }

            if (treeNode.mergePrev || treeNode.mergeNext) {
                output += '<div style="padding-left: 15px"><div class="scs-scn-field-marker scs-scn-element">' + SCs.SCnBallMarker + '</div></div>';
                output += '<div style="padding-left: 30px">';
            } else {
                output += '<div style="padding-left: 15px">';
            }

            if (!treeNode.isSet) {
                output += this.treeNodeElementHtml(treeNode);
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
            output += '</div>';


            output += '</div>';
        }

        return output;
    },

    treeNodeElementHtml: function(treeNode) {

        if (treeNode.element.type & sc_type_link) {
            var containerId = this.container + '_' + this.linkCounter;
            this.linkCounter++;
            this.sc_links[containerId] = treeNode.element.addr;
            return '<div class="scs-scn-element scs-scn-content scs-scn-field" id="' + containerId + '" sc_addr="' + treeNode.element.addr + '">' + '</div>';
        }

       /* if (treeNode.isSet) {
            var res = '';
            res += '{';
            for (idx in treeNode.childs) {
                if (!treeNode.childs[idx].isSetElement) continue;
                res += this.treeNodeHtml(treeNode.childs[idx]);
            }
            res += '}';
            
            return res;
        }*/
        
        return '<a href="#" class="scs-scn-element scs-scn-field" sc_addr="' + treeNode.element.addr + '">' + treeNode.element.addr + '</a>';
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
        for (idx in SCs.SCnSortOrder) {
            var addr = this.getKeynode(SCs.SCnSortOrder[idx]);
            if (addr)
                orderMap[addr] = idx;
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
                    if (!res || (v && v < res)) {
                        res = v;
                    }
                }
                return res + 1;
            }
            
            if (a.parent && b.parent) {
                if (a.parent != b.parent) throw "Not equal parents";
                if (a.parent.isSet) {
                    var oA = a.parent.setOrder[a.element.addr];
                    var oB = a.parent.setOrder[b.element.addr];

                    if (oA && oB) {
                        return oA - oB;
                    } else {
                        if (!oA && oB) return 1;
                        if (!oB && oA) return -1;
                    }
                    
                    return 0;
                }
            }
            
            var orderA = minOrderAttr(a.attrs);
            var orderB = minOrderAttr(b.attrs);
            
            if (orderA && orderB) {
                return orderA - orderB;
            } else {
                if (!orderA && orderB) return 1;
                if (!orderB && orderA) return -1;
            }

            // order by attribute addrs (simple compare, without semantic)
            // order by subject node addrs
            // order by arc type
            
            return 0;
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
    
    init: function() {
        this.nodes = [];
        this.addrs = [];    // array of sc-addrs
        this.links = [];
        this.triples = [];
    },
    
    /**
     * Append new addr into sc-addrs list
     */
    _appendAddr: function(el) {
        if (!(el.type & sc_type_link) && this.addrs.indexOf(el.addr) < 0) {
            this.addrs.push(el.addr);
        }
    },
    
    /*! Builds tree based on array of triples
     * @param {Array} keyords Array of keywords
     * @param {Array} triples Array of triples
     */
    build: function(keywords, triples) {
        var queue = [];
        this.triples = triples;
        // first of all we need to create root nodes for all keywords
        for (i in keywords) {
            var node = new SCs.SCnTreeNode();
            
            node.type = SCs.SCnTreeNodeType.Keyword;
            node.element = keywords[i];
            node.level = -1;
            
            this.nodes.push(node);
            queue.push(node);
        }
        
        this.buildLevels(queue, triples);
    },
    
    buildLevels: function(queue, triples) {
    
        while (queue.length > 0) {
            var node = queue.shift();
            
            // try to find triple that can be added as child to tree node
            var idx = 0;
            while (idx < triples.length) {
                var tpl = triples[idx];
                var found = false;
                var backward = false;
                
                if (!tpl.output && !tpl.ignore) {
                    // arc attributes
                    if (node.type == SCs.SCnTreeNodeType.Sentence) {
                        if ((tpl[0].type & (sc_type_node_role | sc_type_node_norole)) 
                                && (tpl[1].type & sc_type_arc_pos_const_perm | sc_type_var)
                                && tpl[2].addr == node.predicate.addr) {
                            node.attrs.push({n: tpl[0], a: tpl[1], triple: tpl});
                            tpl.output = true;
                            
                            this._appendAddr(tpl[0]);
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
                    
                    if (found) {
                        var nd = new SCs.SCnTreeNode();
            
                        nd.type = SCs.SCnTreeNodeType.Sentence;
                        nd.element = el;
                        nd.predicate = predicate;
                        nd.level = node.level + 1;
                        nd.parent = node;
                        nd.backward = backward;
                        tpl.scn = { treeNode: nd };
                        
                        node.childs.push(nd);
                        nd.triple = tpl;
                        tpl.output = true;
                        
                        queue.push(nd);
                        
                        this._appendAddr(tpl[0]);
                        this._appendAddr(tpl[1]);
                        this._appendAddr(tpl[2]);
                    }
                }
                
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


/* --- src/scs-component.js --- */
SCsComponent = {
    ext_lang: 'scs_code',
    formats: ['format_scs_json'],
    factory: function(sandbox) {
        return new SCsViewer(sandbox);
    },
    getRequestKeynodes: function() {
        var keynodes = ['nrel_section_base_order'];
        return keynodes.concat(SCs.SCnSortOrder);
    }
};

var SCsViewer = function(sandbox) {
    this.init(sandbox);
    return this;
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

SCsViewer.prototype = {
    
    container: null,
    objects: [],
    addrs: [],
    sc_links: {}, // map of sc-link objects key:addr, value: object
    data: null,
    sandbox: null,
    
    init: function(sandbox) {
        this.container = '#' + sandbox.container;
        this.sandbox = sandbox;
        
        this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
        this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
        this.sandbox.eventApplyTranslation = $.proxy(this.updateTranslation, this);
        
        var self = this;
        $(this.container).delegate('[sc_addr]', 'click', function(e) {
            self.sandbox.doDefaultCommand([$(e.currentTarget).attr('sc_addr')]);
        });
        
        this.viewer = new SCs.Viewer();
        this.viewer.init(sandbox.container, $.proxy(sandbox.getKeynode, sandbox));
    },
    
    // ---- window interface -----
    receiveData: function(data) {
        this.data = data;
        this.viewer.appendData(data);
        
        this.sandbox.createViewersForScLinks(this.viewer.getLinks(), 
                            function() { // success

                            }, function() { // error

                            });
    },
    
    updateTranslation: function(namesMap) {
        // apply translation
        $(this.container + ' [sc_addr]').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr]) {
                $(element).text(namesMap[addr]);
            } else {
                if (!$(element).hasClass('scs-scn-content'))
                    $(element).html('<b>ⵔ</b>');
            }
        });
    },
    
    getObjectsToTranslate: function() {
        return this.viewer.getAddrs();
    }
    

};

SCWeb.core.ComponentManager.appendComponentInitialize(SCsComponent);


