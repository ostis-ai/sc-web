SCWeb.ui.ArgumentsPanel = {
    _container : '#arguments_buttons',

    init : function(callback) {

      	var self = this;
		// listen events from arguments
		SCWeb.core.EventManager.subscribe("arguments/add", this, this.onArgumentAppended);
		SCWeb.core.EventManager.subscribe("arguments/remove", this, this.onArgumentRemoved);
		SCWeb.core.EventManager.subscribe("arguments/clear", this, this.onArgumentsCleared);
		
        
        // listen events from translation
		SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
        SCWeb.core.EventManager.subscribe("translation/get", this, function(objects) {
			var items = self.getObjectsToTranslate();
			for (var i in items) {
				objects.push(items[i]);
			}
		});
		

        $('#arguments_clear_button').click(function() {

            SCWeb.core.Arguments.clear();
        });

        $(document).on("click", ".arguments_item", function(event) {

            var idx = $(this).attr('arg_idx');
            SCWeb.core.Arguments.removeArgumentByIndex(parseInt(idx));
        });
        
        callback();
    },

    // ------- Arguments listener interface -----------
    onArgumentAppended : function(argument, idx) {

        var idx_str = idx.toString();
        var self = this;

        // translate added command
        SCWeb.core.Translation
                .translate(
                        [ argument ],
                        function(namesMap) {

                            var value = argument;
                            if (namesMap[argument]) {
                                value = namesMap[argument];
                            }

                            var new_button = '<button class="btn btn-primary arguments_item" sc_addr="'
                                    + argument
                                    + '" arg_idx="'
                                    + idx_str
                                    + '" id="argument_'
                                    + idx_str
                                    + '">'
                                    + value + '</button>';
                            $(self._container).append(new_button);
                        });

    },

    onArgumentRemoved : function(argument, idx) {

        $('#argument_' + idx.toString()).remove();
        // update indicies
        $(this._container + ' [arg_idx]').each(function(index, element) {

            var v = parseInt($(this).attr('arg_idx'));

            if (v > idx) {
                v = v - 1;
                $(this).attr('arg_idx', v.toString());
                $(this).attr('id', 'argument_' + v.toString());
            }
        });
    },

    onArgumentsCleared : function() {

        $(this._container).empty();
    },

    // ------- Translation listener interface ---------
    updateTranslation : function(namesMap) {

        // apply translation
        $('#arguments_buttons [sc_addr]').each(function(index, element) {

            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    },

    getObjectsToTranslate : function() {

        return SCWeb.core.Arguments._arguments;
    }

};
