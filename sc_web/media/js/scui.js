/* Core logic for client-side */

/* 
 * Create instance of scuiRoot object.
 * This object is singleton and agregate whole semantic user interface
 * 
 * @constructor
 * @this {scuiRoot}
 */
var scuiRoot = function(){
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;
}

scuiRoot.prototype = {
    
    // --- initialization of semantic user interface ---
    init:function(options){
        this.initMenu()
    },
    
    // Initialize main menu
    initMenu:function(){
        $.ajax({
            type: "GET",
            url: "api/commands",
            data:{
            },

            // ajax
            success: $.proxy(this._buildMenu, this)
            
        }) // ajax 'commands'
    },
    
    /* 
     * Parse one menu item and generate html representation of it.
     * This function calls recursively for child items.
     * 
     * @param {item} Menu item to parse</param>
     * @return {String} Return generated html menu
     */ 
    _parseMenuItem: function(item){

        this.menuItems.push(item.id);
        var res = '<li><a href="" id="menu_' + item.id + '">' + item.id + '</a>';
        if (item.hasOwnProperty('childs')){
            res += '<ul>'
            for (idx in item.childs){
                var subMenu = item.childs[idx];
                res += this._parseMenuItem(subMenu);
            }
            res += '</ul>';
        }

        return res + '</li>';
    },
    
    /*
     * Method to parse menu from server response and construct it html representation
     * 
     * @param {mainMenu} Main menu object
     */
    _buildMenu: function(mainMenu){
        // delete old menu items
        if (this.menuItems != null)
            delete menuItems;
            
        this.menuItems = new Array();       
        var menuHtml = '<ul>';

        menuHtml += this._parseMenuItem(mainMenu) + '</ul>' + '<br style="clear: left"></br>';
        $('#templatemo_menu').append(menuHtml)

        // resolve identifiers
        var idtfRequest = 'api/idtf?language=ru'
        for (idx in this.menuItems)
        {
            var id = this.menuItems[idx];
            var arg = parseInt(idx) + 1
            idtfRequest += "&" + arg.toString() + "_=" + id;
        }

        $.ajax({
            type: "GET",
            url: idtfRequest,
            data:{
            },

            // ajax
            success : $.proxy(this._translateMenu, this)
        }) // ajax idtf
    },
    
    /*
     * Method to update menu translations
     * @param {identifiers} Object that contains translation for menu items
     */
    _translateMenu: function(identifiers){
        
        if (this.menuItems == null)
            return; // do nothing
        
        for (idx in this.menuItems){
            var item = this.menuItems[idx];
            if (identifiers.hasOwnProperty(item)){
                $('#menu_' + item).text(identifiers[item])
            }                    
        }
        
        if (this.hasOwnProperty('_notifyUpdateMenu')){
            this._notifyUpdateMenu()
        }
    }
    
};
