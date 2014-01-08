SCWeb.ui.Core = {
	
	init: function(data, callback) {
		
		SCWeb.ui.Menu.init(data, function() {
			SCWeb.ui.ArgumentsPanel.init(function() {
				SCWeb.ui.UserPanel.init(data, function() {
					SCWeb.ui.LanguagePanel.init(data, function() {
						SCWeb.ui.WindowManager.init(data, function() {
							callback();
						})
					})
				})
			})
		});
	},
	
};
