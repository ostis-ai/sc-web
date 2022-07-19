TripleUtils = function () {
    this.outputEdges = {};
    this.inputEdges = {};
    this.types = {};
    this.triples = []
};

TripleUtils.prototype = {

    appendTriple: function (tpl) {
        this.triples.push(tpl);
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

    /**
     *
     * @param lookupEdgeAddr
     * @returns {src: number, edge: number, trg: number}
     */
    getEdge: function (lookupEdgeAddr) {
        return this.triples.find(([src, {addr}, trg]) => addr === lookupEdgeAddr);
    },

    /*! Search all constructions, that equal to template. 
     * @returns If something found, then returns list of results; otherwise returns null
     */
    find5_f_a_a_a_f: function (addr1, type2, type3, type4, addr5) {
        var res = [];
        // iterate all output edges from addr1
        var list = this.outputEdges[addr1];
        if (!list) return [];
        for (l in list) {
            var edge = list[l];
            if (this._compareType(type2, this._getType(edge.edge)) && this._compareType(type3, this._getType(edge.trg))) {
                // second triple iteration
                var list2 = this.inputEdges[edge.edge];
                if (list2) {
                    for (l2 in list2) {
                        var edge2 = list2[l2];
                        if (this._compareType(type4, this._getType(edge2.edge)) && (edge2.src === addr5)) {
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
        const list = this.inputEdges[addr3];
        if (!list) return [];

        let res = [];
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

    find5_a_a_f_a_f: function (type1, type2, addr3, type4, addr5) {
        const list = this.find3_f_a_a(addr5, type4, type2);
        if (!list) return [];
        const res = [];
        for (const [src5, edge4, edge] of list) {
            const [src1, edge2, trg3] = this.getEdge(edge.addr);
            if (this._compareType(type1, src1.type) &&
                this._compareType(type2, edge2.type) &&
                addr3 === trg3.addr &&
                this._compareType(type4, edge4.type) &&
                addr5 === src5.addr) {
                res.push([src1, edge2, trg3, edge4, src5]);
            }
        }
        return res;
    },

    find3_f_a_f: function (addr1, type2, addr3) {
        var list = this.inputEdges[addr3];
        if (!list) return [];

        var res = [];
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
        if (!list) return [];

        var res = [];
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
        return !!this.outputEdges[srcAddr];
    },

    checkAnyInputEdge: function (trgAddr) {
        return !!this.inputEdges[trgAddr];
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
        return ((it_type & el_type) === it_type);
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
                if (edge.edge === edgeAddr) {
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
                if (edge.edge === edgeAddr) {
                    this.inputEdges.splice(e, 1);
                    return;
                }
            }
        }

        throw "Can't find input edges"
    }

};

