SCWeb.core.utils.Keyboard = {
    
    ctrl: false,
    shift: false,
    alt: false,
    
    init: function(callback) {
        
        /*$(document).keydown(function(e) {
            console.log(e.which);
        });*/
        
        var self = this;
        $(document).keydown($.proxy(this.keyDown, this));
        $(document).keyup($.proxy(this.keyUp, this));
        
        callback();
    },
    
    /**
     * @param {} keyEvent Key event from jquery
     */
    keyDown: function(keyEvent) {
        this._updateKeyState(keyEvent.which, true);
    },
    
    /**
     * @param {} keyEvent Key event from jquery
     */
    keyUp: function(keyEvent) {
        this._updateKeyState(keyEvent.which, false);
    },
    
    /**
     * @param {} keyCode Code of key that need to be updated
     * @param {boolean} value New value of key state
     */
    _updateKeyState: function(keyCode, value) {
        
        if (keyCode == 17) this.ctrl = value;
        if (keyCode == 16) this.shift = value;
        if (keyCode == 18) this.alt = value;
    }

};


