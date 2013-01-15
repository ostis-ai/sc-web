/* Core logic for client-side */


// -------------------- utils --------------------------
/*
 * Function to translate values of specified nodes in html
 * 
 * @param {id_prefix} Prefix of DOM-nodes id (widhout '#'). Example id="#prefix_1_1".
 * @param {objects} List of objects, that need to be translated. This list contains 
 * sc-addrs of objects.
 * @param {identifiers} Object that contains <key, value> map of translations.
 * Key - sc-addr, Value - translation text.
 */
function _updateTranslation(id_prefix, objects, identifiers){
    for (idx in objects){
        var item = objects[idx];
        if (identifiers.hasOwnProperty(item)){
            $('#' + id_prefix + item).text(identifiers[item])
        }                    
    }
}

var id_select_idtf_language = '#select_idtf_language';
var id_select_output_language = '#select_output_language';

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
        this.initControls();
    },
    
    // Initialize main menu
    initMenu:function(){
        $.ajax({
            type: "GET",
            url: "api/commands",
            data:{
            },

            // ajax
            success: $.proxy(this.buildMenu, this)
            
        }) // ajax 'commands'
    },
    
    initControls: function(){
        this.updateOutputLanguages();
        this.updateIdtfLanguages();
        
        // identifiers laguage selection
        this.currentIdtfLanguage = $(id_select_idtf_language + ' :selected').val();
        $(id_select_idtf_language).change(function() {
            this.currentIdtfLanguage = $(id_select_idtf_language + ' :selected').val();
        });

        // output language selection        
        this.currentOutputLanguage = $(id_select_output_language + ' :selected').val();
        $(id_select_output_language).change(function() {
            this.currentOutputLanguage = $(id_select_output_language + ' :selected').val();
        });
    },
    
    /*
     * Function tha resolve identifiers for specified objects
     * 
     * @methodOf {scuiRoot}
     * @param objects List of objects that need to be resolved. It contains sc-addrs of objects.
     * @param callback Function that will be called on success identifiers resolve.
     * It will take a map (object[key] = value) of resolved identifiers, where key is an sc-addr of object and value is
     * identifier. If identifier for specified object wasn't resolve, then if wouldn't be present in keys.
     * @params context Context parameter for ajax request @see jQuery $.ajax() function for more information
     */
    resolveIdentifiers: function(objects, callback, context){
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
     * @methodOf {scuiRoot}
     * 
     * @param {item} Menu item to parse</param>
     * @return {String} Return generated html menu
     */ 
    parseMenuItem: function(item){

        this.menuItems.push(item.id);
        var res = '<li><a href="" id="menu_' + item.id + '">' + item.id + '</a>';
        if (item.hasOwnProperty('childs')){
            res += '<ul>'
            for (idx in item.childs){
                var subMenu = item.childs[idx];
                res += this.parseMenuItem(subMenu);
            }
            res += '</ul>';
        }

        return res + '</li>';
    },
    
    /*
     * Method to parse menu from server response and construct it html representation
     * @methodOf {scuiRoot}
     * @param {mainMenu} Main menu object
     */
    buildMenu: function(mainMenu){
        // delete old menu items
        if (this.menuItems != null)
            delete menuItems;
            
        this.menuItems = new Array();       
        var menuHtml = '<ul>';

        if (mainMenu.hasOwnProperty('childs')){
            for (idx in mainMenu.childs){
                var subMenu = mainMenu.childs[idx];
                menuHtml += this.parseMenuItem(subMenu);
            }
        }
        menuHtml += '</ul>' + '<br style="clear: left"></br>';
        $('#templatemo_menu').append(menuHtml)

        this.resolveIdentifiers(this.menuItems, this.updateMenuTranslation, this);
    },
    
    /*
     * Method to update menu translations
     * 
     * @methodOf {scuiRoot}
     * @param {identifiers} Object that contains translation for menu items
     */
    updateMenuTranslation: function(identifiers){
        
        if (this.menuItems == null)
            return; // do nothing
        
        _updateTranslation('menu_', this.menuItems, identifiers);
        
        if (this.hasOwnProperty('_notifyUpdateMenu')){
            this._notifyUpdateMenu()
        }
    },
    
    /*
     * Method to update available output languages
     * @methodOf {scuiRoot}
     */
    updateOutputLanguages: function(){
        
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
    
                    optionsHtml += '<option value="' + lang + '"' + 'id="output_lang_' + lang + '">' + lang + '</option>';
                    this.outputLanguages.push(lang);
                }
                
                $(id_select_output_language).append(optionsHtml);
                
                this.resolveIdentifiers(this.outputLanguages, this.updateOutputLanguagesTranslation, this);
            }
            
        }) // ajax
    },
    
    /*
     * Method ot update translation for output languages
     * @methodOf {scuiRoot}
     */
    updateOutputLanguagesTranslation: function(identifiers){
        
        if (this.outputLanguages == null)
            return; // do nothing
        
        _updateTranslation('output_lang_', this.outputLanguages, identifiers);
    },
    
    
    /*
     * Method to update available identifier languages
     * @methodOf {scuiRoot}
     */
    updateIdtfLanguages: function(){
        
        $.ajax({
            type: "GET",
            url: "api/idtfLangs",
            data:{
            },
            context: this,

            // ajax
            success: function(languages){
                
                // delete old output languages
                if (this.idtfLanguages != null)
                    delete idtfLanguages;
                    
                this.idtfLanguages = new Array();       
                var optionsHtml = '';

                for (idx in languages){
                    var lang = languages[idx];
    
                    optionsHtml += '<option value="' + lang + '"' + 'id="idtf_lang_' + lang + '">' + lang + '</option>';
                    this.idtfLanguages.push(lang);
                }
                
                $(id_select_idtf_language).append(optionsHtml);
                
                this.resolveIdentifiers(this.idtfLanguages, this.updateIdtfLanguagesTranslation, this);
            }
            
        }) // ajax
    },
    
    
    /*
     * Method ot update translation for identifier languages
     * @methodOf {scuiRoot}
     */
    updateIdtfLanguagesTranslation: function(identifiers){
        
        if (this.idtfLanguages == null)
            return; // do nothing
        
        _updateTranslation('idtf_lang_', this.idtfLanguages, identifiers);
    },
    
    
};
