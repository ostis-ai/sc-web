SCnComponent = {
    ext_lang: 'scn_code',
    formats: ['format_scs_json'], // server side format to translate sc to format that processing Viewer
    factory: function (sandbox) {
        return new SCnViewer(sandbox);
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

var SCnViewer = function (sandbox) {
    this.objects = [];
    this.addrs = [];
    this.sc_links = {}; // map of sc-link objects key:addr, value: object
    this.data = null;

    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;
    this.expertModeModeManager = new ExpertModeManager(sandbox);
    SCWeb.core.EventManager.subscribe("expert_mode_changed", this, () => {
        this.sandbox.removeChild();
        this.receiveData(this.data);
        this.sandbox.translate();
    });

    SCWeb.core.EventManager.subscribe("translation/changed_language", this, () => {
        this.sandbox.removeChild();
        this.receiveData(this.data);
        this.sandbox.translate();
    });

    // ---- window interface -----
    this.receiveData = async (data) => {
        this.data = data;
        data = JSON.parse(data);
        data = this.expertModeModeManager.applyExpertMode(data);
        this.viewer.appendData(data);
        return this.sandbox.createViewersForScLinks(this.viewer.getLinks());
    };

    this.updateTranslation = function (namesMap) {
        // apply translation
        // console.log(getTriplesJsonFoDebug(JSON.parse(this.data), namesMap, this.sandbox.keynodes));
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

    this.sandbox.eventDataAppend = this.receiveData;
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


SCWeb.core.ComponentManager.appendComponentInitialize(SCnComponent);
