SCg.Tree = function () {
    this.triples = [];
    this.root = new SCg.TreeNode();
};

SCg.Tree.prototype = {
    constructor: SCg.Tree,

    build: function (triples) {

        this.triples = [];
        this.triples = this.triples.concat(triples);

        // determine possible contours
        var contours = {};
        for (t in this.triples) {
            var tpl = this.triples[t];

            if (tpl[0].type & sc_type_node_struct)
                contours[tpl[0].addr] = {el: tpl[0], childs: []};
        }

        // collect contour elements
        var parentsDict = {};
        for (t in this.triples) {
            var tpl = this.triples[t];

            if (tpl.ignore) continue;

            for (c in contours) {
                if ((c == tpl[0].addr) && (tpl[1].type & sc_type_arc_pos_const_perm)) {
                    contours[c].childs.push(tpl[2]);
                    tpl.ignore = true;
                    parentsDict[tpl[2].addr] = c;
                    break;
                }
            }
        }
    },

    /*!
     * Build construction in \p scene
     */
    output: function (scene) {

    }
};


// ----------------------------------
SCg.TreeNode = function () {
    this.childs = [];
    this.parent = null;
};

SCg.TreeNode.prototype = {

    appendChild: function (child) {
        if (child.parent)
            child.parent.removeChild(child);

        if (SCgDebug.eanbled && this.hasChild(child))
            SCgDebug.error("Duplicate child item");

        this.childs.push(child);
    },

    removeChild: function (child) {
        if (child.parent != this)
            SCgDebug.error("Item not found");

        var idx = this.childs.indexOf(child);
        if (idx >= 0)
            this.childs.splice(idx, 1);

        child.parent = null;
    },

    hasChild: function (child) {
        return this.childs.indexOf(child);
    }

};
