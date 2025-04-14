SCgComponent = {
    ext_lang: 'scg_code',
    formats: ['format_scg_json', 'format_gwf_json'],
    struct_support: {'format_scg_json': true, 'format_gwf_json': false},
    factory: async function (sandbox) {
        return await createSCgViewerWindow(sandbox);
    }
};

async function createSCgViewerWindow(sandbox) {
    const instance = new SCgViewerWindow(sandbox);
    await instance.initialize();
    return instance;
}

/**
 * SCgViewerWindow
 * @param sandbox
 * @constructor
 */
const SCgViewerWindow = function (sandbox) {
    this.sandbox = sandbox;
};

SCgViewerWindow.prototype.initialize = async function() {

    const self = this;

    this.tree = new SCg.Tree();
    this.editor = new SCg.Editor();


    this._buildGraphForScgJson = function (data) {
        data = JSON.parse(data)
        var elements = {};
        var connectors = [];
        for (var i = 0; i < data.length; i++) {
            var el = data[i];

            if (elements.hasOwnProperty(el.id))
                continue;
            if (Object.prototype.hasOwnProperty.call(self.editor.scene.objects, el.id)) {
                elements[el.id] = self.editor.scene.objects[el.id];
                continue;
            }

            if (el.el_type & sc_type_node) {
                var model_node = SCg.Creator.generateNode(el.el_type, new SCg.Vector3(10 * Math.random(), 10 * Math.random(), 0), '');
                self.editor.scene.appendNode(model_node);
                self.editor.scene.objects[el.id] = model_node;
                model_node.setScAddr(el.id);
                model_node.setObjectState(SCgObjectState.FromMemory);
                elements[el.id] = model_node;
            } else if (el.el_type & sc_type_connector) {
                connectors.push(el);
            }
        }

        // create connectors
        var founded = true;
        while (connectors.length > 0 && founded) {
            founded = false;
            for (idx in connectors) {
                var obj = connectors[idx];
                var beginId = obj.begin;
                var endId = obj.end;
                // try to get begin and end object for arc
                if (elements.hasOwnProperty(beginId) && elements.hasOwnProperty(endId)) {
                    var beginNode = elements[beginId];
                    var endNode = elements[endId];
                    founded = true;
                    connectors.splice(idx, 1);
                    var model_connector = SCg.Creator.generateConnector(beginNode, endNode, obj.el_type);
                    self.editor.scene.appendConnector(model_connector);
                    self.editor.scene.objects[obj.id] = model_connector;
                    model_connector.setScAddr(obj.id);
                    model_connector.setObjectState(SCgObjectState.FromMemory);
                    elements[obj.id] = model_connector;
                }
            }
        }

        if (connectors.length > 0)
            alert("There are some sc-connectors that are impossible to be shown.");

        self.editor.render.update();
        self.editor.scene.layout();
    };

    this._buildGraphForGwfJson = function (data) {
        ScgObjectBuilder.scene = self.editor.scene
        GwfFileLoader.loadFromText(data, self.editor.render);
    };

    const formats = await window.scClient.resolveKeynodes(SCgComponent.formats.map(value => {return {id: value, type: sc.ScType.NodeConst}}));
    if (!SCgComponent.struct_support.hasOwnProperty(formats["format_scg_json"].value))
        SCgComponent.struct_support[formats["format_scg_json"].value] = SCgComponent.struct_support["format_scg_json"];
    if (!SCgComponent.struct_support.hasOwnProperty(formats["format_gwf_json"].value))
        SCgComponent.struct_support[formats["format_gwf_json"].value] = SCgComponent.struct_support["format_gwf_json"];
    this.editor.setFormat(this.sandbox.format_addr);
    this._buildGraphForFormatMap = {
        [formats["format_scg_json"].value]: this._buildGraphForScgJson,
        [formats["format_gwf_json"].value]: this._buildGraphForGwfJson
    };
    console.log(this._buildGraphForFormatMap);

    // todo(kilativ-dotcom): I don't understand why scg was supposed to be used not for structs
    this.scStructTranslator = new SCgStructTranslator(this.editor, this.sandbox);

    const autocompletionVariants = async function (keyword, callback) {
        const strings = await window.scClient.searchLinkContentsByContentSubstrings([keyword])
        const maxContentSize = 80;
        const keys = strings.length ? strings[0].filter((string) => string.length < maxContentSize) : [];
        callback(keys);
    };

    this.editor.init(
        {
            sandbox: this.sandbox,
            containerId: this.sandbox.container,
            autocompletionVariants: autocompletionVariants,
            translateToSc: function (callback) {
                console.log("translating to sc!!!!!!")
                return self.scStructTranslator.translateToSc().then(callback).catch(callback);
            },
            canEdit: this.sandbox.canEdit(),
            resolveControls: this.sandbox.resolveElementsAddr,
        }
    );


    this.receiveData = function (data) {
        this._buildGraphForFormatMap[this.editor.getFormat()](data);
    };

    this.destroy = function () {
        delete this.editor;
        return true;
    };

    this.getObjectsToTranslate = function () {
        return this.editor.scene.getScAddrs();
    };

    this.applyTranslation = function (namesMap) {
        for (let addr in namesMap) {
            const obj = this.editor.scene.getObjectByScAddr(addr);
            if (obj) {
                obj.text = namesMap[addr];
            }
        }
        this.editor.render.updateTexts();
    };


    this.eventStructUpdate = function () {
        self.scStructTranslator.updateFromSc.apply(self.scStructTranslator, arguments).then(null);
    };

    // delegate event handlers
    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
    this.sandbox.eventApplyTranslation = $.proxy(this.applyTranslation, this);
    this.sandbox.eventStructUpdate = $.proxy(this.eventStructUpdate, this);

    this.sandbox.updateContent();
};


SCWeb.core.ComponentManager.appendComponentInitialize(SCgComponent);
