SCWeb.core.ui.Locker = (function() {

    var _locker = null;
    return {
        show : function() {

            if (!_locker) {
                _locker = $('<div id="uilocker"></div>').appendTo('body');
            }
            _locker.addClass('shown');
        },

        hide : function() {

            _locker.removeClass('shown');
        }
    };
})();
