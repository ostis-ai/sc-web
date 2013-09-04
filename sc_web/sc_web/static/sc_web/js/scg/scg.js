/* --- scg.js --- */
var SCg = SCg || { version: "0.1.0" };

SCg.Editor = function() {

    this.render = null;
    this.scene = null;
};

SCg.Editor.prototype = {


    init: function(params)
    {
        this.render = new SCg.Render();
        this.scene = new SCg.Scene( {render: this.render } );
        this.scene.init();
        
        this.render.scene = this.scene;
        this.render.init(params);
        
        this.containerId = params.containerId;
        this.initUI();
    },
    
    /**
     * Initialize user interface
     */
    initUI: function() {
        var self = this;
        
        var container = '#' + this.containerId;
        $(container).prepend('<div id="tools-' + this.containerId + '"></div>');
        var tools_container = '#tools-' + this.containerId;
        $(tools_container).load('static/sc_web/html/scg-tools-panel.html', function() {
            
            var cont = $(container);
            
            cont.find('#scg-tool-select').button('toggle');
            
            // handle clicks on mode change
            cont.find('#scg-tool-select').click(function() {
                self.scene.setEditMode(SCgEditMode.SCgModeSelect);
            });
            cont.find('#scg-tool-edge').click(function() {
                self.scene.setEditMode(SCgEditMode.SCgModeEdge);
            });
            cont.find('#scg-tool-bus').click(function() {
                self.scene.setEditMode(SCgEditMode.SCgModeBus);
            });
            cont.find('#scg-tool-contour').click(function() {
                self.scene.setEditMode(SCgEditMode.SCgModeContour);
            });
            cont.find('#scg-tool-change-idtf').click(function() {
                self.scene.setModal(SCgModalMode.SCgModalIdtf);
                $(this).popover({container: container});
                $(this).popover('show');
                
                var tool = $(this);
                
                function stop_modal() {
                    self.scene.setModal(SCgModalMode.SCgModalNone);
                    tool.popover('destroy');
                    self.scene.updateObjectsVisual();
                }
                
                
                var input = $(container + ' #scg-change-idtf-input');
                // setup initial value
                input.focus().val(self.scene.selected_objects[0].text);
                input.keypress(function (e) {
                    if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                        
                        if (e.keyCode == KeyCode.Enter)   self.scene.selected_objects[0].setText(input.val());
                        stop_modal();
                        e.preventDefault();
                    } 
                    
                });
                
                // process controls
                $(container + ' #scg-change-idtf-apply').click(function() {
                    self.scene.selected_objects[0].setText(input.val());
                    stop_modal();
                });
                $(container + ' #scg-change-idtf-cancel').click(function() {
                    stop_modal();
                });
                
            });
            
            cont.find('#scg-tool-delete').click(function() {
                self.scene.deleteObjects(self.scene.selected_objects.slice(0, self.scene.selected_objects.length));
                self.scene.clearSelection();
            });
            
            // initial update
            self.onModalChanged();
            self.onSelectionChanged();
            
        });
        
        var self = this;
        this.scene.event_selection_changed = function() {
            self.onSelectionChanged();
        }
        this.scene.event_modal_changed = function() {
            self.onModalChanged();
        }
    },
    
    /**
     * Function that process selection changes in scene
     * It updated UI to current selection
     */
    onSelectionChanged: function() {
        
        if (this.scene.selected_objects.length == 1) {
            this._enableTool('#scg-tool-change-idtf');
        } else {
            this._disableTool('#scg-tool-change-idtf');
        }
        
        if (this.scene.selected_objects.length > 0) {
            this._enableTool('#scg-tool-delete');
        } else {
            this._disableTool('#scg-tool-delete');
        }
    },
    
    /**
     * Function, that process modal state changes of scene
     */
    onModalChanged: function() {
        var self = this;
        function update_tool(tool_id) {
            if (self.scene.modal != SCgModalMode.SCgModalNone)
                self._disableTool(tool_id);
            else
                self._enableTool(tool_id);
        }
        
        update_tool('#scg-tool-select');
        update_tool('#scg-tool-edge');
        update_tool('#scg-tool-bus');
        update_tool('#scg-tool-contour');

        update_tool('#scg-tool-change-idtf');
        update_tool('#scg-tool-delete');
        update_tool('#scg-tool-zoomin');
        update_tool('#scg-tool-zoomout');
    },
    
    // -------------------------------- Helpers ------------------
    /**
     * Change specified tool state to disabled
     */
    _disableTool: function(tool_id) {
        $('#' + this.containerId).find(tool_id).attr('disabled', 'disabled');
    },
    
    /**
     * Change specified tool state to enabled
     */
    _enableTool: function(tool_id) {
         $('#' + this.containerId).find(tool_id).removeAttr('disabled');
    }
};


/* --- scg-debug.js --- */
var SCgDebug = {
    
    enabled: false,
    
    error: function(message) {
        if (!this.enabled) return; // do nothing
        
        alert(message);
    }
    
}


/* --- scg-math.js --- */
SCg.Vector2 = function(x, y) {
	this.x = x;
	this.y = y;
};

SCg.Vector2.prototype = {
	constructor: SCg.Vector2,
	
	copyFrom: function(other) {
		this.x = ohter.x;
		this.y = other.y;
		
		return this;
	},
	
	clone: function() {
		return new SCg.Vector2(this.x, this.y);
	}
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
	
	clone: function() {
		return new SCg.Vector3(this.x, this.y, this.z);
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
	
	mul: function(other) {
		this.x *= other.x;
		this.y *= other.y;
		this.z *= other.z;
		
		return this;
	},
	
	div: function(other) {
		this.x /= other.x;
		this.y /= other.y;
		this.z /= other.z;
		
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
    MergedWithMemory: 1,
    NewInMemory: 2,
    FromMemory: 3
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
    this.state = SCgObjectState.Normal;
    this.is_selected = false;
};

SCg.ModelObject.prototype = {

    constructor: SCg.ModelObject

};

/**
 * Destroy object
 */
SCg.ModelObject.prototype.destroy = function() {
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
 * Setup new text value
 * @param {String} text New text value
 */
SCg.ModelObject.prototype.setText = function(text) {
    this.text = text;
    this.need_observer_sync = true;
};

/**
 * Notify all connected edges to sync
 */
SCg.ModelObject.prototype.notifyEdgesUpdate = function() {

    for (var i = 0; i < this.edges.length; i++) {
       this.edges[i].need_update = true;
       this.edges[i].need_observer_sync = true;
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

/*! Setup new state of object
 * @param {SCgObjectState} state New object state
 */
SCg.ModelObject.prototype.setObjectState = function(state) {
    this.state = state;
    this.need_observer_sync = true;
};

/*!
 * Change value of selection flag
 */
SCg.ModelObject.prototype._setSelected = function(value) {
    this.is_selected = value;
    this.need_observer_sync = true;
};

/**
 * Remove edge from edges list
 */
SCg.ModelObject.prototype.removeEdge = function(edge) {
    var idx = this.edges.indexOf(edge);
    
    if (idx < 0) {
        SCg.error("Something wrong in edges deletion");
        return;
    }
    
    this.edges.splice(idx, 1);
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
        this.setSource(options.source);
    if (options.target)
        this.setTarget(options.target);

    this.source_pos = new SCg.Vector3(0, 0, 0); // the begin position of egde in world coordinates
    this.target_pos = new SCg.Vector3(0, 0, 0); // the end position of edge in world coordinates

    this.requestUpdate();
    this.update();
};

SCg.ModelEdge.prototype = Object.create( SCg.ModelObject.prototype );

/**
 * Destroy object
 */
SCg.ModelEdge.prototype.destroy = function() {
    SCg.ModelObject.prototype.destroy.call(this);
    
    if (this.target)
        this.target.removeEdge(this);
    if (this.source)
        this.source.removeEdge(this);
};

/** 
 * Setup new source object for sc.g-edge
 * @param {Object} scg_obj
 *      sc.g-object, that will be the source of edge
 */
SCg.ModelEdge.prototype.setSource = function(scg_obj) {
    
    if (this.source == scg_obj) return; // do nothing
    
    if (this.source)
        this.source.removeEdge(this);
    
    this.source = scg_obj;
    this.source.edges.push(this);
    this.need_observer_sync = true;
};

/**
 * Setup new target object for sc.g-edge
 * @param {Object} scg_obj
 *      sc.g-object, that will be the target of edge
 */
 SCg.ModelEdge.prototype.setTarget = function(scg_obj) {
     
    if (this.target == scg_obj) return; // do nothing
    
    if (this.target)
        this.target.removeEdge(this);
    
    this.target = scg_obj;
    this.target.edges.push(this);
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
        
        // edge markers
        defs.append('svg:marker')
            .attr('id', 'end-arrow-access').attr('viewBox', '0 -5 10 10').attr('refX', 0)
            .attr('markerWidth', 5).attr('markerHeight', 10).attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M0,-4L10,0L0,4').attr('fill', '#000');
            
        defs.append('svg:marker')
            .attr('id', 'end-arrow-common').attr('viewBox', '0 -5 10 10').attr('refX', 0)
            .attr('markerWidth', 1.5).attr('markerHeight', 6).attr('orient', 'auto')
          .append('svg:path')
            .attr('d', 'M0,-4L10,0L0,4').attr('fill', '#000');
            
        // nodes
        defs.append('svg:circle').attr('id', 'scg.node.const.outer').attr('cx', '0').attr('cy', '0').attr('r', '10');
        defs.append('svg:rect').attr('id', 'scg.node.var.outer').attr('x', '-10').attr('y', '-10').attr('width', '20').attr('height', '20');
            
        defs.append('svg:clip-path')
            .attr('id', 'scg.node.const.clip')
            .append('svg:use')
                .attr('xlink:href', '#scg.node.const.clip');
        
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
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.abstract');//.attr('clip-path', 'url(#scg.node.const.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.const.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);
        
        g = defs.append('svg:g').attr('id', 'scg.node.const.material');//.attr('clip-path', 'url(#scg.node.const.clip)');
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
        
        g = defs.append('svg:g').attr('id', 'scg.node.var.abstract');//.attr('clip-path', 'url(#scg.node.var.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.node.var.outer');
        var g2 = g.append('svg:g').attr('stroke-width', '1');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '6').attr('y2', '6');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.node.var.material');//.attr('clip-path', 'url(#scg.node.var.clip)');
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
      },
      
    /**
     * All sc.g-edges represented by group of paths, so we need to update whole group.
     * This function do that work
     * @param egde {SCg.ModelEdge} Object that represent sc.g-edge
     * @param d3_group {} Object that represents svg group
     */
    updateEdge: function(edge, d3_group) {
        
        // first of all we need to determine if edge has an end marker
        var has_marker = edge.hasArrow();
        
        // now calculate target and source positions
        var pos_src = edge.source_pos.clone();
        var pos_trg = edge.target_pos.clone();
        
        // if we have an arrow, then need to fix end position
        if (has_marker) {
            var dv = pos_trg.clone().sub(pos_src);
            var len = dv.length();
            dv.normalize();
            pos_trg = pos_src.clone().add(dv.multiplyScalar(len - 10));
        }
        
        // make position path
        var position_path = 'M' + pos_src.x + ',' + pos_src.y + 'L' + pos_trg.x + ',' + pos_trg.y;
        
        var sc_type_str = edge.sc_type.toString();
        if (d3_group['sc_type'] != sc_type_str) {
            d3_group.attr('sc_type', sc_type_str);
            
            // remove old
            d3_group.selectAll('path').remove();
                        
            // if it accessory, then append main line
            if (edge.sc_type & sc_type_arc_access) {
                
                
                
                var main_style = 'SCgEdgeAccessPerm';
                if (edge.sc_type & sc_type_arc_temp) {
                    main_style = edge.sc_type & sc_type_var ? 'SCgEdgeAccessTempVar' : 'SCgEdgeAccessTemp';
                }
                
                var p = d3_group.append('svg:path')
                    .classed(main_style, true)
                    .classed('SCgEdgeEndArrowAccess', true)
                    .attr('d', position_path);
                    
                if (edge.sc_type & sc_type_constancy_mask) {
                    p.classed('SCgEdgeVarDashAccessPerm', (edge.sc_type & sc_type_var) && (edge.sc_type & sc_type_arc_perm));
                } else {
                    d3_group.append('svg:path')
                        .classed('SCgEdgeAccessComonDash', true)
                        .attr('d', position_path);
                }

                if (edge.sc_type & sc_type_arc_neg) {
                    d3_group.append('svg:path')
                        .classed('SCgEdgePermNegDash', true)
                        .attr('d', position_path);
                }
            } else if (edge.sc_type & (sc_type_arc_common | sc_type_edge_common)) {
                
                var p = d3_group.append('svg:path')
                    .classed('SCgEdgeCommonBack', true)
                    .classed('SCgEdgeEndArrowCommon', edge.sc_type & sc_type_arc_common)
                    .attr('d', position_path);
                
                d3_group.append('svg:path')
                    .classed('SCgEdgeCommonForeground', true)
                    .attr('d', position_path)
                    
                if (edge.sc_type & sc_type_constancy_mask) {
                    if (edge.sc_type & sc_type_var) {
                        d3_group.append('svg:path')
                            .classed('SCgEdgeCommonForegroundVar', true)
                            .classed('SCgEdgeVarDashCommon', true)
                            .attr('d', position_path);
                    }
                } else {
                    d3_group.append('svg:path')
                        .classed('SCgEdgeAccessPerm', true)
                        .classed('SCgEdgeVarDashCommon', true)
                        .attr('d', position_path);
                }
                
            } else {
                // unknown
                d3_group.append('svg:path')
                    .classed('SCgEdgeUnknown', true)
                    .attr('d', position_path);
            }
            
        } else { 
            // update existing
            d3_group.selectAll('path')
                .attr('d', position_path);
        }
        
        // now we need to draw fuz markers (for now it not supported)
        if (edge.sc_type & sc_type_arc_fuz) {
            d3_group.selectAll('path').attr('stroke', '#f00');
        }
        
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
        
        d3.select('#' + this.containerId).attr('style', 'disbplay: block');
        
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
        
        // need to check if container is visible
        d3.select(window)
                .on('keydown', function() {
                    self.onKeyDown(d3.event.keyCode);
                })
                .on('keyup', function() {
                    self.onKeyUp(d3.event.keyCode);
                });
        this.initDefs();
                                    
        this.d3_container.append('svg:rect')
                        .style("fill", "url(#backGrad)")
                        .attr('width', '100%') //parseInt(this.d3_drawer.style("width")))
                        .attr('height', '100%');//parseInt(this.d3_drawer.style("height")));
                        
                        
        this.d3_drag_line = this.d3_container.append('svg:path')
                .attr('class', 'dragline hidden')
                .attr('d', 'M0,0L0,0');
                
        this.d3_contour_line = d3.svg.line().interpolate("cardinal-closed");
                        
        this.d3_contours = this.d3_container.append('svg:g').selectAll('path');
        this.d3_edges = this.d3_container.append('svg:g').selectAll('path');
        this.d3_nodes = this.d3_container.append('svg:g').selectAll('g');
        this.d3_dragline = this.d3_container.append('svg:g');

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
            
        // drag line point control
        var p = defs.append('svg:g')
                .attr('id', 'dragPoint')
                p.append('svg:circle')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', 10)

                p.append('svg:path')
                    .attr('d', 'M-5,-5L5,5M-5,5L5,-5');
    },
    
    // -------------- draw -----------------------
    update: function() {
    
        var self = this;
        
        // update nodes visual
        this.d3_nodes = this.d3_nodes.data(this.scene.nodes, function(d) { return d.id; });
        
        // add nodes that haven't visual
        var g = this.d3_nodes.enter().append('svg:g')
            .attr('class', function(d) {
                return (d.sc_type & sc_type_constancy_mask) ? 'SCgNode' : 'SCgNodeEmpty';
            })
            .attr("transform", function(d) {
                return 'translate(' + d.position.x + ', ' + d.position.y + ')';
            })
            .on('mouseover', function(d) {
                // enlarge target node
                d3.select(this).classed('SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgStateHighlighted', false)
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
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
            
        this.d3_nodes.exit().remove();
            
        // update edges visual
        this.d3_edges = this.d3_edges.data(this.scene.edges, function(d) { return d.id; });
        
        // add edges that haven't visual
        this.d3_edges.enter().append('svg:g')
            .classed('SCgStateNormal', true)
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgStateHighlighted', false);
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
            })
            .each(function(d) {
                SCgAlphabet.updateEdge(d, d3.select(this));
            });
        
        this.d3_edges.exit().remove();
            
        // update contours visual
        this.d3_contours = this.d3_contours.data(this.scene.contours, function(d) { return d.id; });
        
        g = this.d3_contours.enter().append('svg:path')
                                    .attr('d', d3.svg.line().interpolate('cardinal-closed'))
                                    .attr('class', 'SCgContour');
        this.d3_contours.exit().remove();
        
        this.updateObjects();
    },

    updateObjects: function() {
        this.d3_nodes.each(function (d) {
            
            if (!d.need_observer_sync) return; // do nothing
            
            d.need_observer_sync = false;
            
            d3.select(this).attr("transform", 'translate(' + d.position.x + ', ' + d.position.y + ')')
                    .classed('SCgStateSelected', function(d) {
                        return d.is_selected;
                    }).select('text')
                    .text(function(d) { return d.text; });;
        });
        
        this.d3_edges.each(function(d) {
            
            if (!d.need_observer_sync) return; // do nothing
            d.need_observer_sync = false;
            
            if (d.need_update)
                d.update();
            SCgAlphabet.updateEdge(d, d3.select(this));
        });
                
        this.d3_contours.each(function(d) {
            d3.select(this).attr('d', function(d) { 
                
                if (!d.need_observer_sync) return; // do nothing
                
                if (d.need_update)
                    d.update();
                return self.d3_contour_line(d.verticies) + 'Z'; 
            });
        });

    },
    
    updateTexts: function() {
        this.d3_nodes.select('text').text(function(d) { return d.text; });
    },
    
    updateDragLine: function() {
        var self = this;
        
        // remove old points
        drag_line_points = this.d3_dragline.selectAll('use');
        points = drag_line_points.data(this.scene.drag_line_points, function(d) { return d.idx; })
        points.exit().remove();
        
        if (this.scene.drag_line_points.length < 1) {
            this.d3_drag_line.classed('hidden', true);
            return;
        }        
        
        points.enter().append('svg:use')
            .classed('SCgDragLinePoint', true)
            .attr('xlink:href', '#dragPoint')
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            })
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgDragLinePointHighlighted', true);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgDragLinePointHighlighted', false);
            })
            .on('mousedown', function(d) {
                self.scene.revertDragPoint(d.idx);
                d3.event.stopPropagation();
            });
            
        this.d3_drag_line.classed('hidden', false);
        
        var d_str = '';
        // create path description
        for (idx in this.scene.drag_line_points) {
            var pt = this.scene.drag_line_points[idx];
            
            if (idx == 0) 
                d_str += 'M';
            else
                d_str += 'L';
            d_str += pt.x + ',' + pt.y;
        }
    
        d_str += 'L' + this.scene.mouse_pos.x + ',' + this.scene.mouse_pos.y;
        
        // update drag line
        this.d3_drag_line.attr('d', d_str);
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
    },
    
    onMouseDoubleClick: function(window, render) {
        var point = d3.mouse(window);
        this.scene.onMouseDoubleClick(point[0], point[1]);
    },
    
    onKeyDown: function(key_code) {
        // do not send event to other listeners, if it processed in scene
        if (this.scene.onKeyDown(key_code))
            d3.event.stopPropagation();
        
    },
    
    onKeyUp: function(key_code) {
        // do not send event to other listeners, if it processed in scene
        if (this.scene.onKeyUp(key_code))
            d3.event.stopPropagation();
    },
    
    
    // ------- help functions -----------
    getContainerSize: function() {
        var el = document.getElementById(this.containerId);
        return [el.clientWidth, el.clientHeight];
    }
    

}


/* --- scg-scene.js --- */
var SCgEditMode = {
    SCgModeSelect: 0,
    SCgModeEdge: 1,
    SCgModeBus: 2,
    SCgModeContour: 3,
    
    /**
     * Check if specified mode is valid
     */
    isValid: function(mode) {
        return (mode >= this.SCgModeSelect) && (mode <= this.SCgModeContour);
    }
};

var SCgModalMode = {
    SCgModalNone: 0,
    SCgModalIdtf: 1,
};

var KeyCode = {
    Escape: 27,
    Enter: 13
};

SCg.Scene = function(options) {

    this.render = options.render;
    this.nodes = [];
    this.edges = [];
    this.contours = [];
    
    this.objects = {};
    this.edit_mode = SCgEditMode.SCgModeSelect;
    
    // object, that placed under mouse
    this.pointed_object = null;
    // object, that was mouse pressed
    this.focused_object = null;
    
    // list of selected objects
    this.selected_objects = [];
    
    // drag line points
    this.drag_line_points = [];
    
    // mouse position
    this.mouse_pos = new SCg.Vector3(0, 0, 0);
    
    // edge source and target
    this.edge_data = {source: null, target: null};
    
    // callback for selection changed
    this.event_selection_changed = null;
    // callback for modal state changes
    this.event_modal_changed = null;
    
    /* Flag to lock any edit operations
     * If this flag is true, then we doesn't need to process any editor operatons, because
     * in that moment shows modal dialog
     */
    this.modal = SCgModalMode.SCgModalNone;
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
    
    /**
     * Remove object from scene.
     * @param {SCg.ModelObject} obj Object to remove
     */
    removeObject: function(obj) {
        function remove_from_list(obj, list) {
            var idx = list.indexOf(obj);
            if (idx < 0) {
                SCg.error("Can't find object for remove");
                return;
            }
            
            list.splice(idx, 1);
        }
        
        if (obj instanceof SCg.ModelNode) {
            remove_from_list(obj, this.nodes);
        } else if (obj instanceof SCg.ModelEdge) {
            remove_from_list(obj, this.edges);
        } else if (obj instanceof SCg.ModeContour) {
            remove_from_list(obj, this.contours);
        }
        
        if (obj.sc_addr)
            delete this.objects[obj.sc_addr];
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
     * @param {SCg.ModelObject} source Edge source object
     * @param {SCg.ModelObject} target Edge target object
     * @param {Integer} sc_type SC-type of edge
     *
     * @return Returns created edge
     */
    createEdge: function(source, target, sc_type) {
        var edge = new SCg.ModelEdge({
                                        source: source,
                                        target: target,
                                        sc_type: sc_type ? sc_type : sc_type_edge_common
                                    });
        this.appendEdge(edge);
        
        return edge;
    },
    
    /**
     * Delete objects from scene
     * @param {Array} objects Array of sc.g-objects to delete
     */
    deleteObjects: function(objects) {
        
        function collect_objects(container, root) {
            if (container.indexOf(root) >= 0)
                return;
            
            container.push(root);
            for (idx in root.edges) {
                collect_objects(container, root.edges[idx]);
            }
        }
        
        // collect objects for remove
        var objs = [];
        
        // collect objects for deletion
        for (idx in objects)
            collect_objects(objs, objects[idx]);
        
        // delete objects
        for (idx in objs) {
            this.removeObject(objs[idx]);
            objs[idx].destroy();
        }
        
        this.updateRender();
    },
    
    /**
     * Updates render
     */
    updateRender: function() {
        this.render.update();
    },
    
    /**
     * Updates render objects state
     */
    updateObjectsVisual: function() {
        this.render.updateObjects();
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
    },
    
    /**
     * Append selection to object
     */
    appendSelection: function(obj) {
        if (obj.is_selected) {
            SCgDebug.error('Object trying to be selecting twice');
            return;
        }
        
        this.selected_objects.push(obj);
        obj._setSelected(true);
        
        this._fireSelectionChanged();
    },
    
    /**
     * Remove selection from object
     */
    removeSelection: function(obj) {
        
        var idx = this.selected_objects.indexOf(obj);
        
        if (idx == -1 || !obj.is_selected) {
            SCgDebug.error('Trying to remove selection from unselected object');
            return;
        }
        
        this.selected_objects.splice(idx, 1);
        obj._setSelected(false);
        
        this._fireSelectionChanged();
    },
    
    /**
     * Clear selection list
     */
    clearSelection: function() {
        
        var need_event = this.selected_objects.length > 0;
        
        for (idx in this.selected_objects) {
            this.selected_objects[idx]._setSelected(false);
        }
        
        this.selected_objects.splice(0, this.selected_objects.length);
        
        if (need_event) this._fireSelectionChanged();
    },
    
    // -------- input processing -----------
    onMouseMove: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        this.mouse_pos.x = x;
        this.mouse_pos.y = y;
        
        if ((this.edit_mode == SCgEditMode.SCgModeSelect) && this.focused_object && (this.focused_object.sc_type & sc_type_node)) {
            this.focused_object.setPosition(new SCg.Vector3(x, y, 0));
            this.updateObjectsVisual();
        }
        
        if (this.edit_mode == SCgEditMode.SCgModeEdge) {
            this.render.updateDragLine();
        }
    },
    
    onMouseDown: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        // append new line point
        if (!this.pointed_object && this.edit_mode == SCgEditMode.SCgModeEdge) {
            this.drag_line_points.push({x: x, y: y, idx: this.drag_line_points.length});
        }
    },
    
    onMouseUp: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        if (!this.pointed_object)
            this.clearSelection();
    },
    
    onMouseDoubleClick: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        if (this.edit_mode == SCgEditMode.SCgModeSelect) {
            if (this.pointed_object)
                return; // do nothing
            
            this.createNode(sc_type_node | sc_type_const, new SCg.Vector3(x, y, 0), '');
            this.updateRender();
        }
        
    },
    
    
    onMouseOverObject: function(obj) {
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        this.pointed_object = obj;
    },
    
    onMouseOutObject: function(obj) {
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        this.pointed_object = null;
    },
    
    onMouseDownObject: function(obj) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        if (this.edit_mode == SCgEditMode.SCgModeSelect)
            this.focused_object = obj;
            
        if (this.edit_mode == SCgEditMode.SCgModeEdge) {
            
            // start new edge
            if (!this.edge_data.source) {
                this.edge_data.source = obj;
                this.drag_line_points.push({x: this.mouse_pos.x, y: this.mouse_pos.y, idx: this.drag_line_points.length});
            } else {
                // source and target must be not equal
                if (this.edge_data.source != obj) {
                    this.createEdge(this.edge_data.source, obj, sc_type_arc_pos_const_perm);
                    this.edge_data.source = this.edge_data.target = null;
                    
                    this.drag_line_points.splice(0, this.drag_line_points.length);
                    
                    this.updateRender();
                    this.render.updateDragLine();
                }
            }
        }
            
    },
    
    onMouseUpObject: function(obj) {
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        if (this.edit_mode == SCgEditMode.SCgModeSelect) {
            if (obj == this.focused_object) {
                this.clearSelection();
                this.appendSelection(obj);
                this.updateObjectsVisual();
            }
        
            this.focused_object = null;
        }
    },
    
    onKeyDown: function(key_code) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return false; // do nothing
        
        // revert changes on escape key
        if (key_code == KeyCode.Escape) {
            if (this.edit_mode == SCgEditMode.SCgModeEdge)
            {
                this.resetEdgeMode();
                return true;
            }
        }
        
        return false;
    },
    
    onKeyUp: function(key_code) {
        if (this.modal != SCgModalMode.SCgModalNone) return false; // do nothing
        
        return false;
    },
    
    // -------- edit --------------
    /**
     * Setup new edit mode for scene. Calls from user interface
     * @param {SCgEditMode} mode New edit mode
     */
    setEditMode: function(mode) {
        
        if (this.edit_mode == mode) return; // do nothing
        
        this.edit_mode = mode;
        
        this.focused_object = null;
        this.edge_data.source = null; this.edge_data.target = null;
        
        this.resetEdgeMode();
    },
    
    /** 
     * Changes modal state of scene. Just for internal usage
     */
    setModal: function(value) {
        this.modal = value;
        this._fireModalChanged();
    },
    
    /**
     * Reset edge creation mode state
     */
    resetEdgeMode: function() {
        this.drag_line_points.splice(0, this.drag_line_points.length);
        this.render.updateDragLine();
        
        this.edge_data.source = this.edge_data.target = null;
    },
    
    /**
     * Revert drag line to specified point. All drag point with index >= idx will be removed
     * @param {Integer} idx Index of drag point to revert.
     */
    revertDragPoint: function(idx) {
        if (this.edit_mode != SCgEditMode.SCgModeEdge) {
            SCgDebug.error('Work with drag point in incorrect edit mode');
            return;
        }
        
        this.drag_line_points.splice(idx, this.drag_line_points.length - idx);
        
        if (this.drag_line_points.length == 0) {
            this.edge_data.source = this.edge_data.target = null;
        }
        this.render.updateDragLine();
    },
        
    // ------------- events -------------
    _fireSelectionChanged: function() {
        if (this.event_selection_changed)
            this.event_selection_changed();
    },
    
    _fireModalChanged: function() {
        if (this.event_modal_changed)
            this.event_modal_changed();
    }
};


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
            node_layout.object.setPosition(new SCg.Vector3(node_layout.x, node_layout.y, 0));
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
    this.scene.updateObjectsVisual();
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

        this.editor = new SCg.Editor();
        this.editor.init({containerId: config.container});
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
                this.editor.scene.appendNode(model_node);
                
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

                    this.editor.scene.appendEdge(model_edge);
                    
                    elements[obj.id] = model_edge;
                } 
            }
        }
        
        if (edges.length > 0)
            alert("error");
        
        this.editor.render.update();
        this.editor.scene.layout();
    },

    /**
     * Destroy window
     * @return {Boolean}
     */
    destroy : function(){
        delete this.editor;
        return true;
    },


    /**
     * Emit translate identifiers
     */
    translateIdentifiers    : function(language){
        
        var self = this;
        
        SCWeb.core.Translation.translate(this.editor.scene.getScAddrs(), language, function(namesMap) {
            for (addr in namesMap) {
                var obj = self.editor.scene.getObjectByScAddr(addr);
                if (obj) {
                    obj.text = namesMap[addr];
                }
            }
            
            self.editor.render.updateTexts();
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


