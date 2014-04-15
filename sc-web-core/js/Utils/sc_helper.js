ScHelper = function(sctp_client) {
    this.sctp_client = sctp_client;
};

ScHelper.prototype.init = function() {
    var dfd = new jQuery.Deferred();

    dfd.resolve();
    
    return dfd.promise();
};

/*! Function resolve commands hierarchy for main menu
 */
ScHelper.prototype.getMainMenuCommands() {
    
};