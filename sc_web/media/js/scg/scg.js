

var scgLayout = function(config){
    this._initScgLayout(config);
};

scgLayout.prototype = {


    _initScgLayout  : function(config){
        this.config = config;

        this.config = this._defaultConfig;

        this._graph = null;
        this._renderer = null;
        this.nodeForce = {};
    },

    _defaultConfig  : {
        MAX_REPULSIVE_LENGTH    : 350,
        MAX_REPULSIVE_SQUARED   : 350 * 350,
        AVG_ATTRACTIVE_LENGTH   : 100,
        DEF_START_BOX_HEIGHT    : 101,
        MAX_ITERATIONS_CYCLE    : 21,

        REPULSIVE_PARAMETER     : 120000,
        ATTRACTIVE_PARAMETER    : 2,

        TIME_VELOCITY           : 1,

        SCREEN_CENTER_X         : 200,
        SCREEN_CENTER_Y         : 250,

        MAX_FORCE               : 15.0,

        NUM_STEP_ITERATION      : 5,
        MIN_MOVEMENT            : 2
    },

    setGraph        : function(graph){
        this._graph = graph;
    },

    setRenderer     : function(renderer){
        this._renderer = renderer;
    },

    layout        : function(){

        var self = this;

        setTimeout(function(){
            var isNeedLayout = self._layoutStep(self.config.NUM_STEP_ITERATION);
            self._renderer.reDraw();
            self._renderer._layerNodes.draw();
            if(isNeedLayout){
                self.layout();
            }
        }, 100);

    },


    _layoutStep        : function(iterationNum){

        for(var i = 0; i < iterationNum; i++){
            //for each node
            for (var tt in this._graph.nodes) {
                this.setNodeForce(this._graph.nodes[tt], 0, 0);


                //2.1 find repulsive pairs

                //for each pair
                for (var ttt in this._graph.nodes) {
                    if (ttt == tt) break; //or uncomment (1.1)

                    var relation = this.getRelation(this._graph.nodes[tt], this._graph.nodes[ttt]);

                    console.log(this._graph.nodes[ttt].id +
                        " Repulsive Pairs deltaX " + relation.deltaX +
                        "| deltaY " + relation.deltaY +
                        "| sqDistance " + relation.sqDistance );


                    if (relation.sqDistance > this.config.MAX_REPULSIVE_SQUARED) break;
                    if (relation.sqDistance <= 0) break;  //(1.1)

                    this.addNodeForce(this._graph.nodes[tt], relation.deltaX, relation.deltaY,
                        relation.sqDistance, this.getRepulsiveForce(relation.sqDistance));
                }


                //2.2 find attractive force

                //for each arc in node (between nodes)
                for (var ttt in this._graph.nodes[tt]._incidentArcs) {
                    var tmpNode = this._graph.nodes[tt]._incidentArcs[ttt]._endNode;

                    if (tmpNode == this._graph.nodes[tt]) {
                        tmpNode = this._graph.nodes[tt]._incidentArcs[ttt]._beginNode;
                    }

                    if (tmpNode == this._graph.nodes[tt]) // twice! => error
                    {
                        break;
                    }

                    var relation = this.getRelation(this._graph.nodes[tt], tmpNode);

                    //if (relation.sqDistance > MAX_REPULSIVE_SQUARED) break;
                    if (relation.sqDistance <= 0) break;  //(1.1)

                    //else

                    this.addNodeForce(this._graph.nodes[tt], relation.deltaX, relation.deltaY,
                        relation.sqDistance, this.getAttractiveForce(relation.sqDistance));


                }

            }

            //2.3 find motion vector == node.Force

            //3.1 relocate nodes & arcs
            //for each node
            var nodesMaxMovement = {
                x   : 0,
                y   : 0
            };

            for (var tt in this._graph.nodes) {
                posX = this._graph.nodes[tt].getPosition().x;
                posY = this._graph.nodes[tt].getPosition().y;

                //add max force limit
                var forceX_ = this.getNodeForce(this._graph.nodes[tt]).x;
                var forceY_ = this.getNodeForce(this._graph.nodes[tt]).y;


                console.log(
                    this._graph.nodes[tt].id +
                        " current forceX " + forceX_ + "forceY " + forceY_ );

                if (forceX_ > this.config.MAX_FORCE) forceX_ = this.config.MAX_FORCE;
                if (forceX_ < -this.config.MAX_FORCE) forceX_ = -this.config.MAX_FORCE;
                if (forceY_ > this.config.MAX_FORCE) forceY_ = this.config.MAX_FORCE;
                if (forceY_ < -this.config.MAX_FORCE) forceY_ = -this.config.MAX_FORCE;

                var dx = forceX_ * this.config.TIME_VELOCITY;
                var dy = forceY_ * this.config.TIME_VELOCITY;

                nodesMaxMovement.x = Math.max(nodesMaxMovement.x, Math.abs(dx) );
                nodesMaxMovement.y = Math.max(nodesMaxMovement.y, Math.abs(dy) );

                this._graph.nodes[tt].setPosition(posX + dx, posY + dy);

            }

            if(nodesMaxMovement.x < this.config.MIN_MOVEMENT && nodesMaxMovement.y < this.config.MIN_MOVEMENT){
                return false;
            }

        }

        return true;

    },

    getRelation : function (nodeA, nodeB) {
        var deltaX = nodeB.getPosition().x - nodeA.getPosition().x;
        var deltaY = nodeB.getPosition().y - nodeA.getPosition().y;

        var arr = [];
        arr["deltaX"] = deltaX;
        arr["deltaY"] = deltaY;
        arr["sqDistance"] = deltaX * deltaX + deltaY * deltaY;

        return arr;
    },

    getArcRelation : function (nodeA, nodeB) {
        var deltaX = nodeB.getPosition().x - nodeA.getPosition().x;
        var deltaY = nodeB.getPosition().y - nodeA.getPosition().y;

        var arr = [];
        arr["deltaX"] = deltaX;
        arr["deltaY"] = deltaY;
        arr["sqDistance"] = deltaX * deltaX + deltaY * deltaY;

        return arr;
    },

    getRepulsiveForce : function(squaredDistanceValue) {
        //TODO: f=k(q1*q2) / (L^2). k - parameter, q1=q2=1, L^2=sDV => f=k/sDV
        //+ invert result
        return  -this.config.REPULSIVE_PARAMETER / squaredDistanceValue;
    },

    //although can be repulsive too
    getAttractiveForce : function(squaredDistanceValue) {
        //TODO: f=k*dX. k - parameter => f=k(normal_len - sqrt(sDV))
        return  - this.config.ATTRACTIVE_PARAMETER *
            ((this.config.AVG_ATTRACTIVE_LENGTH - Math.sqrt(squaredDistanceValue)));
    },


    setNodeForce : function(node, x, y) {
        this.nodeForce[node.id] = {
            x : x,
            y : y
        };
    },

    addNodeForce : function(node, x, y, distance, value) {
        var vector_scale = value * value / distance;

        var nodeForce = this.nodeForce[node.id];
        if(!nodeForce){
            this.nodeForce[node.id] = {
                x : 0,
                y : 0
            }
            nodeForce = this.nodeForce[node.id];
        }
        nodeForce.x += x * vector_scale * (value % 1);
        nodeForce.y += y * vector_scale * (value % 1);
    },

    getNodeForce    : function(node){
        return this.nodeForce[node.id];
    }
};


/**
 * scgViewerWindow
 * @param config
 * @constructor
 */
var scgViewerWindow = function(config){
    this._initWindow(config);
};

scgViewerWindow.prototype = {

    /**
     * scgViewer Window init
     * @param config
     * @private
     */
    _initWindow : function(config){

        /**
         * Container for render graph
         * @type {String}
         */
        this.domContainer = config.container;

        this.renderer = null;

        this._currentLanguage = null;

    },

    /**
     * Set new data in viewer
     * @param {Object} data
     */
    receiveData : function(data){
        var graph = this._buildGraph(data);
        if(!graph){
            console.warn('Build graph error');
            return;
        }

        $('#' + this.domContainer).empty();
        this.renderer = new scgKineticRenderer({
            graph       : graph,
            container   : this.domContainer,
            width       : 800,
            height      : 600
        });

        var layout = new scgLayout({});
        layout.setGraph(graph);
        layout.setRenderer(this.renderer);
        layout.layout();


        //@TODO set renderer in scgGraph for redrawing, not in GLOBAL WINDOW
        this.renderer.render();
    },

    /**
     * //@TODO clean memory and stop layout
     * Destroy window
     * @return {Boolean}
     */
    destroy : function(){
        return true;
    },

    /**
     * Build scGraph from JSON
     * @param {Object} data
     * @return {scGraph}
     * @private
     */
    _buildGraph : function(data){
        var graph = GraphBuilder.buildGraph(data);
        return graph;
    },


    /**
     * Emit translate identifiers
     */
    translateIdentifiers    : function(language){

        var objects = this._getObjectsForTranslate();
        var self = this;
        SCWeb.core.Translation.translate(objects, language, function(namesMap) {
            self._translateObjects(namesMap);
        });

    },

    /**
     * Get current language in viewer
     * @return String
     */
    getIdentifiersLanguage  : function(){
        return this._currentLanguage;
    },

    _getObjectsForTranslate : function(){

        /** @var graph {scGraph} **/
        var graph = this.renderer.getGraph();
        var nodes = graph.nodes;
        var objects = [];
        for(var scAddr in nodes){
            objects.push(scAddr);
        }
        return objects;
    },

    _translateObjects       : function(namesMap){

        var graph = this.renderer.getGraph();
        var nodes = graph.nodes;
        var objects = [];
        for(var scAddr in namesMap){
            var node = graph.getNodeById(scAddr);
            if(node){
                node.idf = namesMap[scAddr];
            }
        }

        this.renderer.reDraw();
        this.renderer._layerNodes.draw();

    }

};

SCgComponent = {
    type: 0,
    outputLang: 'format_scg_json',
    factory: function(config) {
        return new scgViewerWindow(config);
    },

    addArgument : function(arg){
        SCWeb.core.Arguments.appendArgument(arg);
    }
};

$(document).ready(function() {
    SCWeb.core.ComponentManager.appendComponentInitialize(function() {
        SCWeb.core.ComponentManager.registerComponent(SCgComponent);
    });
});



/**
 * sc Arc model
 * @param beginNode
 * @param endNode
 * @param config
 */
var scArc = function( beginNode, endNode, config ){

    this._initScArc(beginNode, endNode, config);

};

scArc.prototype = {

    _initScArc  : function( beginNode, endNode, config ){

        this.id     = config.id;
        this.type   = parseInt(config.type);

        this.isArc = true;

        this._beginNode  = beginNode;
        this._beginNodePos = config.beginPos;
        this._endNode    = endNode;
        this._endNodePos = config.endPos;

        this._incidentArcs = [];

        this._breaks = config.breaks || [];

        this.color  = config.color;


        this._beginNode.addIncidentArc(this);
        this._endNode.addIncidentArc(this);

    },

    addIncidentArc  : function( arc ){

        this._incidentArcs[arc.id] = arc;
        return this;

    },

    /**
     * Set arc begin node
     * @param node scNode
     */
    setBeginNode    : function ( node ){
        this._beginNode = node;
    },

    /**
     * Set arc end node
     * @param node scNode
     */
    setEndNode      : function ( node ){
        this._endNode = node;
    },

    /**
     * Get arc begin node
     * @return scNode
     */
    getBeginNode    : function(){
        return this._beginNode;
    },

    /**
     * Get arc end node
     * @return scNode
     */
    getEndNode      : function(){
        return this._endNode;
    },

    /**
     * Add break to arc
     * @param position
     */
    addBreak        : function( position ){
        this._breaks.push(position);
    },


    getPosition     : function( pos ){

        if( !pos ){
            pos = 0.5;
        }

        pos = Number(pos);
        var breakPosition = pos % 1;
        var breakNum = pos - breakPosition;
        var line = this._getLines()[breakNum];

        // @TODO break begin - end position
        var beginPos = line.begin;
        var endPos = line.end;

        var dx = ( beginPos.x - endPos.x ) * breakPosition;
        var dy = ( beginPos.y - endPos.y ) * breakPosition;

        return {
            x : beginPos.x - dx,
            y : beginPos.y - dy
        };


    },

    _getPoints       : function(){

        var points = [];

        points.push( this._beginNode.getPosition( this._beginNodePos ) );

        var breaks = this._breaks;
        for( var i = 0; i < breaks.length; i++){
            points.push(breaks[i]);
        }

        points.push( this._endNode.getPosition( this._endNodePos ) );

        return points;

    },


    _getLines   : function(){

        var points = this._getPoints();
        var lines = [];
        for( var i = 0; i < points.length-1 ; i++){
            lines.push({
                begin : points[i],
                end   : points[i+1]
            });
        }

        return lines;
    },

    _getLastLine    : function(){

        var lines = this._getLines();
        return lines[lines.length - 1];

    },

    _getFirstLine   : function(){

        return this._getLines()[0];

    },



    // types

    _getType        : function(num){
        var parts = this.type.split('/');
        return parts[num];
    },

    isAccessory     : function(){
        return (this.type & sc_type_arc_access) == sc_type_arc_access;
    },

    isOriented     : function(){
        return true;
    },

    isNegative      : function(){
        return (this.type & sc_type_positivity_mask) == sc_type_arc_neg;
    },

    isFuzzy      : function(){
        return (this.type & sc_type_positivity_mask) == sc_type_arc_fuz;
    },

    isPositive      : function(){
        return (this.type & sc_type_positivity_mask) == sc_type_arc_pos;
    },

    isVariable      : function(){
        return (this.type & sc_type_constancy_mask) == sc_type_var;
    },

    isTemporal      : function(){
        return (this.type & sc_type_permanency_mask) == sc_type_arc_temp;
    },

    /**
     * WTF????????????????? for pair/-/-/-/-/wtf/
     * @param from
     * @param to
     * @return {Boolean}
     */
    isUndefined     : function(from ,to){

        return false;
    }


};

/**
 * sc Graph model
 */
var scGraph = function(){

    this._initScGraph();

};


//Types

scGraph.prototype = {

    /**
     * scGraph init
     * @private
     */
    _initScGraph    : function(){

        this.arcs = {};
        this.nodes = {};

    },

    /**
     * Add arc to graph
     * @param arc scArc
     * @return scGraph
     */
    addArc          : function( arc ){

        this.arcs[arc.id] = arc;
        return this;
    },

    /**
     * Add node to graph
     * @param node scNode
     * @return scGraph
     */
    addNode         : function( node ){

        this.nodes[node.id] = node;
        return this;
    },

    /**
     * Getter arc by identificator
     * @param id string
     * @return scArc
     */
    getArcById      : function( id ){

        if( this.arcs[id] ){
            return this.arcs[id];
        }
        return null;
    },

    /**
     * Getter node by identificator
     * @param id string
     * @return scNode
     */
    getNodeById     : function( id ){

        if( this.nodes[id] ){
            return this.nodes[id];
        }
        return this.nodes[id];
    }

};

// sc-element types
var sc_type_node        = 0x1;
var sc_type_link        = 0x2;
var sc_type_edge_common = 0x4;
var sc_type_arc_common  = 0x8;
var sc_type_arc_access  = 0x10;

// sc-element constant
var sc_type_const       = 0x20;
var sc_type_var         = 0x40;

// sc-element positivity
var sc_type_arc_pos         = 0x80;
var sc_type_arc_neg         = 0x100;
var sc_type_arc_fuz         = 0x200;

// sc-element premanently
var sc_type_arc_temp        = 0x400;
var sc_type_arc_perm        = 0x800;

// struct node types
var sc_type_node_tuple       = (0x80 | sc_type_node);
var sc_type_node_struct      = (0x100 | sc_type_node);
var sc_type_node_role        = (0x200 | sc_type_node);
var sc_type_node_norole      = (0x400 | sc_type_node);
var sc_type_node_class       = (0x800 | sc_type_node);
var sc_type_node_abstract    = (0x1000 | sc_type_node);
var sc_type_node_material    = (0x2000 | sc_type_node);

var sc_type_arc_pos_const_perm = (sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm);

// type mask
var sc_type_element_mask     = (sc_type_node | sc_type_link | sc_type_edge_common | sc_type_arc_common | sc_type_arc_access);
var sc_type_constancy_mask   = (sc_type_const | sc_type_var);
var sc_type_positivity_mask  = (sc_type_arc_pos | sc_type_arc_neg | sc_type_arc_fuz);
var sc_type_permanency_mask  = (sc_type_arc_perm | sc_type_arc_temp);
var sc_type_node_struct_mask = (sc_type_node_tuple | sc_type_node_struct | sc_type_node_role | sc_type_node_norole | sc_type_node_class | sc_type_node_abstract | sc_type_node_material);
var sc_type_arc_mask         = (sc_type_arc_access | sc_type_arc_common | sc_type_edge_common);



var GraphBuilder = {

    elementType : {
        NODE : "node",
        LINK : "link",
        ARC : "arc"
    },

    nodeType : {
        LINK : sc_type_node | sc_type_const
    },

    LINK_SUFFIX : "_link",

    buildGraph : function(data) {

        var graph = new scGraph();
        var arcs = [];
        var nodeCount = 0;
        var objDict = {};
        for (idx in data) {
            var obj = data[idx];
            if (obj.type == this.elementType.NODE) {
                var node = this._buildNode(obj);
                this._initNodePosition(node, nodeCount);
                graph.addNode(node);
                nodeCount++;
                objDict[obj.id] = node;
            }
            if (obj.type == this.elementType.ARC) {
                arcs.push(obj);
            }

            if (obj.type == this.elementType.LINK) {
                var node = this._buildLinkNode(obj);
                this._initNodePosition(node, nodeCount);
                graph.addNode(node);
                nodeCount++;
                objDict[obj.id] = node;
            }
        }
        this._buildArcs(arcs, objDict, graph);

        return graph;
    },

    _buildNode : function(jsonElem) {

        var nodeCfg = {
            id : jsonElem.id,
            idf : jsonElem.id,
            type : jsonElem.el_type
        };
        return new scNode(nodeCfg);
    },

    _initNodePosition : function(node, nodeNum) {

        var x = this._calcXNodePos(nodeNum);
        var y = this._calcYNodePos(nodeNum);
        node.setPosition(x, y);
    },

    _calcXNodePos : function(nodeNum) {

        return 100 + nodeNum * 25;
    },

    _calcYNodePos : function(nodeNum) {

        return 70 + nodeNum * 30;
    },

    _buildLinkNode : function(jsonElem) {

        var linkCfg = {
            id : jsonElem.id,
            idf : jsonElem.id + this.LINK_SUFFIX,
            type : this.nodeType.LINK
        };
        return new scNode(linkCfg);
    },

    _buildArcs : function(jsonArcsElems, objDict, graph) {

        // create arcs
        var founded = true;
        while (jsonArcsElems.length > 0 && founded) {
            founded = false;
            for (idx in jsonArcsElems) {
                var obj = jsonArcsElems[idx];
                var beginId = obj.begin;
                var endId = obj.end;
                // try to get begin and end object for arc
                if (objDict.hasOwnProperty(beginId)
                    && objDict.hasOwnProperty(endId)) {
                    var beginNode = objDict[beginId];
                    var endNode = objDict[endId];
                    var arc = this._buildArc(obj, beginNode, endNode);
                    founded = true;
                    jsonArcsElems.splice(idx, 1);
                    objDict[obj.id] = arc;
                    graph.addArc(arc);
                }
            }
        }
    },
    _buildArc : function(jsonElem, firstNode, secondNode) {

        var arcCfg = {
            id : jsonElem.id,
            type : jsonElem.el_type
        };
        return new scArc(firstNode, secondNode, arcCfg);
    }

};

/**
 * sc Node model
 * @param config
 */
var scNode = function(config){

    this._initScNode(config);

};


scNode.prototype = {

    _initScNode     : function( config ){

        this.id     = config.id;
        this.type   = parseInt(config.type);
        this._incidentArcs = config._incidentArcs || {};

        this._position   = config.position || {};
        this.color      = config.color;

        this.idf = config.idf || "";

        //constants

        this.TYPE_POS_VAR   = 1;
        this.TYPE_POS_TYPE  = 2;

        this.isActive = false;

    },

    /**
     *
     * @return Object
     */
    getPosition     : function(){
        return this._position;
    },

    /**
     *
     * @param x int | Object
     * @param y int
     * @return scNode
     */
    setPosition     : function( x, y ){

        if( x.x && x.y ){
            this._position.x = x.x;
            this._position.y = x.y;
        } else {
            this._position.x = x;
            this._position.y = y;
        }
        return this;

    },

    /**
     *
     * @param arc scArc
     * @return scNode
     */
    addIncidentArc  : function( arc ){

        this._incidentArcs[arc.id] = arc;
        return this;

    },

    /**
     *
     * @param arc scArc
     * @return scNode
     */
    removeIncidentArc   : function( arc ){

        if( this._incidentArcs[arc.id] ){
            delete this._incidentArcs[arc.id];
        }
        return this;
    },


    // types

    getStructType        : function(){

        var typeMap = {
            'tuple'     : sc_type_node_tuple,
            'struct'    : sc_type_node_struct,
            'role'      : sc_type_node_role,
            'relation'  : sc_type_node_norole,
            'class'     : sc_type_node_class,
            'abstract'  : sc_type_node_abstract,
            'material'  : sc_type_node_material
        };

        for(var i in typeMap){
            if( ( this.type & sc_type_node_struct_mask ) == typeMap[i] ){
                return i;
            }
        }

        return 'general';
    },

    isVariable      : function(){
        return (this.type & sc_type_constancy_mask) == sc_type_var;
    }
};




/**
 * scg Arc constuctor
 * @param layer for draw
 * @param arc sc-arc model
 */
var scgArc = function( layer, arc, renderer ){
    this._initArc( layer, arc, renderer );
};

scgArc.prototype = {

    /**
     * initilization scgArc
     * @param layer
     * @param arc
     * @private
     */
    _initArc   : function( layer, arc, renderer ){

        this._arc   = arc;
        this._layer = layer;

        this._drawFunc = this._getDrawFunc();

        this._drawObject = null;

        this._renderer = renderer;

        this.draw();

    },

    getRenderer : function(){
        return this._renderer;
    },

    /**
     * First drawing object
     */
    draw    : function(){

        this._draw();
        if( this._arc.isOriented() ){
            var arrowPos = this._prepareArrowPosition();
            var arrow = this._getArrow(arrowPos.begin, arrowPos.end);
            this._layer.add(arrow);
        }

        this._drawBreaks();
    },

    /**
     * Redrawing object
     */
    reDraw  : function(){

        this._reDraw();

        if( this._arc.isOriented() ){
            var arrowPos = this._prepareArrowPosition();
            this._getArrow(arrowPos.begin, arrowPos.end);
        }

        this._drawBreaks();

    },

    /**
     * Draw Kinetic.Line
     * @private
     */
    _draw   : function(){


        var drawObj = new Kinetic.Line(this.__defaultLineConfig);
        var self = this;
        drawObj.setDrawFunc( function(context){
            self._lineDrawFunc.call(this, context, self);
        });
        drawObj.on("mousemove", function(){
            console.log("move");
        });

        var points = this._prepareLinePoints();
        drawObj.setPoints(points);
        this._layer.add(drawObj);
        this._drawObject = drawObj;

    },

    /**
     * Redraw Kinetic.Line
     * @private
     */
    _reDraw : function(){

        this._drawObject.setPoints(this._prepareLinePoints());

    },

    /**
     * Draw Func for Kinetic.Line
     * @param context
     * @param self
     * @private
     */
    _lineDrawFunc   : function(context, self){

        for(var n = 1; n < this.attrs.points.length; n++) {
            var to = this.attrs.points[n];
            var from = this.attrs.points[n-1];
            context.beginPath();
            self._lineDrawPart(context, from, to, self);
            this.stroke(context);
        }

        if(!!this.attrs.lineCap) {
            context.lineCap = this.attrs.lineCap;
        }


    },

    /**
     * Draw part of arc ( between breaks/nodes )
     * @param context canvas context
     * @param from point
     * @param to point
     * @param self
     * @private
     */
    _lineDrawPart : function(context, from, to, self){

        for( var i = 0; i < this._drawFunc.length; i++ ){
            this._drawFunc[i](context, from, to);
        }

    },

    _getDrawFunc           : function(){

        var drawFunc = [];

        /** @var arc scArc */
        var arc = this._arc;

        /** temporal */
        if(arc.isTemporal() && arc.isVariable()){
            drawFunc.push(scgDrawFunction.dashVarLine);
        }
        if(arc.isTemporal() && !arc.isVariable()){
            drawFunc.push(scgDrawFunction.dashLine);
        }

        /** variable */
        if(arc.isVariable() && !arc.isTemporal() && !arc.isUndefined(2,3)){
            drawFunc.push(scgDrawFunction.varLine);
        }

        /** negative */
        if(arc.isNegative()){
            drawFunc.push(scgDrawFunction.negLine);
        }
        if(arc.isFuzzy()){
            drawFunc.push(scgDrawFunction.fuzLine);
        }

        switch(arc.type){

            case (sc_type_edge_common | sc_type_const):
            case (sc_type_arc_common | sc_type_const ):
                drawFunc.push(scgDrawFunction.undefinedConstPairLine);
                return drawFunc;
            case (sc_type_edge_common | sc_type_var):
            case (sc_type_arc_common | sc_type_var ):
                drawFunc.push(scgDrawFunction.undefinedVarPairLine);
                return drawFunc;
            case sc_type_edge_common:
            case sc_type_arc_common:
                drawFunc.push(scgDrawFunction.undefinedPairLine);
                return drawFunc;
            case sc_type_arc_access:
                drawFunc.push(scgDrawFunction.simpleAccessoryLine);
                return drawFunc;
        }

        if(!arc.isVariable() && !arc.isTemporal()){
            drawFunc.push(scgDrawFunction.simpleLine);
        }

        return drawFunc;

    },


    _prepareArrowPosition  : function(){

        var line = this._arc._getLastLine();
        var end     = line.begin;
        var begin   = line.end;

        var dx = begin.x - end.x ;
        var dy = begin.y - end.y ;
        var betta = Math.atan( dy / dx );
        if(dx == 0){
            betta += Math.PI;
        }


        var signX = dx > 0 ? 1 : -1;
        var signY = dy > 0 ? 1 : -1;

        var deltaX = Math.cos(betta) *  signX;
        var deltaY = Math.sin(betta) *  signX;

        var beginIndent = scgConfig.Arc.nodeIndent + 8;

        var position = {
            x : begin.x - deltaX * beginIndent,
            y : begin.y - deltaY * beginIndent
        };

        return {
            begin   : position,
            end     : end
        };


    },

    _prepareLinePoints      : function(){

        var points = this._arc._getPoints();
        var firstLine = this._arc._getFirstLine();
        var lastLine = this._arc._getLastLine();

        var newBeg = this._prepareLinePositions(firstLine.begin, firstLine.end).end;
        var newEnd = this._prepareLinePositions(lastLine.begin, lastLine.end).begin;

        points[0] = newBeg;
        points[points.length-1] = newEnd;
        return points;

    },

    /*
    * Prepare arc begin and end for drawing
    *
    * */
    _prepareLinePositions    : function(end, begin){

        var dx = begin.x - end.x ;
        var dy = begin.y - end.y ;
        var betta = Math.atan( dy / dx );
        if(dx == 0){
            betta += Math.PI;
        }

        var signX = dx > 0 ? 1 : -1;
        var signY = dy > 0 ? 1 : -1;

        var deltaX = Math.cos(betta) *  signX;
        var deltaY = Math.sin(betta) *  signX;

        var beginIndent, endIndent;
        beginIndent = scgConfig.Arc.nodeIndent;
        endIndent = scgConfig.Arc.nodeIndent;

        if( this._arc.isOriented() ){
            beginIndent += 10;
        }

        var newBegin = {
            x : begin.x - deltaX * beginIndent,
            y : begin.y - deltaY * beginIndent
        };

        var newEnd = {
            x : end.x + deltaX * endIndent,
            y : end.y + deltaY * endIndent
        };

        return {
            begin : newBegin,
            end : newEnd
        };

    },

    _drawBreaks : function(){

        var  breaks = this._arc._breaks;
        this._breaks = this._breaks || {};

        for( var i = 0; i < breaks.length; i++){

            if( this._breaks[i] ){

                this._breaks[i].setPosition(breaks[i]);

            } else {

                var _newBreak = this._getBreak(breaks[i]);
                this._layer.add(_newBreak);
                this._breaks[i] = _newBreak;

            }
        }
    },

    _getBreak   : function(pos){

        var config = this._defaultBreakConfig;
        config.x = pos.x;
        config.y = pos.y;
        var _break = new Kinetic.Circle(config);

        var self = this;
        _break.on("dragmove", function(){

            var position = this.getPosition();
            pos.x = position.x;
            pos.y = position.y;
            self.getRenderer().reDraw();

        });

        _break.on("mouseover", function(){

            this.setFill("orange");
            self._layer.draw();

        });

        _break.on("mouseout", function(){

            this.setFill(config.fill);
            self._layer.draw()

        });

        return _break;

    },

    _getArrow   : function(beginPos, endPos){

        if( !this._arrow ){
            this._arrow = new Kinetic.Polygon(this.__defaultArrowConfig);
        }
        this._arrow.setPosition(beginPos);
        var dx = beginPos.x - endPos.x ;
        var dy = beginPos.y - endPos.y ;
        var betta = Math.atan2( dy, dx ) - Math.PI/2;


        if(betta){
            this._arrow.setAttrs({
                rotation: betta
            });
        }

        return this._arrow;
    },

    __defaultArrowConfig : {
        strokeWidth: 1,
        stroke: 'black',
        fill : 'black',
        lineCap: 'butt',
        points: [-3,-2, 3,-2, 0,6],
        rotate  : 0
    },

    _defaultBreakConfig : {
        x: 100,
        y: 100,
        radius: 5,
        stroke: '#666',
        fill: '#ddd',
        strokeWidth: 1,
        draggable : true
    },

    __defaultLineConfig : {
        strokeWidth: 2,
        stroke: 'black',
        lineCap: 'butt',
        points  : [0,0,1,1],
        lineJoin : 'round',
        detectionType : 'pixel'
    }

};

/**
 * scg draw functions for arc types
 * @type {Object}
 */
var scgDrawFunction  = {

    simpleLine  : function(context, from, to){

        context.lineWidth = 2;
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);

    },

    dashLine    : function(context, from ,to){

        var angle = Math.atan2( from.y - to.y, from.x - to.x) + Math.PI;
        context.translate(from.x, from.y);
        context.rotate(angle);


        context.lineWidth = 2;


        var offset  = scgConfig.Arc.DASH_VERT_OFFSET;

        var lineLength = scgHelper.getHypotenuse(from, to);

        var dashHorNum = Math.floor( lineLength / scgConfig.Arc.DASH_HOR_OFFSET );

        for( var i = 0; i < dashHorNum; i++){
            if(i%2){
                context.lineTo(i * scgConfig.Arc.DASH_HOR_OFFSET, 0);
            } else {
                context.moveTo(i * scgConfig.Arc.DASH_HOR_OFFSET, 0);
            }
        }


        context.rotate(-angle);
        context.translate(-from.x, -from.y);

    },

    dashVarLine : function(context, from, to){

        var angle = Math.atan2( from.y - to.y, from.x - to.x) + Math.PI;
        context.translate(from.x, from.y);
        context.rotate(angle);

        context.lineWidth = 2;
        var lineLength = scgHelper.getHypotenuse(from, to);

        var lastX = -3;
        for( var i = 1; lastX < lineLength; i++){
            if(i%2){
                context.moveTo(lastX += 8, 0);
            } else {
                for(var j = 0; j < 4; j++){
                    context.lineTo(lastX += 2,0);
                    context.moveTo(lastX += 2,0);
                }
            }
        }


        context.rotate(-angle);
        context.translate(-from.x, -from.y);

    },

    negLine     : function(context, from, to){

        var angle = Math.atan2( from.y - to.y, from.x - to.x) + Math.PI;
        context.translate(from.x, from.y);
        context.rotate(angle);

        context.lineWidth = width;

        var offset  = scgConfig.Arc.DASH_VERT_OFFSET;
        var width   = scgConfig.Arc.DASH_VERT_WIDTH;

        var lineLength = scgHelper.getHypotenuse(from, to);
        var dashNum = Math.floor( lineLength / offset );

        for( var i = 1; i <= dashNum; i++ ){
            var isUp = i%2;
            context.moveTo(i * offset, width/2);
            context.lineTo(i * offset, -width/2);
        }

        context.rotate(-angle);
        context.translate(-from.x, -from.y);

    },

    fuzLine     : function(context, from, to){

        var angle = Math.atan2( from.y - to.y, from.x - to.x) + Math.PI;
        context.translate(from.x, from.y);
        context.rotate(angle);

        context.lineWidth = width;

        var offset  = scgConfig.Arc.DASH_VERT_OFFSET;
        var width   = scgConfig.Arc.DASH_VERT_WIDTH;

        var lineLength = scgHelper.getHypotenuse(from, to);
        var dashNum = Math.floor( lineLength / offset );

        for( var i = 1; i <= dashNum; i++ ){
            var isUp = i%2;
            context.moveTo(i * offset, isUp * width/2);
            context.lineTo(i * offset, (isUp - 1) * width/2);
        }

        context.rotate(-angle);
        context.translate(-from.x, -from.y);

    },

    varLine     : function(context, from, to){

        var angle = Math.atan2( from.y - to.y, from.x - to.x) + Math.PI;
        context.translate(from.x, from.y);
        context.rotate(angle);

        var offset  = scgConfig.Arc.DASH_VERT_OFFSET;
        var width   = scgConfig.Arc.DASH_VERT_WIDTH;

        var lineLength = scgHelper.getHypotenuse(from, to);

        var lastX = -5;
        for( var i = 1; lastX < lineLength; i++){
            if(i%2){
                context.moveTo(lastX += 10, 0);
            } else {
                var dx = Math.min(lineLength - lastX, 14);
                context.lineTo(lastX += dx, 0);
            }
        }

        context.rotate(-angle);
        context.translate(-from.x, -from.y);

    },

    simpleAccessoryLine : function(context, from, to){

        context.stroke();
        context.beginPath();

        var angle = Math.atan2( from.y - to.y, from.x - to.x) + Math.PI;
        context.translate(from.x, from.y);
        context.rotate(angle);

        context.lineWidth = 4;

        var lineLength = scgHelper.getHypotenuse(from, to);

        var lastX = -5;
        for( var i = 1; lastX < lineLength; i++){
            if(i%2){
                context.moveTo(lastX += 10, 0);
            } else {
                var dx = Math.min(lineLength - lastX, 4);
                context.lineTo(lastX += dx, 0);
            }
        }

        context.rotate(-angle);
        context.translate(-from.x, -from.y);

        context.stroke();

    },

    undefinedPairLine : function(context, from, to){

        context.lineWidth = 6;
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();

        context.strokeStyle = '#ffffff';
        context.beginPath();
        context.lineWidth = 4;
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.strokeStyle = '#000';

        context.beginPath();
        var angle = Math.atan2( from.y - to.y, from.x - to.x) + Math.PI;
        context.translate(from.x, from.y);
        context.rotate(angle);
        context.strokeWidth = 1;
        context.lineWidth = 1;

        var lineLength = scgHelper.getHypotenuse(from, to);
        var lastX = -5;
        for( var i = 1; lastX < lineLength; i++){
            if(i%2){
                context.moveTo(lastX += 10, 0);
            } else {
                var dx = Math.min(lineLength - lastX, 14);
                context.lineTo(lastX += dx, 0);
            }
        }

        context.rotate(-angle);
        context.translate(-from.x, -from.y);

    },

    undefinedConstPairLine : function(context, from, to){

        context.lineWidth = 6;
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();

        context.strokeStyle = '#ffffff';
        context.beginPath();
        context.lineWidth = 4;
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.strokeStyle = '#000';

        context.beginPath();
    },

    undefinedVarPairLine : function(context, from, to){

        context.lineWidth = 6;
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();

        context.strokeStyle = '#ffffff';
        context.beginPath();
        context.lineWidth = 4;

        var angle = Math.atan2( from.y - to.y, from.x - to.x) + Math.PI;
        context.translate(from.x, from.y);
        context.rotate(angle);

        var lineLength = scgHelper.getHypotenuse(from, to);
        var lastX = -5;
        for( var i = 1; lastX < lineLength; i++){
            if(i%2){
                context.moveTo(lastX += 10, 0);
            } else {
                var dx = Math.min(lineLength - lastX, 14);
                context.lineTo(lastX += dx, 0);
            }
        }


        context.rotate(-angle);
        context.translate(-from.x, -from.y);
        context.stroke();
        context.beginPath();
        context.strokeStyle = '#000';
    }

};

/**
 * scg Config object
 * @type {Object}
 */
var scgConfig = {};

/**
 * Arc configs
 * @type {Object}
 */
scgConfig.Arc = {

    nodeIndent : 20,

    DASH_VERT_OFFSET : 24,
    DASH_VERT_WIDTH  : 10,

    DASH_HOR_OFFSET : 2

};

/**
 * Node configs
 * @type {Object}
 */
scgConfig.Node = {


};

/**
 * Scg Graph
 */


/**
 * scg Helper methods
 * @type {Object}
 */
var scgHelper = {

    /**
     * Get hypotenuse by two cathetuses
     * @param a first cathetus length
     * @param b second cathetus length
     * @return {Number} hypothenuse length
     */
    getHypotenuse   : function(a, b){

        var modX = Math.abs(a.x - b.x);
        var modY = Math.abs(a.y - b.y);
        var max = Math.max( modX, modY );
        var min = Math.min(modX, modY);
        var r = min / max;
        return max * Math.sqrt(1 + r*r);

    }

}


/**
 * Scg render for KineticJs Library
 * @param config
 */
var scgKineticRenderer = function( config ){

    this._initScgKineticRenderer( config );

};

// Static properies

scgKineticRenderer._renderers = [];

/**
 *
 * @param typeStr
 * @param renderer
 * @return {Function}
 */
scgKineticRenderer.registerTypeRenderer = function( typeStr, renderer ){

    scgKineticRenderer._renderers[ typeStr ] = renderer;
    return scgKineticRenderer;

};

/**
 * Get renderer class by type
 * @param typeStr string
 * @return {Function} Renderer
 */
scgKineticRenderer.getTypeRenderer  = function( type ){

    var elemType = (type & sc_type_element_mask);

    // Arc renderer
    //@TODO refactor with bit check
    if( elemType == sc_type_arc_common || elemType == sc_type_arc_access || elemType == sc_type_edge_common  ){
        return scgArc;
    }

    // Node renderer
    if( elemType == sc_type_node ){

        if( ( type & sc_type_constancy_mask ) == sc_type_const ){
            return scgNodeConst;
        }
        if( ( type & sc_type_constancy_mask ) == sc_type_var ){
            return scgNodeVar;
        }

    }

    throw new Error("Undefined type of renderer " + type);
};


// methods

scgKineticRenderer.prototype = {

    _initScgKineticRenderer : function( config ){

        // properties
        this._graph     = config.graph;
        this._container = config.container;
        this._arcs = [];
        this._nodes = [];

        this._initProperties(config);

        // init
        var stage = this._getStage();

        this._layerNodes = new Kinetic.Layer();
        this._layerArcs = this._layerNodes;//new Kinetic.Layer();
        stage.add( this._layerArcs );
        stage.add( this._layerNodes );

    },

    _initProperties         : function(config){

        for ( var prop in config ){
            if( !( prop in this ) )
                this[ "_" + prop ] = config[prop];
        }

    },

    _getStage    : function(){

        if( !this._stage ){
            this._stage = new Kinetic.Stage({
                container   : this._container,
                width       : this._width,
                height      : this._height
            });
        }

        return this._stage;

    },


    setGraph    : function( graph ){
        this._graph = graph;
    },

    getGraph    : function(){
        return this._graph;
    },

    reDraw      : function(){

        for( var id in this._arcs ){
            this._arcs[id].reDraw();
        }

        for( var id in this._nodes){
            this._nodes[id].reDraw();
        }

    },

    render      : function(){

        this._renderNodes();
        this._renderArcs();

        this._layerNodes.draw();
        this._layerArcs.draw();

    },

    _renderArcs : function(){

        var arcs = this._graph.arcs;

        for( var id in arcs ){
            var renderClass = scgKineticRenderer.getTypeRenderer( arcs[id].type );
            var arc = new renderClass( this._layerArcs, arcs[id], this );
            this._arcs.push(arc);
        }

    },

    _renderNodes    : function(){

        var nodes = this._graph.nodes;

        for( var id in nodes ){
            var renderClass = scgKineticRenderer.getTypeRenderer( nodes[id].type );
            var node = new renderClass( this._layerNodes, nodes[id], this );
            this._nodes.push(node);
        }

    }
};

/**
 * Scg Node constuctor
 * @param layer for draw
 * @param node sc-node model
 */
var scgNode = function(layer, node, renderer){

    this._initNode(layer, node, renderer);

};

scgNode.prototype = {

    _initNode   : function(layer, node, renderer){

        // properties
        this.id     = 0;
        this.layer  = layer;
        this.node   = node;

        this.idfDrawObj = null;

        this.color  = '#000';

        this._renderer = renderer;

        this.draw();
        this.reDraw();

    },

    getRenderer : function(){
        return this._renderer;
    },

    setColor    : function(color){
        this.color = color;
    },

    draw        : function(){
        this.layer.add( this._getIdf() );
        this._draw();
        return this;
    },

    reDraw      : function(){
        var position = this.node.getPosition();
        this._getIdf().setPosition(position.x + 10, position.y + 10);
        this._reDraw();
        return this;
    },

    _getIdf : function(){

        if(this.idfDrawObj != null){
            this.idfDrawObj.setText(this.node.idf);
            return this.idfDrawObj;
        };

        this._defaultIdfConfig.text = this.node.idf;
        this.idfDrawObj = new Kinetic.Text(this._defaultIdfConfig);

        return this.idfDrawObj;
    },

    _defaultIdfConfig   : {
        x   : 110,
        y   : 110,
        text    : '',
        textFill  : "gray"
    }

};

/*
 * node/const/
 */
var scgNodeConst = function(layer, node, renderer){

    this._initNodeConst(layer, node, renderer);

};

scgNodeConst.prototype = {

    _initNodeConst   : function( layer, node, renderer ){

        this._circle = null;
        this._bg = null;
        this._initNode(layer, node, renderer);
    },


    _draw    : function(){
        this.layer.add( this._getBg() );
        this.layer.add( this._getCircle() );
        return this;
    },

    _reDraw  : function(){
        var position = this.node.getPosition();
        this._getBg().setPosition(position);
        this._getCircle().setPosition(position);
        return this;
    },

    _getCircle  : function(){

        if(this._circle == null){
            this._circle = new Kinetic.Circle(this._defaultCircleConfig);

            this._circle.setPosition( this.node.getPosition() );

            var self = this;
            this._circle.on("dragmove",function(){
                self.node.setPosition( this.getPosition() );
                self.getRenderer().reDraw();
            });

            this._circle.on("mouseover",function(){
                self.setColor('#f0f');
                self.getRenderer().reDraw();
            });

            this._circle.on("mouseout",function(){
                self.setColor('#000');
                self.getRenderer().reDraw();
            });

            this._circle.on("click", function(){
                if(SCWeb.core.utils.Keyboard.ctrl){
                    SCgComponent.addArgument(self.node.id);
                }
            });

        };

        this._circle.setStroke(this.color);

        return this._circle;
    },

    _getBg      : function(){

        if(this._bg == null){
            this._bg = new Kinetic.Shape();
            var self = this;
            this._bg.setDrawFunc(function(context){
                self._bgDrawFunc.call(this, context, self);
            });
        }

        return this._bg;
    },

    _bgDrawFunc     : function(context, self){
        var drawFunc = scgNodeConst.drawFunc[self.node.getStructType()];
        context.strokeStyle = self.color;
        context.fillStyle = self.color;
        drawFunc.call(this, context);
    },

    _defaultCircleConfig : {
        x: 100,
        y: 100,
        radius: 9,
        stroke: '#000',
        strokeWidth: 4,
        draggable : true
    }

};

Kinetic.Global.extend(scgNodeConst,scgNode);

scgNodeConst.drawFunc = {

    "general"   : function(context){

    },

    "relation"  : function(context){
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(-7,-7);
        context.lineTo(7,7)
        context.moveTo(7,-7);
        context.lineTo(-7,7);
        context.stroke();
    },

    "role"      : function(context){
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(0,-7);
        context.lineTo(0,7);
        context.moveTo(-7,0);
        context.lineTo(7,0);
        context.stroke();
    },

    "group"      : function(context){
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(-7,-7);
        context.lineTo(7,7)
        context.moveTo(7,-7);
        context.lineTo(-7,7);
        context.moveTo(-7,0);
        context.lineTo(7,0);
        context.stroke();
    },

    "tuple"      : function(context){
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(-7,0);
        context.lineTo(7,0);
        context.stroke();
    },

    "abstract"      : function(context){
        context.beginPath();
        context.lineWidth = 1;

        for(var i = -6; i < 7; i += 3){
            context.moveTo(-7,i);
            context.lineTo(7,i);
        }

        context.stroke();
    },

    "struct"        : function(context){
        context.beginPath();
        context.arc(0, 0, 2, 0 , 2 * Math.PI, false);
        context.fill();
    },

    "material"      : function(context){
        context.beginPath();
        context.rotate(-Math.PI/4);

        for(var i = -6; i < 7; i += 3){
            context.moveTo(-7,i);
            context.lineTo(7,i);
        }

        context.rotate(Math.PI/4);
        context.stroke();
    }


}


/*
 * node/var/
 */
var scgNodeVar = function(layer, node, renderer){

    this._initNodeVar(layer, node, renderer);

};

scgNodeVar.prototype = {

    _initNodeVar   : function( layer, node, renderer ){

        this._rect = null;
        this._bg = null;
        this._initNode(layer, node, renderer);
    },


    _draw    : function(){
        this.layer.add( this._getBg() )
        this.layer.add( this._getRect() );
        return this;
    },

    _reDraw  : function(){
        var position = this.node.getPosition();
        this._getBg().setPosition(position);
        this._getRect().setPosition(position);
        return this;
    },

    _getRect    : function(){

        if(this._rect == null){
            this._rect = new Kinetic.Rect(this._defaultRectConfig);

            this._rect.setPosition( this.node.getPosition().x, this.node.getPosition());

            var self = this;
            this._rect.on("dragmove",function(){
                self.node.setPosition( this.getPosition() );
                self.getRenderer().reDraw();
            });

            this._rect.on("mouseover",function(){
                self.node.isActive = true;
            });

            this._rect.on("mouseout",function(){
                self.node.isActive = false;
            });

            this._rect.on("click", function(){
                if(SCWeb.core.utils.Keyboard.ctrl){
                    SCgComponent.addArgument(self.node.id);
                }
            });

        };

        this._rect.setStroke(this.color);
        return this._rect;
    },

    _getBg      : function(){

        if(this._bg == null){
            this._bg = new Kinetic.Shape();
            var self = this;
            this._bg.setDrawFunc(function(context){
                self._bgDrawFunc.call(this, context, self);
            });
        }
        return this._bg;
    },

    _bgDrawFunc     : function(context, self){
        var drawFunc = scgNodeVar.drawFunc[self.node.getStructType()];
        context.strokeStyle = self.color;
        context.fillStyle = self.color;
        drawFunc.call(this, context);
    },


    _defaultRectConfig : {
        x: 100,
        y: 100,
        width: 14,
        height: 14,
        offset : { x: 7, y : 7},
        stroke: '#000',
        strokeWidth: 4,
        draggable : true
    }

};

scgNodeVar.drawFunc = {

    "general"   : function(context){

    },

    "relation"  : function(context){
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(-7,-7);
        context.lineTo(7,7)
        context.moveTo(7,-7);
        context.lineTo(-7,7);
        context.stroke();
    },

    "role"      : function(context){
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(0,-7);
        context.lineTo(0,7);
        context.moveTo(-7,0);
        context.lineTo(7,0);
        context.stroke();
    },

    "group"      : function(context){
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(-7,-7);
        context.lineTo(7,7)
        context.moveTo(7,-7);
        context.lineTo(-7,7);
        context.moveTo(-7,0);
        context.lineTo(7,0);
        context.stroke();
    },

    "tuple"      : function(context){
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(-7,0);
        context.lineTo(7,0);
        context.stroke();
    },

    "abstract"      : function(context){
        context.beginPath();
        context.lineWidth = 1;

        for(var i = -6; i < 7; i += 3){
            context.moveTo(-7,i);
            context.lineTo(7,i);
        }

        context.stroke();
    },

    "struct"        : function(context){
        context.beginPath();
        context.arc(0, 0, 2, 0 , 2 * Math.PI, false);
        context.fill();
    },

    "material"      : function(context){
        context.beginPath();
        context.rotate(-Math.PI/4);

        for(var i = -6; i < 7; i += 3){
            context.moveTo(-6,i);
            context.lineTo(6,i);
        }

        context.rotate(Math.PI/4);
        context.stroke();
    }

};

Kinetic.Global.extend(scgNodeVar,scgNode);

