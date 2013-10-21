SCWeb.ui.WindowManager = {
    
    // dictionary that contains information about windows corresponding to history items
    windows: {},
    window_count: 0,
    sandboxes: {},
    
    init: function(callback) {
        
        this.history_tabs_id = '#history-tabs';
        this.history_tabs = $(this.history_tabs_id);
        
        this.window_container_id = '#window-container';
        this.window_container = $(this.window_container_id);
        
        
        callback();
    },
    
    // ----------- History ------------
    /**
     * Append new tab into history
     * @param {String} addr sc-addr of item to append into history
     */
    appendHistoryItem: function(addr) {
        
        // @todo check if tab exist
        /*<li class="dropdown active">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown"><span class="tab-name">Что такое треугольник?</span><span class="caret pull-right"></span></a>
            <ul class="dropdown-menu">
                <li><a href="#">SCg-код</a></li>
                <li><a href="#">SCs-код</a></li>
                <li><a href="#">SCn-код</a></li>
            </ul>
        </li>*/
        var tab_html = '<li class="dropdown" sc_addr="' + addr + '">' +
                            '<a href="#" class="dropdown-toggle" data-toggle="dropdown"' +
                                '<span class="tab-name">' + addr + '</span><span class="caret pull-right"></span>' +
                            '</a>' +
                        '</li>';

        this.history_tabs.prepend(tab_html);
        
        
        
        // get translation and create window
        var ext_lang_addr = SCWeb.core.Main.getDefaultExternalLang();
        var fmt_addr = SCWeb.core.ComponentManager.getPrimaryFormatForExtLang(ext_lang_addr);
		if (fmt_addr) {
			var self = this;
			SCWeb.core.Server.getAnswerTranslated(addr, fmt_addr, function(data) {
				self.appendWindow(data.link, fmt_addr);
			});
		} else
		{
			// error
		}
        
                
    },
    
    /**
     * Removes specified history item
     * @param {String} addr sc-addr of item to remove from history
     */
    removeHistoryItem: function(addr) {
        this.history_tabs.find("[sc_addr='" + addr + "']").remove();
    },
    
    // ------------ Windows ------------
    /**
     * Append new window
     * @param {String} addr sc-addr of question
     * @param {String} fmt_addr sc-addr of window format
     */
    appendWindow: function(addr, fmt_addr) {
        /*<div class="panel panel-primary">
            <div class="panel-heading">Panel heading without title</div>
            <div class="panel-body">
                Panel content
            </div>
        </div>*/
        
        var window_id = 'window_' + addr;
        var window_html =   '<div class="panel panel-default" sc_addr="' + addr + '" sc-addr-fmt="' + fmt_addr + '">' +
                                '<div class="panel-heading">' + addr + '</div>' +
                                '<div class="panel-body" id="' + window_id + '"></div>'
                            '</div>';
        this.window_container.prepend(window_html);
        
        var sandbox = SCWeb.core.ComponentManager.createWindowSandbox(fmt_addr, window_id);
        this.sandboxes[addr] = sandbox;
        
        SCWeb.core.Server.getLinkContent(addr, 
			function(data) {
				sandbox.onDataAppend(data);
			},
			function() { // error
			}
		);
    },
    
    /**
     * Remove specified window
     * @param {String} addr sc-addr of window to remove
     */
    removeWindow: function(addr) {
        this.window_container.find("[sc_addr='" + addr + "']").remove();
    },
};
