var SCgEditMode = {
    SCgModeSelect: 0,
    SCgModeEdge: 1,
    SCgModeBus: 2,
    SCgModeContour: 3,
    SCgModeLink: 4,
    
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
    SCgModalType: 2
};

var KeyCode = {
    Escape: 27,
    Enter: 13
};

SCg.Scene = function(options) {

    this.render = options.render;
    this.nodes = [];
    this.links = [];
    this.edges = [];
    this.contours = [];
    this.buses = [];
    
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
    // points of selected line object
    this.line_points = [];
        
    // mouse position
    this.mouse_pos = new SCg.Vector3(0, 0, 0);
    
    // edge source and target
    this.edge_data = {source: null, target: null};
    
    // bus source
    this.bus_data = {source: null, end: null};
    
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
        node.scene = this;
        if (node.sc_addr)
            this.objects[node.sc_addr] = node;
    },
    
    appendLink: function(link) {
        this.links.push(link);
        link.scene = this;
        if (link.sc_addr)
            this.objects[link.sc_addr] = link;
    },

    /**
     * Appends new sc.g-edge to scene
     * @param {SCg.ModelEdge} edge Edge to append
     */
    appendEdge: function(edge) {
        this.edges.push(edge);
        edge.scene = this;
        if (edge.sc_addr)
            this.objects[edge.sc_addr] = edge;
    },
     
    /**
     * Append new sc.g-contour to scene
     * @param {SCg.ModelContour} contour Contour to append
     */
    appendContour: function(contour) {
        this.contours.push(contour);
        contour.scene = this;
        if (contour.sc_addr)
            this.objects[contour.sc_addr] = contour;
    },
    
    /**
     * Append new sc.g-contour to scene
     * @param {SCg.ModelContour} contour Contour to append
     */
    appendBus: function(bus) {
        this.buses.push(bus);
        bus.scene = this;
    },
    
    /**
     * Remove object from scene.
     * @param {SCg.ModelObject} obj Object to remove
     */
    removeObject: function(obj) {
        function remove_from_list(obj, list) {
            var idx = list.indexOf(obj);
            if (idx < 0) {
                SCgDebug.error("Can't find object for remove");
                return;
            }
            
            list.splice(idx, 1);
        }
        
        if (obj instanceof SCg.ModelNode) {
            remove_from_list(obj, this.nodes);
        }else if (obj instanceof SCg.ModelLink) {
            remove_from_list(obj, this.links);
        } else if (obj instanceof SCg.ModelEdge) {
            remove_from_list(obj, this.edges);
        } else if (obj instanceof SCg.ModelContour) {
            this.deleteObjects(obj.childs);
            remove_from_list(obj, this.contours);
        } else if (obj instanceof SCg.ModelBus) {
            remove_from_list(obj, this.buses);
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
                        position: pos.clone(), 
                        scale: new SCg.Vector2(20, 20),
                        sc_type: sc_type,
                        text: text
                    });
        this.appendNode(node);
        
        return node;
    },
    
    createLink: function(pos, containerId) {
        var link = new SCg.ModelLink({
            position: pos.clone(),
            scale: new SCg.Vector2(50, 50),
            sc_type: sc_type_link,
            containerId: containerId
        });
        this.appendLink(link);
        
        return link;
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
    
    createBus: function(source) {
        var bus = new SCg.ModelBus({
                                      source: source
                                  });
        this.appendBus(bus);
        
        return bus;
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

            if (root.bus)
                collect_objects(container, root.bus);
        }
        
        // collect objects for remove
        var objs = [];
        
        // collect objects for deletion
        for (var idx in objects)
            collect_objects(objs, objects[idx]);

        // delete objects
        for (var idx in objs) {
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
        
        this.selectionChanged();
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
        
        this.selectionChanged();
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
        
        if (need_event) this.selectionChanged();
    },
    
    selectionChanged: function() {
        this._fireSelectionChanged();
        
        this.line_points.splice(0, this.line_points.length);
        // if selected any of line objects, then create controls to control it
        if (this.selected_objects.length == 1) {
            var obj = this.selected_objects[0];
            
            if (obj instanceof SCg.ModelEdge || obj instanceof SCg.ModelBus || obj instanceof SCg.ModelContour) { /* @todo add contour and bus */
                for (idx in obj.points) {
                    this.line_points.push({pos: obj.points[idx], idx: idx});
                }
            }
        }
        
        this.render.updateLinePoints();
        this.updateObjectsVisual();
    },
    
    // -------- input processing -----------
    onMouseMove: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        var offset = new SCg.Vector3(x - this.mouse_pos.x, y - this.mouse_pos.y, 0);

        this.mouse_pos.x = x;
        this.mouse_pos.y = y;
        
        if ((this.edit_mode == SCgEditMode.SCgModeSelect) && this.focused_object) {
            if (this.focused_object.sc_type & (sc_type_node | sc_type_link)) {
                this.focused_object.setPosition(this.focused_object.position.clone().add(offset));
            }
            
            this.updateObjectsVisual();
            this.render.updateLinePoints();
            return true;
        }
        
        if (this.edit_mode == SCgEditMode.SCgModeEdge || this.edit_mode == SCgEditMode.SCgModeBus 
            || this.edit_mode == SCgEditMode.SCgModeContour) {
            this.render.updateDragLine();
            return true;
        }
        
        return false;
    },
    
    onMouseDown: function(x, y) {

        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing

        // append new line point
        if (!this.pointed_object) {
            var isModeEdge = (this.edit_mode == SCgEditMode.SCgModeEdge);
            var isModeContour = (this.edit_mode == SCgEditMode.SCgModeContour);
            var isModeBus = (this.edit_mode == SCgEditMode.SCgModeBus);
            if (isModeContour || (isModeEdge && this.edge_data.source) || (isModeBus && this.bus_data.source)) {
                this.drag_line_points.push({x: x, y: y, idx: this.drag_line_points.length});
                if (isModeBus)
                    this.bus_data.end = {x: x, y: y, idx: this.drag_line_points.length};
                return true;
            }
        }
        
        return false;
    },
    
    onMouseUp: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return false; // do nothing
        
        if (!this.pointed_object) { 
            this.clearSelection();
        }

        this.focused_object = null;
        return false;
    },
    
    onMouseDoubleClick: function(x, y) {
        
        if (this.modal != SCgModalMode.SCgModalNone) return false; // do nothing
        
        if (this.edit_mode == SCgEditMode.SCgModeSelect) {
            if (this.pointed_object)
                return; // do nothing
            
            this.createNode(sc_type_node | sc_type_const, new SCg.Vector3(x, y, 0), '');
            this.updateRender();
            return true;
        }
        if(this.edit_mode == SCgEditMode.SCgModeLink){
            if (this.pointed_object)
                return;

            this.createLink(new SCg.Vector3(x, y, 0), '');
            this.updateRender();

            return true;
        }
        
        return false;
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

        if (this.edit_mode == SCgEditMode.SCgModeSelect) {
            this.focused_object = obj;
            if (obj instanceof SCg.ModelContour || obj instanceof SCg.ModelBus) {
                obj.previousPoint = new SCg.Vector2(this.mouse_pos.x, this.mouse_pos.y);
                return true;
            }
        }

        if (this.edit_mode == SCgEditMode.SCgModeEdge) {

            // start new edge
            if (!this.edge_data.source) {
                this.edge_data.source = obj;
                this.drag_line_points.push({x: this.mouse_pos.x, y: this.mouse_pos.y, idx: this.drag_line_points.length});
                return true;
            } else {
                // source and target must be not equal
                if (this.edge_data.source != obj) {
                    var edge = this.createEdge(this.edge_data.source, obj, sc_type_arc_pos_const_perm);

                    var mouse_pos = new SCg.Vector2(this.mouse_pos.x, this.mouse_pos.y);
                    var start_pos = new SCg.Vector2(this.drag_line_points[0].x, this.drag_line_points[0].y);
                    edge.setSourceDot(this.edge_data.source.calculateDotPos(start_pos));
                    edge.setTargetDot(obj.calculateDotPos(mouse_pos));

                    if (this.drag_line_points.length > 1) {
                        edge.setPoints(this.drag_line_points.slice(1));
                    }
                    this.edge_data.source = this.edge_data.target = null;

                    this.drag_line_points.splice(0, this.drag_line_points.length);

                    this.updateRender();
                    this.render.updateDragLine();
                    return true;
                }
            }
        }
        if (this.edit_mode == SCgEditMode.SCgModeBus) {
        
            if (!this.bus_data.source && !obj.bus && !(obj instanceof SCg.ModelBus)) {
                this.bus_data.source = obj;
                this.drag_line_points.push({x: this.mouse_pos.x, y: this.mouse_pos.y, idx: this.drag_line_points.length});
                return true;
            }
        }
        
        return false;
    },
    
    onMouseUpObject: function(obj) {
        if (this.modal != SCgModalMode.SCgModalNone) return; // do nothing
        
        if (this.edit_mode == SCgEditMode.SCgModeSelect) {
            // case we moved object from contour
            if (obj.contour && !obj.contour.isNodeInPolygon(obj)) {
                obj.contour.removeChild(obj);
            }

            // case we moved object into the contour
            if (!obj.contour && (obj instanceof SCg.ModelNode || obj instanceof SCg.ModelLink)) {
                for (var i = 0; i < this.contours.length; i++) {
                    if (this.contours[i].isNodeInPolygon(obj)) {
                        this.contours[i].addChild(obj);
                    }
                }
            }

            if (obj == this.focused_object) {
                this.clearSelection();
                this.appendSelection(obj);
                this.updateObjectsVisual();
                                
                
            }

            this.focused_object = null;
        }
        
        return true;
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
        
        this.bus_data.source = null;
        
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

        if (this.edit_mode != SCgEditMode.SCgModeEdge && this.edit_mode != SCgEditMode.SCgModeBus && this.edit_mode != SCgEditMode.SCgModeContour) {
            SCgDebug.error('Work with drag point in incorrect edit mode');
            return;
        }
       
        this.drag_line_points.splice(idx, this.drag_line_points.length - idx);
        
        if (this.drag_line_points.length >= 2)
            this.bus_data.end = this.drag_line_points[this.drag_line_points.length - 1];
        else
            this.bus_data.end = null;
        
        if (this.drag_line_points.length == 0) {
            this.edge_data.source = this.edge_data.target = null;
            this.bus_data.source = null;
        }
        this.render.updateDragLine();
    },
    
    /**
     * Update selected line point position
     */
    setLinePointPos: function(idx, pos) {
        if (this.selected_objects.length != 1) {
            SCgDebug.error('Invalid state. Trying to update line point position, when there are no selected objects');
            return;
        }
        
        var edge = this.selected_objects[0];
        if (!(edge instanceof SCg.ModelEdge) && !(edge instanceof SCg.ModelBus) && !(edge instanceof SCg.ModelContour)) {
            SCgDebug.error("Unknown type of selected object");
            return;
        }
        
        if (edge.points.length <= idx) {
            SCgDebug.error('Invalid index of line point');
            return;
        }
        edge.points[idx].x = pos.x;
        edge.points[idx].y = pos.y;
        
        edge.requestUpdate();
        edge.need_update = true;
        edge.need_observer_sync = true;
    
        this.updateObjectsVisual();
        this.render.updateLinePoints();
    },

    finishBusCreation: function() {
        
        var bus = this.createBus(this.bus_data.source);                    
                    
        if (this.drag_line_points.length > 1) {
            bus.setPoints(this.drag_line_points.slice(1));
        }       
        var pos = new SCg.Vector2(this.drag_line_points[0].x, this.drag_line_points[0].y);

        bus.setSourceDot(this.bus_data.source.calculateDotPos(pos));
        bus.setTargetDot(0);
         
        this.bus_data.source = this.bus_data.end = null;

        this.drag_line_points.splice(0, this.drag_line_points.length);

        this.updateRender();
        this.render.updateDragLine();
     },

    finishContourCreation: function() {
        if (this.drag_line_points.length < 3) {
            SCgDebug.error('Set at least 3 points for contour');
            return;
        }

        var polygon =  $.map(this.drag_line_points, function (vertex) {
            return $.extend({}, vertex);
        });

        var contour = new SCg.ModelContour({
            verticies: polygon
        });

        contour.addNodesWhichAreInContourPolygon(this.nodes);
        contour.addNodesWhichAreInContourPolygon(this.links);
        this.appendContour(contour);
        this.pointed_object = contour;
        this.drag_line_points.splice(0, this.drag_line_points.length);
        this.updateRender();
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
