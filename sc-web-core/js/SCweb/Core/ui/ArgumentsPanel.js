SCWeb.core.ui.ArgumentsPanel = {
    _container : '#arguments_buttons',

    init : function(callback) {

        SCWeb.core.Translation.registerListener(this);

        SCWeb.core.Arguments.registerListener(this);
        SCWeb.core.Translation.registerListener(this);

        $('#arguments_clear_button').click(function() {

            SCWeb.core.Arguments.clear();
        });

        $(document).on("click", ".arguments_item", function(event) {

            var idx = $(this).attr('arg_idx');
            SCWeb.core.Arguments.removeArgumentByIndex(parseInt(idx));
        });

        if (callback){callback();}
    },

    // ------- Arguments listener interface -----------
    argumentAppended : function(argument, idx) {

        var idx_str = idx.toString();
        var self = this;

        // translate added command
        SCWeb.core.Translation
                .translate(
                        [ argument ],
                        null,
                        function(namesMap) {

                            var value = argument;
                            if (namesMap[argument]) {
                                value = namesMap[argument];
                            }

                            var new_button = '<button class="btn arguments_item" sc_addr="'
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

    argumentRemoved : function(argument, idx) {

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

    argumentsCleared : function(arguments) {

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

    /**
     * @return Returns list obj sc-elements that need to be translated
     */
    getObjectsToTranslate : function() {

        return SCWeb.core.Arguments._arguments;
    }

};
