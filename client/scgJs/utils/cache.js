function AppCache(opt) {
    this.opt = opt;
    this.cache = [];
}

/*
 * delete all expire keys or if key exist
 * return true if one or more keys have been removed
 */
AppCache.prototype._delExpire = function (key) {
    var rm = false,
        cache = this.cache,
        l = cache.length,
        now = Date.now(),
        obj;

    while (l--) {
        obj = cache[l];

        if (now > obj.expire || key === obj.key) {
            cache.splice(l, 1);
            rm = true;
        }
    }

    return rm;
};

AppCache.prototype.get = function (key) {
    var data,
        now = Date.now(),
        cache = this.cache,
        l = cache.length,
        obj;

    while (l--) {
        obj = cache[l];

        if (obj.key === key) {
            data = obj;
            break;
        }
    }

    if (data && now > data.expire) {
        cache.splice(l, 1);
        data = null;
    }

    return (data ? data.val : null);
};

AppCache.prototype.set = function (key, val) {
    var cache = this.cache,
        max = this.opt.max,
        data = {
            key: key,
            expire: Date.now() + this.opt.expire,
            val: val
        },
        l = cache.length;

    if (l < max) {
        cache.push(data);
    } else if (l >= max && this._delExpire(key)) {
        cache.push(data);
    } else if (l >= max) {
        cache.shift();
        cache.push(data);
    }
};

AppCache.prototype.clear = function () {
    this.cache = [];
};
