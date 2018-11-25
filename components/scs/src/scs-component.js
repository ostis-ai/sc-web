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


function isTripleSystem(set, triple) {
    return set[triple[0].addr] || set[triple[1].addr] || set[triple[2].addr];
}

function removeSystemTriples(set, triples) {
    return triples.filter((triple) => !isTripleSystem(set, triple));
}

function getTriplesJsonFoDebug({keywords, triples, ...data}, translationMap) {
    const renameScAddr = ({addr, ...data}) => ({addr: translationMap[addr] || addr, ...data});
    const renamedKeywords = keywords.map(renameScAddr);
    const renamedTriples = triples.map((triple) => triple.map(renameScAddr));
    return {keywords: renamedKeywords, triples: renamedTriples, ...data};
}


var SCsViewer = function (sandbox) {
    this.objects = new Array();
    this.addrs = new Array();
    this.sc_links = {}; // map of sc-link objects key:addr, value: object
    this.data = null;

    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;

    const getSystemSet = () => {
        const set = {};
        set[this.sandbox.getKeynode('lang_en')] = true;
        set[this.sandbox.getKeynode('lang_ru')] = true;
        set[this.sandbox.getKeynode('nrel_system_identifier')] = true;
        return set;
    };

    const hideSystemDataIfNecessary = ({triples, ...data}, expertModeEnabled = SCWeb.core.ExpertModeEnabled) => {
        if (expertModeEnabled) {
            return {triples, ...data};
        } else {
            return {triples: removeSystemTriples(getSystemSet(), triples), ...data}
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
