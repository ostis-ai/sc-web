SCWeb.ui.SearchPanel = {

    init: function () {
        var dfd = new jQuery.Deferred();
        var self = this;

        var keynode_nrel_main_idtf = null;
        var keynode_nrel_idtf = null;
        var keynode_nrel_system_idtf = null;

        $('.typeahead').typeahead({
                minLength: 3,
                highlight: true,
            },
            {
                name: 'idtf',
                source: function (query, cb) {
                    $('#search-input').addClass('search-processing');
                    SCWeb.core.Server.findIdentifiersSubStr(query, function (data) {
                        keys = [];

                        var addValues = function (key) {
                            var list = data[key];
                            if (list) {
                                for (idx in list) {
                                    var value = list[idx]
                                    keys.push({name: value[1], addr: value[0], group: key});
                                }
                            }
                        }

                        addValues('sys');
                        addValues('main');
                        addValues('common');

                        cb(keys);
                        $('#search-input').removeClass('search-processing');
                    });
                },
                displayKey: 'name',
                templates: {
                    suggestion: function (item) {

                        //glyphicon glyphicon-globe
                        var html = '';
                        if (item.group === 'common') {
                            return '<p class="sc-content">' + item.name + '</p>';
                        } else {
                            var cl = 'glyphicon glyphicon-user';
                            if (item.group === 'sys') {
                                cl = 'glyphicon glyphicon-globe';
                            }
                            return '<p><span class="tt-suggestion-icon ' + cl + '"></span>' + item.name + '</p>';
                        }
                        return '<p>' + item.name + '</p>';
                    }
                }
            }
        ).bind('typeahead:selected', function (evt, item, dataset) {
            if (item && item.addr) {
                SCWeb.core.Main.doDefaultCommand([item.addr]);
            }
            evt.stopPropagation();
            $('.typeahead').val('');
        }).keypress(function (event) {
            if (event.which == 13) {
                SCWeb.core.Main.doTextCommand($(this).val());
                $('#search-input').val('');
            }
        });

        SCWeb.core.Server.resolveScAddr(['nrel_main_idtf', 'nrel_idtf', 'nrel_system_identifier'], function (addrs) {
            keynode_nrel_main_idtf = addrs['nrel_main_idtf'];
            keynode_nrel_idtf = addrs['nrel_idtf'];
            keynode_nrel_system_idtf = addrs['nrel_system_identifier'];

            dfd.resolve();
        });

        return dfd.promise();
    },

};
