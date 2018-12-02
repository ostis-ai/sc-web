const expertSystemIdList = [
    'nrel_system_identifier'
];

class ExpertModeManager {

    constructor(sandbox) {
        this.sandbox = sandbox;
    }

    applyExpertMode(data, expertModeEnabled = SCWeb.core.ExpertModeEnabled) {
        return expertModeEnabled ? data : this.removeExpertData(data);
    };

    removeExpertData(data) {
        this.initTripleUtils(data);
        return this.applyFilters(data);
    };

    initTripleUtils(data) {
        this.tripleUtils = new TripleUtils();
        data.triples.forEach((triple) => this.tripleUtils.appendTriple(triple));
    }

    applyFilters({triples, ...data}) {
        let filteredTriples = triples;
        const filters = [
            (data) => this.removeExpertSystemIdTriples(data),
            (data) => this.transformKeyScElement(data),
        ];
        filters.forEach(filter => filteredTriples = filter(filteredTriples));
        return {
            triples: filteredTriples,
            ...data
        };
    }

    /**
     * Remove constructions
     * ... => [expertSystemId]: ...;;
     * @param triples
     * @return filteredTriples
     */
    removeExpertSystemIdTriples(triples) {
        const expertSystemIdTriples = this.findExpertSystemIdTriples();
        const arcsToRemove = expertSystemIdTriples.map(triple => [triple[1].addr, triple[2].addr]).flat();
        return triples.filter(triple => this.isNotTripleSystem(addr => arcsToRemove.includes(addr), triple));
    };

    findExpertSystemIdTriples() {
        return expertSystemIdList
            .map(systemId => {
                const keynode = this.getKeynode(systemId);
                const triples = [
                    this.tripleUtils.find3_f_a_a(keynode, sc_type_arc_pos_const_perm, sc_type_arc_common),
                ];
                return triples.flat();
            })
            .flat()
    }

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
    }

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
     * <= rrel_key_sc_element: "file://content_html/definition_for_boolean.html"
     *   (* <- lang_ru;; *);;
     * *)

     * @param triples
     * @returns filteredTriples
     */
    transformKeyScElement(triples) {
        const rrelKeyScElement = this.getKeynode("rrel_key_sc_element");
        const nrelScTextTranslation = this.getKeynode("nrel_sc_text_translation");
        const rrelExample = this.getKeynode("rrel_example");
        const arcsToRemove = [];
        const newTriples = [];
        let countOfElement = 0;
        for (const triple of this.tripleUtils.find3_f_a_a(
            rrelKeyScElement,
            sc_type_arc_pos_const_perm,
            sc_type_arc_pos_const_perm)) {
            arcsToRemove.push(triple[1], triple[2]);
            const [src, edge, trg] = this.tripleUtils.getEdge(triple[2].addr);
            const nodeToMerge = trg;
            for (const triple2 of this.tripleUtils.find5_a_a_f_a_f(
                sc_type_node,
                sc_type_arc_common,
                src.addr,
                sc_type_arc_pos_const_perm,
                nrelScTextTranslation
            )) {
                arcsToRemove.push(triple2[1], triple2[3]);
                for (const triple3 of this.tripleUtils.find5_f_a_a_a_f(
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
        return triples1;
    };
}