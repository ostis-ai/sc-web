const searchByKeyWord = async (event, item) => {
    if (item.addr) {
        const searchNodeByIdentifier = async function (addr, identification) {
            const NODE = "_node";

            const template = new sc.ScTemplate();
            template.triple(
                [sc.ScType.Unknown, NODE],
                sc.ScType.EdgeDCommonVar,
                new sc.ScAddr(addr),
                sc.ScType.EdgeAccessVarPosPerm,
                identification,
            );
            let result = await window.scClient.templateSearch(template);
            if (result.length) {
                return result[0].get(NODE).value;
            }

            return null;
        };

        let addr = await searchNodeByIdentifier(item.addr, window.scKeynodes["nrel_system_identifier"]);
        if (!addr) {
            addr = await searchNodeByIdentifier(item.addr, window.scKeynodes["nrel_main_idtf"]);

            if (!addr) {
                addr = item.addr;
            }
        }

        SCWeb.core.Main.doDefaultCommand([addr]);
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
            $('.typeahead').typeahead({
                  minLength: 3,
                  highlight: true,
            },
            {
                  name: 'idtf',
                  source: function (query, cb) {
                      $('#search-input').addClass('search-processing');
                      SCWeb.core.Server.findIdentifiersSubStr(query, function (list) {
                          let keys = [];

                          if (list) {
                              for (let idx in list) {
                                  let value = list[idx];
                                  keys.push({name: value[1], addr: value[0]});
                              }
                          }

                          cb(keys);
                          $('#search-input').removeClass('search-processing');
                      });
                  },
                  displayKey: 'name',
                  templates: {
                      suggestion: function (item) {
                          return '<p>' + item.name + '</p>';
                      }
                  }
              }
            ).bind('typeahead:selected', async function (event, item, dataset) {
                await searchByKeyWord(event, item);
            }).keypress(async function (event) {
                if (event.which === 13) {
                    await searchByKeyWord(event, $('#search-input').val());
                }
            });

            resolve();
        })
    },

};
