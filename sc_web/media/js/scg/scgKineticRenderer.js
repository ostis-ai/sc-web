/**
 * Created with JetBrains WebStorm.
 * User: zsc
 * Date: 09.12.12
 * Time: 14:19
 * To change this template use File | Settings | File Templates.
 */



// constructor

var scgKineticRenderer = function( config ){

    this._initScgKineticRenderer( config );

};

// static

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
scgKineticRenderer.getTypeRenderer  = function( typeStr ){

    if( scgKineticRenderer._renderers[ typeStr ] ){
        return scgKineticRenderer._renderers[ typeStr ];
    }
    throw new Error("Undefined type of renderer" + typeStr);

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

       //this._layerArcs.draw();
        //this._layerNodes.draw();


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
            var arc = new renderClass( this._layerArcs, arcs[id] );
            this._arcs.push(arc);
        }

    },

    _renderNodes    : function(){

        var nodes = this._graph.nodes;

        for( var id in nodes ){
            var renderClass = scgKineticRenderer.getTypeRenderer( nodes[id].type );
            var node = new renderClass( this._layerNodes, nodes[id] );
            this._nodes.push(node);
        }

    }
}