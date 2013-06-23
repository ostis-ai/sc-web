SCWeb.core.utils.Keyboard = (function() {

    var ctrl = false;
    var shift = false;
    var alt = false;
    /**
     * @param {}
     *            keyCode Code of key that need to be updated
     * @param {boolean}
     *            value New value of key state
     */
    var _updateKeyState = function(keyCode, value) {

        if (keyCode == 17) {
            ctrl = value;
        }
        if (keyCode == 16) {
            shift = value;
        }
        if (keyCode == 18) {
            alt = value;
        }
    };
    return {
        init : function() {

            /*
             * $(document).keydown(function(e) { console.log(e.which); });
             */
            $(document).keydown($.proxy(this.keyDown, this));
            $(document).keyup($.proxy(this.keyUp, this));
        },

        /**
         * @param {}
         *            keyEvent Key event from jquery
         */
        keyDown : function(keyEvent) {

            _updateKeyState(keyEvent.which, true);
        },

        /**
         * @param {}
         *            keyEvent Key event from jquery
         */
        keyUp : function(keyEvent) {

            _updateKeyState(keyEvent.which, false);
        },

        isCtrlPressed : function() {

            return ctrl;
        },

        isShiftPressed : function() {

            return shift;
        },

        isAltPressed : function() {

            return alt;
        }
    };
})();
