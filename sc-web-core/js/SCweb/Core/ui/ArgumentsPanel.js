SCWeb.core.ui.ArgumentsPanel = {
    _container: '#arguments_buttons',
    
    init: function(callback) {
        SCWeb.core.Translation.registerListener(this);
        
        SCWeb.core.Arguments.setListener(this);
        
        $('#arguments_clear_button').click(function () {
            SCWeb.core.Arguments.clear();
        });
        
        if (callback)
            callback();
    },
    
    // ------- Arguments listener interface -----------
    argumentAppended: function (argument, idx) {
        var new_button = '<button class="btn arguments_item" sc_addr="' + argument + '" arg_idx="' + idx.toString() + '">' + argument + '</button>';
        $(this._container).append(new_button);
        
        $(this._container + ' [arg_idx]').click(function () {
            var idx = $(this).attr('arg_idx');
            SCWeb.core.Arguments.removeArgumentByIndex(parseInt(idx));
        });
    },
    
    argumentRemoved: function(argument, idx) {
        $(this._container + ' [arg_idx]').remove();
    },
     
    argumentsCleared: function() {
        $(this._container).empty();
    },
    
    // ------- Translation listener interface ---------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#arguments_buttons [sc_addr]').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    },
    
    /**
     * @return Returns list obj sc-elements that need to be translated
     */
    getObjectsToTranslate: function() {
        return SCWeb.core.Arguments._arguments;
    }
    
};
