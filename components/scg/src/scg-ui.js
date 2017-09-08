// ------------------------------

SCg.Widget = function (postition, size) {
}

SCg.Widget.prototype = {
    constructor: SCg.Widget
};

/// ------------------------------
SCg.Button = function (position, size) {
    SCg.Widget.call(this, position, size);
};

SCg.Button.prototype = Object.create(SCg.Widget.prototype);


