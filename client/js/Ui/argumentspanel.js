SCWeb.ui.ArgumentsPanel = {
    _container: '#arguments_buttons',

    init: function () {
        this.argument_add_state = false;
        var dfd = new jQuery.Deferred();

        var self = this;
        // listen events from arguments
        SCWeb.core.EventManager.subscribe("arguments/add", this, this.onArgumentAppended);
        SCWeb.core.EventManager.subscribe("arguments/remove", this, this.onArgumentRemoved);
        SCWeb.core.EventManager.subscribe("arguments/clear", this, this.onArgumentsCleared);


        // listen events from translation
        SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
        SCWeb.core.EventManager.subscribe("translation/get", this, function (objects) {
            var items = self.getObjectsToTranslate();
            for (var i in items) {
                objects.push(items[i]);
            }
        });

        $('#arguments_clear_button').click(function () {
            if (self.isArgumentAddState())
                return;
            SCWeb.core.Arguments.clear();
        });
        $('#arguments_add_button').click(function () {
            self.argument_add_state = !self.argument_add_state;
            self.updateArgumentAddState();
        });

        $(document).on("click", ".argument-item", function (event) {
            var idx = $(this).attr('arg_idx');
            SCWeb.core.Arguments.removeArgumentByIndex(parseInt(idx));
        });

        dfd.resolve();
        return dfd.promise();
    },

    isArgumentAddState: function () {
        return this.argument_add_state;
    },

    updateArgumentAddState: function () {
        var add_button = $("#arguments_add_button");
        if (this.argument_add_state) {
            add_button.addClass('argument-wait');
        } else {
            add_button.removeClass('argument-wait');
        }
    },

    // ------- Arguments listener interface -----------
    onArgumentAppended: function (argument, idx) {

        this.argument_add_state = false;
        this.updateArgumentAddState();

        var idx_str = idx.toString();
        var self = this;

        var new_button = '<button class="btn btn-primary argument-item argument-translate-state" sc_addr="'
            + argument
            + '" arg_idx="'
            + idx_str
            + '" id="argument_'
            + idx_str
            + '"></button>';
        $(this._container).append(new_button);

        // translate added argument
        $.when(SCWeb.core.Translation.translate([argument])).done(function (namesMap) {

            var value = argument;
            if (namesMap[argument]) {
                value = namesMap[argument];
            }

            $(self._container + " [sc_addr='" + argument + "']").text(value).removeClass('argument-translate-state');
        });

    },

    onArgumentRemoved: function (argument, idx) {

        $('#argument_' + idx.toString()).remove();
        // update indicies
        $(this._container + ' [arg_idx]').each(function (index, element) {

            var v = parseInt($(this).attr('arg_idx'));

            if (v > idx) {
                v = v - 1;
                $(this).attr('arg_idx', v.toString());
                $(this).attr('id', 'argument_' + v.toString());
            }
        });
    },

    onArgumentsCleared: function () {

        $(this._container).empty();
    },

    // ------- Translation listener interface ---------
    updateTranslation: function (namesMap) {

        // apply translation
        $('#arguments_buttons [sc_addr]').each(function (index, element) {

            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
    },

    getObjectsToTranslate: function () {

        return SCWeb.core.Arguments._arguments;
    }

};
