const searchByKeyWord = (event, item) => {
    if (item.addr) {
        SCWeb.core.Main.doDefaultCommand([item.addr]);
    } else {
        searchByIdentifier(item);
    }
    event.stopPropagation();
    $('.typeahead').val('');
    $('.tt-dropdown-menu').hide();
};

const searchByIdentifier = (identifier) => {
    SCWeb.core.Server.resolveScAddr([identifier]).then(function (addrs) {
        SCWeb.core.Main.doDefaultCommand([addrs[identifier]]);
    });
}

SCWeb.ui.SearchPanel = {
    init: function () {
        return new Promise(resolve => {
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
                      }
                  }
              }
            ).bind('typeahead:selected', function (event, item, dataset) {
                searchByKeyWord(event, item);
            }).keypress(function (event) {
                if (event.which === 13) {
                    searchByKeyWord(event, $('#search-input').val());
                }
            });

            SCWeb.core.Server.resolveScAddr(['nrel_main_idtf', 'nrel_idtf', 'nrel_system_identifier']).then(function (addrs) {
                keynode_nrel_main_idtf = addrs['nrel_main_idtf'];
                keynode_nrel_idtf = addrs['nrel_idtf'];
                keynode_nrel_system_idtf = addrs['nrel_system_identifier'];

                resolve();
            });
        })
    },

};
