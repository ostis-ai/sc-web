SCWeb.ui.SearchPanel = {
    
    init: function() {
        var dfd = new jQuery.Deferred();

        this.addrs = {}
        var self = this;

        $('.typeahead').typeahead({
            minLength: 3,
            items: 20,
            source: function(query, process) {
                SCWeb.core.Server.findIdentifiersSubStr(query, function(data) {
                    keys = [];
                    for (key in data) {
                        var list = data[key];
                        for (idx in list) {
                            var value = list[idx]
                            keys.push(value[1]);
                            self.addrs[value[1]] = value[0];
                        }
                    }

                    process(keys);
                });
            },
            updater: function(item) {
                var addr = self.addrs[item];
                if (addr)
                    SCWeb.core.Main.doDefaultCommand([addr]);
            }
        });

        dfd.resolve();

        return dfd.promise();
    },
    
};
