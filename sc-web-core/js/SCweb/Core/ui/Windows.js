SCWeb.core.ui.Windows = {
    
    _container: "#tabs_container",
    window_counter: 0,
    windows: {},   // map of currently created windows
    active_window: null,
    
    init: function(callback) {
        SCWeb.core.Translation.registerListener(this);
        
        $('#btn_add_new_window').click($.proxy(this.onCreateWindow, this));
        
        $(document).on("click", ".sc_window", function(event) {
            var idx = $(this).attr('window_num');
            SCWeb.core.ui.Windows.setActiveWindow(idx);
        });

        $('#tabs_container').delegate('button.close', 'click', function(event) {
            var windowId = $(this).attr('window_num');
            SCWeb.core.ui.Windows.destroyWindow(windowId);
            // to prevent handling 'click' event on a '.sc_window' tab
            event.stopPropagation();
        });
        
        if (callback)
            callback();
    },
    
    /**
     * Event hadler for new window button
     */
    onCreateWindow: function() {
        
        var outputLang = SCWeb.core.ui.OutputLanguages.getLanguage();
        
        if (outputLang) {
            this.createWindow(outputLang);
        }
    },
    
    /**
     * Create new window with specified output language
     * @param {String} outputLang SC-addr of output language
     */
    createWindow: function(outputLang) {
        
        var window_num_str = (++this.window_counter).toString();
        var window_id = "window_" + window_num_str;
        var window_data_container = 'window_data_' + this.window_counter;
        
        // fist of all we need to append tab
        $('#tabs_container').append('<li id="' + window_id + '" class="sc_window" window_num="' + window_num_str + '"><a href="#">Window ' + window_num_str + '</a><button class="close" window_num="' + window_num_str + '"><i class="icon-remove-sign"></i></button></li>');
        $('#tabs_data_container').append('<div id="' + window_data_container + '" class="sc_window_data" window_num="' + window_num_str + '"></div>');
        var config = {'container': window_data_container};
        var window = SCWeb.core.ComponentManager.createComponentInstance(config, SCWeb.core.ComponentType.viewer, outputLang);
        this.windows[this.window_counter] = window;
        
        this.setActiveWindow(this.window_counter);
    },
    
    /**
     * Setup specified window as active
     * @param {String} windowId Id of window, that need to be activated
     */
    setActiveWindow: function(windowId) {
        var self = this;
        this.active_window = null;
        var window_id_str = windowId.toString();
        $(this._container + ' .sc_window').each(function (index, element) {
            var v = $(this).attr('window_num');
            
            $(this).removeClass('active');
            
            if (v == window_id_str) {
                $(this).addClass('active');
                self.active_window = windowId;
            }
        });
        
        $('#tabs_data_container .sc_window_data').each(function (index, element) {
            var v = $(this).attr('window_num');
            
            if (v == window_id_str) {
                $(this).removeClass('hidden');
                self.active_window = windowId;
            }else{
                $(this).addClass('hidden');
            }
        });
    },

    destroyWindow: function(windowId) {
        var window = this.windows[windowId];
        //TODO: uncomment when 'destroy' will be implementing
        //window.destroy();
        delete this.windows[windowId];
        var tabSelector = '#tabs_container li[window_num=' + windowId + ']';
        var dataContainerSelector = '#tabs_data_container div[window_num=' + windowId + ']';
        $(tabSelector).remove();
        $(dataContainerSelector).remove();
        if(this.active_window == windowId) {
            this.active_window = null;
            var w;
            for(w in this.windows) {
                this.active_window = w;
                this.setActiveWindow(w);
                return;
            }
        }
    },

    /**
     * Function, to send data into specified window
     * @param {Number} windowId Id of a window, where data need to be sent
     * @param {String} data Data that need to sent
     */
    sendDataToWindow: function(windowId, data) {
        var wind = SCWeb.core.ui.Windows.windows[windowId];
        
        if (wind) {
            wind.recieveData(data);
        }
    },
    
    // ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
    },
    
    /**
     * @return {Array} Returns list obj sc-elements that need to be translated
     */
    getObjectsToTranslate: function() {
        return [];
    }
};
