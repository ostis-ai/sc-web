var SCg = SCg || { version: "0.1.0" };

SCg.Editor = function() {

    this.render = null;
    this.scene = null;
};

SCg.Editor.prototype = {


    init: function(params)
    {
        this.typesMap = {
            'scg-type-node': sc_type_node,
            'scg-type-node-const': sc_type_node | sc_type_const,
            'scg-type-node-const-group': sc_type_node | sc_type_const | sc_type_node_class,
            'scg-type-node-const-abstract': sc_type_node | sc_type_const | sc_type_node_abstract,
            'scg-type-node-const-material': sc_type_node | sc_type_const | sc_type_node_material,
            'scg-type-node-const-norole': sc_type_node | sc_type_const | sc_type_node_norole,
            'scg-type-node-const-role': sc_type_node | sc_type_const | sc_type_node_role,
            'scg-type-node-const-struct': sc_type_node | sc_type_const | sc_type_node_struct,
            'scg-type-node-const-tuple': sc_type_node | sc_type_const | sc_type_node_tuple,
            'scg-type-node-var': sc_type_node | sc_type_var,
            'scg-type-node-var-group': sc_type_node | sc_type_var | sc_type_node_class,
            'scg-type-node-var-abstract': sc_type_node | sc_type_var | sc_type_node_abstract,
            'scg-type-node-var-material': sc_type_node | sc_type_var | sc_type_node_material,
            'scg-type-node-var-norole': sc_type_node | sc_type_var | sc_type_node_norole,
            'scg-type-node-var-role': sc_type_node | sc_type_var | sc_type_node_role,
            'scg-type-node-var-struct': sc_type_node | sc_type_var | sc_type_node_struct,
            'scg-type-node-var-tuple': sc_type_node | sc_type_var | sc_type_node_tuple,
            'scg-type-edge-common': sc_type_edge_common,
            'scg-type-arc-common': sc_type_arc_common,
            'scg-type-arc-common-access': sc_type_arc_access,
            'scg-type-edge-const': sc_type_edge_common | sc_type_const,
            'scg-type-arc-const': sc_type_arc_common | sc_type_const,
            'scg-type-arc-const-perm-pos-access': sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm,
            'scg-type-arc-const-perm-neg-access': sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_perm,
            'scg-type-arc-const-perm-fuz-access': sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_perm,
            'scg-type-arc-const-temp-pos-access': sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_temp,
            'scg-type-arc-const-temp-neg-access': sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_temp,
            'scg-type-arc-const-temp-fuz-access': sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_temp,
            'scg-type-edge-var': sc_type_edge_common | sc_type_var,
            'scg-type-arc-var': sc_type_arc_common | sc_type_var,
            'scg-type-arc-var-perm-pos-access': sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm,
            'scg-type-arc-var-perm-neg-access': sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_perm,
            'scg-type-arc-var-perm-fuz-access': sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_perm,
            'scg-type-arc-var-temp-pos-access': sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_temp,
            'scg-type-arc-var-temp-neg-access': sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_temp,
            'scg-type-arc-var-temp-fuz-access': sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_temp
        };
        
        this.render = new SCg.Render();
        this.scene = new SCg.Scene( {render: this.render } );
        this.scene.init();
        
        this.render.scene = this.scene;
        this.render.init(params);
        
        this.containerId = params.containerId;

        if (params.autocompletionVariants)
            this.autocompletionVariants = params.autocompletionVariants;
        if (params.translateToSc)
            this.translateToSc = params.translateToSc;
        if (params.resolveControls)
            this.resolveControls = params.resolveControls;

        this.canEdit = params.canEdit ? true : false;
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
        $(tools_container).load('static/components/html/scg-tools-panel.html', function() {
             $.ajax({
                    url: "static/components/html/scg-types-panel-nodes.html", 
                    dataType: 'html',
                    success: function(response) {
                           self.node_types_panel_content = response;
                    },
                    error: function() {
                        SCgDebug.error("Error to get nodes type change panel");
                    },
                    complete: function() {
                        $.ajax({
                                url: "static/components/html/scg-types-panel-edges.html", 
                                dataType: 'html',
                                success: function(response) {
                                       self.edge_types_panel_content = response;
                                },
                                error: function() {
                                        SCgDebug.error("Error to get edges type change panel");
                                },
                                complete: function() {
                                    self.bindToolEvents();
                                }
                            });
                    }
                });
            
            if (!self.canEdit) {
                self.hideTool(self.toolEdge());
                self.hideTool(self.toolBus());
                self.hideTool(self.toolContour());
                self.hideTool(self.toolChangeIdtf());
                self.hideTool(self.toolChangeType());
                self.hideTool(self.toolSetContent());
                self.hideTool(self.toolDelete());
                self.hideTool(self.toolOpen());
                self.hideTool(self.toolIntegrate());
            }

            if (self.resolveControls)
                self.resolveControls(tools_container);
        });
        
        
        var self = this;
        this.scene.event_selection_changed = function() {
            self.onSelectionChanged();
        }
        this.scene.event_modal_changed = function() {
            self.onModalChanged();
        }
    },
    
    hideTool: function(tool) {
        tool.addClass('hidden');
    },
    
    showTool: function(tool) {
        tool.removeClass('hidden');
    },

    toggleTool: function(tool) {
        tool.toggleClass('hidden');
    },
    
    tool: function(name) {
        return $('#' + this.containerId).find('#scg-tool-' + name);
    },

    toolSwitch: function() {
        return this.tool('switch');
    },
    
    toolSelect: function() {
        return this.tool('select');
    },
    
    toolEdge: function() {
        return this.tool('edge');
    },
    
    toolBus: function() {
        return this.tool('bus');
    },
    
    toolContour: function() {
        return this.tool('contour');
    },
    
    toolLink: function() {
        return this.tool('link');
    },
    
    toolChangeIdtf: function() {
        return this.tool('change-idtf');
    },
    
    toolChangeType: function() {
        return this.tool('change-type');
    },
    
    toolSetContent: function() {
        return this.tool('set-content');
    },
    
    toolDelete: function() {
        return this.tool('delete');
    },
    
    toolIntegrate: function() {
        return this.tool('integrate');
    },
    
    toolOpen: function() {
        return this.tool('open');
    },
    
    toolZoomIn: function() {
        return this.tool('zoomin');
    },
    
    toolZoomOut: function() {
        return this.tool('zoomout');
    },
    
    /**
     * Bind events to panel tools
     */
    bindToolEvents: function() {
        
        var self = this;
        var container = '#' + this.containerId;
        var cont = $(container);
            
        var select = this.toolSelect();
        select.button('toggle');
        
        // handle clicks on mode change
        this.toolSwitch().click(function() {
            var tools = [self.toolEdge(),
                        self.toolContour(),
                        self.toolBus(),
                        self.toolChangeIdtf(),
                        self.toolChangeType(),
                        self.toolSetContent(),
                        self.toolDelete(),
                        self.toolOpen(),
                        self.toolIntegrate()];
            for (var button = 0 ; button < tools.length ; button++){
                self.toggleTool(tools[button]);
            }
        });
        select.click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeSelect);
        });
        select.dblclick(function() {
            self.scene.setModal(SCgModalMode.SCgModalType);
            self.onModalChanged();
            var tool = $(this);
            function stop_modal() {
                tool.popover('destroy');
                self.scene.setEditMode(SCgEditMode.SCgModeSelect);
                self.scene.setModal(SCgModalMode.SCgModalNone);
            }
            el = $(this);
            el.popover({
                content: self.node_types_panel_content,
                container: container,
                title: 'Change type',
                html: true,
                delay: {show: 500, hide: 100}
            }).popover('show');
            cont.find('.popover-title').append('<button id="scg-type-close" type="button" class="close">&times;</button>');
            $(container + ' #scg-type-close').click(function() {
                stop_modal();
            });
            $(container + ' .popover .btn').click(function() {
                SCgTypeNodeNow = self.typesMap[$(this).attr('id')];
                stop_modal();
            });   
        });
        this.toolEdge().click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeEdge);
        });
        this.toolEdge().dblclick(function() {
            self.scene.setModal(SCgModalMode.SCgModalType);
            self.onModalChanged();
            var tool = $(this);
            function stop_modal() {
                tool.popover('destroy');
                self.scene.setEditMode(SCgEditMode.SCgModeEdge);
                self.scene.setModal(SCgModalMode.SCgModalNone);
            }
            el = $(this);
            el.popover({
                content: self.edge_types_panel_content,
                container: container,
                title: 'Change type',
                html: true,
                delay: {show: 500, hide: 100}
            }).popover('show');
            cont.find('.popover-title').append('<button id="scg-type-close" type="button" class="close">&times;</button>');
            $(container + ' #scg-type-close').click(function() {
                stop_modal();
            });
            $(container + ' .popover .btn').click(function() {
                SCgTypeEdgeNow = self.typesMap[$(this).attr('id')];
                stop_modal();
            });   
        });
        this.toolBus().click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeBus);
        });
        this.toolContour().click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeContour);
        });
        this.toolLink().click(function() {
            self.scene.setEditMode(SCgEditMode.SCgModeLink);
        });
        this.toolChangeIdtf().click(function() {
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
            input.val(self.scene.selected_objects[0].text);
            
            // Fix for chrome: http://stackoverflow.com/questions/17384464/jquery-focus-not-working-in-chrome
            setTimeout(function(){
                input.focus();
            }, 1);
            input.keypress(function (e) {
                if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                    
                    if (e.keyCode == KeyCode.Enter) {
                        var obj = self.scene.selected_objects[0];
                        if (obj.text != input.val()){
                            self.scene.commandManager.execute(new SCgCommandChangeIdtf(obj, obj.text, input.val()));
                        }
                    }
                    stop_modal();
                    e.preventDefault();
                } 
                
            });

            if (self.autocompletionVariants) {
                var types = {
                    local : function(text){
                        return "[" + text + "]";
                    },
                    remote : function(text){
                        return "<" + text + ">";
                    }

                };

                input.typeahead({
                        minLength: 1,
                        highlight: true
                    },
                    {
                        name: 'idtf',
                        source: function(str, callback) {
                            self._idtf_item = null;
                            self.autocompletionVariants(str, callback, { editor: self });
                        },
                        displayKey: 'name',
                        templates: {
                            suggestion : function(item){
                                var decorator = types[item.type];
                                if(decorator)
                                    return decorator(item.name);

                                return item.name;
                            }
                        }
                    }
                ).bind('typeahead:selected', function(evt, item, dataset) {
                    if (item && item.addr) {
                        self._idtf_item = item;
                    }
                    evt.stopPropagation();
                    $('.typeahead').val('');
                });
            }
            
            // process controls
            $(container + ' #scg-change-idtf-apply').click(function() {
                var obj = self.scene.selected_objects[0];
                if (obj.text != input.val() && !self._idtf_item) {
                    self.scene.commandManager.execute(new SCgCommandChangeIdtf(obj, obj.text, input.val()));
                }
                if (self._idtf_item) {
                    window.sctpClient.get_element_type(self._idtf_item.addr).done(function (t) {
                        self.scene.commandManager.execute(new SCgCommandGetNodeFromMemory(obj,
                            obj.sc_type,
                            t,
                            obj.text,
                            input.val(),
                            obj.sc_addr,
                            self._idtf_item.addr,
                            self.scene));
                        stop_modal();
                    });
                } else
                    stop_modal();
            });
            $(container + ' #scg-change-idtf-cancel').click(function() {
                stop_modal();
            });
            
        });
        
        this.toolChangeType().click(function() {
            self.scene.setModal(SCgModalMode.SCgModalType);
            
           if (self.scene.selected_objects.length >= 1) {
            var typeMask = self.scene.selected_objects[0].sc_type & sc_type_arc_mask?  sc_type_arc_mask :
                self.scene.selected_objects[0].sc_type & sc_type_node ?
                    sc_type_node : 0;
               if(!self.scene.selected_objects.every(function(obj){
                return obj.sc_type & typeMask;
               })){
                   
               SCgDebug.error('Something wrong with type selection');
                return;
            }
            }
            
            var tool = $(this);
            
            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
            }
            
            var obj = self.scene.selected_objects[0];
            
            el = $(this);
            el.popover({
                    content: (obj instanceof SCg.ModelEdge) ? self.edge_types_panel_content : self.node_types_panel_content,
                    container: container,
                    title: 'Change type',
                    html: true,
                    delay: {show: 500, hide: 100}
                  }).popover('show');
                  
            cont.find('.popover-title').append('<button id="scg-type-close" type="button" class="close">&times;</button>');
                  
            $(container + ' #scg-type-close').click(function() {
                stop_modal();
            });

            $(container + ' .popover .btn').click(function() {
                var obj = self.scene.selected_objects[0];
                var newType = self.typesMap[$(this).attr('id')];
                if (obj.sc_type != newType){
                    self.scene.commandManager.execute(new SCgCommandChangeType(obj, obj.sc_type, newType));
                }
                self.scene.updateObjectsVisual();
                stop_modal();
            });
        });


        this.toolSetContent().click(function() {
            var tool = $(this);
            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
            }

            self.scene.setModal(SCgModalMode.SCgModalIdtf);
            $(this).popover({container: container});
            $(this).popover('show');

            var input = $(container + ' #scg-set-content-input');
            var input_content = $(container + " input#content[type='file']");
            var input_content_type = $(container + " #scg-set-content-type");
            input.val(self.scene.selected_objects[0].content);
            input_content_type.val(self.scene.selected_objects[0].contentType);

            // process controls
            $(container + ' #scg-set-content-apply').click(function() {
                var obj = self.scene.selected_objects[0];
                var file = input_content[0].files[0];
                if (file != undefined){
                    var fileReader = new FileReader();
                    fileReader.onload = function() {
                        if (obj.content != this.result || obj.contentType != 'string') {
                            self.scene.commandManager.execute(new SCgCommandChangeContent(obj,
                                obj.content,
                                this.result,
                                obj.contentType,
                                'string'));
                        }
                        stop_modal();
                    };
                    fileReader.readAsArrayBuffer(file);
                } else {
                    if (obj.content != input.val() || obj.contentType != input_content_type.val()) {
                        self.scene.commandManager.execute(new SCgCommandChangeContent(obj,
                            obj.content,
                            input.val(),
                            obj.contentType,
                            input_content_type.val()));
                    }
                    stop_modal();
                }
            });
            $(container + ' #scg-set-content-cancel').click(function() {
                stop_modal();
            });
        });


        this.toolDelete().click(function() {
            self.scene.deleteObjects(self.scene.selected_objects.slice(0, self.scene.selected_objects.length));
            self.scene.clearSelection();
        });


        //problem with opening the same doc twice
        this.toolOpen().click(function() {
            var document = $(this)[0].ownerDocument;
            var open_dialog = document.getElementById("scg-tool-open-dialog");

            open_dialog.onchange = function(){
                return GwfFileLoader.load({
                    file: open_dialog.files[0],
                    render : self.render});

            }
            ScgObjectBuilder.scene = self.scene;
            var result = open_dialog.click();
        });
        
        this.toolIntegrate().click(function() {
            self._disableTool(self.toolIntegrate());
            if (self.translateToSc)
                self.translateToSc(self.scene, function() {
                    self._enableTool(self.toolIntegrate());
                });
        });
        
        this.toolZoomIn().click(function() {
            self.render.changeScale(1.1);
        });
        
        this.toolZoomOut().click(function() {
            self.render.changeScale(0.9);
        });


        // initial update
        self.onModalChanged();
        self.onSelectionChanged();
    },
    
    /**
     * Function that process selection changes in scene
     * It updated UI to current selection
     */
    onSelectionChanged: function() {
        
        if (this.scene.selected_objects.length == 1 && !(this.scene.selected_objects[0] instanceof SCg.ModelContour)) {

            if (!this.scene.selected_objects[0].sc_addr) {
                this._enableTool(this.toolChangeIdtf());
                if (this.scene.selected_objects[0] instanceof SCg.ModelLink){
                    this._enableTool(this.toolSetContent());
                } else {
                    this._enableTool(this.toolChangeType());
                }
            }
        } else {
            if (this.scene.selected_objects[0] instanceof SCg.ModelContour) {
                this._enableTool(this.toolChangeIdtf());
            } else {
                this._disableTool(this.toolChangeIdtf());
            }
            this._disableTool(this.toolChangeType());
            this._disableTool(this.toolSetContent());
        }

        /**check*/
        var lastIndex = this.scene.selected_objects.length - 1;
        if(this.scene.selected_objects.length>1) {
            if (!this.scene.selected_objects.some(function (obj) {
                    return obj.sc_addr;
                })) {
                var typeMask = this.scene.selected_objects[lastIndex].sc_type & sc_type_arc_mask ? sc_type_arc_mask :
                    this.scene.selected_objects[lastIndex].sc_type & sc_type_node ?
                        sc_type_node : 0;
                if (this.scene.selected_objects[lastIndex - 1].sc_type & typeMask) {
                    this._enableTool(this.toolChangeType());
                } else {
                    this._disableTool(this.toolChangeType());
                }
            } else if (this.scene.selected_objects.length == 0) {
                this._disableTool(this.toolChangeType());
            }
        }
        /**a*/
        if (this.scene.selected_objects.length > 0) {
            this._enableTool(this.toolDelete());
        } else {
            this._disableTool(this.toolDelete());
        }
    },

    
    /**
     * Function, that process modal state changes of scene
     */
    onModalChanged: function() {
        var self = this;
        function update_tool(tool) {
            if (self.scene.modal != SCgModalMode.SCgModalNone)
                self._disableTool(tool);
            else
                self._enableTool(tool);
        }
        
        update_tool(this.toolSelect());
        update_tool(this.toolEdge());
        update_tool(this.toolBus());
        update_tool(this.toolContour());
        update_tool(this.toolLink());
        update_tool(this.toolChangeIdtf());
        update_tool(this.toolChangeType());
        update_tool(this.toolSetContent());
        update_tool(this.toolDelete());
        update_tool(this.toolZoomIn());
        update_tool(this.toolZoomOut());
    },

    collectIdtfs : function(keyword){
        var self = this;
        var selected_obj = self.scene.selected_objects[0];
        var relative_objs = undefined;

        if(selected_obj instanceof SCg.ModelNode){
            relative_objs = self.scene.nodes;
        }
        if(!relative_objs)
            return [];

        var match = function(text){
            var pattern = new RegExp(keyword, 'i');
            if(text && pattern.test(text))
                return true;
            return false;
        }

        var contains = function(value, array){
            var len = array.length;
            while(len--){
                if(array[len].name === value.name)
                    return true
            }
            return false;
        }
        var matches = [];
        $.each(relative_objs, function(index, item){
            if(match(item['text']))
            {
                var obj = {
                    name: item['text'],
                    type: 'local'
                }
                if(!contains(obj, matches))
                    matches.push(obj);
            }

        });
        return matches;
    },

    /**
     * function(keyword, callback, args)
     * here is default implementation
     * */

    autocompletionVariants : function(keyword, callback, args){
        var self = this;
        callback(self.collectIdtfs(keyword));
    },

    // -------------------------------- Helpers ------------------
    /**
     * Change specified tool state to disabled
     */
    _disableTool: function(tool) {
        tool.attr('disabled', 'disabled');
    },
    
    /**
     * Change specified tool state to enabled
     */
    _enableTool: function(tool) {
         tool.removeAttr('disabled');
    }
};
