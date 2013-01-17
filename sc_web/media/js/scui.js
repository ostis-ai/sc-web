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
    
    // test
    arguments: ['0_5', '0_6'],
    
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
        this.updateIdtfLanguages();
        this.updateOutputLanguages();
        
        // identifiers laguage selection
        $(id_select_idtf_language).change(
                function() {
                    scuiRoot().updateTranslations();
                }
        );

    },
    
    /*
     * Returns currently selected output language
     * @methodOf {scuiRoot}
     * @return Return string that contains sc-addr of selected output language
     */
    getOutputLanguage: function(){
        return $(id_select_output_language + ' :selected').val();
    },
    
    /*
     * Returns currently selected identifiers language
     * @methodOf {scuiRoot}
     * @return Return string that contains sc-addr of scelected identifier language
     */
     getItdfLanguage: function(){
         return $(id_select_idtf_language + ' :selected').val();
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
        var idtfRequest = 'api/idtf?language=' + this.getItdfLanguage();
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
        var res = '<li><div id="' + item.id + '" class="menu_item ' + item.cmd_type + '" >' + item.id + '</div>';
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

        this.resolveIdentifiers(this.menuItems, this.applyMenuTranslation, this);
        
        $('.cmd_atom').click(function() {
            scuiRoot().doCommand(this.id);
        });
    },
    
    /* 
     * Method to update whole UI translations
     * @methodOf {scuiRoot}
     */
    updateTranslations: function(){
        this.resolveIdentifiers(this.menuItems, this.applyMenuTranslation, this);
        this.resolveIdentifiers(this.outputLanguages, this.applyOutputLanguagesTranslation, this);
        this.resolveIdentifiers(this.idtfLanguages, this.applyIdtfLanguagesTranslation, this);
    },
    
    /*
     * Method to update menu translations
     * 
     * @methodOf {scuiRoot}
     * @param {identifiers} Object that contains translation for menu items
     */
    applyMenuTranslation: function(identifiers){
        
        if (this.menuItems == null)
            return; // do nothing
        
        _updateTranslation('', this.menuItems, identifiers);
        
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
                
                this.resolveIdentifiers(this.outputLanguages, this.applyOutputLanguagesTranslation, this);
            }
            
        }) // ajax
    },
    
    /*
     * Method ot update translation for output languages
     * @methodOf {scuiRoot}
     */
    applyOutputLanguagesTranslation: function(identifiers){
        
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
                
                this.resolveIdentifiers(this.idtfLanguages, this.applyIdtfLanguagesTranslation, this);
            }
            
        }) // ajax
    },
    
    
    /*
     * Method ot update translation for identifier languages
     * @methodOf {scuiRoot}
     */
    applyIdtfLanguagesTranslation: function(identifiers){
        
        if (this.idtfLanguages == null)
            return; // do nothing
        
        _updateTranslation('idtf_lang_', this.idtfLanguages, identifiers);
    },
    
    /* Method to initiate user command on server
     * @param {cmd_addr} sc-addr of command
     * @param {output_addr} sc-addr of output language
     * @param {arguments} List that contains sc-addrs of command arguments
     * @methodOf {scuiRoot}
     */
     doCommand: function(cmd_addr){
        
        var arguments = '';
        for (idx in this.arguments){
            var arg = this.arguments[idx];
            arguments += idx.toString() + '_=' + arg + '&';
        }
        arguments += 'cmd=' + cmd_addr + '&';
        arguments += 'output=' + this.getOutputLanguage();
        
        $.ajax({
            type: "GET",
            url: "api/doCommand",
            data: arguments,
            context: this,

            // ajax
            success: function(data){
                alert("Get answer");
            }
        });
     }

    
    
};
