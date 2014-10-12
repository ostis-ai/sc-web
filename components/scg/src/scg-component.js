SCgComponent = {
    ext_lang: 'scg_code',
    formats: ['format_scg_json'],
    factory: function(sandbox) {
        return new scgViewerWindow(sandbox);
    }
};

/**
 * scgViewerWindow
 * @param config
 * @constructor
 */
var scgViewerWindow = function(sandbox) {

    this.domContainer = sandbox.container;
    this.sandbox = sandbox;
    this.tree = new SCg.Tree();
    this.editor = new SCg.Editor();
    
    var self = this;

    var autocompletionVariants = function(keyword, callback, self) {

        SCWeb.core.Server.findIdentifiersSubStr(keyword, function(data) {
            keys = [];
            for (key in data) {
                var list = data[key];
                for (idx in list) {
                    var value = list[idx]
                    keys.push({name: value[1], addr: value[0], group: key});
                }
            }

            callback(keys);
        });
    };
    
    var translateToSc = function(scene, callback) {
        if (!self.sandbox.is_struct)
            throw "Invalid state. Trying translate sc-link into sc-memory";
        
        var translateObj = function(obj) {
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.sandbox.addr, obj.sc_addr);
        };
                
        var dfdNodes = jQuery.Deferred();
        
        // translate nodes
        var nodes = scene.nodes.slice();
        $.when.apply($, nodes.map(function(node) {
            var dfd = new jQuery.Deferred();
            
            if (!node.sc_addr) {
                window.sctpClient.create_node(node.sc_type).done(function (r) {
                    node.setScAddr(r.result);
                    node.setObjectState(SCgObjectState.NewInMemory);
                    
                    translateObj(node);
                    dfd.resolve();
                });
            } else
                dfd.resolve();
            
            return dfd.promise();
        })).done(function() {
            
             // translate edges
            var edges = scene.edges.slice();
            $.when.apply($, edges.map(function (edge) {
                var dfd = new jQuery.Deferred();

                if (!edge.sc_addr) {
                    var src = edge.source.sc_addr;
                    var trg = edge.target.sc_addr;

                    if (src && trg) {
                        window.sctpClient.create_arc(edge.sc_type, src, trg).done(function(r) {
                            edge.setScAddr(r.result);
                            edge.setObjectState(SCgObjectState.NewInMemory);

                            translateObj(edge);
                            translated = true;
                            dfd.resolve();
                        });
                    } else
                        dfd.resolve();
                } else
                    dfd.resolve();

                return dfd.promise();
            })).done(function() {
                scene.updateRender();
            });
        });
        
       
    };
    
    this.editor.init(
        {
            containerId: sandbox.container,
            autocompletionVariants : autocompletionVariants,
            translateToSc: translateToSc,
            canEdit: this.sandbox.canEdit()
        }
    );


    this.receiveData = function(data) {
        var dfd = new jQuery.Deferred();
    
        /*this.collectTriples(data);
        this.tree.build(this.triples);*/
        this._buildGraph(data);

        dfd.resolve();
        return dfd.promise();
    };

    this.collectTriples = function(data) {

        this.triples = [];
        
        var elements = {};
        var edges = [];
        for (var i = 0; i < data.length; i++) {
            var el = data[i];

            elements[el.id] = el;
            if (el.el_type & sc_type_arc_mask) {
                edges.push(el);
            }
        }

        var founded = true;
        while (edges.length > 0 && founded) {
            founded = false;
            for (idx in edges) {
                var obj = edges[idx];
                var beginEl = elements[obj.begin];
                var endEl = elements[obj.end];

                // try to get begin and end object for arc
                if (beginEl && endEl) {
                    founded = true;
                    edges.splice(idx, 1);
                    
                    this.triples.push([beginEl, {type: obj.el_type, addr: obj.id}, endEl]);
                } 
            }
        }

        alert(this.triples.length);
    };

    this._buildGraph = function(data) {
        
        var elements = {};
        var edges = new Array();
        for (var i = 0; i < data.length; i++) {
            var el = data[i];
            
            if (elements.hasOwnProperty(el.id))
                continue;
                
            if (this.editor.scene.objects.hasOwnProperty(el.id)) {
                elements[el.id] = this.editor.scene.objects[el.id];
                continue;
            }
            
            if (el.el_type & sc_type_node || el.el_type & sc_type_link) {
                var model_node = this.editor.scene.createNode(el.el_type, new SCg.Vector3(10 * Math.random(), 10 * Math.random(), 0), '');
                model_node.setScAddr(el.id);
                model_node.setObjectState(SCgObjectState.FromMemory);
                
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
                    
                    var model_edge = this.editor.scene.createEdge(beginNode, endNode, obj.el_type);
                    model_edge.setScAddr(obj.id);
                    model_edge.setObjectState(SCgObjectState.FromMemory);
                    
                    elements[obj.id] = model_edge;
                } 
            }
        }
        
        if (edges.length > 0)
            alert("error");
        
        this.editor.render.update();
        this.editor.scene.layout();
    };

    this.destroy = function(){
        delete this.editor;
        return true;
    };

    this.getObjectsToTranslate = function() {
        return this.editor.scene.getScAddrs();
    };

    this.applyTranslation = function(namesMap) {
        for (addr in namesMap) {
            var obj = this.editor.scene.getObjectByScAddr(addr);
            if (obj) {
                obj.text = namesMap[addr];
            }
        }
            
        this.editor.render.updateTexts();
    };
    
    var self = this;
    this.updateQueue = [];
    this.elementsQueue = [];
    
    this.requestUpdate = function() {
        if (!self.updateTimeOut && (self.updateQueue.length > 0 || self.elementsQueue.length > 0))
        {
            self.updateTimeOut = window.setTimeout(self.processUpdateQueue, 100);
            self.editor.render.update();
            self.editor.scene.layout();
        }
    }
    
    this.processUpdateQueue = function() {
        
        window.clearTimeout(self.updateTimeOut);
        delete self.updateTimeOut;
        
        var tasks = []
        for (var i = 0; i < Math.min(50, self.updateQueue.length); ++i)
            tasks.push(self.updateQueue.shift());
            
        (function (tasks) {
                
            var processTaskFn = function() {
                if (tasks.length == 0) {
                    self.requestUpdate();
                } else {
                    var task = tasks.shift();
                    
                    (function(added, element) {
                        var obj = self.editor.scene.getObjectByScAddr(element);
                        if (obj) {
                            if (!added) {
                                self.editor.scene.deleteObjects([obj]);
                                processTaskFn();
                            }
                        } else {
                            window.sctpClient.get_element_type(element).done(function (res) {
                                
                                self.sandbox.getIdentifier(element, function(idtf) {

                                    var type = res.result;
                                    if (type & sc_type_node || type & sc_type_link) {
                                        self.elementsQueue.push([element, type, idtf]);
                                        processTaskFn();
                                    } else if (type & sc_type_arc_mask) {
                                        window.sctpClient.get_arc(element).done(function (res) {
                                            self.elementsQueue.push([element, type, idtf, res.result[0], res.result[1]]);
                                            processTaskFn();
                                        });
                                    }
                                });
                            });
                        }
                    })(task[0], task[1]);
                }
            };
            
            processTaskFn();
            
            // append edges
            var elements = [];
            for (var i = 0; i < Math.min(50, self.elementsQueue.length); ++i) 
                elements.push(self.elementsQueue.shift());
            
            while (elements.length > 0) {
                var el = elements.shift();
                var addr = el[0];
                var type = el[1];
                
                if (type & sc_type_node || type & sc_type_link) {
                    var model_node = self.editor.scene.createNode(type, new SCg.Vector3(10 * Math.random(), 10 * Math.random(), 0), '');
                    model_node.setScAddr(addr);
                    model_node.setObjectState(SCgObjectState.FromMemory);
                    model_node.setText(el[2]);
                } else if (type & sc_type_arc_mask) {
                
                    var bObj = self.editor.scene.getObjectByScAddr(el[3]);
                    var eObj = self.editor.scene.getObjectByScAddr(el[4]);

                    if (!bObj || !eObj) {
                        self.elementsQueue.push(el);
                        continue;
                    }

                    var model_edge = self.editor.scene.createEdge(bObj, eObj, type);
                    model_edge.setScAddr(addr);
                    model_edge.setObjectState(SCgObjectState.FromMemory);
                    model_edge.setText(el[2]);
                }
            }
            
            self.requestUpdate();
                            
        })(tasks);
        

        self.requestUpdate();
    };
    
    this.eventStructUpdate = function(added, element, arc) {
        window.sctpClient.get_arc(arc).done(function (r) {
            self.updateQueue.push([added, r.result[1]]);
            self.requestUpdate();
        });
    };

    // delegate event handlers
    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
    this.sandbox.eventApplyTranslation = $.proxy(this.applyTranslation, this);
    this.sandbox.eventStructUpdate = $.proxy(this.eventStructUpdate, this);

    this.sandbox.updateContent();
};



SCWeb.core.ComponentManager.appendComponentInitialize(SCgComponent);
