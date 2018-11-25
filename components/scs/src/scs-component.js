SCsComponent = {
    ext_lang: 'scs_code',
    formats: ['format_scs_json'],
    factory: function (sandbox) {
        return new SCsViewer(sandbox);
    },
    getRequestKeynodes: function () {
        var keynodes = [
            'nrel_section_base_order',
            'rrel_key_sc_element',
            'nrel_key_sc_element_base_order',
            'scg_code',
            'lang_en',
            'lang_ru',
            "nrel_sc_text_translation",
            "rrel_example",
        ];
        return keynodes.concat(SCs.SCnSortOrder);
    }
};

function reverseMap(map) {
    const result = {};
    for (const key in map) {
        result[map[key]] = key;
    }
    return result;
}

function getTriplesJsonFoDebug({keywords, triples, ...data}, translationMap, keynodes) {
    const reverseKeynodes = reverseMap(scKeynodes);
    const reverseModeKeynodes = reverseMap(keynodes);
    const renameScAddr = ({addr, ...data}) => ({
        addr:
        reverseModeKeynodes[addr] ||
        reverseKeynodes[addr] ||
        translationMap[addr] ||
        addr,
        ...data
    });
    const renamedKeywords = keywords.map(renameScAddr);
    const renamedTriples = triples.map((triple) => triple.map(renameScAddr));
    return {keywords: renamedKeywords, triples: renamedTriples, ...data};
}

const getSystemSet = (getKeynode) => {
    const set = {};
    set[getKeynode('lang_en')] = true;
    set[getKeynode('lang_ru')] = true;
    set[getKeynode('nrel_system_identifier')] = true;
    return set;
};

function isNotTripleSystem(isAddrSystem, triple) {
    return !isAddrSystem(triple[0].addr) &&
        !isAddrSystem(triple[1].addr) &&
        !isAddrSystem(triple[2].addr);
}

/**
 * Remove constructions
 * ... => nrel_sys_identifier: [*   *];;
 * @param getKeynode
 * @param triples
 * @param data
 */
function removeNrelSysIdentifier(getKeynode, {triples, ...data}) {
    let tripleUtils = new TripleUtils();
    for (const triple of triples) {
        tripleUtils.appendTriple(triple);
    }
    const arcsToRemove = [];
    const sysIdentifierTriples = tripleUtils.find3_f_a_a(getKeynode('nrel_system_identifier'),
        sc_type_arc_pos_const_perm,
        sc_type_arc_common);
    for (const triple of sysIdentifierTriples) {
        arcsToRemove.push(triple[1].addr);
        arcsToRemove.push(triple[2].addr);
    }
    return {
        triples: triples.filter(isNotTripleSystem.bind(undefined,
            Array.prototype.includes.bind(arcsToRemove))),
        ...data
    };
}

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
function transformKeyScElement(getKeynode, {triples, ...data}) {
    const rrelKeyScElement = getKeynode("rrel_key_sc_element");
    const nrelScTextTranslation = getKeynode("nrel_sc_text_translation");
    const rrelExample = getKeynode("rrel_example");
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
}

function removeSystemTriples(getKeynode, data) {
    let filteredData = removeNrelSysIdentifier(getKeynode, data);
    return transformKeyScElement(getKeynode, filteredData);
}

var SCsViewer = function (sandbox) {
    this.objects = new Array();
    this.addrs = new Array();
    this.sc_links = {}; // map of sc-link objects key:addr, value: object
    this.data = null;

    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;

    const hideSystemDataIfNecessary = (data, expertModeEnabled = SCWeb.core.ExpertModeEnabled) => {
        if (expertModeEnabled) {
            return data;
        } else {
            const getKeynode = (keynode) => scKeynodes[keynode] || this.sandbox.getKeynode(keynode);
            return removeSystemTriples(getKeynode, data);
        }
    };

    this.expertModeEnabledCallback = function () {
        this.sandbox.removeChild();
        this.receiveData(this.data);
        this.sandbox.translate();
    };

    SCWeb.core.EventManager.subscribe("expert_mode_enabled", this, this.expertModeEnabledCallback);
    this.expertModeDisabledCallback = function () {
        this.sandbox.removeChild();
        this.receiveData(this.data);
        this.sandbox.translate();
    };

    SCWeb.core.EventManager.subscribe("expert_mode_disabled", this, this.expertModeDisabledCallback);

    // ---- window interface -----
    this.receiveData = function (data) {
        this.data = data;
        data = JSON.parse(data);
        data = hideSystemDataIfNecessary(data);
        this.viewer.appendData(data);
        return $.when(this.sandbox.createViewersForScLinks(this.viewer.getLinks()));
    };

    this.updateTranslation = function (namesMap) {
        // apply translation
        console.log(getTriplesJsonFoDebug(JSON.parse(this.data), namesMap, this.sandbox.keynodes));
        $(this.sandbox.container_selector).each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (!$(element).hasClass('sc-content') && !$(element).hasClass('sc-contour') &&
                !$(element).hasClass('scs-scn-connector') && ($(element).hasClass('scs-scn-element'))) {
                $(element).removeClass('resolve-idtf-anim');
                if (namesMap[addr]) {
                    $(element).text(namesMap[addr]);
                } else {
                    $(element).html('<b>...</b>');
                }
            }
        });
    };

    this.getObjectsToTranslate = function () {
        return this.viewer.getAddrs();
    };

    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
    this.sandbox.eventApplyTranslation = $.proxy(this.updateTranslation, this);

    this.viewer = new SCs.Viewer();
    this.viewer.init(sandbox, $.proxy(sandbox.getKeynode, sandbox));

    this.sandbox.updateContent();
};

var SCsConnectors = {};

$(document).ready(function () {

    SCsConnectors[sc_type_arc_pos_const_perm] = "->";
    SCsConnectors[sc_type_edge_common | sc_type_const] = "==";
    SCsConnectors[sc_type_edge_common | sc_type_var] = "_==";
    SCsConnectors[sc_type_arc_common | sc_type_const] = "=>";
    SCsConnectors[sc_type_arc_common | sc_type_var] = "_=>";
    SCsConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm] = "_->";
});


SCWeb.core.ComponentManager.appendComponentInitialize(SCsComponent);
