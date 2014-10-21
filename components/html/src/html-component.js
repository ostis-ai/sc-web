HtmlComponent = {
    formats: ['format_html'],
    factory: function(sandbox) {
        return new HtmlViewer(sandbox);
    }
};

var HtmlViewer = function(sandbox) {
    this.data = null;
    this.addrs = new Array();
    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;
    $(this.container).addClass("html-window");

    this.receiveData = function(data) {
        var dfd = new jQuery.Deferred();

        $(this.container).html(data);

        // collect all sc-element and process them
        var idtfList = [];
        var sc_links = {};
        var sc_elements = $(this.container + ' sc_element');
        for (var i = 0; i < sc_elements.length; ++i) {
            var id = $(sc_elements[i]).attr('sys_idtf');
            if (id)
                idtfList.push(id);
        }

        // collect all sc-links
        var scLinksList = [];
        var sc_links_el = $(this.container + ' sc_link');
        for (var i = 0; i < sc_links_el.length; ++i) {
            var id = $(sc_links_el[i]).attr('sys_idtf');
            if (id)
                scLinksList.push(id);
        }

        // resolve addrs
        SCWeb.core.Server.resolveScAddr(idtfList.concat(scLinksList), $.proxy(function(addrs) {
            for (idtf in addrs) {
                this.addrs.push(addrs[idtf]);
            }
    
            var sc_elements = $(this.container + ' sc_element');
            for (var i = 0; i < sc_elements.length; ++i) {
                var addr = addrs[ $(sc_elements[i]).attr('sys_idtf')];
                if (addr) {
                    $(sc_elements[i]).html('<a href="#" class="sc-element" sc_addr="' + addr + '">' + $(sc_elements[i]).html() + "</a>");
                } else {
                    $(sc_elements[i]).addClass('sc-not-exist');
                }
            }

            var sc_links_el = $(this.container + ' sc_link');
            for (var i = 0; i < sc_links_el.length; ++i) {
                var addr = addrs[ $(sc_links_el[i]).attr('sys_idtf')];
                if (addr) {
                    var containerId = this.sandbox.container + '_' + i;
                    sc_links[containerId] = addr;
                    $(sc_links_el[i]).html('<div class="sc-content" sc_addr="' + addr + '" id="' + containerId + '"></div>');
                }
            }
            
            $.when(this.sandbox.createViewersForScLinks(sc_links)).done(
                function() {
                    dfd.resolve();
                });
                
            $(this.container + ' a:not(.sc-element)').attr('target', '_blank');
                
            //dfd.resolve();
        }, this));

        return dfd.promise();
    },

    // ---- window interface -----
    this.updateTranslation = function(namesMap) {
        // apply translation
        $(this.container + ' [sc_addr]:not(.sc-content)').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr] && $(element).is(':empty')) {
                $(element).text(namesMap[addr]);
            }
        });
    },
    
    this.getObjectsToTranslate = function() {
        return this.addrs;
    }

    this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
    this.sandbox.eventApplyTranslation = $.proxy(this.updateTranslation, this);
    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    
    this.sandbox.updateContent();
};


SCWeb.core.ComponentManager.appendComponentInitialize(HtmlComponent);
