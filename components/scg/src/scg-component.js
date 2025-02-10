SCgComponent = {
    ext_lang: 'scg_code',
    formats: ['format_scg_json'],
    struct_support: true,
    factory: function (sandbox) {
        return new SCgViewerWindow(sandbox);
    }
};


/**
 * SCgViewerWindow
 * @param sandbox
 * @constructor
 */
const SCgViewerWindow = function (sandbox) {
    const self = this;

    this.sandbox = sandbox;
    this.tree = new SCg.Tree();
    this.editor = new SCg.Editor();

    // todo(kilativ-dotcom): I don't understand why scg was supposed to be used not for structs
    this.scStructTranslator = new SCgStructTranslator(this.editor, this.sandbox);

    const autocompletionVariants = async function (keyword, callback) {
        strings = await window.scClient.searchLinkContentsByContentSubstrings([keyword])
        const maxContentSize = 80;
        const keys = strings.length ? strings[0].filter((string) => string.length < maxContentSize) : [];
        callback(keys);
    };

    this.editor.init(
        {
            sandbox: sandbox,
            containerId: sandbox.container,
            autocompletionVariants: autocompletionVariants,
            translateToSc: function (callback) {
                return self.scStructTranslator.translateToSc().then(callback).catch(callback);
            },
            canEdit: this.sandbox.canEdit(),
            resolveControls: this.sandbox.resolveElementsAddr,
        }
    );


    this.receiveData = function (data) {
        this._buildGraph(data);
    };

    this._buildGraph = function (data) {
        ScgObjectBuilder.scene = self.editor.scene
        GwfFileLoader.loadFromText(data, self.editor.render);
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
};


SCWeb.core.ComponentManager.appendComponentInitialize(SCgComponent);
