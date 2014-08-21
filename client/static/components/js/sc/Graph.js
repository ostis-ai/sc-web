



var scGraph = function(){

    this._initScGraph();

};


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