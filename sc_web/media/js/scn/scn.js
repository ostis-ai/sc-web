$.namespace('Ostis.ui.scn');

Ostis.ui.scn.SCnComponent = {
    type : SCWeb.core.ComponentType.viewer,
    outputLang : 'format_scn_json',
    formats : [],
    factory : function(config) {
        return new Ostis.ui.scn.Viewer(config);
    }
};

SCWeb.core.ComponentManager.appendComponentInitialize(function() {
    SCWeb.core.ComponentManager.registerComponent(Ostis.ui.scn.SCnComponent);
});

Ostis.ui.scn.HtmlAttributes = {
    ID : 'scn_addr',
    LABEL : 'scnLableFor'
};

Ostis.ui.scn.SCnCssClass = {
    KEYWORD : 'SCnKeyword',
    SENTENCE : 'Sentence',
    FIELD : 'SCnField',
    LINK : 'SCnLink',
    MARKER : 'SCnFieldMarker',
    VALUE : 'SCnFieldValue',
    FILE : 'SCnNoTransContent',
    LOOP : 'SCnTransContent',
    SELECTABLE : 'SCnSelectable',
    HOVERED : 'SCnHovered',
    SELECTED : 'SCnSelected',
    LEVEL : 'SCnLevel'
};


Ostis.ui.scn.HtmlBuilder = function() {

    var NodeType = {
        TUPLE : 'tuple',
        LOOP : 'loop'
    };

    var ContentType = {
        TEXT : 'text',
        IMAGE : 'image',
        FILE : 'file',
        REF_FILE : 'ref_file'
    };
    return {

        buildTree : function(data) {

            var outputData = '';
            for ( var keywordInd = 0; keywordInd < data.length; keywordInd++) {
                outputData += this._buildNode(data[keywordInd]);
            }
            return outputData;
        },

        _buildNode : function(node) {

            var output = '';
            output += this._startWrapper(node);
            if (node.keyword) {
                output += this._buildKeywordNode(node);
            } else {
                output += this._buildNodeContent(node);
            }
            output += this._buildSentences(node);
            output += this._closeWrapper(node);
            return output;
        },

        _buildKeywordNode : function(node) {

            var result = "<div " + "class='" + Ostis.ui.scn.SCnCssClass.KEYWORD
                    + "'>";
            result += this._buildAtomicNode(node);
            result += "</div>";
            return result;
        },

        _buildAtomicNode : function(node) {

            var atomicNode = this._startSelectableNode(node);
            atomicNode += this._getNodeLabel(node);
            atomicNode += this._closeSelectableNode();
            return atomicNode;
        },

        _startSelectableNode : function(node) {

            return "<a " + Ostis.ui.scn.HtmlAttributes.ID + "='" + node.id
                    + "' class='" + Ostis.ui.scn.SCnCssClass.LINK + " "
                    + Ostis.ui.scn.SCnCssClass.SELECTABLE + "'>";
        },

        _getNodeLabel : function(node) {

            return "<span " + Ostis.ui.scn.HtmlAttributes.LABEL + "='"
                    + node.id + "'> " + node.id + "</span>";
        },

        _closeSelectableNode : function() {

            return "</a>";
        },

        _buildSentences : function(node) {

            var sentOut = '';
            if (node.SCArcs) {
                for ( var arcInd = 0; arcInd < node.SCArcs.length; arcInd++) {
                    sentOut += this._buildOneSentence(node.SCArcs[arcInd]);
                }
            }
            return sentOut;
        },

        _buildOneSentence : function(arc) {

            var resSen = "<div class='" + Ostis.ui.scn.SCnCssClass.SENTENCE
                    + "'>";
            var buildMarker = true;
            var shiftLevel = false;
            if (arc.SCAttributes) {
                resSen += this._buildField(arc, $.proxy(this._buildAttrValue,
                        this), buildMarker, shiftLevel);
                buildMarker = false;
                shiftLevel = true;
            }
            if (arc.SCNode) {
                resSen += this._buildField(arc, $.proxy(this._buildNodeValue,
                        this), buildMarker, shiftLevel);
            }
            resSen += "</div>";
            return resSen;
        },

        _buildField : function(arc, valContVisitor, buildMarker, shiftLevel) {

            var fieldRes = "<div class='" + Ostis.ui.scn.SCnCssClass.FIELD;
            if (shiftLevel) {
                fieldRes = fieldRes + " " + Ostis.ui.scn.SCnCssClass.LEVEL;
            }
            fieldRes = fieldRes + "'>";
            if (buildMarker && arc.type) {
                fieldRes += this._buildMarker(arc);
            }
            fieldRes += this._buildValue(arc, valContVisitor);
            fieldRes += "</div>";
            return fieldRes;
        },

        _buildMarker : function(arc) {

            var markerRes = "<div class='" + Ostis.ui.scn.SCnCssClass.MARKER
                    + "'>";
            markerRes += this._startSelectableNode(arc);
            markerRes += Ostis.ui.scn.TypeResolver.resolveArc(arc.type,
                    arc.backward);
            markerRes += this._closeSelectableNode();
            markerRes += "</div>";
            return markerRes;
        },

        _buildValue : function(arc, valContVisitor) {

            var valRes = "<div class='" + Ostis.ui.scn.SCnCssClass.VALUE + "'>";
            valRes += valContVisitor(arc);
            valRes += "</div>";
            return valRes;
        },

        _buildAttrValue : function(arc) {

            var attrRes = '';
            var allAttr = arc.SCAttributes;
            for ( var attrInd = 0; attrInd < allAttr.length; attrInd++) {
                var attribute = allAttr[attrInd];
                attrRes += this._buildSingleAttribute(attribute);
            }
            return attrRes;
        },

        _buildSingleAttribute : function(attr) {

            return this._buildAtomicNode(attr) + ":";
        },

        _buildNodeValue : function(arc) {

            return this._buildNode(arc.SCNode);
        },

        _buildNodeContent : function(node) {

            var nodeCont = '';
            var con = node.content;
            if (con) {
                if (con.type == ContentType.TEXT) {
                    nodeCont = con.value;
                } else if (con.type == ContentType.IMAGE) {
                    nodeCont = this._buildImageContent(con);
                } else if (con.type == ContentType.FILE) {
                    nodeCont = this._buildFileContent(con);
                } else if (con.type == ContentType.REF_FILE) {
                    nodeCont = this._buildRefFileContent(con);
                }
            } else if (node.id) {
                nodeCont = this._buildAtomicNode(node);
            }
            return nodeCont;
        },

        _buildImageContent : function(content) {

            var result = this._startFileWrapper();
            result += "<img src='" + content.value + "' />";
            result += this._closeFileWrapper();
            return result;
        },

        _buildFileContent : function(content) {

            var result = this._startFileWrapper();
            for ( var nodeInd = 0; nodeInd < content.value.length; nodeInd++) {
                result += this._buildNode(content.value[nodeInd]);
            }
            result += this._closeFileWrapper();
            return result;
        },

        _buildRefFileContent : function(con) {

            var result = this._startFileWrapper();
            result += con.value;
            result += this._closeFileWrapper();
            return result;
        },

        _startFileWrapper : function() {

            return "<span class='" + Ostis.ui.scn.SCnCssClass.FILE + " "
                    + Ostis.ui.scn.SCnCssClass.SELECTABLE + "'>";
        },

        _closeFileWrapper : function() {

            return "</span>";
        },

        _startWrapper : function(node) {

            var result = '';
            if (node.type && node.type.class) {
                if (node.type.class == NodeType.TUPLE) {
                    result = "<div " + Ostis.ui.scn.HtmlAttributes.ID + "='"
                            + node.id + "'>";
                    result += "<div>{</div>";
                } else if (node.type.class == NodeType.LOOP) {
                    result = "<span " + Ostis.ui.scn.HtmlAttributes.ID + "='"
                            + node.id + "' class='"
                            + Ostis.ui.scn.SCnCssClass.LOOP + "'>";
                }
            }
            return result;
        },

        _closeWrapper : function(node) {

            var result = '';
            if (node.type && node.type.class) {
                if (node.type.class == NodeType.TUPLE) {
                    result = "<div>}</div></div>";
                } else if (node.type.class == NodeType.LOOP) {
                    result = "</span>";
                }
            }
            return result;
        }
    };
};


Ostis.ui.scn.Selection = function(parent) {

    var elementQueue = [];
    var selected = [];
    return {
        init : function() {

            var selectableClassExpr = "." + Ostis.ui.scn.SCnCssClass.SELECTABLE;
            var hoveredClassExpr = "." + Ostis.ui.scn.SCnCssClass.HOVERED;
            $(parent).delegate(selectableClassExpr, 'mouseenter',
                    $.proxy(this._elementEnter, this));
            $(parent).delegate(selectableClassExpr, 'mouseleave',
                    $.proxy(this._elementLeave, this));
            $(parent).delegate(hoveredClassExpr, 'click',
                    $.proxy(this._elementClick, this));
            $(parent).delegate('a', 'click',
                $.proxy(this._linkClick, this));
            SCWeb.core.Arguments.registerListener(this);
        },

        _elementClick : function(event) {

            if (event.ctrlKey) {
                $(event.currentTarget).toggleClass(
                        Ostis.ui.scn.SCnCssClass.SELECTED, true);
                var scAddr = $(event.currentTarget).attr(
                        Ostis.ui.scn.HtmlAttributes.ID);
                selected.push(scAddr);
                SCWeb.core.Arguments.appendArgument(scAddr);
            }
        },

        _elementEnter : function(event) {

            var elementToClearHover = this._getLastElementInQueue();
            if (elementToClearHover) {
                $(elementToClearHover).removeClass(
                        Ostis.ui.scn.SCnCssClass.HOVERED);
            }

            var elementToHover = event.currentTarget;
            elementQueue.push(elementToHover);
            $(elementToHover).addClass(Ostis.ui.scn.SCnCssClass.HOVERED);
        },

        _elementLeave : function(event) {

            elementQueue.pop();
            $(event.currentTarget)
                    .removeClass(Ostis.ui.scn.SCnCssClass.HOVERED);

            var elementToHover = this._getLastElementInQueue();
            if (elementToHover) {
                $(elementToHover).addClass(Ostis.ui.scn.SCnCssClass.HOVERED);
            }
        },

        _linkClick: function(event) {
            if (!event.ctrlKey) {
                var scAddr = $(event.currentTarget).attr(Ostis.ui.scn.HtmlAttributes.ID);
                $(parent).trigger('semanticNeighbourhood', scAddr);
            }
        },

        _getLastElementInQueue : function() {

            return elementQueue[elementQueue.length - 1];
        },

        argumentAppended : function(argument, idx) {

        },

        argumentRemoved : function(argument, idx) {

            if (selected.length != 0) {
                var addrIndex = $.inArray(argument, selected);
                if (addrIndex != -1) {
                    selected.splice(addrIndex, 1);
                    this._unselectElement(argument);
                }
            }
        },

        _unselectElement : function(scAddr) {

            var expr = "." + Ostis.ui.scn.SCnCssClass.SELECTED + "["
                    + Ostis.ui.scn.HtmlAttributes.ID + "=" + scAddr + "]";
            $(expr).each(
                    function(index, element) {

                        $(element).toggleClass(
                                Ostis.ui.scn.SCnCssClass.SELECTED, false);
                    });
        },

        argumentsCleared : function() {

            if (selected.length != 0) {
                for ( var addrInd = 0; addrInd < selected.length; addrInd++) {
                    var addr = selected[addrInd];
                    this._unselectElement(addr);
                }
                selected = [];
            }
        }
    };
};

Ostis.ui.scn.TypeResolver = function() {

    var scnArcs = [];
    scnArcs[sc_type_edge_common] = {
        forward : '↔',
        backward : '↔'
    };
    scnArcs[sc_type_arc_common] = {
        forward : '→',
        backward : '←'
    };
    scnArcs[sc_type_arc_access] = {
        forward : '..∍',
        backward : '∊..'
    };
    scnArcs[sc_type_arc_pos_const_perm] = {
        forward : '∍',
        backward : '∊'
    };
    scnArcs[sc_type_edge_common | sc_type_const] = {
        forward : '⇔',
        backward : '⇔'
    };
    scnArcs[sc_type_edge_common | sc_type_var] = {
        forward : '⇐⇒',
        backward : '⇐⇒'
    };
    scnArcs[sc_type_arc_common | sc_type_const] = {
        forward : '⇒',
        backward : '⇐'
    };
    scnArcs[sc_type_arc_common | sc_type_var] = {
        forward : '_⇒',
        backward : '_⇐'
    };
    scnArcs[sc_type_arc_access | sc_type_const] = {
        forward : '_∍',
        backward : '_∊'
    };
    // --
    scnArcs[sc_type_arc_access | sc_type_const | sc_type_arc_neg
            | sc_type_arc_perm] = {
        forward : '∌',
        backward : '∉'
    };
    scnArcs[sc_type_arc_access | sc_type_var | sc_type_arc_neg
            | sc_type_arc_perm] = {
        forward : '_∌',
        backward : '_∉'
    };
    scnArcs[sc_type_arc_access | sc_type_const | sc_type_arc_fuz
            | sc_type_arc_perm] = {
        forward : '/∍',
        backward : '∊/'
    };
    scnArcs[sc_type_arc_access | sc_type_var | sc_type_arc_fuz
            | sc_type_arc_perm] = {
        forward : '_/∍',
        backward : '_∊/'
    };
    // ---
    scnArcs[sc_type_arc_access | sc_type_const | sc_type_arc_pos
            | sc_type_arc_temp] = {
        forward : '~∍',
        backward : '∊~'
    };
    scnArcs[sc_type_arc_access | sc_type_var | sc_type_arc_pos
            | sc_type_arc_temp] = {
        forward : '_~∍',
        backward : '_∊~'
    };
    scnArcs[sc_type_arc_access | sc_type_const | sc_type_arc_neg
            | sc_type_arc_temp] = {
        forward : '~∌',
        backward : '∉~'
    };
    scnArcs[sc_type_arc_access | sc_type_var | sc_type_arc_neg
            | sc_type_arc_temp] = {
        forward : '_~∌',
        backward : '_∉~'
    };
    scnArcs[sc_type_arc_access | sc_type_const | sc_type_arc_fuz
            | sc_type_arc_temp] = {
        forward : '~/∍',
        backward : '∊/~'
    };
    scnArcs[sc_type_arc_access | sc_type_var | sc_type_arc_fuz
            | sc_type_arc_temp] = {
        forward : '_~/∍',
        backward : '_∊/~'
    };
    return {
        resolveArc : function(arcMask, backward) {

            return backward ? scnArcs[arcMask].backward
                    : scnArcs[arcMask].forward;
        },

        resolveNode : function(nodeMask) {

            return "";
        }
    };
}();


Ostis.ui.scn.Viewer = function(config) {

    var viewerId = '#' + config['container'];
    var htmlBuilder = new Ostis.ui.scn.HtmlBuilder();
    var selectionHandler = Ostis.ui.scn.Selection(viewerId);
    selectionHandler.init();
    var nodeLabels = [];
    var toTranslate = [];
    var currentLanguage = null;
    return {

        _onNewContent : function(event, data) {

            var outputData = htmlBuilder.buildTree(data);
            nodeLabels = [];
            toTranslate = [];
            $(viewerId).empty().append(outputData);
            this._initNodes();
        },

        _initNodes : function() {

            var translXPath = viewerId + " ["
                    + Ostis.ui.scn.HtmlAttributes.LABEL + "]";
            $(translXPath).each(
                    function(index, element) {

                        nodeLabels.push(element);
                        var scnAddr = $(element).attr(
                                Ostis.ui.scn.HtmlAttributes.LABEL);
                        toTranslate.push(scnAddr);
                    });
        },

        /**
         * to support component interface
         */
        destroy: function() {

        },

        // -----
        receiveData : function(data) {

            this._onNewContent(null, data);
        },

        translateIdentifiers : function(language) {
            currentLanguage = language;
            var proxyUpdateTrans = $.proxy(this.updateTranslation, this);
            SCWeb.core.Translation.translate(toTranslate, language, proxyUpdateTrans);
        },

        updateTranslation : function(namesMap) {

            for ( var nodeInd = 0; nodeInd < nodeLabels.length; nodeInd++) {
                var nodeEl = nodeLabels[nodeInd];
                var addr = $(nodeEl).attr(Ostis.ui.scn.HtmlAttributes.LABEL);
                var label = namesMap[addr];
                if (label) {
                    $(nodeEl).text(label);
                }
            }
        },

        getIdentifiersLanguage : function() {

            return currentLanguage;
        }
    };
};


