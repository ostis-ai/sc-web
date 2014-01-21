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
        
        var self = this;
        $(this.container).delegate('[sc_addr]', 'click', function(e) {
            self.sandbox.doDefaultCommand([$(e.currentTarget).attr('sc_addr')]);
        });
        
        /*if (this.sandbox.link_addr) {
            this.sandbox.getLinkContent(this.sandbox.link_addr,
                                            $.proxy(this.receiveData, this),
                                            function () {});
        }*/

    },

    receiveData: function(data) {
        var dfd = new jQuery.Deferred();

        $(this.container).html(data);

        // collect all sc-element and process them
        var idtfList = [];
        var sc_elements = $(this.container + ' sc_element');
        for (var i = 0; i < sc_elements.length; ++i) {
            var id = $(sc_elements[i]).attr('sys_idtf');
            
            if (id)
                idtfList.push(id);
        }

        // resolve addrs
        var self = this;
        SCWeb.core.Server.resolveScAddr(idtfList, function(addrs) {
            for (idtf in addrs) {
                self.addrs.push(addrs[idtf]);
            }
    
            var sc_elements = $(self.container + ' sc_element');
            for (var i = 0; i < sc_elements.length; ++i) {
                var addr = addrs[ $(sc_elements[i]).attr('sys_idtf')];
                if (addr) {
                    $(sc_elements[i]).attr('sc_addr', addr).addClass('sc-element');
                }
            }

            dfd.resolve();
        });

        return dfd.promise();
    },

    // ---- window interface -----
    updateTranslation: function(namesMap) {
        // apply translation
        $(this.container + ' [sc_addr]').each(function(index, element) {
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


