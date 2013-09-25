SCWeb.ui.Utils = {
    
    bindArgumentsSelector: function(selector) {

        $(selector).on("mousedown", function(e) {
            var self = this;
            clearTimeout(this.downTimer);
            
            this.downTimer = setTimeout(function() {
                SCWeb.core.Arguments.appendArgument($(self).attr('sc_addr'));
                self.done = true;
                clearTimeout(this.downTimer);
            }, 1000);
            
        }).on("mouseup mouseleave", function(e) {
            clearTimeout(this.downTimer);
            if (this.done) {
                delete this.done;
                e.stopPropagation();
            }
        });
        
    },
    
};
