


var scNode = function(config){

    this._initScNode(config);

};


scNode.prototype = {

    _initScNode     : function( config ){

        this.id     = config.id;
        this.type   = config.type;
        this._incidentArcs = config._incidentArcs || {};

        this._position   = config.position || {};
        this.color      = config.color;

        this.idf = config.idf || "Empty";

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
    }


};


