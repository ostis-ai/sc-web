SCWeb.ui.Menu = {
    _items: null,

    /*!
     * Initialize menu in user interface
     * @param {Object} params Parameters for menu initialization.
     * There are required parameters:
     * - menu_container_id - id of dom element that will contains menu items
     * - menu_commands - object, that represent menu command hierachy (in format returned from server)
     */
    init: function (params) {
        var dfd = new jQuery.Deferred();
        var self = this;

        this.menu_container_id = '#' + params.menu_container_id;

        // register for translation updates
        SCWeb.core.EventManager.subscribe("translation/get", this, function (objects) {
            var items = self.getObjectsToTranslate();
            for (var i in items) {
                objects.push(items[i]);
            }
        });
        SCWeb.core.EventManager.subscribe("translation/update", this, function (names) {
            self.updateTranslation(names);
        });

        context.init({
            //fadeSpeed: 100,
            //filter: null,
            //above: 'auto',
            preventDoubleContext: true,
            //compress: false,
            container: '#main-container'
        });
        context.attach('[sc_addr]', this._contextMenu);

        this._build(params.menu_commands);
        dfd.resolve();
        return dfd.promise();
    },

    _build: function (menuData) {

        this._items = [];

        var menuHtml = '<ul class="nav navbar-nav">';

        //TODO: change to children, remove intermediate 'childs'
        if (menuData.hasOwnProperty('childs')) {
            for (i in menuData.childs) {
                var subMenu = menuData.childs[i];
                menuHtml += this._parseMenuItem(subMenu);
            }
        }

        menuHtml += '</ul>';

        $(this.menu_container_id).append(menuHtml);

        this._registerMenuHandler();
    },

    _parseMenuItem: function (item) {

        this._items.push(item.id);

        var itemHtml = '';
        if (item.cmd_type == 'cmd_noatom') {
            itemHtml = '<li class="dropdown"><a sc_addr="' + item.id + '" id="' + item.id + '" class="menu-item menu-cmd-noatom dropdown-toggle" data-toggle="dropdown" href="#" ><span clas="text">' + item.id + '</span><b class="caret"></b></a>';
        } else if (item.cmd_type == 'cmd_atom') {
            itemHtml = '<li><a id="' + item.id + '"sc_addr="' + item.id + '" class="menu-item menu-cmd-atom" >' + item.id + '</a>';
        } else {
            itemHtml = '<li><a id="' + item.id + '"sc_addr="' + item.id + '" class="menu-item menu-cmd-keynode" >' + item.id + '</a>';
        }

        if (item.hasOwnProperty('childs')) {
            itemHtml += '<ul class="dropdown-menu">';
            for (i in item.childs) {
                var subMenu = item.childs[i];
                itemHtml += this._parseMenuItem(subMenu);
            }
            itemHtml += '</ul>';
        }
        return itemHtml + '</li>';
    },

    _registerMenuHandler: function () {

        $('.menu-item').click(function () {
            var sc_addr = $(this).attr('sc_addr');
            if ($(this).hasClass('menu-cmd-atom')) {
                SCWeb.core.Main.doCommand(sc_addr, SCWeb.core.Arguments._arguments);
            } else if ($(this).hasClass('menu-cmd-keynode')) {
                SCWeb.core.Main.doDefaultCommand([sc_addr]);
            }
        });
    },

    _sort: function () {

    },

    _contextMenu: function (target) {
        var dfd = new jQuery.Deferred();
        var args = SCWeb.core.Arguments._arguments.slice();
        args.push(target.attr('sc_addr'));
        SCWeb.core.Server.contextMenu(args, function (data) {

            var parseMenuItem = function (item, parentSubmenu) {
                var menu_item = {};
                menu_item.action = function (e) {
                    SCWeb.core.Main.doCommand(item, args);
                }

                menu_item.text = item;
                parentSubmenu.push(menu_item);
            }

            var menu = [];
            for (i in data) {
                parseMenuItem(data[i], menu);
            }

            var applyTranslation = function (item, id, text) {
                if (item.text == id) {
                    item.text = text;
                }
                if (item.subMenu) {
                    for (i in item.subMenu) {
                        applyTranslation(item.subMenu[i], id, text);
                    }
                }
            }

            SCWeb.core.Server.resolveIdentifiers(data, function (namesMap) {

                for (var itemId in namesMap) {
                    if (namesMap.hasOwnProperty(itemId)) {
                        for (i in menu) {
                            applyTranslation(menu[i], itemId, namesMap[itemId]);
                        }
                    }
                }

                // sort menu
                menu.sort(function (a, b) {
                    if (a.text > b.text)
                        return 1;
                    if (a.text < b.text)
                        return -1;
                    return 0;
                });

                menu.unshift({
                    text: '<span class="glyphicon glyphicon-pushpin" aria-hidden="true"></span>',
                    action: function (e) {
                        SCWeb.core.Arguments.appendArgument(target.attr('sc_addr'));
                    }
                });

                dfd.resolve(menu);
            });
        });

        return dfd.promise();
    },

    // ---------- Translation listener interface ------------
    updateTranslation: function (namesMap) {
        // apply translation
        $(this.menu_container_id + ' [sc_addr]').each(function (index, element) {
            var addr = $(element).attr('sc_addr');
            if (namesMap[addr]) {
                $(element).text(namesMap[addr]);
            }
        });

    },

    /**
     * @return Returns list obj sc-elements that need to be translated
     */
    getObjectsToTranslate: function () {
        return this._items;
    }
};
