var SCg = SCg || {
    version: "0.1.0"
};

SCg.Editor = function () {

    this.render = null;
    this.scene = null;
};

SCg.Editor.prototype = {


    init: function (params) {
        this.typesMap = {
            'scg-type-node': sc_type_node,
            'scg-type-const-node': sc_type_const_node,
            'scg-type-const-node-class': sc_type_const_node_class,
            'scg-type-const-node-superclass': sc_type_const_node_superclass,
            'scg-type-const-node-material': sc_type_const_node_material,
            'scg-type-const-node-non-role': sc_type_const_node_non_role,
            'scg-type-const-node-role': sc_type_const_node_role,
            'scg-type-const-node-structure': sc_type_const_node_structure,
            'scg-type-const-node-tuple': sc_type_const_node_tuple,
            'scg-type-var-node': sc_type_var_node,
            'scg-type-var-node-class': sc_type_var_node_class,
            'scg-type-var-node-superclass': sc_type_var_node_superclass,
            'scg-type-var-node-material': sc_type_var_node_material,
            'scg-type-var-node-non-role': sc_type_var_node_non_role,
            'scg-type-var-node-role': sc_type_var_node_role,
            'scg-type-var-node-structure': sc_type_var_node_structure,
            'scg-type-var-node-tuple': sc_type_var_node_tuple,
            'scg-type-common-edge': sc_type_common_edge,
            'scg-type-common-arc': sc_type_common_arc,
            'scg-type-membership-arc': sc_type_membership_arc,
            'scg-type-const-common-edge': sc_type_const_common_edge,
            'scg-type-const-common-arc': sc_type_const_common_arc,
            'scg-type-const-perm-pos-arc': sc_type_const_perm_pos_arc,
            'scg-type-const-perm-neg-arc': sc_type_const_perm_neg_arc,
            'scg-type-const-fuz-arc': sc_type_const_fuz_arc,
            'scg-type-const-temp-pos-arc': sc_type_const_temp_pos_arc,
            'scg-type-const-temp-neg-arc': sc_type_const_temp_neg_arc,
            'scg-type-const-actual-temp-pos-arc': sc_type_const_actual_temp_pos_arc,
            'scg-type-const-actual-temp-neg-arc': sc_type_const_actual_temp_neg_arc,
            'scg-type-const-inactual-temp-pos-arc': sc_type_const_inactual_temp_pos_arc,
            'scg-type-const-inactual-temp-neg-arc': sc_type_const_inactual_temp_neg_arc,
            'scg-type-var-common-edge': sc_type_var_common_edge,
            'scg-type-var-common-arc': sc_type_var_common_arc,
            'scg-type-var-perm-pos-arc': sc_type_var_perm_pos_arc,
            'scg-type-var-perm-neg-arc': sc_type_var_perm_neg_arc,
            'scg-type-var-fuz-arc': sc_type_var_fuz_arc,
            'scg-type-var-temp-pos-arc': sc_type_var_temp_pos_arc,
            'scg-type-var-temp-neg-arc': sc_type_var_temp_neg_arc,
            'scg-type-var-actual-temp-pos-arc': sc_type_var_actual_temp_pos_arc,
            'scg-type-var-actual-temp-neg-arc': sc_type_var_actual_temp_neg_arc,
            'scg-type-var-inactual-temp-pos-arc': sc_type_var_inactual_temp_pos_arc,
            'scg-type-var-inactual-temp-neg-arc': sc_type_var_inactual_temp_neg_arc,
            'scg-type-node-link': sc_type_node_link,
            'scg-type-const-node-link': sc_type_const_node_link,
            'scg-type-var-node-link': sc_type_var_node_link,
            'scg-type-const-node-link-class': sc_type_const_node_link_class,
            'scg-type-var-node-link-class': sc_type_var_node_link_class,
        };

        this.render = new SCg.Render();
        this.scene = new SCg.Scene({
            render: this.render,
            edit: this
        });
        this.scene.init();

        this.render.scene = this.scene;
        this.render.sandbox = params.sandbox;
        this.render.sandbox.scene = this.render.scene;
        this.render.init(params);

        this.containerId = params.containerId;

        if (params.autocompletionVariants)
            this.autocompletionVariants = params.autocompletionVariants;
        if (params.translateToSc)
            this.translateToSc = params.translateToSc;
        if (params.resolveControls)
            this.resolveControls = params.resolveControls;

        this.canEdit = !!params.canEdit;
        this.initUI();

        SCWeb.core.EventManager.subscribe("render/update", null, () => {
            this.scene.updateRender();
            this.scene.updateLinkVisual();
        });
    },

    /**
     * Initialize user interface
     */
    initUI: function () {
        var self = this;
        var container = '#' + this.containerId;
        $(container).prepend('<div id="tools-' + this.containerId + '"></div>');
        var tools_container = '#tools-' + this.containerId;
        $(tools_container).load('static/components/html/scg-tools-panel.html', function () {
            $.ajax({
                url: "static/components/html/scg-types-panel-nodes.html",
                dataType: 'html',
                success: function (response) {
                    self.node_types_panel_content = response;
                },
                error: function () {
                    SCgDebug.error("Error to get nodes type change panel");
                },
                complete: function () {
                    $.ajax({
                        url: "static/components/html/scg-types-panel-links.html",
                        dataType: 'html',
                        success: function (response) {
                            self.link_types_panel_content = response;
                        },
                        error: function () {
                            SCgDebug.error(
                                "Error to get links type change panel");
                        },
                        complete: function () {
                            $.ajax({
                                url: "static/components/html/scg-types-panel-connectors.html",
                                dataType: 'html',
                                success: function (response) {
                                    self.connector_types_panel_content = response;
                                },
                                error: function () {
                                    SCgDebug.error(
                                        "Error to get connectors type change panel");
                                },
                                complete: function () {
                                    $.ajax({
                                        url: 'static/components/html/scg-delete-panel.html',
                                        dataType: 'html',
                                        success: function (response) {
                                            self.delete_panel_content = response;
                                        },
                                        error: function () {
                                            SCgDebug.error(
                                                "Error to get delete panel");
                                        },
                                        complete: function () {
                                            self.bindToolEvents();
                                        }
                                    });
                                }
                            })
                        }
                    });
                }
            });
            if (!self.canEdit) {
                self.hideTool(self.toolConnector());
                self.hideTool(self.toolBus());
                self.hideTool(self.toolContour());
                self.hideTool(self.toolOpen());
                self.hideTool(self.toolSave());
                self.hideTool(self.toolIntegrate());
                self.hideTool(self.toolUndo());
                self.hideTool(self.toolRedo());
            }
            if (SCWeb.core.Main.editMode === SCgEditMode.SCgViewOnly) {
                self.hideTool(self.toolSwitch());
                self.hideTool(self.toolSelect());
                self.hideTool(self.toolLink());
                self.hideTool(self.toolUndo());
                self.hideTool(self.toolRedo());
                self.hideTool(self.toolClear());
            }
            if (self.resolveControls)
                self.resolveControls(tools_container);
        });
        this.scene.setEditMode(SCWeb.core.Main.editMode);
        this.scene.event_selection_changed = function () {
            self.onSelectionChanged();
        };
        this.scene.event_modal_changed = function () {
            self.onModalChanged();
        };
        this.keyboardCallbacks = {
            'onkeydown': function (event) {
                self.scene.onKeyDown(event)
            },
            'onkeyup': function (event) {
                self.scene.onKeyUp(event);
            }
        };
        this.openComponentCallbacks = function () {
            self.render.requestUpdateAll();
        }
    },

    hideTool: function (tool) {
        tool.addClass('hidden');
    },

    showTool: function (tool) {
        tool.removeClass('hidden');
    },

    toggleTool: function (tool) {
        tool.toggleClass('hidden');
    },

    tool: function (name) {
        return $('#' + this.containerId).find('#scg-tool-' + name);
    },

    toolSwitch: function () {
        return this.tool('switch');
    },

    toolSelect: function () {
        return this.tool('select');
    },

    toolConnector: function () {
        return this.tool('connector');
    },

    toolBus: function () {
        return this.tool('bus');
    },

    toolContour: function () {
        return this.tool('contour');
    },

    toolLink: function () {
        return this.tool('link');
    },

    toolUndo: function () {
        return this.tool('undo');
    },

    toolRedo: function () {
        return this.tool('redo');
    },

    toolChangeIdtf: function () {
        return this.tool('change-idtf');
    },

    toolChangeType: function () {
        return this.tool('change-type');
    },

    toolSetContent: function () {
        return this.tool('set-content');
    },

    toolDelete: function () {
        return this.tool('delete');
    },

    toolClear: function () {
        return this.tool('clear');
    },

    toolIntegrate: function () {
        return this.tool('integrate');
    },

    toolOpen: function () {
        return this.tool('open');
    },

    toolSave: function () {
        return this.tool('save');
    },

    toolAutoSize: function () {
        return this.tool('autosize');
    },

    toolZoomIn: function () {
        return this.tool('zoomin');
    },

    toolZoomOut: function () {
        return this.tool('zoomout');
    },

    /**
     * Bind events to panel tools
     */
    bindToolEvents: function () {

        var self = this;
        var container = '#' + this.containerId;
        var cont = $(container);

        var select = this.toolSelect();
        select.button('toggle');

        // handle clicks on mode change
        this.toolSwitch().click(function () {
            self.canEdit = !self.canEdit;
            var tools = [self.toolConnector(),
            self.toolContour(),
            self.toolBus(),
            self.toolUndo(),
            self.toolRedo(),
            self.toolDelete(),
            self.toolClear(),
            self.toolOpen(),
            self.toolSave(),
            self.toolIntegrate()
            ];
            for (var button = 0; button < tools.length; button++) {
                self.toggleTool(tools[button]);
            }
            self.hideTool(self.toolChangeIdtf());
            self.hideTool(self.toolSetContent());
            self.hideTool(self.toolChangeType());
            self.hideTool(self.toolDelete());
        });
        select.click(function () {
            self.scene.setEditMode(SCgEditMode.SCgModeSelect);
        });
        select.dblclick(function () {
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
                delay: {
                    show: 500,
                    hide: 100
                }
            }).popover('show');
            cont.find('.popover-title').append(
                '<button id="scg-type-close" type="button" class="close">&times;</button>');
            $(container + ' #scg-type-close').click(function () {
                stop_modal();
            });
            $(container + ' .popover .btn').click(function () {
                SCgTypeNodeNow = self.typesMap[$(this).attr('id')];
                stop_modal();
            });
        });
        this.toolConnector().click(function () {
            self.scene.setEditMode(SCgEditMode.SCgModeConnector);
        });
        this.toolConnector().dblclick(function () {
            self.scene.setModal(SCgModalMode.SCgModalType);
            self.onModalChanged();
            var tool = $(this);

            function stop_modal() {
                tool.popover('destroy');
                self.scene.setEditMode(SCgEditMode.SCgModeConnector);
                self.scene.setModal(SCgModalMode.SCgModalNone);
            }

            el = $(this);
            el.popover({
                content: self.connector_types_panel_content,
                container: container,
                title: 'Change type',
                html: true,
                delay: {
                    show: 500,
                    hide: 100
                }
            }).popover('show');
            cont.find('.popover-title').append(
                '<button id="scg-type-close" type="button" class="close">&times;</button>');
            $(container + ' #scg-type-close').click(function () {
                stop_modal();
            });
            $(container + ' .popover .btn').click(function () {
                SCgTypeConnectorNow = self.typesMap[$(this).attr('id')];
                stop_modal();
            });
        });
        this.toolBus().click(function () {
            self.scene.setEditMode(SCgEditMode.SCgModeBus);
        });
        this.toolContour().click(function () {
            self.scene.setEditMode(SCgEditMode.SCgModeContour);
        });
        this.toolLink().click(function () {
            self.scene.setEditMode(SCgEditMode.SCgModeLink);
        });
        this.toolUndo().click(function () {
            self.scene.commandManager.undo();
            self.scene.updateRender();
        });
        this.toolRedo().click(function () {
            self.scene.commandManager.redo();
            self.scene.updateRender();
        });
        this.toolChangeIdtf().click(function () {
            self.scene.setModal(SCgModalMode.SCgModalIdtf);
            $(this).popover({
                container: container
            });
            $(this).popover('show');

            const tool = $(this);

            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
            }

            const input = $(container + ' #scg-change-idtf-input');
            // setup initial value
            input.val(self.scene.selected_objects[0].text);

            // Fix for chrome: http://stackoverflow.com/questions/17384464/jquery-focus-not-working-in-chrome
            setTimeout(function () {
                input.focus();
            }, 1);

            const wrapperChangeApply = async (obj, selectedIdtf) => {
                if (obj.text !== selectedIdtf) {
                    searchNodeByAnyIdentifier(selectedIdtf).then(async (selectedAddr) => {
                        if (selectedAddr) {
                            const [type] = await scClient.getElementsTypes([selectedAddr]);
                            self.scene.commandManager.execute(new SCgCommandGetNodeFromMemory(
                                obj,
                                type.value,
                                selectedIdtf,
                                selectedAddr.value,
                                self.scene)
                            );
                        } else {
                            self.scene.commandManager.execute(new SCgCommandChangeIdtf(obj, selectedIdtf));
                        }
                    });
                }
            }

            input.keypress(function (e) {
                if (e.keyCode === KeyCode.Enter || e.keyCode === KeyCode.Escape) {
                    if (e.keyCode === KeyCode.Enter) {
                        const obj = self.scene.selected_objects[0];
                        if (!self._selectedIdtf) self._selectedIdtf = input.val();
                        wrapperChangeApply(obj, self._selectedIdtf).then(stop_modal);
                    }
                    stop_modal();
                    e.preventDefault();
                }
            });

            if (self.autocompletionVariants) {
                input.typeahead({
                    minLength: 1,
                    highlight: true
                }, {
                    name: 'idtf',
                    source: function (str, callback) {
                        self._selectedIdtf = null;
                        self.autocompletionVariants(str, callback);
                    },
                    templates: {
                        suggestion: (string) => {
                            return string;
                        }
                    }
                }).bind('typeahead:selected', (event, string, _data) => {
                    if (string?.length) {
                        self._selectedIdtf = string;
                    }
                    event.stopPropagation();
                    input.val(string);
                    $('.typeahead').val('');
                });
            }

            // process controls
            $(container + ' #scg-change-idtf-apply').click(async function () {
                const obj = self.scene.selected_objects[0];
                if (!self._selectedIdtf) self._selectedIdtf = input.val();
                wrapperChangeApply(obj, self._selectedIdtf).then(stop_modal);
            });
            $(container + ' #scg-change-idtf-cancel').click(function () {
                stop_modal();
            });
            $('.switchingItemsLi').click(function () {
                stop_modal();
            });
        });

        this.toolChangeType().click(function () {
            self.scene.setModal(SCgModalMode.SCgModalType);

            var tool = $(this);

            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.event_selection_changed();
                self.scene.updateObjectsVisual();
            }

            var obj = self.scene.selected_objects[0];

            let types;
            if (obj instanceof SCg.ModelConnector) {
                types = self.connector_types_panel_content;
            } else if (obj instanceof SCg.ModelNode) {
                types = self.node_types_panel_content;
            } else if (obj instanceof SCg.ModelLink) {
                types = self.link_types_panel_content;
            }

            el = $(this);
            el.popover({
                content: types,
                container: container,
                title: 'Change type',
                html: true,
                delay: {
                    show: 500,
                    hide: 100
                }
            }).popover('show');

            cont.find('.popover-title').append(
                '<button id="scg-type-close" type="button" class="close">&times;</button>');

            $(container + ' #scg-type-close').click(function () {
                stop_modal();
            });

            $(container + ' .popover .btn').click(function () {
                var newType = self.typesMap[$(this).attr('id')];
                var command = [];
                self.scene.selected_objects.forEach(function (obj) {
                    if (obj.sc_type !== newType) {
                        command.push(new SCgCommandChangeType(obj, newType));
                    }
                });
                self.scene.commandManager.execute(new SCgWrapperCommand(command));
                self.scene.updateObjectsVisual();
                stop_modal();
            });
        });


        this.toolSetContent().click(function () {
            let tool = $(this);
            const startValueLink = self.scene.selected_objects[0].content.trim();

            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
            }

            self.scene.setModal(SCgModalMode.SCgModalIdtf);
            $(this).popover({
                container: container
            });
            $(this).popover('show');

            const obj = self.scene.selected_objects[0];
            const input = $(container + ' #scg-set-content-input');
            const input_content = $(container + " input#content[type='file']");
            input.val(self.scene.selected_objects[0].content);
            setTimeout(function () {
                input.focus();
            }, 1);

            const wrapperRenameAttachLink = async () => {
                const endValueLink = input.val().trim();
                const file = input_content[0].files[0];
                if ((startValueLink === endValueLink && obj.sc_addr) && !file) stop_modal();
                obj.changedValue = true;

                let addrMainConcept;
                if (obj.sc_addr) {
                    let templateAddr = new sc.ScTemplate();
                    templateAddr.quintuple(
                        [sc.ScType.VarNode, "_node"],
                        sc.ScType.VarCommonArc,
                        new sc.ScAddr(obj.sc_addr),
                        sc.ScType.VarPermPosArc,
                        new sc.ScAddr(window.scKeynodes['nrel_main_idtf'])
                    );
                    addrMainConcept = await window.scClient.searchByTemplate(templateAddr)
                        .then(result => {
                            if (!result.length) return;
                            return result[0].get("_node").value;
                        });
                }
                if (addrMainConcept) {
                    const objMainConcept = self.scene.getObjectByScAddr(Number(addrMainConcept));
                    self.scene.commandManager.execute(new SCgCommandChangeIdtf(objMainConcept, input.val()));
                    document.querySelector(`[sc_addr="${addrMainConcept}"]`).nextSibling.textContent = input.val();
                }

                if (startValueLink !== endValueLink && obj.sc_addr) {
                    obj.changedValue = true;
                }

                if (file) {
                    let fileReader = new FileReader();
                    fileReader.onload = function () {
                        const scLinkHelper = new ScFileLinkHelper(file, this.result);
                        if (obj.sc_addr) obj.changedValue = true;
                        self.scene.commandManager.execute(new SCgCommandChangeContent(
                            obj,
                            scLinkHelper.htmlViewResult(),
                            scLinkHelper.type,
                        ));
                        stop_modal();
                    };
                    fileReader.readAsArrayBuffer(file);
                } else {
                    const preDefineStringContentType = function (content) {
                        function isHTML(str) {
                            return /<[a-z][\s\S]*>/i.test(str);
                        }

                        return isHTML(content) ? 'html' : 'string';
                    }

                    if (obj.content !== input.val()) {
                        if (obj.sc_addr) obj.changedValue = true;
                        self.scene.commandManager.execute(new SCgCommandChangeContent(
                            obj,
                            input.val(),
                            preDefineStringContentType(input.val()),
                        ));
                    }
                    stop_modal();
                }
            }

            input.keypress(async function (e) {
                if (e.keyCode === KeyCode.Enter || e.keyCode === KeyCode.Escape) {
                    if (e.keyCode === KeyCode.Enter) {
                        wrapperRenameAttachLink().then(null);
                    }
                    stop_modal();
                    e.preventDefault();
                }
            });
            // process controls
            $(container + ' #scg-set-content-apply').click(async function () {
                wrapperRenameAttachLink().then(null);
            });
            $(container + ' #scg-set-content-cancel').click(function () {
                stop_modal();
            });
        });

        this.toolDelete().click(async function () {
            if (!self.scene.selected_objects.length) return;

            DeleteButtons.init();

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
                content: self.delete_panel_content,
                container: container,
                html: true,
                delay: {
                    show: 500,
                    hide: 100
                }
            }).popover('show');
            cont.find('.popover-content').append(
                '<button id="scg-close-btn" type="button" class="close scg-close-btn-fragments-window">&times;</button>'
            );

            if (self.scene.selected_objects.length === 1) {
                if (!self.scene.selected_objects[0].sc_addr) {
                    cont.find('.delete-from-db-btn').prop('disabled', true).addClass('disabled-delete-btn');
                }
                const isDeletable = await self.checkCanDelete(
                    self.scene.selected_objects[0].sc_addr
                );
                if (isDeletable) cont.find('.delete-from-db-btn').prop('disabled', true).addClass('disabled-delete-btn');
            } else {
                const result = await Promise.all(
                    self.scene.selected_objects.map(async (selected_object) => {
                        if (!selected_object.sc_addr) return null
                        return await self.checkCanDelete(selected_object.sc_addr)
                    })
                );
                result.every((elem) => elem === false)
                    ? null
                    : cont.find('.delete-from-db-btn').prop('disabled', true).addClass('disabled-delete-btn');
            }

            cont.find('.popover').addClass('scg-tool-fragments-popover');
            cont.find('.popover-content').addClass('scg-tool-fragments-popover-content');
            cont.find('.popover>.arrow').addClass('scg-tool-popover-arrow-hide');
            
            cont.find('#scg-close-btn').click(function () {
                stop_modal();
                select.button('toggle');
            });

            cont.find('.delete-from-db-btn').click(async function (e) {
                e.stopImmediatePropagation();
                if (self.scene.selected_objects.length > 0) {
                    if (self.scene.selected_objects.length > 1) {
                        const cantDelete = [];
                        const deletableObjects = await Promise.all(self.scene.selected_objects.filter(obj => obj.sc_addr).map(async (obj) => {
                            const canDelete = await self.checkCanDelete(obj.sc_addr);
                            if (canDelete) {
                                cantDelete.push(obj);
                            } else {
                                return obj;
                            }
                        })).then(arr => arr.filter(Boolean));

                        function diffArray(arr1, arr2) {
                            return arr1.filter(item => !arr2.includes(item));
                        }
                        self.scene.deleteObjects(diffArray(self.scene.selected_objects, cantDelete));
                        self.scene.addDeletedObjects(deletableObjects);
                    } else {
                        self.scene.deleteObjects(self.scene.selected_objects);
                        self.scene.addDeletedObjects(self.scene.selected_objects);
                    }
                }
                self.hideTool(self.toolDelete());
                stop_modal();
                select.button('toggle');
            })

            cont.find('.delete-from-scene-btn').click(async function (e) {
                e.stopImmediatePropagation();
                self.scene.deleteObjects(self.scene.selected_objects);
                stop_modal();
                self.hideTool(self.toolDelete())
                select.button('toggle');
            })
        });

        this.toolClear().click(function () {
            self._disableTool(self.toolClear());
            self.scene.clear = true;
            self.scene.selectAll();
            self.scene.clear = false;
            if (self.scene.selected_objects.length) {
                const objects = self.scene.selected_objects.slice();
                self.scene.clearSelection();
                self.scene.deleteObjects(objects);
            }
            self._enableTool(self.toolClear());
        });

        this.toolOpen().click(function () {
            var document = $(this)[0].ownerDocument;
            var open_dialog = document.getElementById("scg-tool-open-dialog");
            self.scene.clearSelection();
            open_dialog.onchange = function () {
                GwfFileLoader.load({
                    file: open_dialog.files[0],
                    render: self.render
                });
                this.value = null;
            }
            ScgObjectBuilder.scene = self.scene;
            open_dialog.click();
        });

        this.toolSave().click(function () {
            var blob = new Blob([GwfFileCreate.createFile(self.scene)], {
                type: "text/plain;charset=utf-8"
            });
            saveAs(blob, "new_file.gwf");
        });

        const updateConfirmedData = async function () {
            self._disableTool(self.toolIntegrate());
            if (self.translateToSc)
                self.translateToSc(() => {
                    self._enableTool(self.toolIntegrate());
                });

            self._enableTool(self.toolClear());
        }

        const getElement = async function (arr) {
            let construction = new sc.ScConstruction();
            construction.generateNode(sc.ScType.ConstNode, 'node')

            arr.forEach(el => {
                construction.generateConnector(sc.ScType.ConstPermPosArc, 'node', new sc.ScAddr(el.sc_addr));
            })

            const elements = await scClient.generateElements(construction);
            return elements[0];
        }

        this.toolIntegrate().click(async function () {
            self.scene.deleted_objects = self.scene.deleted_objects.filter(el => el.sc_addr !== null);
            if (self.scene.deleted_objects.length) {
                SCWeb.core.Server.doCommand(
                    window.scKeynodes["ui_menu_erase_elements"],
                    [(await getElement(self.scene.deleted_objects)).value],
                    function (get_result) {
                        updateConfirmedData();
                    }
                );
                self.scene.deleted_objects = [];
                return;
            }
            await updateConfirmedData();
        });

        this.toolAutoSize().click(function () {
            const scaleDelta = 0.05;
            const scaleRect = 10;

            const [containerWidth, containerHeight] = self.scene.getContainerSize();
            const scgHeight = self.scene.render.d3_container[0][0].getBoundingClientRect().height;
            const scgWidth = self.scene.render.d3_container[0][0].getBoundingClientRect().width;
            const currentScale = self.scene.render.scale;
            const heightRatio = containerHeight / scgHeight;
            const widthRatio = containerWidth / scgWidth;
            let scale = currentScale * Math.min(heightRatio, widthRatio) - scaleDelta;
            if (scale < 0) scale = 0.01;
            const translateX = self.scene.render.d3_container[0][0].getBoundingClientRect().width * scale;
            const translateY = self.scene.render.d3_container[0][0].getBoundingClientRect().height * scale;
            
            self.scene.render._changeContainerTransform([((containerWidth - translateX) / 2), ((containerHeight - translateY) / 2)], scale);
            self.scene.render._changeContainerTransform([((containerWidth - self.scene.render.d3_container[0][0].getBoundingClientRect().width) / 2), ((containerHeight - self.scene.render.d3_container[0][0].getBoundingClientRect().height) / 2)], scale); 

            const svg = document.querySelector('.SCgSvg');
            const graph = self.scene.render.d3_container[0][0];

            const currentTranslateScgWidth = self.scene.render.translate[0];
            const currentTranslateScgHeight = self.scene.render.translate[1];
            const svgRect = svg.getBoundingClientRect();
            const graphRect = graph.getBoundingClientRect();
            const currentRectTop = graphRect.top - svgRect.top - scaleRect;
            const currentRectLeft = graphRect.left - svgRect.left - scaleRect;
            const currentRectRight = graphRect.right - svgRect.right + scaleRect;
            const currentRectBotton = graphRect.bottom - svgRect.bottom + scaleRect;
            if (currentRectTop < 0 && currentRectLeft < 0) {
                self.scene.render._changeContainerTransform([currentTranslateScgWidth - currentRectLeft, currentTranslateScgHeight - currentRectTop], scale);
            } else if (currentRectTop < 0 && currentRectRight > 0) {
                self.scene.render._changeContainerTransform([currentTranslateScgWidth - currentRectRight, currentTranslateScgHeight - currentRectTop], scale);
            } else if (currentRectBotton > 0 && currentRectLeft < 0) {
                self.scene.render._changeContainerTransform([currentTranslateScgWidth - currentRectLeft, currentTranslateScgHeight - currentRectBotton], scale);
            } else if (currentRectBotton > 0 && currentRectRight > 0) {
                self.scene.render._changeContainerTransform([currentTranslateScgWidth - currentRectRight, currentTranslateScgHeight - currentRectBotton], scale);
            } else  if (currentRectTop < 0) {
                self.scene.render._changeContainerTransform([currentTranslateScgWidth, currentTranslateScgHeight - currentRectTop], scale);
            } else if (currentRectLeft < 0) {
                self.scene.render._changeContainerTransform([currentTranslateScgWidth - currentRectLeft, currentTranslateScgHeight], scale);
            } else if (currentRectBotton > 0) {
                self.scene.render._changeContainerTransform([currentTranslateScgWidth, currentTranslateScgHeight - currentRectBotton], scale);
            } else if (currentRectRight > 0) {
                self.scene.render._changeContainerTransform([currentTranslateScgWidth - currentRectRight, currentTranslateScgHeight], scale);
            };   
            
            const svgRect2AfterRender = svg.getBoundingClientRect();
            const graphRectAfterRender = graph.getBoundingClientRect();
            const currentRectTopAfterRender = graphRectAfterRender.top - svgRect2AfterRender.top - scaleRect;
            const currentRectLeftAfterRender = graphRectAfterRender.left - svgRect2AfterRender.left - scaleRect;
            const currentRectRightAfterRender = graphRectAfterRender.right - svgRect2AfterRender.right + scaleRect;
            const currentRectBottonAfterRender = graphRectAfterRender.bottom - svgRect2AfterRender.bottom + scaleRect;
            if (Math.abs(currentRectLeftAfterRender) < Math.abs(currentRectRightAfterRender)) {
                self.scene.render._changeContainerTransform([self.scene.render.translate[0] + ((Math.abs(currentRectRightAfterRender) + Math.abs(currentRectLeftAfterRender) ) / 2) , self.scene.render.translate[1]], scale);
            };
            if (Math.abs(currentRectLeftAfterRender) > Math.abs(currentRectRightAfterRender)) {
                self.scene.render._changeContainerTransform([self.scene.render.translate[0] - ((currentRectLeftAfterRender - currentRectRightAfterRender) / 2), self.scene.render.translate[1]], scale);
            };
            if (Math.abs(currentRectTopAfterRender) < Math.abs(currentRectBottonAfterRender)) {
                self.scene.render._changeContainerTransform([self.scene.render.translate[0], self.scene.render.translate[1] + ((Math.abs(currentRectBottonAfterRender) + Math.abs(currentRectTopAfterRender) ) / 2)], scale);
            };
            if (Math.abs(currentRectTopAfterRender) > Math.abs(currentRectBottonAfterRender)) {
                self.scene.render._changeContainerTransform([self.scene.render.translate[0], self.scene.render.translate[1] - ((Math.abs(currentRectTopAfterRender) + Math.abs(currentRectBottonAfterRender)) / 2)], scale);
            };
        });
        
        this.toolZoomIn().click(function () {
            self.render.changeScale(1.1);
        });

        this.toolZoomOut().click(function () {
            self.render.changeScale(0.9);
        });

        window.onmessage = (e) => {
            if (e.data.type === 'SCALE_CHANGE') {
                return self.render.changeScale(e.data.value);
            }
        };

        // initial update
        self.onModalChanged();
        self.onSelectionChanged();
    },

    checkCanDelete: async function (addr) {
        if (!addr) return true;

        let template = new sc.ScTemplate();
        template.triple(
            new sc.ScAddr(window.scKeynodes["basic_ontology_structure"]),
            sc.ScType.VarPermPosArc,
            new sc.ScAddr(addr)
        );
        const res = await window.scClient.searchByTemplate(template);

        return res.length !== 0;
    },

    /**
     * Function that process selection changes in scene
     * It updated UI to current selection
     */
    onSelectionChanged: async function () {
        const self = this;

        const checkCanEdit = async (addr) => {
            return !(await self.checkCanDelete(addr));
        }

        if (SCWeb.core.Main.editMode === SCgEditMode.SCgViewOnly) {
            this.hideTool(this.toolChangeIdtf());
            this.hideTool(this.toolChangeType());
            this.hideTool(this.toolSetContent());
            this.hideTool(this.toolDelete());
        }
        else if (this.canEdit) {
            this.hideTool(this.toolChangeIdtf());
            this.hideTool(this.toolChangeType());
            this.hideTool(this.toolSetContent());
            this.hideTool(this.toolDelete());

            this.scene.selected_objects.length > 0 && !this.scene.clear
                ? this.showTool(this.toolDelete())
                : this.hideTool(this.toolDelete())

            if (this.scene.selected_objects.length > 1) {
                if (this.scene.isSelectedObjectAllConnectorsOrAllNodes() && !this.scene.isSelectedObjectAllHaveScAddr()) {
                    this.showTool(this.toolChangeType());
                }
            } else if (this.scene.selected_objects.length === 1 && !this.scene.selected_objects[0].sc_addr) {
                if (this.scene.selected_objects[0] instanceof SCg.ModelNode) {
                    this.showTool(this.toolChangeIdtf());
                    this.showTool(this.toolChangeType());
                } else if (this.scene.selected_objects[0] instanceof SCg.ModelConnector) {
                    this.showTool(this.toolChangeType());
                } else if (this.scene.selected_objects[0] instanceof SCg.ModelContour) {
                    this.showTool(this.toolChangeIdtf());
                } else if (this.scene.selected_objects[0] instanceof SCg.ModelLink) {
                    this.showTool(this.toolChangeIdtf());
                    this.showTool(this.toolSetContent());
                    this.showTool(this.toolChangeType());
                }
            } else if (this.scene.selected_objects.length === 1 && await checkCanEdit(this.scene.selected_objects[0].sc_addr)) {
                if (this.scene.selected_objects[0] instanceof SCg.ModelLink) {
                    this.showTool(this.toolSetContent());
                }
            }
        }
    },


    /**
     * Function, that process modal state changes of scene
     */
    onModalChanged: function () {
        var self = this;

        function update_tool(tool) {
            if (self.scene.modal != SCgModalMode.SCgModalNone)
                self._disableTool(tool);
            else
                self._enableTool(tool);
        }

        update_tool(this.toolSwitch());
        update_tool(this.toolSelect());
        update_tool(this.toolConnector());
        update_tool(this.toolBus());
        update_tool(this.toolContour());
        update_tool(this.toolLink());
        update_tool(this.toolUndo());
        update_tool(this.toolRedo());
        update_tool(this.toolChangeIdtf());
        update_tool(this.toolChangeType());
        update_tool(this.toolSetContent());
        update_tool(this.toolDelete());
        update_tool(this.toolClear());
        update_tool(this.toolAutoSize());
        update_tool(this.toolZoomIn());
        update_tool(this.toolZoomOut());
        update_tool(this.toolIntegrate());
        update_tool(this.toolOpen());
    },

    collectIdtfs: function (keyword) {
        var self = this;
        var selected_obj = self.scene.selected_objects[0];
        var relative_objs = undefined;

        if (selected_obj instanceof SCg.ModelNode) {
            relative_objs = self.scene.nodes;
        }
        if (!relative_objs)
            return [];

        var match = function (text) {
            var pattern = new RegExp(keyword, 'i');
            if (text && pattern.test(text))
                return true;
            return false;
        }

        var contains = function (value, array) {
            var len = array.length;
            while (len--) {
                if (array[len].name === value.name)
                    return true
            }
            return false;
        }
        var matches = [];
        $.each(relative_objs, function (index, item) {
            if (match(item['text'])) {
                var obj = {
                    name: item['text'],
                    type: 'local'
                }
                if (!contains(obj, matches))
                    matches.push(obj);
            }

        });
        return matches;
    },

    /**
     * function(keyword, callback, args)
     * here is default implementation
     * */

    autocompletionVariants: function (keyword, callback, args) {
        var self = this;
        callback(self.collectIdtfs(keyword));
    },

    // -------------------------------- Helpers ------------------
    /**
     * Change specified tool state to disabled
     */
    _disableTool: function (tool) {
        tool.attr('disabled', 'disabled');
    },

    /**
     * Change specified tool state to enabled
     */
    _enableTool: function (tool) {
        tool.removeAttr('disabled');
    }
};