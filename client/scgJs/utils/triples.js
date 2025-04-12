TripleUtils = function () {
    this.outgoingConnectors = {};
    this.incomingConnectors = {};
    this.types = {};
    this.triples = []
};

TripleUtils.prototype = {

    appendTriple: function (tpl) {
        this.triples.push(tpl);
        this.types[tpl[0].addr] = tpl[0].type;
        this.types[tpl[1].addr] = tpl[1].type;
        this.types[tpl[2].addr] = tpl[2].type;

        this._appendOutputConnector(tpl[0].addr, tpl[1].addr, tpl[2].addr);
        this._appendInputConnector(tpl[0].addr, tpl[1].addr, tpl[2].addr);
    },

    removeTriple: function (tpl) {
        this._removeOutputConnector(tpl[0].addr, tpl[1].addr);
        this._removeInputConnector(tpl[2].addr, tpl[1].addr);
    },

    /**
     *
     * @param lookupConnectorAddr
     * @returns {src: number, connector: number, trg: number}
     */
    getConnector: function (lookupConnectorAddr) {
        return this.triples.find(([src, {addr}, trg]) => addr === lookupConnectorAddr);
    },

    /*! Search all constructions, that equal to template. 
     * @returns If something found, then returns list of results; otherwise returns null
     */
    find5_f_a_a_a_f: function (addr1, type2, type3, type4, addr5) {
        var res = [];
        // iterate all output connectors from addr1
        var list = this.outgoingConnectors[addr1];
        if (!list) return [];
        for (l in list) {
            var connector = list[l];
            if (this._compareType(type2, this._getType(connector.connector)) && this._compareType(type3, this._getType(connector.trg))) {
                // second triple iteration
                var list2 = this.incomingConnectors [connector.connector];
                if (list2) {
                    for (l2 in list2) {
                        var connector2 = list2[l2];
                        if (this._compareType(type4, this._getType(connector2.connector)) && (connector2.src === addr5)) {
                            if (!res) res = [];
                            res.push([
                                {addr: addr1, type: this._getType(addr1)},
                                {addr: connector.connector, type: this._getType(connector.connector)},
                                {addr: connector.trg, type: this._getType(connector.trg)},
                                {addr: connector2.connector, type: this._getType(connector2.connector)},
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
        const list = this.incomingConnectors [addr3];
        if (!list) return [];

        let res = [];
        for (l in list) {
            var connector = list[l];
            if (this._compareType(type2, this._getType(connector.connector)) && (addr1 === connector.src)) {
                var list2 = this.incomingConnectors [addr5];
                if (!list2) continue;

                for (l2 in list2) {
                    var connector2 = list2[l2];
                    if (this._compareType(type4, this._getType(connector2.connector)) && (addr3 === connector.src)) {
                        if (!res) res = [];
                        res.push([
                            {addr: addr1, type: this._getType(addr1)},
                            {addr: connector.connector, type: this._getType(connector.connector)},
                            {addr: addr3, type: this._getType(addr3)},
                            {addr: connector2.connector, type: this._getType(connector2.connector)},
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
        for (const [src5, connector4, connector] of list) {
            const [src1, connector2, trg3] = this.getConnector(connector.addr);
            if (this._compareType(type1, src1.type) &&
                this._compareType(type2, connector2.type) &&
                addr3 === trg3.addr &&
                this._compareType(type4, connector4.type) &&
                addr5 === src5.addr) {
                res.push([src1, connector2, trg3, connector4, src5]);
            }
        }
        return res;
    },

    find3_f_a_f: function (addr1, type2, addr3) {
        var list = this.incomingConnectors [addr3];
        if (!list) return [];

        var res = [];
        for (l in list) {
            var connector = list[l];
            if (this._compareType(type2, connector.connector) && (addr1 === connector.src)) {
                if (!res) res = [];
                res.push([
                    {addr: addr1, type: this._getType(addr1)},
                    {addr: connector.connector, type: this._getType(connector.connector)},
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
        var list = this.outgoingConnectors[addr1];
        if (!list) return [];

        var res = [];
        for (l in list) {
            var connector = list[l];
            if (this._compareType(type2, this._getType(connector.connector)) && this._compareType(type3, this._getType(connector.trg))) {
                if (!res) res = [];
                res.push([
                    {addr: addr1, type: this._getType(addr1)},
                    {addr: connector.connector, type: this._getType(connector.connector)},
                    {addr: connector.trg, type: this._getType(connector.trg)}
                ]);
            }
        }
        return res;
    },

    checkAnyOutputConnector: function (srcAddr) {
        return !!this.outgoingConnectors[srcAddr];
    },

    checkAnyInputConnector: function (trgAddr) {
        return !!this.incomingConnectors [trgAddr];
    },

    checkAnyOutputConnectorType: function (srcAddr, connectorType) {
        var list = this.outgoingConnectors[srcAddr];
        if (list) {
            for (l in list) {
                if (this._checkType(connectorType, this._getType(list[l].connector)))
                    return true;
            }
        }
        return false;
    },

    checkAnyInputConnectorType: function (trgAddr, connectorType) {
        var list = this.incomingConnectors [trgAddr];
        if (list) {
            for (l in list) {
                if (this._checkType(connectorType, this._getType(list[l].connector)))
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

    _appendOutputConnector: function (srcAddr, connectorAddr, trgAddr) {
        var list = this.outgoingConnectors[srcAddr];
        var connector = {src: srcAddr, connector: connectorAddr, trg: trgAddr};
        if (!list) {
            this.outgoingConnectors[srcAddr] = [connector];
        } else {
            list.push(connector);
        }
    },

    _removeOutputConnector: function (srcAddr, connectorAddr) {
        var list = this.outgoingConnectors[srcAddr];
        if (list) {
            for (e in list) {
                var connector = list[e];
                if (connector.connector === connectorAddr) {
                    this.outgoingConnectors.splice(e, 1);
                    return;
                }
            }
        }

        throw "Can't find output connectors"
    },

    _appendInputConnector: function (srcAddr, connectorAddr, trgAddr) {
        var list = this.incomingConnectors [trgAddr];
        var connector = {src: srcAddr, connector: connectorAddr, trg: trgAddr};
        if (!list) {
            this.incomingConnectors [trgAddr] = [connector];
        } else {
            list.push(connector);
        }
    },

    _removeInputConnector: function (trgAddr, connectorAddr) {
        var list = this.incomingConnectors [trgAddr];
        if (list) {
            for (e in list) {
                var connector = list[e];
                if (connector.connector === connectorAddr) {
                    this.incomingConnectors .splice(e, 1);
                    return;
                }
            }
        }

        throw "Can't find input connectors"
    }

};

