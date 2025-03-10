SCs.SCnTree = function () {

};

SCs.SCnTree.prototype = {

    init: function (contourAddr, keynode_func) {
        this.nodes = [];
        this.addrs = [];    // array of sc-addrs
        this.links = [];
        this.identifiers = {};
        this.triples = [];
        this.usedLinks = {};
        this.subtrees = {}; // dictionary of subtrees (contours)
        this.contourAddr = contourAddr;    // sc-addr of contour, that structure build with this tree
        this.getKeynode = keynode_func;
    },

    /**
     * Append new addr into sc-addrs list
     */
    _appendAddr: function (el) {
        if (((el.type & sc_type_node_link) != sc_type_node_link) && this.addrs.indexOf(el.addr) < 0) {
            this.addrs.push(el.addr);
        }
    },

    /** Determine all subtrees in triples
     */
    determineSubTrees: function () {
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

            if ((tpl[1].type != sc_type_const_perm_pos_arc) || ((tpl[0].type & sc_type_node_structure) != sc_type_node_structure) || (tpl[0].addr == this.contourAddr)) {
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
                sc_type_const_perm_pos_arc,
                0,
                sc_type_const_perm_pos_arc,
                key_key);
            if (keywords) {
                // try to find order
                var klist = [];
                var elements = {};
                var orderMap = {};
                var orderMapReverse = {};
                for (k in keywords) {
                    var a = keywords[k][2].addr;
                    klist.push(a);
                    elements[a] = keywords[k][2];
                }

                var order_key = this.getKeynode('nrel_key_sc_element_base_order');
                for (var i = 0; i < klist.length; i++) {
                    for (var j = 0; j < klist.length; j++) {

                        if (i === j) continue;

                        var result = tu.find5_f_a_f_a_f(klist[i],
                            sc_type_common_arc | sc_type_const,
                            klist[j],
                            sc_type_const_perm_pos_arc,
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
                keywordsList = this.findKeywords(subtree.triples, addr);
            }

            this.subtrees[addr] = tree;
            tree.build(keywordsList, subtree.triples, self.identifiers);
            this.addrs = this.addrs.concat(tree.addrs);
        }
    },

    /*! Builds tree based on array of triples
     * @param {Array} keywords Array of keywords
     * @param {Array} triples Array of triples
     * @param {Map} identifiers Map of addr identifiers
     */
    build: function (keywords, triples, identifiers) {
        var queue = [];
        this.identifiers = identifiers;
        this.triples = this.triples.concat(triples);

        if (keywords.length == 0) {
            keywords = this.findKeywords(this.triples);
        }

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

    buildLevels: function (queue, triples) {
        while (queue.length > 0) {
            var node = queue.shift();

            // stop tree building after input sc_type_const_perm_pos_arc to sc_type_node_link
            if ((node.parent)
                && ((node.parent.element.type & sc_type_node_link) == sc_type_node_link)
                && (node.predicate.type == sc_type_const_perm_pos_arc)
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

                // collect all sc-addrs (do not collect addrs of connectors in triples, because addrs used to resolve identifiers)
                this._appendAddr(tpl[0]);
                this._appendAddr(tpl[2]);

                if (!tpl.output && !tpl.ignore) {
                    // arc attributes
                    if (node.type == SCs.SCnTreeNodeType.Sentence) {
                        if (((tpl[0].type & sc_type_node_role == sc_type_node_role) || (tpl[0].type & sc_type_node_non_role == sc_type_node_non_role))
                            && ((tpl[1].type == sc_type_const_perm_pos_arc) || (tpl[1].type == sc_type_var_perm_pos_arc))
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
                        tpl.scn = {treeNode: nd};

                        if ((el.type & sc_type_node_link) == sc_type_node_link) {
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
    destroySubTree: function (node) {
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

    /*! Returns information about specified connector.
     * Returned object has such properties:
     * - source - source element
     * - target - target element
     * - connector - connector element
     * If there are no info about specified connector, then returns null
     */
    getConnectorInfo: function (addr) {
        for (i in this.triples) {
            var tpl = this.triples[i];
            if (tpl[1].addr == addr)
                return {connector: tpl[1], source: tpl[0], target: tpl[2]};
        }
        return null;
    },

    findKeywords: function (triples, addr) {
        var keywords = {};
        var keywordsList = [];

        function addArc(el, value) {

            var n = value;
            if ((el.type & sc_type_arc_mask) || ((el.type & sc_type_node_link) == sc_type_node_link))
                n += -2; // minimize priority of arcs and links

            if (keywords[el.addr])
                keywords[el.addr].priority += n;
            else
                keywords[el.addr] = {el: el, priority: n};
        }

        //---
        for (idx in triples) {
            var tpl = triples[idx];
            var n = 1;

            if (tpl[0].type & sc_type_connector || tpl[2].type & sc_type_connector)
                n -= 1; // minimize priority of nodes, that has output/input arcs to other arcs or links
            if ((tpl[2].type & sc_type_node_link) == sc_type_node_link || (tpl[0].type & sc_type_node_link) == sc_type_node_link)
                n -= 1; // minimize priority of nodes, that has output/input arcs to links
            if (tpl[1].type & (sc_type_common_arc | sc_type_common_edge))
                n += 1;

            if (addr != null) {
                if (tpl[0].addr != addr)
                    addArc(tpl[0], n);
                if (tpl[2].addr != addr)
                    addArc(tpl[2], n);
            } else {
                addArc(tpl[0], n);
                addArc(tpl[2], n);
            }
        }

        var maxValue = -1;
        for (a in keywords) {
            var el = keywords[a];
            if (el.priority > maxValue) {
                keywordsList = [el.el];
                maxValue = el.priority;
            }
        }

        return keywordsList;
    }

};


// ----------------------------------------
SCs.SCnTreeNodeType = {
    Keyword: 1,
    Sentence: 2
};

SCs.SCnTreeNode = function () {
    this.type = SCs.SCnTreeNodeType.Sentence;
    this.element = null;
    this.childs = new Array();   // list of child sentences for subject
    this.attrs = new Array();   // list of attributes
    this.predicate = null;      // sc-addr of arc
    this.backward = false;      // backwards flag for predicates
    this.level = -1;             // tree level
    this.parent = null;         // parent tree node
};

SCs.SCnTreeNode.prototype = {};
