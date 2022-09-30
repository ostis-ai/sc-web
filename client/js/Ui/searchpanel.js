const searchByKeyWord = async (event, string) => {
    if (string) {
        const searchNodeByIdentifier = async function (linkAddr, identification) {
            const NODE = "_node";

            const template = new sc.ScTemplate();
            template.triple(
                [sc.ScType.Unknown, NODE],
                sc.ScType.EdgeDCommonVar,
                linkAddr,
                sc.ScType.EdgeAccessVarPosPerm,
                identification,
            );
            let result = await window.scClient.templateSearch(template);
            if (result.length) {
                return result[0].get(NODE).value;
            }

            return null;
        };

        let linkAddrs = await window.scClient.getLinksByContents([string]);
        let addr = null;

        if (linkAddrs.length) {
            linkAddrs = linkAddrs[0];

            if (linkAddrs.length)
            {
                addr = linkAddrs[0];
                addr = await searchNodeByIdentifier(addr, window.scKeynodes["nrel_system_identifier"]);
                if (!addr) {
                    addr = await searchNodeByIdentifier(addr, window.scKeynodes["nrel_main_idtf"]);
                }

                if (!addr) {
                    addr = linkAddrs[0];
                }
            }

            SCWeb.core.Main.doDefaultCommand([addr]);
        }
    }
    event.stopPropagation();
    $('.typeahead').val('');
    $('.tt-dropdown-menu').hide();
};

SCWeb.ui.SearchPanel = {
    init: function () {
        return new Promise(resolve => {
            $('.typeahead').typeahead({
                  minLength: 3,
                  highlight: true,
            },
            {
                  name: 'idtf',
                  source: function (str, cb) {
                      $('#search-input').addClass('search-processing');
                      window.scClient.getStringsBySubstrings([str]).then((result) => {
                          let keys = [];

                          if (result.length) {
                              const slice = result[0];
                              for (let idx in slice) {
                                  if (slice[idx].length < 30) {
                                      keys.push(slice[idx]);
                                  }
                              }
                          }

                          cb(keys);
                          $('#search-input').removeClass('search-processing');
                      });
                  },
                  templates: {
                      suggestion: function (string) {
                          return '<p>' + string + '</p>';
                      }
                  }
              }
            ).bind('typeahead:selected', async function (event, string, dataset) {
                await searchByKeyWord(event, string);
            }).keypress(async function (event) {
                if (event.which === 13) {
                    await searchByKeyWord(event, $('#search-input').val());
                }
            });

            resolve();
        })
    },

};
