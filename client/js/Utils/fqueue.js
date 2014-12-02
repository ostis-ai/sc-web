function fQueueFunc() {
    return {
        func: arguments[0],
        done: arguments[1],
        args: arguments.slice(2)
    };
}

function fQueue() {
    var dfd = new jQuery.Deferred();
    var funcs = arguments.slice(0);

    (function next() {
        if(funcs.length > 0) {
            var f = funcs.shift();
            f.func.call(f.args)
                .done(function() {
                    if (f.done)
                        f.done.call(arguments);
                    next();
                })
                .fail(function() {
                    dfd.reject.call(arguments);
                });
        }
    })();

    return dfd.promise();
};

(function dfdQueue() {

    var q,
        tasks = [],
        remain = 0,
        await = null;   // callback

    var pushImpl = function(dfd) {
        remain++;
        dfd.done()
    };

    return q = {
        push: function(dfd) {
            pushImpl(dfd);
        },

        awaitAll: function(f) {
            await = f;
        }
    };

})();