SCWeb.ui.WindowManager = {
    
    // dictionary that contains information about windows corresponding to history items
    windows: {},
    window_count: 0,
    
    init: function(callback) {
        
        this.history_tabs_id = '#history-tabs';
        this.history_tabs = $(this.history_tabs_id);
        
        this.window_container_id = '#window-container';
        this.window_container = $(this.window_container_id);
        
        // test
        for (var i = 0; i < 10; i++) {
            this.appendHistoryItem(i.toString());
            this.appendWindow(i.toString());
        }
        
        for (var i = 0; i < 5; i++) {
            this.removeHistoryItem(i.toString());
            this.removeWindow(i.toString());
        }
        
        
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
     * @param {String} addr sc-addr of window to append
     */
    appendWindow: function(addr) {
        /*<div class="panel panel-primary">
            <div class="panel-heading">Panel heading without title</div>
            <div class="panel-body">
                Panel content
            </div>
        </div>*/
        
        var window_html =   '<div class="panel panel-default" sc_addr="' + addr + '">' +
                                '<div class="panel-heading">' + addr + '</div>' +
                                '<div class="panel-body"></div>'
                            '</div>';
        this.window_container.prepend(window_html);
    },
    
    /**
     * Remove specified window
     * @param {String} addr sc-addr of window to remove
     */
    removeWindow: function(addr) {
        this.window_container.find("[sc_addr='" + addr + "']").remove();
    },
};
