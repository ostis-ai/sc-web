/* --- src/scs.js --- */
var SCs = SCs || { version: "0.1.0" };

SCs.Connectors = {};
SCs.SCnConnectors = {};

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

    init: function(container) {
        this.containerId = '#' + container;
        this.tree = new SCs.SCnTree();
        this.tree.init();
        
        this.output = new SCs.SCnOutput();
        this.output.init(this.tree, container);
    },
    
    /*! Append new scs-data to visualize
     */
    appendData: function(data) {
        this.tree.build(data.keywords, data.triples);
        $(this.containerId).html(this.output.toHtml());
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
    
    init: function(tree, container) {
        this.tree = tree;
        this.container = container;
        this.sc_links = [];
        this.linkCounter = 0;
    },

    /*! Returns string that contains html representation of scn-text
     */
    toHtml: function() {
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

        if (treeNode.type == SCs.SCnTreeNodeType.Keyword) {
            output = '<div class="scn-keyword"><a href="#" class="scs-scn-element" sc_addr="' + treeNode.element.addr + '">' + treeNode.element.addr + '</a></div>';
        } else {
            var marker = SCs.SCnConnectors[treeNode.predicate.type];
            marker = treeNode.backward ? marker.b : marker.f;

            output = '<div class="scs-scn-field" style="padding-left: ' + (treeNode.level * 15) + 'px">';
            output += '<div class="scs-scn-field-marker scs-scn-element">' + marker + '</div>';
            if (treeNode.attrs.length > 0) {
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
                output += '<div style="padding-left: ' + (treeNode.level + 1) * 15 + 'px">' + this.treeNodeElementHtml(treeNode) + '</div>';
            } else {
                output += '<div>' + this.treeNodeElementHtml(treeNode) + '</div>';
            }
            output += '</div>';
        }

        for (idx in treeNode.childs) {
            output += this.treeNodeHtml(treeNode.childs[idx]);
        }

        return output;
    },

    treeNodeElementHtml: function(treeNode) {
        if (treeNode.element.type & sc_type_link) {
            var containerId = this.container + '_' + this.linkCounter;
            this.linkCounter++;
            this.sc_links[containerId] = treeNode.element.addr;
            return '<div class="scs-scn-element scs-scn-content" id="' + containerId + '" sc_addr="' + treeNode.element.addr + '">' + '</div>';
        } else {
            return '<a href="#" class="scs-scn-element" sc_addr="' + treeNode.element.addr + '">' + treeNode.element.addr + '</a>';
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
                
                if (!tpl.output) {
                    // arc attributes
                    if (node.type == SCs.SCnTreeNodeType.Sentence) {
                        if ((tpl[0].type & (sc_type_node_role | sc_type_node_norole)) 
                                && (tpl[1].type & sc_type_arc_pos_const_perm | sc_type_var)
                                && tpl[2].addr == node.predicate.addr) {
                            node.attrs.push({n: tpl[0], a: tpl[1]});
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
                    }
                    
                    if (found) {
                        var nd = new SCs.SCnTreeNode();
            
                        nd.type = SCs.SCnTreeNodeType.Sentence;
                        nd.element = el;
                        nd.predicate = predicate;
                        nd.level = node.level + 1;
                        nd.parent = node;
                        
                        node.childs.push(nd);
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
        this.viewer.init(sandbox.container);
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
                    $(element).text('●');
            }
        });
    },
    
    getObjectsToTranslate: function() {
        return this.viewer.getAddrs();
    }
    

};

SCWeb.core.ComponentManager.appendComponentInitialize(SCsComponent);


