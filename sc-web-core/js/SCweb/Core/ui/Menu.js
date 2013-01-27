SCWeb.core.ui.Menu= {
    _menuContainerId: 'menu_container',
    _items: null,

    init: function() {
        SCWeb.core.Server.getCommands($.proxy(this._build, this));
    },

    _build: function(menuData) {

        this._items = [];

        var menuHtml = '<ul class="nav">';

        //TODO: change to children, remove intermediate 'childs'
        if (menuData.hasOwnProperty('childs')){
            var id;
            var subMenu;
            var i;
            for(i=0; i < menuData.childs.length; i++) {
                subMenu = menuData.childs[i];
                menuHtml += this._parseMenuItem(subMenu);
            }
        }

        menuHtml += '</ul>';

        $('#' + this._menuContainerId).append(menuHtml);

        SCWeb.core.Translation.addIdentifiers(this._items);
        SCWeb.core.Translation.addContainer(this._menuContainerId);

        //TODO: decide how to treat ajax query
        SCWeb.core.Translation.translate('0_60');

        this._registerMenuHandler();
    },

    _parseMenuItem: function(item) {

        this._items.push(item.id);

        var item_class = 'dropdown';
        var itemHtml = '';
        if (item.cmd_type == 'atom'){
            itemHtml = '<li class="' + item_class + '"><a id="' + item.id + '"data-sc-addr="' + item.id + '" class="menu_item ' + item.cmd_type + '" >' + item.id + '</a>';
        } else{
            itemHtml = '<li class="' + item_class + '"><a id="' + item.id + '"data-sc-addr="' + item.id + '" class="menu_item ' + item.cmd_type + ' dropdown-toggle" data-toggle="dropdown" href="#" >' + item.id + '</a>';
        }


        if (item.hasOwnProperty('childs')){
            itemHtml += '<ul class="dropdown-menu">';
            var id;
            var subMenu;
            var i;
            for(i=0; i < item.childs.length; i++) {
                subMenu = item.childs[i];
                itemHtml += this._parseMenuItem(subMenu);
            }
            itemHtml += '</ul>';
        }
        return itemHtml + '</li>';
    },

    _registerMenuHandler: function() {
//        $('.cmd_atom').click(function() {
//            scuiRoot().doCommand(this.id);
//        });
    }
};