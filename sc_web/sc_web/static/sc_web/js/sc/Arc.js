



var scArc = function( beginNode, endNode, config ){

    this._initScArc(beginNode, endNode, config);

};

scArc.prototype = {

    _initScArc  : function( beginNode, endNode, config ){

        this.id     = config.id;
        this.type   = config.type;

        this.isArc = true;

        this._beginNode  = beginNode;
        this._beginNodePos = config.beginPos;
        this._endNode    = endNode;
        this._endNodePos = config.endPos;

        this._incidentArcs = [];

        this._breaks = config.breaks || [];

        this._isOriented = true;

        this.color  = config.color;


        this._beginNode.addIncidentArc(this);
        this._endNode.addIncidentArc(this);



    },

    isOriented  : function(){

        return !!this._isOriented;

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

    }


};