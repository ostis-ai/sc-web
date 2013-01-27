SCWeb.core.ui.Locker = {
    _locker: null,

    show: function() {
        if(!this._locker) {
            this._locker = $('<div id="uilocker"></div>').appendTo('body');
        }
        this._locker.addClass('shown');
    },

    hide: function() {
        this._locker.removeClass('shown');
    }
};
