class ExpertModeManager {

    constructor(sandbox) {
        this.sandbox = sandbox;
    }

    applyExpertMode(data, expertModeEnabled = SCWeb.core.ExpertModeEnabled) {
        return expertModeEnabled ? data : this.removeNotExpertData(data);
    };

    removeNotExpertData(data) {
        return this.removeSystemTriples(data);
    };

    removeSystemTriples(data) {
        let filteredData = this.filterData(data);
        return this.transformKeyScElement(filteredData);
    };

    filterData(data) {
        data = this.removeTriplesByIdentifier('nrel_system_identifier', sc_type_arc_common, data);
        data = this.removeTriplesWithNotChosenLanguage(data);
        return data;
    };

    removeTriplesWithNotChosenLanguage(data) {
        let currentLanguageAddr = SCWeb.core.Translation.getCurrentLanguage();
        let langToRemove = 'lang_en';
        if (this.getKeynode(langToRemove) == currentLanguageAddr) {
            langToRemove = 'lang_ru';
        }
        return this.removeTriplesByIdentifier(langToRemove, sc_type_link, data);
    };

    getKeynode(keynode) {
        return scKeynodes[keynode] || this.sandbox.getKeynode(keynode);
    };

    /**
     * Remove constructions
     * ... => nrel_sys_identifier: [*   *];;
     * @param identifier
     * @param type
     * @param triples
     * @param data
     */
     removeTriplesByIdentifier(identifier, type, {triples, ...data}) {
         let tripleUtils = new TripleUtils();
         for (const triple of triples) {
             tripleUtils.appendTriple(triple);
         }
         const arcsToRemove = [];
         const foundTriples = tripleUtils.find3_f_a_a(this.getKeynode(identifier),
             sc_type_arc_pos_const_perm,
             type);
         for (const triple of foundTriples) {
             arcsToRemove.push(triple[1].addr);
             arcsToRemove.push(triple[2].addr);
         }
         return {
             triples: triples.filter(this.isNotTripleSystem.bind(undefined,
                 Array.prototype.includes.bind(arcsToRemove))),
             ...data
         };
     };

    isNotTripleSystem(isAddrSystem, triple) {
        return !isAddrSystem(triple[0].addr) &&
            !isAddrSystem(triple[1].addr) &&
            !isAddrSystem(triple[2].addr);
    };

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
    transformKeyScElement({triples, ...data}) {
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
        const triples1 = triples.filter(this.isNotTripleSystem.bind(undefined,
            Array.prototype.includes.bind(arcsToRemoveAddrs)))
            .concat(newTriples);
        return {
            triples: triples1,
            ...data
        }
    };
}