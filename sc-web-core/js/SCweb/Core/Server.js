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
            success: function(result) {
                callback(result);
            }
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
    }
};
