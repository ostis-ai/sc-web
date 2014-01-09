SCsComponent = {
	ext_lang: 'scs_code',
    formats: ['format_scs_json'],
    factory: function(sandbox) {
        return new SCsViewer(sandbox);
    }
};

var SCsViewer = function(sandbox) {
    this.init(sandbox);
    return this;
};

var SCsConnectors = {};

$(document).ready(function() {
	
	SCsConnectors[sc_type_arc_pos_const_perm] = "->";
	SCsConnectors[sc_type_edge_common | sc_type_const] = "==";
	SCsConnectors[sc_type_edge_common | sc_type_var] = "_==";
	SCsConnectors[sc_type_arc_common | sc_type_const] = "=>";
	SCsConnectors[sc_type_arc_common | sc_type_var] = "_=>";
	SCsConnectors[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm] = "_->";
});

SCsViewer.prototype = {
    
    container: null,
    objects: [],
    addrs: [],
    sc_links: {}, // map of sc-link objects key:addr, value: object
    data: null,
    sandbox: null,
    
    init: function(sandbox) {
        this.container = '#' + sandbox.container;       
        this.sandbox = sandbox;
        
        this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
		this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
		this.sandbox.eventApplyTranslation = $.proxy(this.updateTranslation, this);
		
		var self = this;
		$(this.container).delegate('[sc_addr]', 'click', function(e) {
			self.sandbox.doDefaultCommand([$(e.currentTarget).attr('sc_addr')]);
		});
    },
    
    /**
     * Append new addr into sc-addrs list
     * @param {String} addr sc-addr to append
     */
    _appendAddr: function(addr) {
        if (this.addrs.indexOf(addr) < 0) {
            this.addrs.push(addr);
        }
    },
        
    /*! Generate html, that represents one element of scs sentence
     */
    scsElementToHtml: function(object) {
		// check if sc-element is and sc-link
        if (object.type & sc_type_link) {
			var containerId = this.sandbox.container + '_' + this.addrs.length;
            this.sc_links[containerId] = object.addr;
            return '<div class="scs_element scs_scn_link" id="' + containerId + '" sc_addr="' + object.addr + '">' + '</div>';
        }
        
        return '<div class="scs_element"><a href="#" sc_addr="' + object.addr + '">' + object.addr + '</a></div>'
	},
    
    /*! Generates output html used by scs level 2
     */
    generateSCsLevel2: function() {
		var html = '';
		var triples = this.data.triples;
		for (idx in triples) {
			var triple = triples[idx];
			
			html += '<div class="scs_sentence">';
			html += this.scsElementToHtml(triple[0]);
			this._appendAddr(triple[0].addr);
			html += '<div class="scs_connector"><a href="#" sc_addr="' + triple[1].addr + '">' + SCsConnectors[triple[1].type] + '</a></div>';
			this._appendAddr(triple[1].addr);
			html += this.scsElementToHtml(triple[2]);
			this._appendAddr(triple[2].addr);
			html += '</div></br>';
			
		}
		
		return html;
	},
    
    // ---- window interface -----
    receiveData: function(data) {
		this.data = data;
		this.sc_links = [];
		this.addrs = [];
		
		$(this.container).empty();
        $(this.container).append(this.generateSCsLevel2());
        
        this.sandbox.createViewersForScLinks(this.sc_links, 
							function() { // success

                            }, function() { // error

                            });
    },
    
    updateTranslation: function(namesMap) {
        // apply translation
		$(this.container + ' [sc_addr]').each(function(index, element) {
			var addr = $(element).attr('sc_addr');
			if(namesMap[addr]) {
				$(element).text(namesMap[addr]);
			}
		});
    },
    
    getObjectsToTranslate: function() {
		return this.addrs;
	}
    

};

SCWeb.core.ComponentManager.appendComponentInitialize(SCsComponent);
