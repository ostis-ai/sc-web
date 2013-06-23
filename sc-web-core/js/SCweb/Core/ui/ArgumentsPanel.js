SCWeb.core.ui.ArgumentsPanel = (function() {

    var _container = '#arguments_buttons';
    return {
        init : function() {

            SCWeb.core.Environment.on(SCWeb.core.events.Translation.UPDATE, $
                    .proxy(this.updateTranslation, this));
            SCWeb.core.Environment.on(
                    SCWeb.core.events.Translation.COLLECT_ADDRS, $.proxy(
                            this.getObjectsToTranslate, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.APPENDED, $
                    .proxy(this.argumentAppended, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.REMOVED, $
                    .proxy(this.argumentRemoved, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Argument.CLEARED, $
                    .proxy(this.argumentsCleared, this));
            $('#arguments_clear_button').click(function() {

                SCWeb.core.Environment.fire(SCWeb.core.events.Argument.CLEAR);
            });

            $(document).on(
                    "click",
                    ".arguments_item",
                    function(event) {

                        var idx = $(this).attr('arg_idx');
                        var intInd = parseInt(idx);
                        SCWeb.core.Environment.fire(
                                SCWeb.core.events.Argument.REMOVE_IND, intInd);
                    });
        },

        // ------- Arguments listener interface -----------
        argumentAppended : function(event) {

            var idx_str = event.argIndex.toString();
            var argument = event.argValue;
            var eventData = {};
            eventData.language = null;
            eventData.translValues = [ argument ];
            eventData.callback = $.proxy(function(namesMap) {

                var value = argument;
                if (namesMap[argument]) {
                    value = namesMap[argument];
                }

                var new_button = '<button class="btn arguments_item" sc_addr="'
                        + argument + '" arg_idx="' + idx_str
                        + '" id="argument_' + idx_str + '">' + value
                        + '</button>';
                $(_container).append(new_button);
            }, this);
            SCWeb.core.Environment.fire(
                    SCWeb.core.events.Translation.TRANSLATE, eventData);
        },

        argumentRemoved : function(event) {

            var idx = event.argIndex;
            $('#argument_' + idx.toString()).remove();
            // update indicies
            $(_container + ' [arg_idx]').each(function(index, element) {

                var v = parseInt($(this).attr('arg_idx'));

                if (v > idx) {
                    v = v - 1;
                    $(this).attr('arg_idx', v.toString());
                    $(this).attr('id', 'argument_' + v.toString());
                }
            });
        },

        argumentsCleared : function() {

            $(_container).empty();
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
        getObjectsToTranslate : function(toTranslate) {

            var arguments = SCWeb.core.Environment
                    .getResource(SCWeb.core.Resources.ARGUMENTS);
            toTranslate.append(arguments);
        }

    };
})();