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

function getTriplesJsonFoDebug({keywords, triples, ...data}, translationMap) {
    const reverseKeynodes = reverseMap(scKeynodes);
    const renameScAddr = ({addr, ...data}) => ({
        addr: reverseKeynodes[addr] ||
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

function removeSystemTriples(getKeynode, data) {
    let systemSet = getSystemSet(getKeynode);
    return removeNrelSysIdentifier(getKeynode, data);
    // let filteredTriples = triples.filter(isNotTripleSystem.bind(undefined, (addr) => systemSet[addr]));
    // return {
    //     triples: filteredTriples,
    //     ...data
    // };
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
            return removeSystemTriples(this.sandbox.getKeynode.bind(this.sandbox), data);
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
        console.log(getTriplesJsonFoDebug(JSON.parse(this.data), namesMap));
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
