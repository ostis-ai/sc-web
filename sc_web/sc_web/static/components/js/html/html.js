/* --- src/html.js --- */
var Html = Html || { version: "0.1.0" };


/* --- src/html-component.js --- */
HtmlComponent = {
    formats: ['format_html'],
    factory: function(sandbox) {
        return new HtmlViewer(sandbox);
    }
};

var HtmlViewer = function(sandbox) {
    this.init(sandbox);
    return this;
};


HtmlViewer.prototype = {
    
    container: null,
    data: null,
    sandbox: null,
    addrs: [],
    
    init: function(sandbox) {
        this.container = '#' + sandbox.container;
        this.sandbox = sandbox;
        
        this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
        this.sandbox.eventApplyTranslation = $.proxy(this.updateTranslation, this);
        this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
        
        this.sandbox.updateContent();
    },

    receiveData: function(data) {
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
        var self = this;
        SCWeb.core.Server.resolveScAddr(idtfList.concat(scLinksList), function(addrs) {
            for (idtf in addrs) {
                self.addrs.push(addrs[idtf]);
            }
    
            var sc_elements = $(self.container + ' sc_element');
            for (var i = 0; i < sc_elements.length; ++i) {
                var addr = addrs[ $(sc_elements[i]).attr('sys_idtf')];
                if (addr) {
                    $(sc_elements[i]).html('<a href="#" class="sc-element" sc_addr="' + addr + '">' + $(sc_elements[i]).html() + "</a>");
                } else {
                    $(sc_elements[i]).addClass('sc-not-exist');
                }
            }

            var sc_links_el = $(self.container + ' sc_link');
            for (var i = 0; i < sc_links_el.length; ++i) {
                var addr = addrs[ $(sc_links_el[i]).attr('sys_idtf')];
                if (addr) {
                    var containerId = self.sandbox.container + '_' + i;
                    sc_links[containerId] = addr;
                    $(sc_links_el[i]).html('<div class="sc-content" sc_addr="' + addr + '" id="' + containerId + '"></div>');
                }
            }
            
            
            $.when(self.sandbox.createViewersForScLinks(sc_links)).done(
                function() {
                    dfd.resolve();
                });
            //dfd.resolve();
        });

        return dfd.promise();
    },

    // ---- window interface -----
    updateTranslation: function(namesMap) {
        // apply translation
        $(this.container + ' [sc_addr]:not(.sc-content)').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr] && $(element).is(':empty')) {
                $(element).text(namesMap[addr]);
            }
        });
    },
    
    getObjectsToTranslate: function() {
        return this.addrs;
    }
    

};

SCWeb.core.ComponentManager.appendComponentInitialize(HtmlComponent);


