/**
 * Created with JetBrains WebStorm.
 * User: zsc
 * Date: 09.10.12
 * Time: 20:33
 * To change this template use File | Settings | File Templates.
 */


var scgArc = function( layer, arc ){

    this._initArc( layer, arc );

}


scgArc.prototype = {

    /*
    * init sc-arc
    * */
    _initArc   : function( layer, arc ){

        this._arc   = arc;
        this._layer = layer;

        this.draw();

    },

    draw    : function(){

        this._draw();

        if( this._arc.isOriented() ){
            var arrowPos = this._prepareArrowPosition();
            var arrow = this._getArrow(arrowPos.begin, arrowPos.end);
            this._layer.add(arrow);
        }

        this._drawBreaks();
    },

    reDraw  : function(){

        this._reDraw();

        if( this._arc.isOriented() ){
            var arrowPos = this._prepareArrowPosition();
            this._getArrow(arrowPos.begin, arrowPos.end);
        }

        this._drawBreaks();

    },


    _prepareArrowPosition  : function(){

        var line = this._arc._getLastLine();
        var end     = line.begin;
        var begin   = line.end;

        var dx = begin.x - end.x ;
        var dy = begin.y - end.y ;
        var betta = Math.atan( dy / dx );

        var signX = dx > 0 ? 1 : -1;
        var signY = dy > 0 ? 1 : -1;

        var deltaX = Math.cos(betta) *  signX;
        var deltaY = Math.sin(betta) *  signX;

        var beginIndent = scgConfig.Arc.nodeIndent;

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
            window.renderer.reDraw();

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
        var betta = Math.atan( dy / dx );

        if( dx > 0){
            betta += Math.PI;
        }

        if(betta){
            this._arrow.setAttrs({
                rotation: betta
            });
        }

        return this._arrow;
    },

    __defaultArrowConfig : {
        strokeWidth: 2,
        stroke: 'black',
        fill : 'black',
        lineCap: 'square',
        points: [10,-3,10,3,0,0],
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
    }

};


/*
 * arc/const/pos
 *
 * */

var scgArcConstPos  = function( layer, arc ){

    this._initArcConstPos( layer, arc );

};


scgArcConstPos.prototype = {

    _initArcConstPos    : function( layer, arc ){

        this._arrow = null;
        this._line = null;

        scgArc.call(this, layer, arc);
    },

    _draw    : function(){

        var points = this._prepareLinePoints();

        this._layer.add(this._getLine(points ));

        return this;

    },

    _reDraw  : function(){

        var points = this._prepareLinePoints();
        this._getLine(points);

        return this;
    },

    _getLine    : function(points){

        if( this._line == null ){
            this._line = new Kinetic.Line(this.__defaultLineConfig);
        }

        this._line.setPoints(points);

        return this._line;
    },

    __defaultLineConfig : {
        strokeWidth: 2,
        stroke: 'black',
        id: 'quadLine',
        lineCap: 'square',
        points  : [0,0,1,1],
        lineJoin : 'round'
    }


};


Kinetic.Global.extend(scgArcConstPos,scgArc);
scgKineticRenderer.registerTypeRenderer('arc/const/pos', scgArcConstPos);




/*
 * arc/pair/var
 *
 * */

var scgArcPairVar = function( layer, arc ){
    this._initArcPairVar( layer, arc );
};


scgArcPairVar.prototype = {

    _initArcPairVar    : function( layer, arc ){

        // properties (graphic parts)
        this._lineDashed = null;
        this._lineBorder = null;

        // parent constructor
        scgArc.call(this, layer, arc );
    },

    /*
     * draw method
     *
     * */
    _draw    : function(){

        var points = this._prepareLinePoints();

        this._layer.add(this._getBorderLine(points));
        this._layer.add(this._getDashedLine(points));

        return this;

    },

    _reDraw  : function(){

        var points = this._prepareLinePoints();
        this._getBorderLine(points);
        this._getDashedLine(points);

        return this;
    },

    _getDashedLine   : function(points){

        if(this._lineDashed == null){
            this._lineDashed = new Kinetic.Line(this.__defaultDashedLineConfig);
        }
        this._lineDashed.setPoints(points);
        return this._lineDashed;
    },

    _getBorderLine   : function(points){

        if(this._lineBorder == null){
            this._lineBorder = new Kinetic.Line(this.__defaultBorderLineConfig);
        }
        this._lineBorder.setPoints(points);
        return this._lineBorder;
    },

    __defaultDashedLineConfig   : {
        dashArray: [8*2,8*4],
        strokeWidth: 8 - 2,
        stroke: 'white',
        id: 'quadLine',
        lineCap: 'square',
        points: [0,0,1,1],
        lineJoin : 'round'
    },

    __defaultBorderLineConfig : {
        strokeWidth: 8,
        stroke: 'black',
        id: 'quadLine',
        points  : [0,0,1,1],
        lineJoin : 'round'
    }


};


Kinetic.Global.extend(scgArcPairVar,scgArc);
scgKineticRenderer.registerTypeRenderer('arc/pair/var', scgArcPairVar);




/*
 * arc/const/have
 *
 * */

var scgArcConstHave = function( layer, arc ){
    this._initArcConstHave( layer, arc );
};


scgArcConstHave.prototype = {

    _initArcConstHave    : function( layer, arc ){

        // properties (graphic parts)
        this._lineDashed = null;
        this._lineCenter = null;

        // parent constructor
        scgArc.call(this, layer, arc );
    },

    /*
     * draw method
     *
     * */
    _draw    : function(){

        var points = this._prepareLinePoints();

        this._layer.add(this._getCenterLine(points));
        this._layer.add(this._getDashedLine(points));

        return this;

    },

    _reDraw  : function(){

        var points = this._prepareLinePoints();

        this._getCenterLine(points);
        this._getDashedLine(points);

        return this;
    },

    _getDashedLine   : function(points){

        if(this._lineDashed == null){
            this._lineDashed = new Kinetic.Line(this.__defaultDashedLineConfig);
        }
        this._lineDashed.setPoints(points);
        return this._lineDashed;
    },

    _getCenterLine   : function(points){

        if(this._lineCenter == null){
            this._lineCenter = new Kinetic.Line(this.__defaultCenterLineConfig);
        }
        this._lineCenter.setPoints(points);
        return this._lineCenter;
    },

    __defaultDashedLineConfig   : {
        dashArray: [8/8,8*4],
        strokeWidth: 2,
        stroke: 'black',
        id: 'quadLine',
        lineCap: 'square',
        lineJoin : 'round'
    },

    __defaultCenterLineConfig : {
        strokeWidth: 1,
        stroke: 'black',
        id: 'quadLine',
        lineCap: 'square',
        lineJoin : 'round'
    }


}


Kinetic.Global.extend(scgArcConstHave,scgArc);
scgKineticRenderer.registerTypeRenderer('arc/const/have', scgArcConstHave);
