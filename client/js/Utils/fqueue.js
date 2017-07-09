var fQueue = (function () {

    var qnb = function () {
        var dfd = new jQuery.Deferred();
        var funcs = Array.prototype.slice.call(arguments, 0);

        function worker() {
            if (funcs.length > 0) {
                var f = funcs.shift();
                f.func.apply(f, f.args).done(function () {
                    if (f.done)
                        f.done.call(f.args);
                    setTimeout(worker, 1);
                }).fail(function () {
                    dfd.reject.call(f.args);
                });
            } else
                dfd.resolve();
        };
        worker();
        return dfd.promise();
    };
    return {
        Func: function (func, args, done) {
            return {func: func, done: done, args: args};
        },
        Queue: qnb,
    };
})();

(function dfdQueue() {

    var q,
        tasks = [],
        remain = 0,
        await = null;   // callback

    var pushImpl = function (dfd) {
        remain++;
        dfd.done()
    };

    return q = {
        push: function (dfd) {
            pushImpl(dfd);
        },

        awaitAll: function (f) {
            await = f;
        }
    };

})();