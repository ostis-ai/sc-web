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
            'scg-type-arc-const-perm-pos-access': sc_type_arc_access | sc_type_const | sc_type_arc_pos |
                sc_type_arc_perm,
            'scg-type-arc-const-perm-neg-access': sc_type_arc_access | sc_type_const | sc_type_arc_neg |
                sc_type_arc_perm,
            'scg-type-arc-const-perm-fuz-access': sc_type_arc_access | sc_type_const | sc_type_arc_fuz |
                sc_type_arc_perm,
            'scg-type-arc-const-temp-pos-access': sc_type_arc_access | sc_type_const | sc_type_arc_pos |
                sc_type_arc_temp,
            'scg-type-arc-const-temp-neg-access': sc_type_arc_access | sc_type_const | sc_type_arc_neg |
                sc_type_arc_temp,
            'scg-type-arc-const-temp-fuz-access': sc_type_arc_access | sc_type_const | sc_type_arc_fuz |
                sc_type_arc_temp,
            'scg-type-edge-var': sc_type_edge_common | sc_type_var,
            'scg-type-arc-var': sc_type_arc_common | sc_type_var,
            'scg-type-arc-var-perm-pos-access': sc_type_arc_access | sc_type_var | sc_type_arc_pos |
                sc_type_arc_perm,
            'scg-type-arc-var-perm-neg-access': sc_type_arc_access | sc_type_var | sc_type_arc_neg |
                sc_type_arc_perm,
            'scg-type-arc-var-perm-fuz-access': sc_type_arc_access | sc_type_var | sc_type_arc_fuz |
                sc_type_arc_perm,
            'scg-type-arc-var-temp-pos-access': sc_type_arc_access | sc_type_var | sc_type_arc_pos |
                sc_type_arc_temp,
            'scg-type-arc-var-temp-neg-access': sc_type_arc_access | sc_type_var | sc_type_arc_neg |
                sc_type_arc_temp,
            'scg-type-arc-var-temp-fuz-access': sc_type_arc_access | sc_type_var | sc_type_arc_fuz |
                sc_type_arc_temp,
            'scg-type-link': sc_type_link,
            'scg-type-link-const': sc_type_link | sc_type_const,
            'scg-type-link-var': sc_type_link | sc_type_var,
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

        const panelPaths = {
            toolPanel: {
                default: 'static/components/html/scg-tools-panel.html',
                demo: 'static/components/html/demo-scg-tools-panel.html',
            },
            nodesTypes: {
                default: 'static/components/html/scg-types-panel-nodes.html',
                demo: 'static/components/html/demo-scg-types-panel-nodes.html',
            },
            edgesTypes: {
                default: 'static/components/html/scg-types-panel-edges.html',
                demo: 'static/components/html/demo-scg-types-panel-edges.html',
            },
            changeIdtf: {
                default: 'static/components/html/scg-change-idtf.html',
                demo: 'static/components/html/demo-scg-change-idtf.html',
            },
            setContent: {
                default: 'static/components/html/scg-set-content.html',
                demo: 'static/components/html/demo-scg-set-content.html',
            },
        };

        const implementation = window.demoImplementation ? 'demo' : 'default';

        if (window.demoImplementation) {
            $('.panel-body').addClass('demo-scg-shadow');
        }

        $(tools_container).load(panelPaths.toolPanel[implementation], function () {
            $.ajax({
                url: panelPaths.nodesTypes[implementation],
                dataType: 'html',
                success: function (response) {
                    self.node_types_panel_content = response;
                },
                error: function () {
                    SCgDebug.error("Error to get nodes type change panel");
                },
                complete: function () {
                    $.ajax({
                        url: "static/components/html/scg-types-panel-links.html", //! Mksm Нету демо
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
                                url: panelPaths.edgesTypes[implementation],
                                dataType: 'html',
                                success: function (response) {
                                    self.edge_types_panel_content = response;
                                },
                                error: function () {
                                    SCgDebug.error(
                                        "Error to get edges type change panel");
                                },
                                complete: function () {
                                    $.ajax({
                                        url: 'static/components/html/scg-delete-panel.html', //! Mksm Нету демо
                                        dataType: 'html',
                                        success: function (response) {
                                            self.delete_panel_content = response;
                                        },
                                        error: function () {
                                            SCgDebug.error(
                                                "Error to get delete panel");
                                        },
                                        complete: function () {
                                            $.ajax({
                                                url: panelPaths.changeIdtf[implementation],
                                                dataType: 'html',
                                                success: function (response) {
                                                    self.change_idtf_panel_content = response;
                                                },
                                                error: function () {
                                                    SCgDebug.error(
                                                        "Error to get change idtf panel");
                                                },
                                                complete: function () {
                                                    $.ajax({
                                                        url: panelPaths.setContent[implementation],
                                                        dataType: 'html',
                                                        success: function (response) {
                                                            self.set_content_panel = response;
                                                        },
                                                        error: function () {
                                                            SCgDebug.error(
                                                                "Error to get set content panel");
                                                        },
                                                        complete: function () {
                                                            self.bindToolEvents();
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            if (!self.canEdit) {
                self.hideTool(self.toolEdge());
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

    toolEdge: function () {
        return this.tool('edge');
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
            var tools = [self.toolEdge(),
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
        this.toolEdge().click(function () {
            self.scene.setEditMode(SCgEditMode.SCgModeEdge);
        });
        this.toolEdge().dblclick(function () {
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
                SCgTypeEdgeNow = self.typesMap[$(this).attr('id')];
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
                content: self.change_idtf_panel_content,
                container: container,
                title: 'Change identifier',
                html: true,
                delay: {
                    show: 500,
                    hide: 100
                }
            });
            $(this).popover('show');

            if (window.demoImplementation) {
                cont.find('.popover').addClass('demo-scg-popover-layout popover-position demo-popover-width popover-position-change-idtf ');
                cont.find('.popover-title').addClass('demo-scg-popover-title demo-text-align-center');
                cont.find('.popover>.arrow').addClass('scg-tool-popover-arrow-hide');
                cont.find('.popover-title').text('Изменить идентификатор');
            }

            const tool = $(this);

            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
                self.scene.setEditMode(SCgEditMode.SCgModeSelect);
                $('#scg-tool-change-idtf').removeClass('active');
            }

            const input = $(container + ' #scg-change-idtf-input');
            // setup initial value
            input.val(self.scene.selected_objects[0].text);

            // Fix for chrome: http://stackoverflow.com/questions/17384464/jquery-focus-not-working-in-chrome
            setTimeout(function () {
                input.focus();
            }, 1);

            const checkEnterValue = async (text) => {
                let linkAddrs = await window.scClient.getLinksByContents([text]);
                if (!linkAddrs.length) return;

                let template = new sc.ScTemplate();
                template.tripleWithRelation(
                    [sc.ScType.NodeVar, '_node'],
                    sc.ScType.EdgeDCommonVar,
                    linkAddrs[0][0],
                    sc.ScType.EdgeAccessVarPosPerm,
                    new sc.ScAddr(window.scKeynodes['nrel_main_idtf']),
                );

                const result = await scClient.templateSearch(template);
                if (!result.length) return;

                return result[0].get("_node");
            }

            const wrapperChangeApply = async (obj, input, self) => {
                const addrNodeEnterValue = await checkEnterValue(input[0].value);
                if (obj.text !== input.val() && !self._selectedIdtf && !addrNodeEnterValue) {
                    self.scene.commandManager.execute(new SCgCommandChangeIdtf(obj, input.val()));
                }

                if (!self._selectedIdtf && addrNodeEnterValue) {
                    if (!addrNodeEnterValue) stop_modal();
                    const [type] = await scClient.checkElements([addrNodeEnterValue]);
                    self.scene.commandManager.execute(new SCgCommandGetNodeFromMemory(
                        obj,
                        type.value,
                        input[0].value,
                        addrNodeEnterValue.value,
                        self.scene));
                    stop_modal();
                }

                if (self._selectedIdtf) {
                    searchNodeByAnyIdentifier(self._selectedIdtf).then(async (selectedAddr) => {
                        if (!selectedAddr) stop_modal();

                        const [type] = await scClient.checkElements([selectedAddr]);
                        self.scene.commandManager.execute(new SCgCommandGetNodeFromMemory(
                            obj,
                            type.value,
                            self._selectedIdtf,
                            selectedAddr.value,
                            self.scene));
                        stop_modal();
                    });
                }
                else stop_modal();
            }

            input.keypress(function (e) {
                if (e.keyCode === KeyCode.Enter || e.keyCode === KeyCode.Escape) {
                    if (e.keyCode === KeyCode.Enter) {
                        var obj = self.scene.selected_objects[0];
                        wrapperChangeApply(obj, input, self);
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
                wrapperChangeApply(obj, input, self);
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
                self.scene.setEditMode(SCgEditMode.SCgModeSelect);
                select.button('toggle');
            }

            const obj = self.scene.selected_objects[0];

            el = $(this);
            el.popover({
                content: (obj instanceof SCg.ModelEdge) ? self.edge_types_panel_content : self.node_types_panel_content,
                container: container,
                title: 'Change type',
                html: true,
                delay: {
                    show: 500,
                    hide: 100
                }
            }).popover('show');

            if (window.demoImplementation) {
                cont.find('.popover').addClass('demo-scg-popover-layout popover-position-change-type');
                cont.find('.popover-title').addClass('demo-scg-popover-title');
                cont.find('.popover>.arrow').addClass('scg-tool-popover-arrow-hide');
                cont.find('.popover-title').text(
                    (obj instanceof SCg.ModelEdge) ? 'Изменить тип дуги' : 'Изменить тип узла'
                );
            }

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
            $('.switchingItemsLi').click(function () {
                stop_modal();
            });
        });


        this.toolSetContent().click(function () {
            var tool = $(this);
            const startValueLink = self.scene.selected_objects[0].content.trim();

            function stop_modal() {
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
            }

            self.scene.setModal(SCgModalMode.SCgModalIdtf);
            $(this).popover({
                content: self.set_content_panel,
                container: container,
                title: 'Change content',
                html: true,
                delay: {
                    show: 500,
                    hide: 100
                }
            });
            $(this).popover('show');

            var obj = self.scene.selected_objects[0];
            var input = $(container + ' #scg-set-content-input');
            var input_content = $(container + " input#content[type='file']");
            var input_content_type = $(container + " #scg-set-content-type");
            input.val(self.scene.selected_objects[0].content);
            input_content_type.val(self.scene.selected_objects[0].contentType);

            if (window.demoImplementation) {
                cont.find('.popover').addClass('demo-scg-popover-layout popover-position-change-type demo-popover-width popover-position-set-content');
                cont.find('.popover-title').addClass('demo-scg-popover-title demo-text-align-center');
                cont.find('.popover>.arrow').addClass('scg-tool-popover-arrow-hide');
                cont.find('.popover-title').text('Изменить содержимое');

                const demoSelect = document.querySelector('.demo-select');
                const demoSelectValue = document.querySelector('.demo-select-value');
                const listOfOptions = document.querySelectorAll('.demo-option');
                const fileInput = document.querySelector('.file-input');
                const fileInputText = document.querySelector('.demo-file-input-text');
                const body = document.body;

                const toggleDropdown = (event) => {
                    event.stopPropagation();
                    demoSelect.classList.toggle('opened');
                };

                const selectOption = (event) => {
                    const options = document.querySelectorAll('.demo-option');

                    options.forEach((option) => {
                        if (option.classList.contains('demo-selected-option')) {
                            option.classList.remove('demo-selected-option');
                        }
                    });

                    event.currentTarget.classList.add("demo-selected-option");
                    demoSelectValue.value = event.currentTarget.textContent;
                    input_content_type.val(demoSelectValue.value);
                };

                const closeDropdownFromOutside = () => {
                    if (demoSelect.classList.contains('opened')) {
                        demoSelect.classList.remove('opened');
                    }
                };

                const changeFileInputText = (e) => {
                    if (e.currentTarget.value) {
                        fileInputText.innerHTML = e.currentTarget.value;
                    } else {
                        fileInputText.innerHTML = "Файл не выбран";
                    }
                }

                body.addEventListener('click', closeDropdownFromOutside);

                listOfOptions.forEach((option) => {
                    option.addEventListener('click', selectOption);
                });

                demoSelect.addEventListener('click', toggleDropdown);

                fileInput.addEventListener('change', changeFileInputText);

                demoSelectValue.value = input_content_type.val();
            };

            setTimeout(function () {
                input.focus();
            }, 1);

            if (input.val() && (obj.contentType === 'image' || obj.contentType === 'html')) {
                $(container + ' .popover-content').prepend(input.val());
                $(container + ' .popover-content').children('img').css({ 'height': '150px', 'width': '150px' });
                input.val('');
            };

            const wrapperRenameAttachLink = async () => {
                var endValueLink = input.val().trim();
                var file = input_content[0].files[0];

                if ((startValueLink === endValueLink && obj.sc_addr) && !file) stop_modal();
                obj.changedValue = true;

                let addrMainConcept;
                let templateAddr = new sc.ScTemplate();

                templateAddr.tripleWithRelation(
                    [sc.ScType.NodeVar, "_node"],
                    sc.ScType.EdgeDCommonVar,
                    new sc.ScAddr(obj.sc_addr),
                    sc.ScType.EdgeAccessVarPosPerm,
                    new sc.ScAddr(window.scKeynodes['nrel_main_idtf'])
                );
                addrMainConcept = await window.scClient.templateSearch(templateAddr)
                    .then(result => {
                        if (!result.length) return;
                        return result[0].get("_node").value;
                    });

                if (addrMainConcept) {
                    const objMainConcept = self.scene.getObjectByScAddr(Number(addrMainConcept));
                    self.scene.commandManager.execute(new SCgCommandChangeIdtf(objMainConcept, input.val()));
                    document.querySelector(`[sc_addr="${addrMainConcept}"]`).nextSibling.textContent = input.val();
                };

                if (startValueLink !== endValueLink && obj.sc_addr) {
                    obj.changedValue = true;
                }

                if (file !== undefined) {
                    setTimeout(() => {
                        if (obj.contentType === 'image') {
                            self.scene.commandManager.execute(new SCgCommandChangeContent(
                                obj,
                                obj.content,
                                obj.contentType,
                                null,
                            ));
                            stop_modal();
                        }
                    }, 100);

                    const fileReader = new FileReader();
                    fileReader.onload = function () {
                        const scLinkHelper = new ScFileLinkHelper(file, this.result);
                        if (obj.fileReaderResult !== scLinkHelper.fileArrayBuffer || obj.contentType !== scLinkHelper.type) {
                            if (obj.sc_addr) obj.changedValue = true;
                            self.scene.commandManager.execute(new SCgCommandChangeContent(
                                obj,
                                scLinkHelper.htmlViewResult(),
                                scLinkHelper.type,
                                scLinkHelper.fileArrayBuffer,
                            ));
                        }
                        stop_modal();
                    };
                    fileReader.readAsArrayBuffer(file);
                } else {
                    if (obj.content !== input.val() || obj.contentType !== input_content_type.val()) {
                        if (obj.sc_addr) obj.changedValue = true;

                        self.scene.commandManager.execute(new SCgCommandChangeContent(obj,
                            input.val(),
                            input_content_type.val(),
                            null
                        ));
                    }
                    stop_modal();
                }
            }

            input.keypress(function (e) {
                if (e.keyCode === KeyCode.Enter || e.keyCode === KeyCode.Escape) {
                    if (e.keyCode === KeyCode.Enter) {
                        wrapperRenameAttachLink();
                    }
                    stop_modal();
                    e.preventDefault();
                }
            });
            // process controls
            $(container + ' #scg-set-content-apply').click(async function () {
                wrapperRenameAttachLink();
                setTimeout(() => {
                    self.scene.updateLinkVisual();
                    self.scene.updateRender();
                }, 100)
            });
            $(container + ' #scg-set-content-cancel').click(function () {
                stop_modal();
            });
            $('.switchingItemsLi').click(function () {
                stop_modal();
            });
        });

        window.deleteScgElement = function () {
            self.scene.deleteObjects(self.scene.selected_objects);
            self.scene.addDeletedObjects(self.scene.selected_objects);
        };

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
                        self.scene.elements_to_delete = diffArray(self.scene.selected_objects, cantDelete);
                        self.scene.deletable_objects = deletableObjects;
                        console.log(self.scene.elements_to_delete);
                        if (window.demoImplementation) {
                            console.log("SC-WEB post deleteScgElement");
                            const command = {'type': "deleteScgElement"};
                            window.top.postMessage(command, '*');
                        }
                        else {
                            window.deleteScgElement();
                        }
                    } else {
                        if (window.demoImplementation) {
                            console.log("SC-WEB post deleteScgElement");
                            const command = {'type': "deleteScgElement"};
                            window.top.postMessage(command, '*');
                        }
                        else {
                            window.deleteScgElement();
                        }
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

        window.clearScene = function () {
            self.scene.clear = true;
            self.scene.selectAll();
            self.scene.clear = false;
            self.scene.deleteObjects(self.scene.selected_objects);
            self.scene.addDeletedObjects(self.scene.selected_objects);
        }

        this.toolClear().click(function () {
            if (window.demoImplementation) {
                console.log("SC-WEB post clearScene");
                const command = {'type': "clearScene"};
                window.top.postMessage(command, '*');
            }
            else {
                window.clearScene();
            }
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
            construction.createNode(sc.ScType.NodeConst, 'node')

            arr.forEach(el => {
                construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, 'node', new sc.ScAddr(el.sc_addr));
            })

            const elements = await scClient.createElements(construction);
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
            sc.ScType.EdgeAccessVarPosPerm,
            new sc.ScAddr(addr)
        );
        const res = await window.scClient.templateSearch(template);

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
                if (this.scene.isSelectedObjectAllArcsOrAllNodes() && !this.scene.isSelectedObjectAllHaveScAddr()) {
                    this.showTool(this.toolChangeType());
                }
            } else if (this.scene.selected_objects.length === 1 && !this.scene.selected_objects[0].sc_addr) {
                if (this.scene.selected_objects[0] instanceof SCg.ModelNode) {
                    this.showTool(this.toolChangeIdtf());
                    this.showTool(this.toolChangeType());
                } else if (this.scene.selected_objects[0] instanceof SCg.ModelEdge) {
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
        update_tool(this.toolEdge());
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