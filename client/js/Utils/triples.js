TripleUtils = function () {
    this.outputEdges = {};
    this.inputEdges = {};
    this.types = {};
};

TripleUtils.prototype = {

    appendTriple: function (tpl) {
        this.types[tpl[0].addr] = tpl[0].type;
        this.types[tpl[1].addr] = tpl[1].type;
        this.types[tpl[2].addr] = tpl[2].type;

        this._appendOutputEdge(tpl[0].addr, tpl[1].addr, tpl[2].addr);
        this._appendInputEdge(tpl[0].addr, tpl[1].addr, tpl[2].addr);
    },

    removeTriple: function (tpl) {
        this._removeOutputEdge(tpl[0].addr, tpl[1].addr);
        this._removeInputEdge(tpl[2].addr, tpl[1].addr);
    },

    /*! Search all constructions, that equal to template. 
     * @returns If something found, then returns list of results; otherwise returns null
     */
    find5_f_a_a_a_f: function (addr1, type2, type3, type4, addr5) {
        var res = null;
        // iterate all output edges from addr1
        var list = this.outputEdges[addr1];
        if (!list) return null;
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, this._getType(edge.edge)) && this._compareType(type3, this._getType(edge.trg))) {
                // second triple iteration
                var list2 = this.inputEdges[edge.edge];
                if (list2) {
                    for (l2 in list2) {
                        var edge2 = list2[l2];
                        if (this._compareType(type4, this._getType(edge2.edge)) && (edge2.src == addr5)) {
                            if (!res) res = [];
                            res.push([
                                {addr: addr1, type: this._getType(addr1)},
                                {addr: edge.edge, type: this._getType(edge.edge)},
                                {addr: edge.trg, type: this._getType(edge.trg)},
                                {addr: edge2.edge, type: this._getType(edge2.edge)},
                                {addr: addr5, type: this._getType(addr5)}
                            ]);
                        }
                    }
                }
            }
        }
        return res;
    },

    find5_f_a_f_a_f: function (addr1, type2, addr3, type4, addr5) {
        var list = this.inputEdges[addr3];
        if (!list) return null;

        var res = null;
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, this._getType(edge.edge)) && (addr1 === edge.src)) {
                var list2 = this.inputEdges[addr5];
                if (!list2) continue;

                for (l2 in list2) {
                    var edge2 = list2[l2];
                    if (this._compareType(type4, this._getType(edge2.edge)) && (addr3 === edge.src)) {
                        if (!res) res = [];
                        res.push([
                            {addr: addr1, type: this._getType(addr1)},
                            {addr: edge.edge, type: this._getType(edge.edge)},
                            {addr: addr3, type: this._getType(addr3)},
                            {addr: edge2.edge, type: this._getType(edge2.edge)},
                            {addr: addr5, type: this._getType(addr5)}
                        ]);
                    }
                }
            }
        }
    },

    find3_f_a_f: function (addr1, type2, addr3) {
        var list = this.inputEdges[addr3];
        if (!list) return null;

        var res = null;
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, edge.edge) && (addr1 === edge.src)) {
                if (!res) res = [];
                res.push([
                    {addr: addr1, type: this._getType(addr1)},
                    {addr: edge.edge, type: this._getType(edge.edge)},
                    {addr: addr3, type: this._getType(addr3)}
                ]);
            }
        }

        return res;
    },

    /*! Search all constructions, that equal to template. 
     * @returns If something found, then returns list of results; otherwise returns null
     */
    find3_f_a_a: function (addr1, type2, type3) {
        // iterate elements
        var list = this.outputEdges[addr1];
        if (!list) return null;

        var res = null;
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, this._getType(edge.edge)) && this._compareType(type3, this._getType(edge.trg))) {
                if (!res) res = [];
                res.push([
                    {addr: addr1, type: this._getType(addr1)},
                    {addr: edge.edge, type: this._getType(edge.edge)},
                    {addr: edge.trg, type: this._getType(edge.trg)}
                ]);
            }
        }
        return res;
    },

    checkAnyOutputEdge: function (srcAddr) {
        return this.outputEdges[srcAddr] ? true : false;
    },

    checkAnyInputEdge: function (trgAddr) {
        return this.inputEdges[trgAddr] ? true : false;
    },

    checkAnyOutputEdgeType: function (srcAddr, edgeType) {
        var list = this.outputEdges[srcAddr];
        if (list) {
            for (l in list) {
                if (this._checkType(edgeType, this._getType(list[l].edge)))
                    return true;
            }
        }
        return false;
    },

    checkAnyInputEdgeType: function (trgAddr, edgeType) {
        var list = this.inputEdges[trgAddr];
        if (list) {
            for (l in list) {
                if (this._checkType(edgeType, this._getType(list[l].edge)))
                    return true;
            }
        }
        return false;
    },

    // just for internal usage
    _compareType: function (it_type, el_type) {
        return ((it_type & el_type) == it_type);
    },

    _getType: function (addr) {
        return this.types[addr];
    },

    _appendOutputEdge: function (srcAddr, edgeAddr, trgAddr) {
        var list = this.outputEdges[srcAddr];
        var edge = {src: srcAddr, edge: edgeAddr, trg: trgAddr};
        if (!list) {
            this.outputEdges[srcAddr] = [edge];
        } else {
            list.push(edge);
        }
    },

    _removeOutputEdge: function (srcAddr, edgeAddr) {
        var list = this.outputEdges[srcAddr];
        if (list) {
            for (e in list) {
                var edge = list[e];
                if (edge.edge == edgeAddr) {
                    this.outputEdges.splice(e, 1);
                    return;
                }
            }
        }

        throw "Can't find output edges"
    },

    _appendInputEdge: function (srcAddr, edgeAddr, trgAddr) {
        var list = this.inputEdges[trgAddr];
        var edge = {src: srcAddr, edge: edgeAddr, trg: trgAddr};
        if (!list) {
            this.inputEdges[trgAddr] = [edge];
        } else {
            list.push(edge);
        }
    },

    _removeInputEdge: function (trgAddr, edgeAddr) {
        var list = this.inputEdges[trgAddr];
        if (list) {
            for (e in list) {
                var edge = list[e];
                if (edge.edge == edgeAddr) {
                    this.inputEdges.splice(e, 1);
                    return;
                }
            }
        }

        throw "Can't find input edges"
    }

};

