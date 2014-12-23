SCgComponent = {
    ext_lang: 'scg_code',
    formats: ['format_scg_json'],
    struct_support: true,
    factory: function(sandbox) {
        return new scgViewerWindow(sandbox);
    }
};

function scgTranslateToSc(sandbox, scene, callback) {
    if (!sandbox.is_struct)
        throw "Invalid state. Trying translate sc-link into sc-memory";

    var appendToConstruction = function(obj) {
        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, sandbox.addr, obj.sc_addr);
    };

    var dfdNodes = jQuery.Deferred();

    // translate nodes
    var nodes = scene.nodes.slice();
    $.when.apply($, nodes.map(function(node) {
        var dfd = new jQuery.Deferred();

        if (!node.sc_addr) {
            window.sctpClient.create_node(node.sc_type).done(function (r) {
                node.setScAddr(r);
                node.setObjectState(SCgObjectState.NewInMemory);

                appendToConstruction(node);
                dfd.resolve();
            });
        } else {
            dfd.resolve();
        }

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
                        edge.setScAddr(r);
                        edge.setObjectState(SCgObjectState.NewInMemory);

                        appendToConstruction(edge);
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

function scgScStructTranslator(_editor, _sandbox) {
    var r, editor = _editor,
        sandbox = _sandbox,
        tasks = [],
        processBatch = false,
        taskDoneCount = 0;
    
    var processTask = function(task) {
        var addr = task[0];
        var type = task[1];
        
        function resolveIdtf(addr, obj) {
            sandbox.getIdentifier(addr, function(idtf) {
                obj.setText(idtf);
            });
        }
        
        function randomPos() {
            return new SCg.Vector3(100 * Math.random(), 100 * Math.random(), 0);
        }
        
        if (editor.scene.getObjectByScAddr(addr))
            return;
        
        if (type & sc_type_node) {
            var model_node = editor.scene.createNode(type, randomPos(), '');
            model_node.setScAddr(addr);
            model_node.setObjectState(SCgObjectState.FromMemory);
            resolveIdtf(addr, model_node);
            taskDoneCount++;
        } else if (type & sc_type_arc_mask) {
            var bObj = editor.scene.getObjectByScAddr(task[2]);
            var eObj = editor.scene.getObjectByScAddr(task[3]);
            if (!bObj || !eObj) {
                tasks.push(task);
            } else {
                var model_edge = editor.scene.createEdge(bObj, eObj, type);
                model_edge.setScAddr(addr);
                model_edge.setObjectState(SCgObjectState.FromMemory);
                resolveIdtf(addr, model_edge);
                taskDoneCount++;
            }
        } else if (type & sc_type_link) {
            var model_link = editor.scene.createLink(randomPos());
            model_link.setScAddr(addr);
            model_link.setObjectState(SCgObjectState.FromMemory);
            taskDoneCount++;
        }
        
    };
    var processTaskBatch = function(batch) {
        taskDoneCount = 0;
        for (var i = 0; i < batch.length; ++i)
            processTask(batch[i]);
        
        processBatch = false;
        editor.render.update();
        editor.scene.layout();
        
        window.setTimeout(update, 100);
    };
    var addTask = function() {
        tasks.push(Array.prototype.slice.call(arguments));
        update(true);
    };
    var update = function(force) {
        if (!processBatch && tasks.length > 0) {
            processBatch = true;
            if (taskDoneCount > 0 || force) {
                window.setTimeout(function() {
                    processTaskBatch(tasks.splice(0, Math.max(30, tasks.length)));
                }, 100);
            }
        }
    };
    
    var self = this;
    
    return r = {
        removeElement: function(addr) {
            var obj = editor.scene.getObjectByScAddr(addr);
            if (obj)
                editor.scene.deleteObjects([addr]);
        },
        addNode: function(addr, type) {
            addTask.apply(self, arguments);
        },
        addEdge: function(addr, type, src, trg) {
            addTask.apply(self, arguments);
        }
    };
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
    
    this.editor.init(
        {
            containerId: sandbox.container,
            autocompletionVariants : autocompletionVariants,
            translateToSc: function(scene, callback) {
                return scgTranslateToSc(self.sandbox, scene, callback);
            },
            canEdit: this.sandbox.canEdit(),
            resolveControls: this.sandbox.resolveElementsAddr,
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
    this.scStructTranslator = new scgScStructTranslator(this.editor, this.sandbox);
    
    this.eventStructUpdate = function(added, element, arc) {
        window.sctpClient.get_arc(arc).done(function (r) {
            var el = r[1];
            if (!added) {
                self.scStructTranslator.removeElement(el);
            } else {
                window.sctpClient.get_element_type(el).done(function(t) {
                    if (t & (sc_type_node | sc_type_link)) {
                        self.scStructTranslator.addNode(el, t);
                    } else if (t & sc_type_arc_mask) {
                        window.sctpClient.get_arc(el).done(function(r) {
                            self.scStructTranslator.addEdge(el, t, r[0], r[1]);
                        });
                    } else
                        throw "Unknown element type " + t;
                });
            }
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
