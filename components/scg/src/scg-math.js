SCg.Vector2 = function (x, y) {
    this.x = x;
    this.y = y;
};

SCg.Vector2.prototype = {
    constructor: SCg.Vector2,

    copyFrom: function (other) {
        this.x = other.x;
        this.y = other.y;

        return this;
    },

    clone: function () {
        return new SCg.Vector2(this.x, this.y);
    },

    add: function (other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    },

    sub: function (other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    },

    mul: function (other) {
        this.x *= other.x;
        this.y *= other.y;
        return this;
    },

    div: function (other) {
        this.x /= other.x;
        this.y /= other.y;
        return this;
    },

    multiplyScalar: function (v) {
        this.x *= v;
        this.y *= v;
        return this;
    },

    divideScalar: function (v) {
        this.x /= v;
        this.y /= v;
        return this;
    },

    length: function () {
        return Math.sqrt(this.lengthSquared());
    },

    lengthSquared: function () {
        return this.x * this.x + this.y * this.y;
    },

    distance: function () {
        return Math.sqrt(this.distanceSquared.apply(this, arguments));
    },

    distanceSquared: function () {
        if (arguments.length === 2) {
            var x = this.x - arguments[0],
                y = this.y - arguments[1];

            return x * x + y * y;
        }

        var x = this.x - arguments[0].x,
            y = this.y - arguments[0].y;
        return x * x + y * y;
    },

    normalize: function () {
        return this.divideScalar(this.length());
    },

    dotProduct: function (other) {
        return this.x * other.x + this.y * other.y;
    },

    crossProduct: function (other) {
        return this.x * other.y - this.y * other.x;
    }
};


// --------------------
SCg.Vector3 = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

SCg.Vector3.prototype = {
    constructor: SCg.Vector3,

    equals: function (other) {
        return this.x == other.x && this.y == other.y && this.z == other.z;
    },

    copyFrom: function (other) {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;

        return this;
    },

    clone: function () {
        return new SCg.Vector3(this.x, this.y, this.z);
    },

    sub: function (other) {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;

        return this;
    },

    add: function (other) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;

        return this;
    },

    mul: function (other) {
        this.x *= other.x;
        this.y *= other.y;
        this.z *= other.z;

        return this;
    },

    div: function (other) {
        this.x /= other.x;
        this.y /= other.y;
        this.z /= other.z;

        return this;
    },

    multiplyScalar: function (v) {
        this.x *= v;
        this.y *= v;
        this.z *= v;

        return this;
    },

    normalize: function () {
        var l = this.length();
        this.x /= l;
        this.y /= l;
        this.z /= l;
    },

    length: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },

    lengthSquared: function () {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    },

    dotProduct: function (other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    },

    crossProduct: function (other) {
        return new SCg.Vector3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x);
    },

    to2d: function () {
        return new SCg.Vector2(this.x, this.y);
    }
};

SCg.Math = {};

SCg.Math.distanceSquared = function (p1, p2) {
    var x = p1.x - p2.x,
        y = p1.y - p2.y;

    return x * x + y * y;
};


SCg.Algorithms = {};

/*!
 * Check if a point is in polygon
 * http://habrahabr.ru/post/125356/
 * @param point object with 'x' and 'y' fields, {SCg.Vector2} for example
 * @param vertecies Array of points, which represents a polygon
 * @return {boolean} true if the point is in the polygon, false otherwise
 */
SCg.Algorithms.isPointInPolygon = function (point, vertecies) {
    // create copy of array of vertecies
    var polygon = $.map(vertecies, function (vertex) {
        return $.extend({}, vertex);
    });

    var Q_PATT = [[0, 1], [3, 2]];

    var pred_pt = polygon[polygon.length - 1];
    var t1 = pred_pt.y - point.y < 0 ? 1 : 0;
    var t2 = pred_pt.x - point.x < 0 ? 1 : 0;
    var pred_q = Q_PATT[t1][t2];

    var w = 0;

    for (var i = 0; i < polygon.length; i++) {
        var cur_pt = polygon[i];
        cur_pt.x -= point.x;
        cur_pt.y -= point.y;

        t1 = cur_pt.y < 0 ? 1 : 0;
        t2 = cur_pt.x < 0 ? 1 : 0;
        var q = Q_PATT[t1][t2];

        switch (q - pred_q) {
            case -3:
                ++w;
                break;
            case 3:
                --w;
                break;
            case -2:
                if (pred_pt.x * cur_pt.y >= pred_pt.y * cur_pt.x)
                    ++w;
                break;
            case 2:
                if (!(pred_pt.x * cur_pt.y >= pred_pt.y * cur_pt.x))
                    --w;
                break;
        }

        pred_pt = cur_pt;
        pred_q = q;
    }

    return w != 0;
};

/*!
 * Find intersection points of line and polygon
 * @param pin Array of points, which represents a polygon
 * @param segStart the first point, object with 'x' and 'y' fields, {SCg.Vector2} for example
 * @param segEnd the second point, object with 'x' and 'y' fields, {SCg.Vector2} for example
 * @return {Array} intersection points
 */
SCg.Algorithms.polyclip = function (pin, segStart, segEnd) {

    var inside = function (p, plane) {
        var d = p.x * plane[0] + p.y * plane[1];
        return d > plane[2];
    };

    var clip = function (segStart, segEnd, plane) {
        var d1 = segStart.x * plane[0] + segStart.y * plane[1] - plane[2];
        var d2 = segEnd.x * plane[0] + segEnd.y * plane[1] - plane[2];
        var t = (0 - d1) / (d2 - d1);
        var x1 = segStart.x + t * (segEnd.x - segStart.x);
        var y1 = segStart.y + t * (segEnd.y - segStart.y);
        return {x: x1, y: y1};
    };

    var plane = [segStart.y - segEnd.y, segEnd.x - segStart.x, 0];
    plane[2] = segStart.x * plane[0] + segStart.y * plane[1];
    var n = pin.length;
    var pout = [];
    var s = pin[n - 1];
    for (var ci = 0; ci < n; ci++) {
        var p = pin[ci];
        if (inside(p, plane)) {
            if (!inside(s, plane)) {
                var t = clip(s, p, plane);
                pout.push(t);
            }
        }
        else {
            if (inside(s, plane)) {
                var t = clip(s, p, plane);
                pout.push(t);
            }
        }

        s = p;
    }

    return pout;
};

