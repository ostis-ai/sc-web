/**
 * Created with JetBrains WebStorm.
 * User: zsc
 * Date: 09.10.12
 * Time: 20:33
 * To change this template use File | Settings | File Templates.
 */


var scgNode = function(layer, node){
    this._initNode(layer, node);

};

scgNode.prototype = {

    _initNode   : function(layer, node){

        // properties
        this.id     = 0;
        this.idf    = "Node 1";
        this.layer  = layer;
        this.node   = node;

        this._draw();
        this.reDraw();

    }

}


/*
 * node/const/general_node
 *
 *
 * */

var scgNodeConstGeneral = function(layer, node){

    this._initNodeConstGeneral(layer, node);

};

scgNodeConstGeneral.prototype = {

    _initNodeConstGeneral   : function( layer, node ){

        this._circle = null;
        this._idf = null;
        scgNode.call( this, layer, node );
    },


    _draw    : function(){

        this.layer.add( this._getIdf() );
        this.layer.add( this._getCircle() );
        return this;

    },

    reDraw  : function(){

        var position = this.node.getPosition();
        this._getCircle().setPosition(position);
        this._getIdf().setPosition(position.x + 10, position.y + 10);


    },

    _getIdf : function(){


        if(this._idf != null){
            return this._idf;
        };

        this._defaultIdfConfig.text = this.node.idf;
        this._idf = new Kinetic.Text(this._defaultIdfConfig);

        return this._idf;

    },

    _getCircle  : function(){

        if(this._circle != null){
            return this._circle;
        };

        this._circle = new Kinetic.Circle(this._defaultCircleConfig);

        this._circle.setPosition( this.node.getPosition() );

        var self = this;
        this._circle.on("dragmove",function(){
            self.node.setPosition( this.getPosition() );
            window.renderer.reDraw();
        });

        this._circle.on("mouseover",function(){
            this.setStroke("orange");
            window.renderer.reDraw();
        });

        this._circle.on("mouseout",function(){
            this.setStroke("#000");
            window.renderer.reDraw();
        });

        return this._circle;
    },

    _defaultIdfConfig   : {
        x   : 110,
        y   : 110,
        text    : '',
        textFill  : "blue"
    },

    _defaultCircleConfig : {
        x: 100,
        y: 100,
        radius: 9,
        stroke: '#000',
        fill: '#eee',
        strokeWidth: 4,
        draggable : true
    }



}

Kinetic.Global.extend(scgNodeConstGeneral,scgNode);
scgKineticRenderer.registerTypeRenderer("node/const/general_node", scgNodeConstGeneral);
