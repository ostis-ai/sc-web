(function($) {
    $.namespace = function(namespace) {
        var parts = namespace.split('.');
        var scope = window;
        var i = 0;
        while(i < parts.length) {
            scope[parts[i]] = scope[parts[i]] || {};
            scope = scope[parts[i]];
            i++;
        }
    };
}(jQuery));