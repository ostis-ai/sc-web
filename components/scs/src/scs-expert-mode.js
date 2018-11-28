const applyExpertMode = (data, expertModeEnabled = SCWeb.core.ExpertModeEnabled) => {
    return expertModeEnabled ? data : this.removeNotExpertData(data);
};

const ExpertModeManager = {
    sandbox: null,
    setSandbox: (sandbox) => this.sandbox = sandbox,

    applyExpertMode: (data, expertModeEnabled = SCWeb.core.ExpertModeEnabled) => {
        return expertModeEnabled ? data : this.removeNotExpertData(data);
    },

    removeNotExpertData: (data) => {
        return this.removeSystemTriples(data);
    },

    removeSystemTriples: (data) => {
        let filteredData = this.removeNrelSysIdentifier(data);
        return this.transformKeyScElement(filteredData);
    },

    getKeyNode: (keynode) => scKeynodes[keynode] || this.sandbox.getKeynode(keynode),

    /**
     * Remove constructions
     * ... => nrel_sys_identifier: [*   *];;
     * @param triples
     * @param data
     */
    removeNrelSysIdentifier: ({triples, ...data}) => {
        let tripleUtils = new TripleUtils();
        for (const triple of triples) {
            tripleUtils.appendTriple(triple);
        }
        const arcsToRemove = [];
        const sysIdentifierTriples = tripleUtils.find3_f_a_a(this.getKeynode('nrel_system_identifier'),
            sc_type_arc_pos_const_perm,
            sc_type_arc_common);
        for (const triple of sysIdentifierTriples) {
            arcsToRemove.push(triple[1].addr);
            arcsToRemove.push(triple[2].addr);
        }
        return {
            triples: triples.filter(this.isNotTripleSystem.bind(undefined,
                Array.prototype.includes.bind(arcsToRemove))),
            ...data
        };
    },

    isNotTripleSystem: (isAddrSystem, triple) => {
        return !isAddrSystem(triple[0].addr) &&
            !isAddrSystem(triple[1].addr) &&
            !isAddrSystem(triple[2].addr);
    },

    /**
     * nrel_boolean
     * <- rrel_key_sc_element:
     ...
     (*
     <- definition;;
     <= nrel_sc_text_translation:
     ...
     (*
     -> rrel_example:
     "file://content_html/definition_for_boolean.html"
     (* <- lang_ru;; *);;
     *);;
     *);
     *
     * ===>
     * nrel_boolean
     * (*
     * "file://content_html/definition_for_boolean.html"
     *   (* <- lang_ru;; *);;
     * *)

     * @param getKeynode
     * @param data
     * @returns {{triples}}
     */
    transformKeyScElement: ({triples, ...data}) => {
        const rrelKeyScElement = this.getKeynode("rrel_key_sc_element");
        const nrelScTextTranslation = this.getKeynode("nrel_sc_text_translation");
        const rrelExample = this.getKeynode("rrel_example");
        const arcsToRemove = [];
        const newTriples = [];
        let countOfElement = 0;
        let tripleUtils = new TripleUtils();
        for (const triple of triples) {
            tripleUtils.appendTriple(triple);
        }
        for (const triple of tripleUtils.find3_f_a_a(
            rrelKeyScElement,
            sc_type_arc_pos_const_perm,
            sc_type_arc_pos_const_perm)) {
            arcsToRemove.push(triple[1], triple[2]);
            const [src, edge, trg] = tripleUtils.getEdge(triple[2].addr);
            const nodeToMerge = trg;
            for (const triple2 of tripleUtils.find5_a_a_f_a_f(
                sc_type_node,
                sc_type_arc_common,
                src.addr,
                sc_type_arc_pos_const_perm,
                nrelScTextTranslation
            )) {
                arcsToRemove.push(triple2[1], triple2[3]);
                for (const triple3 of tripleUtils.find5_f_a_a_a_f(
                    triple2[0].addr,
                    sc_type_arc_pos_const_perm,
                    0,
                    sc_type_arc_pos_const_perm,
                    rrelExample
                )) {
                    arcsToRemove.push(triple3[1], triple3[3]);
                    const trgNodeToMerge = triple3[2];
                    newTriples.push([
                        nodeToMerge,
                        {
                            addr: "merge_key_sc_element_" + countOfElement++,
                            type: sc_type_arc_pos_const_perm
                        },
                        trgNodeToMerge,
                    ])
                }

            }
        }

        const arcsToRemoveAddrs = arcsToRemove.map(({addr}) => addr);
        const triples1 = triples.filter(isNotTripleSystem.bind(undefined,
            Array.prototype.includes.bind(arcsToRemoveAddrs)))
            .concat(newTriples);
        return {
            triples: triples1,
            ...data
        }
    },
};