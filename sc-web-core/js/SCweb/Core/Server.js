SCWeb.core.Server = {
    /**
     * Gets command menu structure.
     *
     * @param {Function} callback
     */
    getCommands: function(callback) {
        $.ajax({
            type: 'GET',
            url: 'api/commands',
            data: null,
            success: callback
        });
    },

    /**
     *
     * @param {Array} identifiers
     * @param {String} language
     * @param {Function} callback
     */
    resolveIdentifiers: function(identifiers, language, callback) {
        var data = 'language=' + language;

        var id;
        var index;
        var i;
        for(i = 0; i < identifiers.length; i++) {
            id = identifiers[i];
            index = (i + 1) + '_';
            data += '&' + index + '=' + id;
        }

        //TODO: change to POST because the data may reach the limit of GET parameters string
        $.ajax({
            type: 'GET',
            url: 'api/idtf',
            data: data,
            success: callback
        });
    },

    /**
     *
     * @param {Function} callback
     */
    getOutputLanguages: function(callback) {
        $.ajax({
            type: 'GET',
            url: 'api/outputLangs',
            data: null,
            success: callback
        });
    },

    /**
     *
     * @param {Function} callback
     */
    getIdentifierLanguages: function(callback) {
        $.ajax({
            type: 'GET',
            url: 'api/idtfLangs',
            data: null,
            success: callback
        });
    },
    
    /** Function to initiate user command on server
    * @param {cmd_addr} sc-addr of command
    * @param {output_addr} sc-addr of output language
    * @param {arguments_list} List that contains sc-addrs of command arguments
    * @param {callback} Function, that will be called with recieved data
    */
    doCommand: function(cmd_addr, output_addr, arguments_list, callback){

        var arguments = '';
        for (var i = 0; i < arguments_list.length; i++){
            var arg = arguments_list[i];
            arguments += i.toString() + '_=' + arg + '&';
        }
        arguments += 'cmd=' + cmd_addr + '&';
        arguments += 'output=' + output_addr;

        $.ajax({
            type: "GET",
            url: "api/doCommand",
            data: arguments,
            success: callback
        });
    },
    
    /**
     * Function that resolve sc-addrs for specified sc-elements by their system identifiers
     * @param {identifiers} List of system identifiers, that need to be resolved
     * @param {callback} Callback function that calls, when sc-addrs resovled. It
     * takes object that contains map of resolved sc-addrs as parameter
     */
    resolveScAddr: function(idtfList, callback){
        var arguments = '';
        for (i = 0; i < idtfList.length; i++){
            var arg = idtfList[i];
            arguments += i.toString() + '_=' + arg + '&';
        }
        
        $.ajax({
            type: "GET",
            url: "api/scAddrs",
            data: arguments,
            success: callback
        });
    }
};
