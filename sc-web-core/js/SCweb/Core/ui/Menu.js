SCWeb.core.ui.Menu = (function() {

    var _menuContainerId = 'menu_container';
    var _menuSelector = '#' + _menuContainerId;
    var _items = null;

    var _parseMenuItem = function(item) {

        _items.push(item.id);
        var item_class = 'dropdown';
        var itemHtml = '';
        if (item.cmd_type == 'atom') {
            itemHtml = '<li class="' + item_class + '"><a id="' + item.id
                    + '"sc_addr="' + item.id + '" class="menu_item '
                    + item.cmd_type + '" >' + item.id + '</a>';
        } else {
            itemHtml = '<li class="' + item_class + '"><a id="' + item.id
                    + '"sc_addr="' + item.id + '" class="menu_item '
                    + item.cmd_type
                    + ' dropdown-toggle" data-toggle="dropdown" href="#" >'
                    + item.id + '</a>';
        }
        if (item.hasOwnProperty('childs')) {
            itemHtml += '<ul class="dropdown-menu">';
            var subMenu;
            var i;
            for (i = 0; i < item.childs.length; i++) {
                subMenu = item.childs[i];
                itemHtml += _parseMenuItem(subMenu);
            }
            itemHtml += '</ul>';
        }
        return itemHtml + '</li>';
    };

    var _menuClickHandler = function(event) {

        var scAddr = $(this).attr('sc_addr');
        // append as argument
        if (SCWeb.core.utils.Keyboard.isCtrlPressed()) {
            SCWeb.core.Environment.fire(SCWeb.core.events.Argument.APPEND,
                    scAddr);
        } else {
            if ($(this).hasClass('cmd_atom')) {
                var outputLang = SCWeb.core.Environment
                        .getResource(SCWeb.core.Resources.OUTPUT_LANGUAGE);
                if (!outputLang) {
                    alert("There are no any output language selected");
                } else {
                    var argsList = SCWeb.core.Environment
                            .getResource(SCWeb.core.Resources.ARGUMENTS);
                    var curWnd = SCWeb.core.Environment
                            .getResource(SCWeb.core.Resources.ACTIVE_WND);
                    if (!curWnd) {
                        alert("There are no any active window to output answer");
                    } else {
                        var callback = function(data) {

                            var eventData = {};
                            eventData.container = curWnd;
                            eventData.newData = data;
                            SCWeb.core.Environment.fire(
                                    SCWeb.core.events.Data.NEW, eventData);
                        };
                        SCWeb.core.Server.doCommand(scAddr, outputLang,
                                argsList, callback);
                    }
                }
            }
        }
    };

    var _registerMenuHandler = function() {

        $('.menu_item').click(_menuClickHandler);
    };

    var _build = function(eventData) {

        var menuData = eventData.userCommands;
        _items = [];
        var menuHtml = '<ul class="nav">';
        // TODO: change to children, remove intermediate 'childs'
        if (menuData.hasOwnProperty('childs')) {
            var subMenu;
            var i;
            for (i = 0; i < menuData.childs.length; i++) {
                subMenu = menuData.childs[i];
                menuHtml += _parseMenuItem(subMenu);
            }
        }
        menuHtml += '</ul>';
        $(_menuSelector).append(menuHtml);
        _registerMenuHandler();
    };

    return {
        init : function() {

            SCWeb.core.Environment.on(SCWeb.core.events.Translation.UPDATE, $
                    .proxy(this.updateTranslation, this));
            SCWeb.core.Environment.on(
                    SCWeb.core.events.Translation.COLLECT_ADDRS, $.proxy(
                            this.getObjectsToTranslate, this));
            SCWeb.core.Environment.on(SCWeb.core.events.Core.START, $.proxy(
                    _build, this));
        },

        // ---------- Translation listener interface ------------
        updateTranslation : function(namesMap) {

            // apply translation
            $('#menu_container [sc_addr]').each(function(index, element) {

                var addr = $(element).attr('sc_addr');
                if (namesMap[addr]) {
                    $(element).text(namesMap[addr]);
                }
            });

        },

        /**
         * @return Returns list obj sc-elements that need to be translated
         */
        getObjectsToTranslate : function(toTranslate) {

            toTranslate.append(_items);
        }
    };
})();
