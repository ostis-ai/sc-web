SCs.SCnOutput = function () {
};

SCs.SCnOutput.prototype = {

    init: function (tree, container, keynode_func, gen_window_func) {
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
    toHtml: function () {
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
    treeNodeHtml: function (treeNode) {
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
                output += '<div class="scs-scn-field"><div class="scs-scn-field-marker scs-scn-element resolve-idtf-anim">=</div>'
                    //+ '' //sc_addr="' + treeNode.element.addr + '">'
                    + this.treeNodeElementHtml(treeNode);
                +'</div>';
            }
            output += childsToHtml();

            var contourTree = this.tree.subtrees[treeNode.element.addr];
            if (contourTree) {
                output += '<div class="scs-scn-field-marker scs-scn-element">=</div>'
                    + '<div class="scs-scn-element sc-contour scs-scn-field sc-no-default-cmd ui-no-tooltip" sc_addr="' + treeNode.element.addr + '">'
                    + '<div class="scs-scn-view-primary">' + this.subtreeToHtml(contourTree) + '</div>'
                    + '<div class="scs-scn-view-external hidden"></div>'
                    + '<button type="button" class="scs-scn-view-toogle-button btn btn-info btn-xs"><span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span></button>'
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
                    output += '<a href="#" class="scs-scn-element scs-scn-highlighted resolve-idtf-anim" sc_addr="' + attr.n.addr + '"></a>' + '<span>' + sep + '</span>';
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

    treeNodeElementHtml: function (treeNode, isKeyword) {

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
                return '(<a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted resolve-idtf-anim" sc_addr="' + einfo.source.addr + '"></a>\
                        <a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted scs-scn-connector" sc_addr="' + treeNode.element.addr + '">'
                    + marker.f + '</a>\
                        <a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted resolve-idtf-anim" sc_addr="' + einfo.target.addr + '"></a>)';
            }
        }

        return '<a href="#" class="scs-scn-element scs-scn-field scs-scn-highlighted resolve-idtf-anim" sc_addr="' + treeNode.element.addr + '"></a>';
    },

    subtreeToHtml: function (subtree) {
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
    treeSort: function () {
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
    treeMerge: function () {
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
    determineSets: function () {

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
