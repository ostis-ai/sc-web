SCWeb.core.Translation = {
    _identifiers: [],
    _containers: [],

    /**
     *
     * @param {Array} identifiers
     */
    addIdentifiers: function(identifiers) {
        var i;
        var id;
        for(i = 0; i < identifiers.length; i++) {
            id = identifiers[i];
            if(this._identifiers.indexOf(id) === -1) {
                this._identifiers.push(id);            }
        }
    },

    /**
     *
     * @param {String} containerId
     */
    addContainer: function(containerId) {
        this._containers.push(containerId);
    },

    /**
     *
     * @param {String} language
     */
    translate: function(language) {
        SCWeb.core.Server.resolveIdentifiers(this._identifiers, language, $.proxy(this._applyTranslation, this));
    },

    /**
     *
     * @param {Object} namesMap
     */
    _applyTranslation: function(namesMap) {
        var containerId;
        var i;
        var id;
        for(i = 0; i < this._containers.length; i++) {
            containerId = this._containers[i];
            $('#' + containerId + ' [data-sc-addr]').each(function(index, element) {
                id = $(element).data('sc-addr');
                if(namesMap[id]) {
                    $(element).text(namesMap[id]);
                }
            });
        }
    }
};
