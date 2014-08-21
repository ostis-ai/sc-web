$.namespace('Ostis.ui.scn');

Ostis.ui.scn.IdentifierGenerator = (function() {

    var sequenceNumber = 0;
    var _nextSequenceNumber = function() {

        return sequenceNumber++;
    };

    return {
        generateLinkId : function(viewerId, linkAddr) {

            return viewerId + "_" + linkAddr + "_" + _nextSequenceNumber();
        }
    };
})();

Ostis.ui.scn.KeynodesIdtf = {
	'nrel_main_idtf': 1,
	'nrel_idtf': 2,
	'nrel_system_idtf': 3
	};
Ostis.ui.scn.KeynodesAddr = {};

Ostis.ui.scn.Viewer = function(sandbox) {
	this._init(sandbox);
};

Ostis.ui.scn.Viewer.prototype = {
	
	_init: function(sandbox) {
		this.viewerId = sandbox.container;
		this.viewerSelector = '#' + this.viewerId;
		this.htmlBuilder = Ostis.ui.scn.HtmlBuilder(this.viewerId);
		this.selectionHandler = Ostis.ui.scn.Selection(this.viewerId, sandbox);
		this.selectionHandler.init();
		this.nodeLabels = [];
		this.toTranslate = [];
		this.currentLanguage = null;
		this.sandbox = sandbox;
		
		this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
		this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
		this.sandbox.eventApplyTranslation = $.proxy(this.updateTranslation, this);
	},

    _initNodes: function() {

        var translXPath = this.viewerSelector + " ["
                + Ostis.ui.scn.HtmlAttributes.LABEL + "]";
        var self = this;
        $(translXPath).each(function(index, element) {

            self.nodeLabels.push(element);
            var scnAddr = $(element).attr(Ostis.ui.scn.HtmlAttributes.LABEL);
            self.toTranslate.push(scnAddr);
        });
    },

    _loadLinksData: function() {

        var linksXPath = this.viewerSelector + " ["
                + Ostis.ui.scn.HtmlAttributes.LINK + "]";
        var containers = {};
        
        $(linksXPath).each(
                function(index, element) {

                    var scAddr = $(element).attr(
                            Ostis.ui.scn.HtmlAttributes.LINK);
                    var containerId = $(element).attr(
                            Ostis.ui.scn.HtmlAttributes.HTML_ID);
					containers[containerId] = scAddr;
                });
                
         this.sandbox.createViewersForScLinks(containers, 
							function() { // success

                            }, function() { // error

                            });

    },
    
    /**
	 * to support component interface
	 */
	// -----
	receiveData : function(data) {

		var outputData = this.htmlBuilder.buildTree(data);
		this.nodeLabels = [];
		this.toTranslate = [];
		$(this.viewerSelector).empty().append(outputData);
		this.selectionHandler.preselectArguments();
		this._initNodes();
		this._loadLinksData();
	},

	updateTranslation : function(namesMap) {

		for ( var nodeInd = 0; nodeInd < this.nodeLabels.length; nodeInd++) {
			var nodeEl = this.nodeLabels[nodeInd];
			var addr = $(nodeEl).attr(Ostis.ui.scn.HtmlAttributes.LABEL);
			var label = namesMap[addr];
			if (label) {
				$(nodeEl).text(label);
			}
		}
	},
	
	getObjectsToTranslate : function() {
		return this.toTranslate;
	}
	
};


Ostis.ui.scn.HtmlBuilder = function(parentId) {

    var MARKERS = {
        SYNONIM : "=",
        SET_ELEMENT : "•"
    };

    var doViewerNodeModifications = function(node) {

        if (node.set) {
            for ( var setArcInd = 0; setArcInd < node.SCArcs.length; setArcInd++) {
                var setArc = node.SCArcs[setArcInd];
                setArc.marker = MARKERS.SET_ELEMENT;
            }
        }
    };

    var _buildNode = function(node) {

        var output = '';
        doViewerNodeModifications(node);
        output += _startWrapper(node);
        if (node.keyword) {
            output += _buildKeywordNode(node);
        } else {
            output += _buildNodeContent(node);
        }
        output += _buildSynonyms(node);
        output += _buildSentences(node);
        output += _closeWrapper(node);
        return output;
    };

    var _buildKeywordNode = function(node) {

        var result = "<div "
                + Ostis.ui.scn.HtmlAttributeBuilder
                        .buildClassAttr(Ostis.ui.scn.SCnCssClass.KEYWORD) + ">";
        result += _buildAtomicNode(node);
        result += "</div>";
        return result;
    };

    var _buildAtomicNode = function(node) {

        var atomicNode = _startSelectableNode(node);
        atomicNode += _getNodeLabel(node);
        atomicNode += _closeSelectableNode();
        return atomicNode;
    };

    var _startSelectableNode = function(node) {

        var cssClass = Ostis.ui.scn.SCnCssClass.LINK + " "
                + Ostis.ui.scn.SCnCssClass.SELECTABLE;
        return "<a " + Ostis.ui.scn.HtmlAttributeBuilder.buildScnIdAttr(node)
                + " "
                + Ostis.ui.scn.HtmlAttributeBuilder.buildClassAttr(cssClass)
                + ">";
    };

    var _getNodeLabel = function(node) {

        return "<span "
                + Ostis.ui.scn.HtmlAttributeBuilder.buildLabelAttr(node) + ">"
                + node.id + "</span>";
    };

    var _closeSelectableNode = function() {

        return "</a>";
    };

    var _buildSynonyms = function(node) {

        var sentOut = '';
        if (node.SCSynonims) {
            for ( var synInd = 0; synInd < node.SCSynonims.length; synInd++) {
                sentOut += _buildOneSynonym(node.SCSynonims[synInd]);
            }
        }
        return sentOut;
    };

    var _buildSentences = function(node) {

        var sentOut = '';
        if (node.SCArcs) {
            for ( var arcInd = 0; arcInd < node.SCArcs.length; arcInd++) {
                sentOut += _buildOneSentence(node.SCArcs[arcInd]);
            }
        }
        return sentOut;
    };

    var _buildAttrValue = function(arc) {

        var attrRes = '';
        var allAttr = arc.SCAttributes;
        for ( var attrInd = 0; attrInd < allAttr.length; attrInd++) {
            var attribute = allAttr[attrInd];
            attrRes += _buildSingleAttribute(attribute);
        }
        return attrRes;
    };

    var _buildSingleAttribute = function(attr) {

        return _buildAtomicNode(attr) + ":";
    };

    var _buildNodeValue = function(arc) {

        return _buildNode(arc.SCNode);
    };

    var _buildSentenceBegin = function() {

        return "<div "
                + Ostis.ui.scn.HtmlAttributeBuilder
                        .buildClassAttr(Ostis.ui.scn.SCnCssClass.SENTENCE)
                + ">";
    };

    var _buildSentenceEnd = function() {

        return "</div>";
    };

    var _buildOneSynonym = function(node) {

        var resSen = _buildSentenceBegin();
        resSen += _buildSynonymField(node);
        resSen += _buildSentenceEnd();
        return resSen;
    };

    var _buildSynonymField = function(node) {

        var fieldRes = "<div ";
        var fieldClass = Ostis.ui.scn.SCnCssClass.FIELD;
        fieldRes += Ostis.ui.scn.HtmlAttributeBuilder
                .buildClassAttr(fieldClass);
        fieldRes += ">";
        fieldRes += _buildStaticMarker(MARKERS.SYNONIM);
        fieldRes += _buildNode(node);
        fieldRes += "</div>";
        return fieldRes;
    };

    var _buildOneSentence = function(arc) {

        var resSen = _buildSentenceBegin();
        var buildMarker = true;
        var shiftLevel = false;
        if (arc.SCAttributes) {
            var attrFuncProxy = $.proxy(_buildAttrValue, this);
            resSen += _buildField(arc, attrFuncProxy, buildMarker, shiftLevel);
            buildMarker = false;
            shiftLevel = true;
        }
        if (arc.SCNode) {
            var nodeValFuncProxy = $.proxy(_buildNodeValue, this);
            resSen += _buildField(arc, nodeValFuncProxy, buildMarker,
                    shiftLevel);
        }
        resSen += _buildSentenceEnd();
        return resSen;
    };

    var _buildField = function(arc, valContVisitor, buildMarker, shiftLevel) {

        var fieldRes = "<div ";
        var fieldClass = Ostis.ui.scn.SCnCssClass.FIELD;
        if (shiftLevel) {
            fieldClass = fieldClass + " " + Ostis.ui.scn.SCnCssClass.LEVEL;
        }
        fieldRes += Ostis.ui.scn.HtmlAttributeBuilder
                .buildClassAttr(fieldClass);
        fieldRes += ">";
        if (buildMarker && (arc.type || arc.marker)) {
            fieldRes += _buildSelectableMarker(arc);
        }
        fieldRes += _buildValue(arc, valContVisitor);
        fieldRes += "</div>";
        return fieldRes;
    };

    var _buildStaticMarker = function(marker) {

        var markerRes = "<div "
                + Ostis.ui.scn.HtmlAttributeBuilder
                        .buildClassAttr(Ostis.ui.scn.SCnCssClass.MARKER) + ">";
        markerRes += marker;
        markerRes += "</div>";
        return markerRes;
    };

    var _buildSelectableMarker = function(arc) {

        var markerRes = "<div "
                + Ostis.ui.scn.HtmlAttributeBuilder
                        .buildClassAttr(Ostis.ui.scn.SCnCssClass.MARKER) + ">";
        markerRes += _startSelectableNode(arc);
        var markerView = arc.marker ? arc.marker : Ostis.ui.scn.TypeResolver
                .resolveArc(arc.type, arc.backward);
        markerRes += markerView;
        markerRes += _closeSelectableNode();
        markerRes += "</div>";
        return markerRes;
    };

    var _buildValue = function(arc, valContVisitor) {

        var valRes = "<div "
                + Ostis.ui.scn.HtmlAttributeBuilder
                        .buildClassAttr(Ostis.ui.scn.SCnCssClass.VALUE) + ">";
        valRes += valContVisitor(arc);
        valRes += "</div>";
        return valRes;
    };

    var _buildNodeContent = function(node) {

        var nodeCont = '';
        if (node.contour) {
            nodeCont += _buildContourContent(node);
        } else if (node.type & sc_type_link) {
            nodeCont = Ostis.ui.scn.HtmlLinkBuilder.buildLink(parentId, node);
        } else if (node.id && !node.set) {
            nodeCont = _buildAtomicNode(node);
        }
        return nodeCont;
    };

    var _startWrapper = function(node) {

        var result = '';
        if (node.set) {
            result = "<div "
                    + Ostis.ui.scn.HtmlAttributeBuilder.buildScnIdAttr(node)
                    + " "
                    + Ostis.ui.scn.HtmlAttributeBuilder
                            .buildClassAttr(Ostis.ui.scn.SCnCssClass.SELECTABLE)
                    + ">";
            result += "<div>{</div>";
        } else if (node.contour) {

            var contourClass = Ostis.ui.scn.SCnCssClass.SELECTABLE + " "
                    + Ostis.ui.scn.SCnCssClass.LOOP;
            result = "<span "
                    + Ostis.ui.scn.HtmlAttributeBuilder.buildScnIdAttr(node)
                    + " "
                    + Ostis.ui.scn.HtmlAttributeBuilder
                            .buildClassAttr(contourClass) + ">";
        }
        return result;
    };

    var _closeWrapper = function(node) {

        var result = '';
        if (node.set) {
            result = "<div>}</div></div>";
        } else if (node.contour) {
            result = "</span>";
        }
        return result;
    };

    var _buildContourContent = function(node) {

        var outCont = '';
        for ( var keywInd = 0; keywInd < node.SCNodes.length; keywInd++) {
            outCont += _buildNode(node.SCNodes[keywInd]);
        }
        return outCont;
    };
    return {

        buildTree : function(data) {

            var outputData = '';
            for ( var keywordInd = 0; keywordInd < data.length; keywordInd++) {
                outputData += _buildNode(data[keywordInd]);
            }
            return outputData;
        }
    };
};

Ostis.ui.scn.HtmlAttributeBuilder = (function() {

    return {
        buildIdAttr : function(idVal) {

            return "id='" + idVal + "'";
        },

        buildClassAttr : function(cls) {

            return "class='" + cls + "'";
        },

        buildScnIdAttr : function(node) {

            return Ostis.ui.scn.HtmlAttributes.ID + "='" + node.id + "' ";
        },

        buildLabelAttr : function(node) {

            return Ostis.ui.scn.HtmlAttributes.LABEL + "='" + node.id + "' ";
        },

        buildLinkAttr : function(node) {

            return Ostis.ui.scn.HtmlAttributes.LINK + "='" + node.id + "'";
        }
    };
})();

Ostis.ui.scn.HtmlLinkBuilder = (function() {

    var _startFileWrapper = function(node) {

        var cssClass = Ostis.ui.scn.SCnCssClass.FILE + " "
                + Ostis.ui.scn.SCnCssClass.SELECTABLE;
        return "<span "
                + Ostis.ui.scn.HtmlAttributeBuilder.buildClassAttr(cssClass)
                + " " + Ostis.ui.scn.HtmlAttributeBuilder.buildScnIdAttr(node)
                + ">";
    };

    var _closeFileWrapper = function() {

        return "</span>";
    };

    var _beginLinkContainer = function(viewerId, node) {

        var containerId = Ostis.ui.scn.IdentifierGenerator.generateLinkId(
                viewerId, node.id);
        return "<div "
                + Ostis.ui.scn.HtmlAttributeBuilder.buildIdAttr(containerId)
                + " " + Ostis.ui.scn.HtmlAttributeBuilder.buildLinkAttr(node)
                + ">";
    };

    var _endLinkContainer = function() {

        return "</div>";
    };

    return {

        buildLink : function(container, link) {

            var result = _startFileWrapper(link);
            result += _beginLinkContainer(container, link);
            result += _endLinkContainer();
            result += _closeFileWrapper();
            return result;
        }
    };
})();

Ostis.ui.scn.SCnComponent = {
	ext_lang: 'scn_code',
    formats : ['format_scn_json'],
    factory : function(sandbox) {
        return new Ostis.ui.scn.Viewer(sandbox);
    },
    init: function(callback) {
		var idtfs = [];
		for (key in Ostis.ui.scn.KeynodesIdtf) {
			if (!Ostis.ui.scn.KeynodesAddr.hasOwnProperty(key))
				idtfs.push(key);
		}
		if (idtfs.length > 0) {
			this.sandbox.resolveAddrs(idtfs, function(data) {
				for (key in data) {
					if (Ostis.ui.scn.KeynodesIdtf.hasOwnProperty(key))
						Ostis.ui.scn.KeynodesAddr[key] = Ostis.ui.scn.KeynodesIdtf[key];
				}
				callback();
			});
		} else
			callback();
	}
};

SCWeb.core.ComponentManager.appendComponentInitialize(Ostis.ui.scn.SCnComponent);

Ostis.ui.scn.HtmlAttributes = {
    ID : 'sc_addr',
    LABEL : 'scnLableFor',
    LINK : 'scnLinkFor',
    HTML_ID : "id"
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


Ostis.ui.scn.Selection = function(parent, sandbox) {

    var elementQueue = [];
    var parentSelector = '#' + parent;

    var _elementClick = function(event) {

    /*    if (event.ctrlKey) {
            var scAddr;
            $(event.currentTarget).toggleClass(
                    Ostis.ui.scn.SCnCssClass.SELECTED, true);
            scAddr = $(event.currentTarget)
                    .attr(Ostis.ui.scn.HtmlAttributes.ID);
            SCWeb.core.Arguments.appendArgument(scAddr);
        } else*/ {
            scAddr = $(event.currentTarget)
                    .attr(Ostis.ui.scn.HtmlAttributes.ID);
            //$(parentSelector).trigger('semanticNeighbourhood', scAddr);
            sandbox.doDefaultCommand([scAddr]);
        }
    };

    var _elementEnter = function(event) {

        var elementToClearHover = _getLastElementInQueue();
        if (elementToClearHover) {
            $(elementToClearHover)
                    .removeClass(Ostis.ui.scn.SCnCssClass.HOVERED);
        }

        var elementToHover = event.currentTarget;
        elementQueue.push(elementToHover);
        $(elementToHover).addClass(Ostis.ui.scn.SCnCssClass.HOVERED);
    };

    var _elementLeave = function(event) {

        elementQueue.pop();
        $(event.currentTarget).removeClass(Ostis.ui.scn.SCnCssClass.HOVERED);

        var elementToHover = _getLastElementInQueue();
        if (elementToHover) {
            $(elementToHover).addClass(Ostis.ui.scn.SCnCssClass.HOVERED);
        }
    };

    var _getLastElementInQueue = function() {

        return elementQueue[elementQueue.length - 1];
    };

    var _selectElement = function(scAddr) {

        var expr = parentSelector + " [" + Ostis.ui.scn.HtmlAttributes.ID + "="
                + scAddr + "]";
        $(expr).each(function(index, element) {

            $(element).toggleClass(Ostis.ui.scn.SCnCssClass.SELECTED, true);
        });
    };

    return {
        init : function() {

            var selectableClassExpr = "." + Ostis.ui.scn.SCnCssClass.SELECTABLE;
            var hoveredClassExpr = "." + Ostis.ui.scn.SCnCssClass.HOVERED;
            $(parentSelector).delegate(selectableClassExpr, 'mouseenter',
                    $.proxy(_elementEnter, this));
            $(parentSelector).delegate(selectableClassExpr, 'mouseleave',
                    $.proxy(_elementLeave, this));
            $(parentSelector).delegate(hoveredClassExpr, 'click',
                    $.proxy(_elementClick, this));
        },

        preselectArguments : function() {

            var toSelect = SCWeb.core.Arguments.getArguments();
            for ( var toSelInd = 0; toSelInd < toSelect.length; toSelInd++) {
                _selectElement(toSelect[toSelInd]);
            }
        },

        argumentAppended : function(argument, idx) {

            _selectElement(argument);
        },

        argumentRemoved : function(argument, idx) {

            var expr = parentSelector + " ."
                    + Ostis.ui.scn.SCnCssClass.SELECTED + "["
                    + Ostis.ui.scn.HtmlAttributes.ID + "=" + argument + "]";
            $(expr).each(
                    function(index, element) {

                        $(element).toggleClass(
                                Ostis.ui.scn.SCnCssClass.SELECTED, false);
                    });
        },

        argumentsCleared : function() {

            var expr = parentSelector + " ."
                    + Ostis.ui.scn.SCnCssClass.SELECTED;
            $(expr).each(
                    function(index, element) {

                        $(element).toggleClass(
                                Ostis.ui.scn.SCnCssClass.SELECTED, false);
                    });
        }
    };
};

Ostis.ui.scn.TypeResolver = (function() {

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
    scnArcs[sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm] = {
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
})();


