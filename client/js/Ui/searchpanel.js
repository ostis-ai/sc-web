const searchNodeByAnyIdentifier = async (string) => {
    return new Promise(async (resolve) => {
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
                return result[0].get(NODE);
            }

            return null;
        };

        let linkAddrs = await window.scClient.getLinksByContents([string]);
        let addr = null;

        if (linkAddrs.length) {
            linkAddrs = linkAddrs[0];

            if (linkAddrs.length) {
                addr = linkAddrs[0];
                addr = await searchNodeByIdentifier(addr, window.scKeynodes["nrel_system_identifier"]);
                if (!addr) {
                    addr = await searchNodeByIdentifier(addr, window.scKeynodes["nrel_main_idtf"]);
                }

                if (!addr) {
                    addr = linkAddrs[0];
                }
            }

            resolve(addr);
        }
    });
};

const translateByKeyWord = async (event, string) => {
    if (string) {
        searchNodeByAnyIdentifier(string).then((selectedAddr) => {
            SCWeb.core.Main.doDefaultCommand([selectedAddr.value]);
        });
    }
    event.stopPropagation();
    $('.typeahead').val('');
    $('.tt-dropdown-menu').hide();
};

SCWeb.ui.SearchPanel = {
    init: function () {
        return new Promise(resolve => {
            $('.typeahead').typeahead({
                  minLength: 1,
                  highlight: true,
            },
            {
                  name: 'idtf',
                  source: function (str, callback) {
                      $('#search-input').addClass('search-processing');
                      window.scClient.getLinksContentsByContentSubstrings([str]).then((strings) => {
                          const maxContentSize = 200;
                          const keys = strings.length ? strings[0].filter((string) => string.length < maxContentSize) : [];
                          callback(keys);
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
                await translateByKeyWord(event, string);
            }).keypress(async function (event) {
                if (event.which === 13) {
                    await translateByKeyWord(event, $('#search-input').val());
                }
            });

            resolve();
        })
    },

};
