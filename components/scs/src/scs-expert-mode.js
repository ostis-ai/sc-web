const expertSystemIdList = ['nrel_system_identifier'];

class ExpertModeManager {

    constructor(sandbox) {
        this.sandbox = sandbox;
        this.languages = sandbox.getLanguages();
    }

    applyExpertMode(data, expertModeEnabled = SCWeb.core.ExpertModeEnabled) {
        return expertModeEnabled ? data : this.removeExpertData(data);
    }

    removeExpertData({triples, ...data}) {
        this.initTripleUtils(triples);
        return {
            triples: this.applyFilters(triples),
            ...data
        };
    }

    initTripleUtils(triples) {
        delete this.tripleUtils;
        this.tripleUtils = new TripleUtils();
        triples.forEach((triple) => this.tripleUtils.appendTriple(triple));
    }

    applyFilters(triples) {
        let filteredTriples = triples;
        const filters = [
            (triples) => this.removeTriplesWithNotCurrentLanguage(triples),
            (triples) => this.removeCurrentLanguageNode(triples),
            (triples) => this.removeExpertSystemIdTriples(triples),
            (triples) => this.transformKeyScElement(triples),
        ];
        filters.forEach(filter => {
            this.initTripleUtils(filteredTriples);
            filteredTriples = filter(filteredTriples)
        });
        return filteredTriples
    }

    removeTriplesWithNotCurrentLanguage(triples) {
        let currentLanguageAddr = this.sandbox.getCurrentLanguage();
        let languageToRemoveList = this.languages.filter(lang => lang !== currentLanguageAddr);
        return this.removeTriplesByKeynodeList(languageToRemoveList, triples);
    }

    removeCurrentLanguageNode(triples) {
        let currentLanguageAddr = this.sandbox.getCurrentLanguage();
        const currentLanguage = this.languages.filter(lang => lang === currentLanguageAddr);
        return this.removeTriplesByKeynodeList(currentLanguage, triples, false);
    }

    removeExpertSystemIdTriples(triples) {
        return this.removeTriplesBySystemIdList(expertSystemIdList, triples)
    }

    removeTriplesBySystemIdList(systemIdList, triples, withChild = true) {
        const keynodeList = systemIdList.map((systemId) => this.getKeynode(systemId));
        return this.removeTriplesByKeynodeList(keynodeList, triples, withChild);
    }

    removeTriplesByKeynodeList(keynodeList, triples, withChild = true) {
        const expertSystemIdTriples = this.findExpertKeynodeTriples(keynodeList);
        const arcsToRemove = expertSystemIdTriples
            .map(triple => withChild ? [triple[1].addr, triple[2].addr] : [triple[1].addr]);
        const flatArray = [].concat.apply([], arcsToRemove);
        return this.removeArcs(flatArray, triples);
    }

    removeArcs(arcsToRemove, triples) {
        return triples.filter(triple => this.isNotTripleSystem(addr => arcsToRemove.includes(addr), triple))
    }

    findExpertKeynodeTriples(keynodeList) {
        let systemIdTriples = keynodeList
            .map(keynode => {
                const arcTriples = this.tripleUtils.find3_f_a_a(keynode, sc_type_arc_pos_const_perm, sc_type_arc_common);
                const linkTriples = this.tripleUtils.find3_f_a_a(keynode, sc_type_arc_pos_const_perm, sc_type_link);
                return [].concat(arcTriples, linkTriples);
            });
        return [].concat.apply([], systemIdTriples);
    }

    getKeynode(systemId) {
        return window.scKeynodes[systemId] || this.sandbox.getKeynode(systemId);
    }

    isNotTripleSystem(isAddrSystem, triple) {
        return !isAddrSystem(triple[0].addr) &&
            !isAddrSystem(triple[1].addr) &&
            !isAddrSystem(triple[2].addr);
    }

    /**
     * sourceNode
     * <- rrel_key_sc_element:
     translationNode
     (*
     <= nrel_sc_text_translation:
     preLinkNode
     (*
     -> linkNode;;
     *);;
     *);
     *
     * ===>
     * sourceNode
     * (*
     *  <- rrel_key_sc_element: linkNode;;
     * *)

     * @param triples
     * @returns filteredTriples
     */
    transformKeyScElement(triples) {
        const rrelKeyScElement = this.getKeynode("rrel_key_sc_element");
        const arcsToRemove = [];
        const newTriples = [];
        this.tripleUtils
            .find3_f_a_a(rrelKeyScElement, sc_type_arc_pos_const_perm, sc_type_arc_pos_const_perm)
            .forEach(triple => {
                const [translationNode, edge, sourceNode] = this.tripleUtils.getEdge(triple[2].addr);
                const preLinkNode = this.findPreLinkNodeTriple(translationNode);
                if (preLinkNode) {
                    arcsToRemove.push(preLinkNode[1], preLinkNode[2], preLinkNode[3]);
                    const linkNodeTriple = this.findLinkNodeTriple(preLinkNode[0]);
                    if (linkNodeTriple) {
                        arcsToRemove.push(linkNodeTriple[1]);
                        newTriples.push([linkNodeTriple[2], edge, sourceNode]);
                    }
                }
            });

        const arcsToRemoveAddrs = arcsToRemove.map(({addr}) => addr);
        return this.removeArcs(arcsToRemoveAddrs, triples).concat(newTriples);
    }

    findPreLinkNodeTriple(translationNode) {
        const nrelScTextTranslation = this.getKeynode("nrel_sc_text_translation");
        const triples = this.tripleUtils.find5_a_a_f_a_f(
            sc_type_node,
            sc_type_arc_common,
            translationNode.addr,
            sc_type_arc_pos_const_perm,
            nrelScTextTranslation);
        return triples.length && triples[0];
    }

    findLinkNodeTriple(preLinkNode) {
        const triples = this.tripleUtils.find3_f_a_a(preLinkNode.addr, sc_type_arc_pos_const_perm, sc_type_link);
        return triples.length && triples[0];
    }
}