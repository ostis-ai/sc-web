SCs.Viewer = function () {

    this.sandbox = null;
    this.containerId = null;
    this.getKeynode = null;
    this.tree = null;
    this.output = null;
    this.expertModeEnabled = false;


    const buildOutput = () => {
        this.tree = new SCs.SCnTree();
        this.tree.init(null, this.getKeynode);

        this.output = new SCs.SCnOutput();
        this.output.init(this.tree, this.sandbox.container, this.getKeynode, this.sandbox.generateWindowContainer);
    };

    this.init = function (sandbox, keynode_func) {
        this.sandbox = sandbox;
        this.containerId = '#' + sandbox.container;
        this.getKeynode = keynode_func;
    };

    this.getSystemSet = function () {
        const set = {};
        set[this.getKeynode('lang_en')] = true;
        set[this.getKeynode('lang_ru')] = true;
        set[this.getKeynode('nrel_system_identifier')] = true;
        return set;
    };

    this.appendData = function (data) {
        var self = this;
        buildOutput();
        this.tree.build(data.keywords, data.triples);
        $(self.containerId).html(self.output.toHtml());

        $(self.containerId + ' .sc-contour > .scs-scn-view-toogle-button').click(function () {
            var button = $(this);
            var contour = button.parent();
            var contour_addr = contour.attr('sc_addr');
            var primary = contour.find('.scs-scn-view-primary');
            var external = contour.find('.scs-scn-view-external');

            var height = Math.min(Math.max(primary.height(), 600), 1024);
            var width = primary.width();

            if (primary.is(":visible") && !external.has('div').length) {
                var wid = self.sandbox.container + '-' + contour_addr;
                external.html('<div id="' + wid + '" style="width: ' + width + 'px; height: ' + height + 'px;"></div>');

                var structs = {};
                structs[wid] = {addr: contour_addr, ext_lang_addr: self.getKeynode('scg_code')};
                self.sandbox.createViewersForScStructs(structs);
            }

            primary.toggleClass('hidden');
            external.toggleClass('hidden');
        });
    };

    this.getAddrs = function () {
        return this.tree.addrs;
    };

    this.getLinks = function () {
        return this.output.sc_links;
    };

};

