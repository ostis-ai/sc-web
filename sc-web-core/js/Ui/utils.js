SCWeb.ui.Utils = {
    /**
     * Bind default handler for arguments selection to specified elements
     * @param {String} container_id Id of elements container
     * @param {String} selector jQuery selector for elements
     */
    bindArgumentsSelector: function(container_id, selector) {

        $("#" + container_id).delegate(selector, "mousedown", function(e) {
			
			if (e.which === 1) {
				
				var self = this;
				clearTimeout(this.downTimer);
				self.done = false;
				
				this.downTimer = setTimeout(function() {
					SCWeb.core.Arguments.appendArgument($(self).attr('sc_addr'));
					self.done = true;
					clearTimeout(this.downTimer);
				}, 1000);
				
				e.stopPropagation();
			}
            
        }).delegate(selector, "mouseup mouseleave", function(e) {
            clearTimeout(this.downTimer);
            if (this.done) {
				e.stopPropagation();
            }
        }).delegate(selector, "click", function(e) {
			if (this.done) {
				e.stopPropagation();
			}
		});
        
    },
    
};
