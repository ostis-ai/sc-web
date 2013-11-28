SCWeb.ui.SettingsPanel = {
	
	/*!
     * Initialize settings panel.
     * @param {Object} params Parameters for panel initialization.
     * There are required parameters:
     * - languages - list of available natural languages
     */
    init: function(params, callback) {
		this.languages = params.languages;
		this.popoverVisible = false;
		var self = this;
		
		$("#settings-button").popover({
			id: "settings-popover",
			html: true,
			content: self.makeLanguagesHtml(this.languages),
			placement: 'bottom',
			trigger: 'manual'
		});
		
		
		$("#settings-button").click(function() {
			
			if (self.popoverVisible) {
				$("#settings-button").popover('hide');
				self.popoverVisible = false;
				return;
			}
			
			$("#settings-button").popover('show');
			self.popoverVisible = true;		
		});
		
		// subscribe events
		SCWeb.core.EventManager.subscribe("translation/update", this, this.updateTranslation);
		SCWeb.core.EventManager.subscribe("translation/get", this, function(objects) {
			$('#settings-panel-languages [sc_addr]').each(function(index, element) {
				objects.push($(element).attr('sc_addr'));
			});
		});
		
		
		callback();
	},
	
	/** Appends languages to popover
	 */
	makeLanguagesHtml: function(langs) {
		var items = "";
		
		for (i in langs) {
			items += '<option sc_addr="' + langs[i] + '">' + langs[i] + "</option>";
		}
		
		return languagesContent = '<select id="settings-panel-languages">' + items + '</select>';
	},
	
	
	// ---------- Translation listener interface ------------
    updateTranslation: function(namesMap) {
        // apply translation
        $('#settings-panel-languages [sc_addr]').each(function(index, element) {
            var addr = $(element).attr('sc_addr');
            if(namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });
        
    },
};
