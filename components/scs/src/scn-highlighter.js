SCs.Highlighter = function (parent) {

    var elementQueue = [];
    var parentSelector = '#' + parent;

    var _elementEnter = function (event) {

        var elementToClearHover = _getLastElementInQueue();
        if (elementToClearHover) {
            jQuery(elementToClearHover).removeClass("scs-scn-hovered");
        }

        var elementToHover = event.currentTarget;
        elementQueue.push(elementToHover);
        jQuery(elementToHover).addClass("scs-scn-hovered");
    };

    var _elementLeave = function (event) {

        elementQueue.pop();
        jQuery(event.currentTarget).removeClass("scs-scn-hovered");

        var elementToHover = _getLastElementInQueue();
        if (elementToHover) {
            jQuery(elementToHover).addClass("scs-scn-hovered");
        }
    };

    var _getLastElementInQueue = function () {

        return elementQueue[elementQueue.length - 1];
    };

    return {
        init: function () {

            var selectableClassExpr = "." + "scs-scn-highlighted";
            var hoveredClassExpr = "." + "scs-scn-hovered";
            jQuery(parentSelector).delegate(selectableClassExpr, 'mouseenter',
                jQuery.proxy(_elementEnter, this));
            jQuery(parentSelector).delegate(selectableClassExpr, 'mouseleave',
                jQuery.proxy(_elementLeave, this));
        },
    };
};