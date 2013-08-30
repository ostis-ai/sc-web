/* --- scg.js --- */
var SCg = SCg || { version: "0.1.0" };

SCg.Viewer = function() {

	this.render = null;
	this.scene = null;
};

SCg.Viewer.prototype = {


	init: function(params)
	{
		this.render = new SCg.Render();
		this.scene = new SCg.Scene( {render: this.render } );
		this.scene.init();
		
		this.render.scene = this.scene;
		this.render.init(params);
	}
	
};

/* --- scg-math.js --- */
SCg.Vector2 = function(x, y) {
	this.x = x;
	this.y = y;
};

SCg.Vector2.prototype = {
	constructor: SCg.Vector2
};


// --------------------
SCg.Vector3 = function(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
};

SCg.Vector3.prototype = {
	constructor: SCg.Vector3,
	
	copyFrom: function(other) {
		this.x = other.x;
		this.y = other.y;
		this.z = other.z;
		
		return this;
	},
	
	sub: function(other) {
		this.x -= other.x;
		this.y -= other.y;
		this.z -= other.z;
		
		return this;
	},
	
	add: function(other) {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
		
		return this;
	},
	
	multiplyScalar: function(v) {
		this.x *= v;
		this.y *= v;
		this.z *= v;
		
		return this;
	},
	
	normalize: function() {
		var l = this.length();
		this.x /= l;
		this.y /= l;
		this.z /= l;
	},
	
	length: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}
};


/* --- scg-model.js --- */


/* --- scg-model-objects.js --- */
var SCgObjectState = {
    Normal: 0,
    Deleted: 1,
    Merged: 2,
    NewInMemory: 3
};

var ObjectId = 0;

/**
     * Initialize sc.g-object with specified options.
     * 
     * @param {Object} options
     * Initial options of object. There are possible options:
     * - observer - object, that observe this
     * - position - object position. SCg.Vector3 object
     * - scale - object size. SCg.Vector2 object.
     * - sc_type - object type. See sc-types for more info.
     * - text - text identifier of object
     */
SCg.ModelObject = function(options) {
    
    this.need_observer_sync = true;

    if (options.position) {
        this.position = options.position;
    }  else {
        this.position = new SCg.Vector3(0.0, 0.0, 0.0);
    }

    if (options.scale) {
        this.scale = options.scale;
    } else {
        this.scale = new SCg.Vector2(20.0, 20.0);
    }

    if (options.sc_type) {
        this.sc_type = options.sc_type;
    } else {
        this.sc_type = sc_type_node;
    }

    if (options.sc_addr) {
        this.sc_addr = options.sc_addr;
    } else {
        this.sc_addr = null;
    }
    
    if (options.text) {
        this.text = options.text;
    } else {
        this.text = null;
    }
    
    this.id = ObjectId++;

    this.edges = [];    // list of connected edges
    this.need_update = true;    // update flag
};

SCg.ModelObject.prototype = {

    constructor: SCg.ModelObject

};

/**
 * Setup new position of object
 * @param {SCg.Vector3} pos
 *      New position of object
 */
SCg.ModelObject.prototype.setPosition = function(pos) {
    this.position = pos;
    this.need_observer_sync = true;

    this.requestUpdate();
    this.notifyEdgesUpdate();
};

/**
 * Setup new scale of object
 * @param {SCg.Vector2} scale
 *      New scale of object
 */
SCg.ModelObject.prototype.setScale = function(scale) {
    this.scale = scale;
    this.need_observer_sync = true;

    this.requestUpdate();
    this.update();
};

/**
 * Notify all connected edges to sync
 */
SCg.ModelObject.prototype.notifyEdgesUpdate = function() {

    for (var i = 0; i < this.edges.length; i++) {
       this.edges[i].need_update = true;
    }

};

/** Function iterate all objects, that need to be updated recursively, and 
 * mark them for update.
 */
SCg.ModelObject.prototype.requestUpdate = function() {
    this.need_update = true;
    for (var i = 0; i < this.edges.length; ++i) {
        this.edges[i].requestUpdate();
    }
};

/** Updates object state.
 */
SCg.ModelObject.prototype.update = function() {

    this.need_update = false;
    this.need_observer_sync = true;

    for (var i = 0; i < this.edges.length; ++i) {
        var edge = this.edges[i];

        if (edge.need_update) {
            edge.update();
        }
    }
};

/*! Calculate connector position.
 * @param {SCg.Vector3} Position of other end of connector
 * @param {Float} Dot position on this object.
 * @returns Returns position of connection point (new instance of SCg.Vector3, that can be modified later)
 */
SCg.ModelObject.prototype.getConnectionPos = function(from, dotPos) {
    return new SCg.Vector3(this.position.x, this.position.y, this.position.z);
};


// -------------- node ---------

/**
 * Initialize sc.g-node object.
 * @param {Object} options
 *      Initial options of sc.g-node. It can include params from base object
 */
SCg.ModelNode = function(options) {

    SCg.ModelObject.call(this, options);

};

SCg.ModelNode.prototype = Object.create( SCg.ModelObject.prototype );

SCg.ModelNode.prototype.getConnectionPos = function(from, dotPos) {

    SCg.ModelObject.prototype.getConnectionPos.call(this, from, dotPos);

    var radius = this.scale.x;
    var center = this.position;
    
    var result = new SCg.Vector3(0, 0, 0);
    
    result.copyFrom(from).sub(center).normalize();
    result.multiplyScalar(radius).add(center);

    return result;
};


// --------------- arc -----------

/**
 * Initialize sc.g-arc(edge) object
 * @param {Object} options
 *      Initial opations of sc.g-arc. 
 */
SCg.ModelEdge = function(options) {
    
    SCg.ModelObject.call(this, options);

    this.source = null;
    this.target = null;

    if (options.source)
        this.source = options.source;
    if (options.target)
        this.target = options.target;

    this.source_pos = new SCg.Vector3(0, 0, 0); // the begin position of egde in world coordinates
    this.target_pos = new SCg.Vector3(0, 0, 0); // the end position of edge in world coordinates

    this.requestUpdate();
    this.update();
};

SCg.ModelEdge.prototype = Object.create( SCg.ModelObject.prototype );

/** 
 * Setup new begin object for sc.g-edge
 * @param {Object} scg_obj
 *      sc.g-object, that will be the begin of edge
 */
SCg.ModelEdge.prototype.setBegin = function(scg_obj) {
    
    this.source = scg_obj;

    this.need_observer_sync = true;
};

/**
 * Setup new end object for sc.g-edge
 * @param {Object} scg_obj
 *      sc.g-object, that will be the end of edge
 */
 SCg.ModelEdge.prototype.setEnd = function(scg_obj) {
    this.target = scg_obj;

    this.need_observer_sync = true;
 };

 SCg.ModelEdge.prototype.update = function() {
    SCg.ModelObject.prototype.update.call(this);

    // calculate begin and end positions
    this.source_pos = this.source.getConnectionPos(this.target.position, 0);
    this.target_pos = this.target.getConnectionPos(this.source.position, 0);

    this.position.copyFrom(this.target_pos).add(this.source_pos).multiplyScalar(0.5);
 };
 
 /*! Checks if this edge need to be drawen with arrow at the end
  */
 SCg.ModelEdge.prototype.hasArrow = function() {
    return this.sc_type & (sc_type_arc_common | sc_type_arc_access);
 };
 
 //---------------- contour ----------------
 /**
 * Initialize sc.g-arc(edge) object
 * @param {Object} options
 *      Initial opations of sc.g-arc. 
 */
SCg.ModelContour = function(options) {
    
    SCg.ModelObject.call(this, options);

    this.childs = [];
    this.verticies = [];
};

SCg.ModelContour.prototype = Object.create( SCg.ModelObject.prototype );

SCg.ModelContour.prototype.update = function() {

    // http://jsfiddle.net/NNwFa/44/
    
    var verts = [];
    var cx = 0;
    var cy = 0;
    for (var i = 0; i < this.childs.length; i++) {
        var pos = this.childs[i].position;
        verts.push([pos.x , pos.y]);
        
        cx += pos.x;
        cy += pos.y;
    }
    
    cx /= float(this.childs.length);
    cy /= float(this.childs.length);
    
    var cV = new SCg.Vector2(cx, cy);
    var pV = new SCg.Vector2(0, 0);
    
    for (var i = 0; i < this.verts.length; i++) {
        var pos = this.verts[i];
        
        
        cx += pos.x;
        cy += pos.y;
    }
    
    this.verticies = d3.geom.hull(verts);
};

/**
 * Append new child into contour
 * @param {SCg.ModelObject} child Child object to append
 */
SCg.ModelContour.prototype.addChild = function(child) {
    this.childs.push(child);
};

/**
 * Remove child from contour
 * @param {SCg.ModelObject} child Child object for remove
 */
 SCg.ModelContour.prototype.removeChild = function(child) {
    this.childs.remove(child);
 };
 


/* --- scg-alphabet.js --- */
var SCgAlphabet = {
    
    scType2Str: {},
    
    /**
     * Initialize all definitions, for svg drawer
     */
    initSvgDefs: function(defs) {
        
        this.initTypesMapping();
        
        defs.append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 8)
            .attr('markerWidth', 7)
            .attr('markerHeight', 10)
            .attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M0,-4L10,0L0,4')
            .attr('fill', '#000');
            
        // nodes
        //<circle id="scg.node.const.outer" cx="0" cy="0" r="10"/>
        defs.append('svg:circle')
            .attr('id', 'scg.node.const.outer')
            .attr('cx', '0')
            .attr('cy', '0')
            .attr('r', '10');
            
        //<rect id="scg.node.var.outer" width="20" height="20" x="-10" y="-10"/>
        defs.append('svg:rect')
            .attr('id', 'scg.node.var.outer')
            .attr('x', '-10')
            .attr('y', '-10')
            .attr('width', '20')
            .attr('height', '20');
            
        /*<clip-path id="scg.node.const.clip">
            <use xlink:href="scg.node.const.outer" />
        </clip-path>*/
        
        defs.append('svg:clip-path')
            .attr('id', 'scg.node.const.clip')
            .append('svg:use')
                .attr('xlink:href', '#scg.node.const.clip');
        
        /*<clip-path id="scg.node.var.clip">
            <use xlink:href="#scg.node.var.outer" />
        </clip-path>*/
        
        defs.append('svg:clip-path')
            .attr('id', 'scg.node.var.clip')
            .append('svg:use')
                .attr('xlink:href', '#scg.node.var.clip');
                
        //  ----- define constant nodes -----      
        var g = defs.append('svg:g').attr('id', 'scg.node');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '5');
        g.append('svg:text').attr('x', '7').attr('y', '15').attr('class', 'SCgText');
        
        g = defs.append('svg:g').attr('id', 'scg.node.const');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.tuple');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.struct');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '3').attr('stroke', 'none').attr('fill', '#000');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.role');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:line').attr('x1', '0').attr('x2', '0').attr('y1', '-10').attr('y2', '10').attr('stroke-width', '3');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.norole');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(-45, 0, 0)');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.class');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(-45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.abstract').attr('clip-path', 'url(#scg.node.const.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.material').attr('clip-path', 'url(#scg.node.const.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1').attr('transform', 'rotate(-45, 0, 0)');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);
        
        
        //  ----- define variable nodes -----
        g = defs.append('svg:g').attr('id', 'scg.node.var');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.tuple');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.struct');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '3').attr('stroke', 'none').attr('fill', '#000');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.role');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:line').attr('x1', '0').attr('x2', '0').attr('y1', '-10').attr('y2', '10').attr('stroke-width', '3');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.norole');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(-45, 0, 0)');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.class');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3').attr('transform', 'rotate(-45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', '3');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.abstract').attr('clip-path', 'url(#scg.node.var.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.node.var.material').attr('clip-path', 'url(#scg.node.var.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1').attr('transform', 'rotate(-45, 0, 0)');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);
        
    },
    
    /**
     * Append sc.g-text to definition
     */
     appendText: function(def, x, y) {
        def.append('svg:text')
            .attr('x', '17')
            .attr('y', '21')
            .attr('class', 'SCgText')
     },
     
     /**
      * Return definition name by sc-type
      */
     getDefId: function(sc_type) {
         if (this.scType2Str.hasOwnProperty(sc_type)) {
             return this.scType2Str[sc_type];
         }
         
         return 'scg.node';
     },
     
     /**
      * Initialize sc-types mapping
      */
      initTypesMapping: function() {
        this.scType2Str[sc_type_node] = 'scg.node';
        this.scType2Str[sc_type_node | sc_type_const] = 'scg.node.const';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_material] = 'scg.node.const.material';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_abstract] = 'scg.node.const.abstract';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_class] = 'scg.node.const.class';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_struct] = 'scg.node.const.struct';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_norole] = 'scg.node.const.norole';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_role] = 'scg.node.const.role';
        this.scType2Str[sc_type_node | sc_type_const | sc_type_node_tuple] = 'scg.node.const.tuple';

        this.scType2Str[sc_type_node | sc_type_var] = 'scg.node.var';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_material] = 'scg.node.var.material';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_abstract] = 'scg.node.var.abstract';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_class] = 'scg.node.var.class';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_struct] = 'scg.node.var.struct';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_norole] = 'scg.node.var.norole';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_role] = 'scg.node.var.role';
        this.scType2Str[sc_type_node | sc_type_var | sc_type_node_tuple] = 'scg.node.var.tuple';
      }
};


/* --- scg-render.js --- */

SCg.Render = function() {
    this.scene = null;
};

SCg.Render.prototype = {

    init: function(params) {
        this.containerId = params.containerId;
        this.d3_drawer = d3.select('#' + this.containerId).append("svg:svg").attr("pointer-events", "all").attr("width", '100%').attr("height", '100%');
        
        
        var self = this;
        this.d3_container = this.d3_drawer.append('svg:g')
                                .attr("class", "SCgSvg")
                                .on('mousemove', function() {
                                    self.onMouseMove(this, self);
                                    })
                                .on('mousedown', function() {
                                    self.onMouseDown(this, self);
                                    })
                                .on('mouseup', function() {
                                    self.onMouseUp(this, self);
                                    })
                                .on('dblclick', function() {
                                    self.onMouseDoubleClick(this, self);
                                    });
        this.initDefs();
                                    
        this.d3_container.append('svg:rect')
                        .style("fill", "url(#backGrad)")
                        .attr('width', '100%') //parseInt(this.d3_drawer.style("width")))
                        .attr('height', '100%');//parseInt(this.d3_drawer.style("height")));
                        
                        
        this.d3_drag_line = this.d3_container.append('svg:path')
                .attr('class', 'SCgEdge dragline hidden')
                .attr('d', 'M0,0L0,0');
                
        this.d3_contour_line = d3.svg.line().interpolate("cardinal-closed");
                        
        this.d3_contours = this.d3_container.append('svg:g').selectAll('path');
        this.d3_edges = this.d3_container.append('svg:g').selectAll('path');
        this.d3_nodes = this.d3_container.append('svg:g').selectAll('g');
                                
        this.mouse_down_node = null;
        this.object_under_mouse = null;
        this.selected_node = null;
        
        
        // ----------- test -----------
        var self = this;
    },
    
    // -------------- Definitions --------------------
    initDefs: function() {
        // define arrow markers for graph links
        var defs = this.d3_drawer.append('svg:defs')
        
        SCgAlphabet.initSvgDefs(defs);

        var grad = defs.append('svg:radialGradient')
            .attr('id', 'backGrad')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '100%').attr("spreadMethod", "pad");
            
            grad.append('svg:stop')
            .attr('offset', '0%')
            .attr('stop-color', 'rgb(255,253,252)')
            .attr('stop-opacity' , '1')
            grad.append('svg:stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgb(245,245,245)')
            .attr('stop-opacity', '1')
    },
    
    // -------------- draw -----------------------
    update: function() {
    
        var self = this;
        
        // update nodes visual
        this.d3_nodes = this.d3_nodes.data(this.scene.nodes, function(d) { return d.id; });
        
        // add nodes that haven't visual
        var g = this.d3_nodes.enter().append('svg:g')
            .attr('class', function(d) {
                if (!(d.sc_type & sc_type_constancy_mask)) {
                    return 'SCgNodeEmpty';
                }
                
                return 'SCgNode';
            })
            .attr("transform", function(d) {
                return 'translate(' + d.position.x + ', ' + d.position.y + ')';
            })
            .on('mouseover', function(d) {
                // enlarge target node
                d3.select(this).classed('SCgHighlighted', true);
                self.object_under_mouse = d;
            })
            .on('mouseout', function(d) {
                // unenlarge target node
                d3.select(this)
                    .attr('transform', function(d) {
                        return 'translate(' + d.position.x + ', ' + d.position.y + ')';
                    })
                    .classed('SCgHighlighted', false);
                self.object_under_mouse = null;
            })
            .on('mousedown', function(d) {
                if(d3.event.ctrlKey) return;

                // select node
                self.mouse_down_node = d;
                if (self.mouse_down_node === self.selected_node) 
                    self.selected_node = null;
                else 
                    self.selected_node = self.mouse_down_node;

                // reposition drag line
                self.d3_drag_line
                    .classed('hidden', false)
                    .attr('d', 'M' + self.mouse_down_node.position.x + ',' + self.mouse_down_node.position.y + 'L' + self.mouse_down_node.position.x + ',' + self.mouse_down_node.position.y);

                self.update();
            })
            .on('mouseup', function(d) {
                
                if (!self.mouse_down_node) return;

                // needed by FF
                self.d3_drag_line
                    .classed('hidden', true);

                // check for drag-to-self
                mouse_up_node = d;
                if (mouse_up_node === self.mouse_down_node) { 
                    self.mouse_down_node = null;
                    return; 
                }

                // add edge to graph
                self.scene.createEdge(self.mouse_down_node, mouse_up_node, null);
                self.relayout();
            
                self.update();
            });
        g.append('svg:use')
            .attr('xlink:href', function(d) {
                return '#' + SCgAlphabet.getDefId(d.sc_type); 
            })
        g.append('svg:text')
            .attr('class', 'SCgText')
            .attr('x', function(d) { return d.scale.x / 1.3; })
            .attr('y', function(d) { return d.scale.y / 1.3; })
            .text(function(d) { return d.text; });
            
        // update edges visual
        this.d3_edges = this.d3_edges.data(this.scene.edges, function(d) { return d.id; });
        
        // add edges that haven't visual
        g = this.d3_edges.enter().append('svg:g');
        
        g.append('svg:path')
            .attr('class', 'SCgEdge')
            .attr('d', function(d) {
                return 'M' + d.source_pos.x + ',' + d.source_pos.y + 'L' + d.target_pos.x + ',' + d.target_pos.y;
            })
            .style('marker-end', function(d) { return d.hasArrow() ? 'url(#end-arrow)' : ''; })
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgHighlighted', true);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgHighlighted', false);
            });
            
            
        // update contours visual
        this.d3_contours = this.d3_contours.data(this.scene.contours, function(d) { return d.id; });
        
        g = this.d3_contours.enter().append('svg:path')
                                    .attr('d', d3.svg.line().interpolate('cardinal-closed'))
                                    .attr('class', 'SCgContour');
        
        this.updatePositions();
    },

    updatePositions: function() {
        this.d3_nodes.attr("transform", function(d) { 
            return 'translate(' + d.position.x + ', ' + d.position.y + ')'
        });
        this.d3_edges.select('path').attr('d', function(d) {
            d.update();
            return 'M' + d.source_pos.x + ',' + d.source_pos.y + 'L' + d.target_pos.x + ',' + d.target_pos.y;
        });
                
        this.d3_contours.attr('d', function(d) { 
            d.update();
            return self.d3_contour_line(d.verticies) + 'Z'; 
        });
    },
    
    updateTexts: function() {
        this.d3_nodes.select('text').text(function(d) { return d.text; });
    },
            
    // -------------- Objects --------------------
    appendRenderNode: function(render_node) {
        render_node.d3_group = this.d3_container.append("svg:g");
    },

    appendRenderEdge: function(render_edge) {
        render_edge.d3_group = this.d3_container.append("g");
    },

    // --------------- Events --------------------
    onMouseDown: function(window, render) {
        var point = d3.mouse(window);
        render.scene.onMouseDown(point[0], point[1]);         
    },
    
    onMouseUp: function(window, render) {
        var point = d3.mouse(window);
        render.scene.onMouseUp(point[0], point[1]);
    },
    
    onMouseMove: function(window, render) {
        var point = d3.mouse(window);
        render.scene.onMouseMove(point[0], point[1]);
        
        if (!this.mouse_down_node) return;

        // update drag line
        this.d3_drag_line.attr('d', 'M' + this.mouse_down_node.position.x + ',' + this.mouse_down_node.position.y + 'L' + point[0] + ',' + point[1]);
    },
    
    onMouseDoubleClick: function(window, render) {
        var point = d3.mouse(window);
        
        if (!render.object_under_mouse) {
            render.scene.createNode(sc_type_node, new SCg.Vector3(point[0], point[1], 0), null);
            render.update();
//      render.relayout();
        }   
    },
    
    getContainerSize: function() {
        var el = document.getElementById(this.containerId);
        return [el.clientWidth, el.clientHeight];
    }
    

}


/* --- scg-scene.js --- */
SCg.Scene = function(options) {

    this.render = options.render;
    this.nodes = [];
    this.edges = [];
    this.contours = [];
    
    this.objects = {};
};

SCg.Scene.prototype = {

    constructor: SCg.Scene,


    init: function() {
        this.layout_manager = new SCg.LayoutManager();
        this.layout_manager.init(this);
    },

    /**
     * Appends new sc.g-node to scene
     * @param {SCg.ModelNode} node Node to append
     */
    appendNode: function(node) {
        this.nodes.push(node);
        if (node.sc_addr)
            this.objects[node.sc_addr] = node;
    },

    /**
     * Appends new sc.g-edge to scene
     * @param {SCg.ModelEdge} edge Edge to append
     */
    appendEdge: function(edge) {
        this.edges.push(edge);
        if (edge.sc_addr)
            this.objects[edge.sc_addr] = edge;
    },
     
    /**
     * Append new sc.g-contour to scene
     * @param {SCg.ModelContour} contour Contour to append
     */
    appendContour: function(contour) {
        this.contours.push(contour);
        if (contour.sc_addr)
            this.objects[contour.sc_addr] = contour;
    },  

    // --------- objects create/destroy -------
    /**
     * Create new node
     * @param {Integer} sc_type Type of node
     * @param {SCg.Vector3} pos Position of node
     * @param {String} text Text assotiated with node
     * 
     * @return Returns created node
     */
    createNode: function(sc_type, pos, text) {
        var node = new SCg.ModelNode({ 
                        position: new SCg.Vector3(pos.x, pos.y, pos.z), 
                        scale: new SCg.Vector2(20, 20),
                        sc_type: sc_type,
                        text: text
                    });
        this.appendNode(node);
        
        return node;
    },
    
    /**
     * Create edge between two specified objects
     * @param {SCg.ModelObject} begin Begin object of edge
     * @param {SCg.ModelObject} end End object of edge
     * @param {Integer} sc_type SC-type of edge
     *
     * @return Returns created edge
     */
    createEdge: function(begin, end, sc_type) {
        var edge = new SCg.ModelEdge({
                                        begin: begin,
                                        end: end,
                                        sc_type: sc_type ? sc_type : sc_type_edge_common
                                    });
        this.appendEdge(edge);
        
        return edge;
    },

    // --------- mouse events ------------

     onMouseDown: function(x, y) {

     },

     onMouseMove: function(x, y) {

     },

     onMouseUp: function(x, y) {

     },

     // --------- layout --------
     layout: function() {
        this.layout_manager.doLayout();
        this.render.update();
     },
     
     onLayoutTick: function() {
     
     },
     
     /**
      * Returns size of container, where graph drawing
      */
    getContainerSize: function() {
        return this.render.getContainerSize();
    },
     
     /**
      * Return array that contains sc-addrs of all objects in scene
      */
    getScAddrs: function() {
        var keys = new Array();
        for (key in this.objects) {
            keys.push(key);
        }
        return keys;
    },
    
    /**
     * Return object by sc-addr
     * @param {String} addr sc-addr of object to find
     * @return If object founded, then return it; otherwise return null
     */
    getObjectByScAddr: function(addr) {
        if (this.objects.hasOwnProperty(addr))
            return this.objects[addr];
            
        return null;
    }
};


/* --- scg-component.js --- */
SCgComponent = {
    type: 0,
    outputLang: 'hypermedia_format_scg_json',
    formats: [],
    factory: function(config) {
        return new scgViewerWindow(config);
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

        this.viewer = new SCg.Viewer();
        this.viewer.init({containerId: config.container});
    },

    /**
     * Set new data in viewer
     * @param {Object} data
     */
    receiveData : function(data){
        
        this._buildGraph(data);
    },

    /**
     * Build scGraph from JSON
     * @param {Object} data
     * @return {scGraph}
     * @private
     */
    _buildGraph : function(data){
        
        var elements = {};
        var edges = new Array();
        for (var i = 0; i < data.length; i++) {
            var el = data[i];
            
            if (elements.hasOwnProperty(el.id))
                continue;
            
            if (el.el_type & sc_type_node || el.el_type & sc_type_link) {
                var model_node = new SCg.ModelNode({ 
                        position: new SCg.Vector3(10 * Math.random(), 10 * Math.random(), 0), //1000 * Math.random() - 500), 
                        sc_type: el.el_type,
                        text: "",
                        sc_addr: el.id
                    });
                this.viewer.scene.appendNode(model_node);
                
                elements[el.id] = model_node;
            } else if (el.el_type & sc_type_arc_mask) {
                edges.push(el);
            }
        }
        
        // create edges
        var founded = true;
        while (edges.length > 0 && founded) {
            founded = false;
            for (idx in edges) {
                var obj = edges[idx];
                var beginId = obj.begin;
                var endId = obj.end;
                // try to get begin and end object for arc
                if (elements.hasOwnProperty(beginId) && elements.hasOwnProperty(endId)) {
                    var beginNode = elements[beginId];
                    var endNode = elements[endId];
                    
                    founded = true;
                    edges.splice(idx, 1);
                    
                    var model_edge = new SCg.ModelEdge({
                        source: beginNode,
                        target: endNode,
                        sc_type: obj.el_type,
                        sc_addr: obj.id
                    });

                    this.viewer.scene.appendEdge(model_edge);
                    
                    elements[obj.id] = model_edge;
                } 
            }
        }
        
        if (edges.length > 0)
            alert("error");
        
        this.viewer.render.update();
        this.viewer.scene.layout();
    },

    /**
     * Destroy window
     * @return {Boolean}
     */
    destroy : function(){
        delete this.viewer;
        return true;
    },


    /**
     * Emit translate identifiers
     */
    translateIdentifiers    : function(language){
        
        var self = this;
        
        SCWeb.core.Translation.translate(this.viewer.scene.getScAddrs(), language, function(namesMap) {
            for (addr in namesMap) {
                var obj = self.viewer.scene.getObjectByScAddr(addr);
                if (obj) {
                    obj.text = namesMap[addr];
                }
            }
            
            self.viewer.render.updateTexts();
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
        return [];
    },

    _translateObjects       : function(namesMap){

    }

};


SCWeb.core.ComponentManager.appendComponentInitialize(function() {
    SCWeb.core.ComponentManager.registerComponent(SCgComponent);
});


/* --- scg-layout.js --- */
var SCgLayoutObjectType = {
    Node: 0,
    Edge: 1,
    Link: 2,
    Contour: 3,
    DotPoint: 4
};

// Layout algorithms


/**
 * Base layout algorithm
 */
SCg.LayoutAlgorithm = function(nodes, edges, contours, onTickUpdate) {
    this.nodes = nodes;
    this.edges = edges;
    this.contours = contours;
    this.onTickUpdate = onTickUpdate;
};

SCg.LayoutAlgorithm.prototype = {
    constructor: SCg.LayoutAlgorithm
};

// --------------------------

SCg.LayoutAlgorithmForceBased = function(nodes, edges, contours, onTickUpdate, rect) {
    SCg.LayoutAlgorithm.call(this, nodes, edges, contours, onTickUpdate);
    this.rect = rect;
};

SCg.LayoutAlgorithmForceBased.prototype = Object.create( SCg.LayoutAlgorithm );

SCg.LayoutAlgorithmForceBased.prototype.start = function() {
    // init D3 force layout
    var self = this;
    this.force = d3.layout.force()
        .nodes(this.nodes)
        .links(this.edges)
        .size(this.rect)
	.gravity(0.1)
        .linkDistance(function(edge){
		if (edge.source.type == SCgLayoutObjectType.DotPoint ||
			edge.target.type == SCgLayoutObjectType.DotPoint) {
			return 50;
		}
		
		return 170;
	})
	.linkStrength(function(edge){
		if (edge.source.type == SCgLayoutObjectType.DotPoint ||
			edge.target.type == SCgLayoutObjectType.DotPoint) {
			return 1.0;
		}

		return 0.9;
	})
        .charge(function(node) {
		if (node.type == SCgLayoutObjectType.DotPoint) {
			return 0;
		}
		return -1000;
	})
        .on('tick', function() {
            self.onLayoutTick();
        })
        .start();
};

SCg.LayoutAlgorithmForceBased.prototype.onLayoutTick = function() {
    
    var dots = [];
    for (idx in this.nodes) {
        var node_layout = this.nodes[idx];
        
        if (node_layout.type == SCgLayoutObjectType.Node) {
            node_layout.object.position.x = node_layout.x;
            node_layout.object.position.y = node_layout.y;
        } else
        {
            if (node_layout.type == SCgLayoutObjectType.DotPoint) {
                dots.push(node_layout);
            }
        }
    }
    
    // setup dot points positions 
    for (idx in dots) {
        var dot = dots[idx];
        
        var edge = dot.object.target;
        if (dot.source)
            edge = dot.object.source;
        
        dot.x = edge.position.x;
        dot.y = edge.position.y;
    }
    
    this.onTickUpdate();
};


// ------------------------------------

SCg.LayoutManager = function() {

};

SCg.LayoutManager.prototype = {
    constructor: SCg.LayoutManager
};

SCg.LayoutManager.prototype.init = function(scene) {
    this.scene = scene;
    this.nodes = null;
    this.edges = null;
    
    this.algorithm = null;
};

/**
 * Prepare objects for layout
 */
SCg.LayoutManager.prototype.prepareObjects = function() {

    this.nodes = new Array();
    this.edges = new Array();
    var objDict = {};
    
    // first of all we need to collect objects from scene, and build them representation for layout
    for (idx in this.scene.nodes) {
        var node = this.scene.nodes[idx];
        var obj = new Object();
        
        obj.x = node.position.x;
        obj.y = node.position.y;
        obj.object = node;
        obj.type = SCgLayoutObjectType.Node;
        
        objDict[node.id] = obj;
        this.nodes.push(obj);
    }
    
    for (idx in this.scene.edges) {
        var edge = this.scene.edges[idx];
        var obj = new Object();
        
        obj.object = edge;
        obj.type = SCgLayoutObjectType.Edge;
        
        objDict[edge.id] = obj;
        this.edges.push(obj);
    }
    
    // store begin and end for edges
    for (idx in this.edges) {
        edge = this.edges[idx];
        
        source = objDict[edge.object.source.id];
        target = objDict[edge.object.target.id];
        
        function getEdgeObj(srcObj, isSource) {
            if (srcObj.type == SCgLayoutObjectType.Edge) {
                var obj = new Object();
                obj.type = SCgLayoutObjectType.DotPoint;
                obj.object = srcObj.object;
                obj.source = isSource;
            
                return obj;
            }
            return srcObj;
        };
                
        edge.source = getEdgeObj(source, true);
        edge.target = getEdgeObj(target, false);
        
        if (edge.source != source)
            this.nodes.push(edge.source);
        if (edge.target != target)
            this.nodes.push(edge.target);
    }
    
};

/**
 * Starts layout in scene
 */
SCg.LayoutManager.prototype.doLayout = function() {
    var self = this;
    
    this.prepareObjects();
    this.algorithm = new SCg.LayoutAlgorithmForceBased(this.nodes, this.edges, null, 
                                                        $.proxy(this.onTickUpdate, this), 
                                                        this.scene.getContainerSize());
    this.algorithm.start();
};

SCg.LayoutManager.prototype.onTickUpdate = function() { 
    this.scene.render.update();
};


