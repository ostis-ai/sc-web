const expertSystemIdList = ['nrel_system_identifier'];

// TODO: Found this list in project and remove from this
const languages = ['lang_ru', 'lang_en'];

class ExpertModeManager {

    constructor(sandbox) {
        this.sandbox = sandbox;
    }

    applyExpertMode(data, expertModeEnabled = SCWeb.core.ExpertModeEnabled) {
        return expertModeEnabled ? data : this.removeExpertData(data);
    }

    removeExpertData(data) {
        this.initTripleUtils(data);
        return this.applyFilters(data);
    }

    initTripleUtils(data) {
        this.tripleUtils = new TripleUtils();
        data.triples.forEach((triple) => this.tripleUtils.appendTriple(triple));
    }

    applyFilters({triples, ...data}) {
        let filteredTriples = triples;
        filteredTriples = this.removeTriplesWithNotCurrentLanguage(filteredTriples);
        filteredTriples = this.removeCurrentLanguageNode(filteredTriples);
        filteredTriples = this.removeExpertSystemIdTriples(filteredTriples);
        filteredTriples = this.transformKeyScElement(filteredTriples);
        return {
            triples: filteredTriples,
            ...data
        };
    }

    removeTriplesWithNotCurrentLanguage(triples) {
        let currentLanguageAddr = SCWeb.core.Translation.getCurrentLanguage();
        let languageToRemoveList = languages.filter(lang => this.getKeynode(lang) !== currentLanguageAddr);
        return this.removeTriplesBySystemIdList(languageToRemoveList, triples);
    }

    removeCurrentLanguageNode(triples) {
        let currentLanguageAddr = SCWeb.core.Translation.getCurrentLanguage();
        const currentLanguage = languages.filter(lang => this.getKeynode(lang) === currentLanguageAddr);
        return this.removeTriplesBySystemIdList(currentLanguage, triples, false);
    }

    removeExpertSystemIdTriples(triples) {
        return this.removeTriplesBySystemIdList(expertSystemIdList, triples)
    }

    removeTriplesBySystemIdList(systemIdList, triples, withChild = true) {
        const expertSystemIdTriples = this.findExpertSystemIdTriples(systemIdList);
        const arcsToRemove = expertSystemIdTriples
            .map(triple => withChild ? [triple[1].addr, triple[2].addr] : [triple[1].addr]);
        const flatArray = [].concat.apply([], arcsToRemove);
        return this.removeArcs(flatArray, triples);
    }

    removeArcs(arcsToRemove, triples) {
        return triples.filter(triple => this.isNotTripleSystem(addr => arcsToRemove.includes(addr), triple))
    }

    findExpertSystemIdTriples(systemIdList) {
        let systemIdTriples = systemIdList
            .map(this.getKeynode.bind(this))
            .map(keynode => {
                const arcTriples = this.tripleUtils.find3_f_a_a(keynode, sc_type_arc_pos_const_perm, sc_type_arc_common);
                const linkTriples = this.tripleUtils.find3_f_a_a(keynode, sc_type_arc_pos_const_perm, sc_type_link);
                return [].concat(arcTriples, linkTriples);
            });
        return [].concat.apply([], systemIdTriples);
    }

    getKeynode(keynode) {
        return scKeynodes[keynode] || this.sandbox.getKeynode(keynode);
    }

    isNotTripleSystem(isAddrSystem, triple) {
        return !isAddrSystem(triple[0].addr) &&
            !isAddrSystem(triple[1].addr) &&
            !isAddrSystem(triple[2].addr);
    }

    /**
     * nrel_boolean
     * <- rrel_key_sc_element:
     ...
     (*
     <= nrel_sc_text_translation:
     ...
     (*
     -> rrel_example: "file://content_html/definition_for_boolean.html";;
     *);;
     *);
     *
     * ===>
     * nrel_boolean
     * (*
     *  <- rrel_key_sc_element: "file://content_html/definition_for_boolean.html";;
     * *)

     * @param triples
     * @returns filteredTriples
     */
    transformKeyScElement(triples) {
        // TODO: Need to be refactored
        const rrelKeyScElement = this.getKeynode("rrel_key_sc_element");
        const nrelScTextTranslation = this.getKeynode("nrel_sc_text_translation");
        const rrelExample = this.getKeynode("rrel_example");
        const arcsToRemove = [];
        const newTriples = [];
        for (const triple of this.tripleUtils.find3_f_a_a(
            rrelKeyScElement,
            sc_type_arc_pos_const_perm,
            sc_type_arc_pos_const_perm)) {
            const [src, edge, trg] = this.tripleUtils.getEdge(triple[2].addr);
            const nodeToMerge = trg;
            for (const triple2 of this.tripleUtils.find5_a_a_f_a_f(
                sc_type_node,
                sc_type_arc_common,
                src.addr,
                sc_type_arc_pos_const_perm,
                nrelScTextTranslation
            )) {
                arcsToRemove.push(triple2[1], triple2[2], triple2[3]);
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
                        trgNodeToMerge,
                        edge,
                        nodeToMerge,
                    ]);
                }

            }
        }

        const arcsToRemoveAddrs = arcsToRemove.map(({addr}) => addr);
        return this.removeArcs(arcsToRemoveAddrs, triples).concat(newTriples);
    }
}