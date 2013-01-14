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
        this.initMenu();
        this._updateOutputLanguages();
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
     * Function tha resolve identifiers for specified objects
     * 
     * @param objects List of objects that need to be resolved. It contains sc-addrs of objects.
     * @param callback Function that will be called on success identifiers resolve.
     * It will take a map (object[key] = value) of resolved identifiers, where key is an sc-addr of object and value is
     * identifier. If identifier for specified object wasn't resolve, then if wouldn't be present in keys.
     * @params context Context parameter for ajax request @see jQuery $.ajax() function for more information
     */
    _resolveIdentifiers: function(objects, callback, context){
        // resolve identifiers
        var idtfRequest = 'api/idtf?language=ru'
        for (idx in objects)
        {
            var id = objects[idx];
            var arg = parseInt(idx) + 1
            idtfRequest += "&" + arg.toString() + "_=" + id;
        }

        $.ajax({
            type: "GET",
            url: idtfRequest,
            data:{
            },
            
            context: context,
            // ajax
            success : callback
            
        }) // ajax idtf
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

        if (mainMenu.hasOwnProperty('childs')){
            for (idx in mainMenu.childs){
                var subMenu = mainMenu.childs[idx];
                menuHtml += this._parseMenuItem(subMenu);
            }
        }
        menuHtml += '</ul>' + '<br style="clear: left"></br>';
        $('#templatemo_menu').append(menuHtml)

        this._resolveIdentifiers(this.menuItems, this._updateMenuTranslation, this);
    },
    
    /*
     * Method to update menu translations
     * 
     * @param {identifiers} Object that contains translation for menu items
     */
    _updateMenuTranslation: function(identifiers){
        
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
    },
    
    /*
     * Method to update available output languages
     * 
     */
    _updateOutputLanguages: function(){
        
        $.ajax({
            type: "GET",
            url: "api/outputLangs",
            data:{
            },
            context: this,

            // ajax
            success: function(languages){
                
                // delete old output languages
                if (this.outputLanguages != null)
                    delete outputLanguages;
                    
                this.outputLanguages = new Array();       
                var optionsHtml = '';

                for (idx in languages){
                    var lang = languages[idx];
    
                    optionsHtml += '<option value="' + lang + '"' + 'id="lang_' + lang + '">' + lang + '</option>';
                    this.outputLanguages.push(lang);
                }
                
                $('#slect_output_language').append(optionsHtml);
                
                this._resolveIdentifiers(this.outputLanguages, this._updateOutputLanguagesTranslation, this);
            }
            
        }) // ajax 'commands'
    },
    
    /*
     * Method ot update translation for output languages
     */
    _updateOutputLanguagesTranslation: function(identifiers){
        
        if (this.outputLanguages == null)
            return; // do nothing
        
        for (idx in this.outputLanguages){
            var lang = this.outputLanguages[idx];
            if (identifiers.hasOwnProperty(lang)){
                $('#lang_' + lang).text(identifiers[lang])
            }                    
        }
    } 
    
};
