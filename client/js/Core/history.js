/**
 * Object controls history of dialog
 * It can fires next events:
 * - "history/add" - this event emits on new history item add. Parameters: addr
 * where:
 *      - addr - is a sc-addr of history item;
 */
SCWeb.core.DialogHistory = {
    
    init: function() {
        var dfd = new jQuery.Deferred();
        
        dfd.resolve();
        return dfd.promise();
    },
        
};
