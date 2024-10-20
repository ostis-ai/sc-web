SCg.Render = function () {
    this.scene = null;
    this.sandbox = null;
};

SCg.Render.prototype = {

    init: function (params) {
        this.containerId = params.containerId;
        this.sandbox = params.sandbox;

        this.linkBorderWidth = 5;
        this.scale = 1;
        this.translate = [0, 0];
        this.translate_started = false;
        this.zoomIn = 1.1;
        this.zoomOut = 0.9

        this.transformByZoom = function (e) {
            const svg = e.currentTarget
            const svgRect = svg.getBoundingClientRect();

            const svgX = e.clientX - svgRect.x;
            const svgY = e.clientY - svgRect.y;

            const transformX = (svgX - this.translate[0]) / this.scale;
            const transformY = (svgY - this.translate[1]) / this.scale;

            e.wheelDelta > 0 ? this.scale *= this.zoomIn : this.scale *= this.zoomOut;

            this.translate[0] = svgX - transformX * this.scale;
            this.translate[1] = svgY - transformY * this.scale;

            this.scene.render._changeContainerTransform()
        }
        // disable tooltips
        $('#' + this.containerId).parent().addClass('ui-no-tooltip');

        this.d3_drawer = d3.select('#' + this.containerId)
            .append("svg:svg")
            .attr("pointer-events", "all")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("class", "SCgSvg")
            .on('mousemove', function () {
                self.onMouseMove(this, self);
            })
            .on('mousedown', function () {
                self.onMouseDown(this, self);
            })
            .on('mouseup', function () {
                self.onMouseUp(this, self);
            })
            .on('dblclick', function () {
                self.onMouseDoubleClick(this, self);
            })
            .on("mouseleave", function (d) {
                self.scene.onMouseUpObject(d);
                if (d3.event.stopPropagation()) d3.event.stopPropagation();
            })
            .on("wheel", function () {
                self.transformByZoom(d3.event);
            });

        const svg = document.querySelector("svg.SCgSvg");
        svg.ondragstart = () => false;

        this.scale = 1;
        var self = this;
        self.sandbox.updateContent();
        this.d3_container = this.d3_drawer.append('svg:g')
            .attr("class", "SCgSvg");

        this.initDefs();

        /* this.d3_container.append('svg:rect')
         .style("fill", "url(#backGrad)")
         .attr('width', '10000') //parseInt(this.d3_drawer.style("width")))
         .attr('height', '10000');//parseInt(this.d3_drawer.style("height")));
         */

        this.d3_drag_line = this.d3_container.append('svg:path')
            .attr('class', 'dragline hidden')
            .attr('d', 'M0,0L0,0');
        this.d3_contour_line = d3.svg.line().interpolate("cardinal-closed");
        this.d3_contours = this.d3_container.append('svg:g').selectAll('path');
        this.d3_accept_point = this.d3_container.append('svg:use')
            .attr('class', 'SCgAcceptPoint hidden')
            .attr('xlink:href', '#acceptPoint')
            .on('mouseover', function (d) {
                d3.select(this).classed('SCgAcceptPointHighlighted', true);
            })
            .on('mouseout', function (d) {
                d3.select(this).classed('SCgAcceptPointHighlighted', false);
            })
            .on('mousedown', function (d) {
                self.scene.listener.finishCreation();
                d3.event.stopPropagation();
            });
        this.d3_connectors = this.d3_container.append('svg:g').selectAll('path');
        this.d3_buses = this.d3_container.append('svg:g').selectAll('path');
        this.d3_nodes = this.d3_container.append('svg:g').selectAll('g');
        this.d3_links = this.d3_container.append('svg:g').selectAll('g');
        this.d3_dragline = this.d3_container.append('svg:g');
        this.d3_line_points = this.d3_container.append('svg:g');

        this.line_point_idx = -1;
    },

    // -------------- Definitions --------------------
    initDefs: function () {
        // define arrow markers for graph links
        var defs = this.d3_drawer.append('svg:defs')

        SCgAlphabet.initSvgDefs(defs, this.containerId);

        var grad = defs.append('svg:radialGradient')
            .attr('id', 'backGrad')
            .attr('cx', '50%')
            .attr('cy', '50%')
            .attr('r', '100%').attr("spreadMethod", "pad");

        grad.append('svg:stop')
            .attr('offset', '0%')
            .attr('stop-color', 'rgb(255,253,252)')
            .attr('stop-opacity', '1')
        grad.append('svg:stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgb(245,245,245)')
            .attr('stop-opacity', '1')

        // line point control
        var p = defs.append('svg:g')
            .attr('id', 'linePoint')
        p.append('svg:circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 10);

        p = defs.append('svg:g')
            .attr('id', 'acceptPoint')
        p.append('svg:circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 10)
        p.append('svg:path')
            .attr('d', 'M-5,-5 L0,5 5,-5');
        p = defs.append('svg:g')
            .attr('id', 'removePoint')
        p.append('svg:circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 10)

        p.append('svg:path')
            .attr('d', 'M-5,-5L5,5M-5,5L5,-5');
    },

    classState: function (obj, base) {
        let res = ' sc-no-default-cmd ui-no-tooltip SCgElement';

        if (SCWeb.core.Main.viewMode === SCgViewMode.DistanceBasedSCgView) res += ' DBSCgView';

        if (base) res += ' ' + base;

        if (obj.is_selected) res += ' SCgStateSelected';

        if (obj.is_highlighted) res += ' SCgStateHighlighted ';

        switch (obj.state) {
            case SCgObjectState.FromMemory:
                res += ' SCgStateFromMemory';
                break;
            case SCgObjectState.MergedWithMemory:
                res += ' SCgStateMergedWithMemory';
                break;
            case SCgObjectState.NewInMemory:
                res += ' SCgStateNewInMemory';
                break;
            default:
                res += ' SCgStateNormal';
        }

        return res;
    },

    classToogle: function (o, cl, flag) {
        let item = d3.select(o);
        let str = item.attr("class");
        let res = str ? str.replace(cl, '') : '';
        res = res.replace('  ', ' ');
        if (flag)
            res += ' ' + cl;
        item.attr("class", res);
    },

    appendNodeVisual: function (g) {
        g.append('svg:use')
            .attr('xlink:href', function (d) {
                return '#' + SCgAlphabet.getDefId(d.sc_type);
            })
            .attr('class', 'sc-no-default-cmd ui-no-tooltip');
    },

    // -------------- draw -----------------------
    update: function () {
        let self = this;

        function eventsWrap(selector) {
            selector.on('mouseover', function (d) {
                self.classToogle(this, 'SCgStateHighlighted', true);
                if (self.scene.onMouseOverObject(d))
                    d3.event.stopPropagation();
            })
                .on('mouseout', function (d) {
                    self.classToogle(this, 'SCgStateHighlighted', false);
                    if (self.scene.onMouseOutObject(d))
                        d3.event.stopPropagation();
                })
                .on('mousedown', function (d) {
                    self.scene.onMouseDownObject(d);
                    if (d3.event.stopPropagation())
                        d3.event.stopPropagation();
                })
                .on('mouseup', function (d) {
                    self.scene.onMouseUpObject(d);
                    if (d3.event.stopPropagation())
                        d3.event.stopPropagation();
                })
                .on("dblclick", d => {
                    if (d3.event.stopPropagation())
                        d3.event.stopPropagation();

                    if (SCWeb.core.Main.viewMode === SCgViewMode.DistanceBasedSCgView) {
                        if (self.scene.getObjectByScAddr(d.sc_addr) instanceof SCg.ModelConnector) return;

                        self.sandbox.updateContent(new sc.ScAddr(d.sc_addr));
                        return;
                    }

                    if (SCWeb.core.Main.editMode === SCgEditMode.SCgViewOnly) return;

                    if (!d.sc_addr) return;

                    if (d3.event.stopPropagation())
                        d3.event.stopPropagation();
                    let windowId = SCWeb.ui.WindowManager.getActiveWindowId();
                    let container = document.getElementById(windowId);
                    SCWeb.core.Main.doDefaultCommandWithFormat([d.sc_addr], $(container).attr("sc-addr-fmt"));
                });
        }

        // add nodes that haven't visual
        this.d3_nodes = this.d3_nodes.data(this.scene.nodes, function (d) {
            return d.id;
        });

        let g = this.d3_nodes.enter().append('svg:g')
            .attr("transform", function (d) {
                return 'translate(' + d.position.x + ', ' + d.position.y + ')scale(' + SCgAlphabet.classScale(d) + ')';
            })
            .attr('class', function (d) {
                let classStyle = (d.sc_type & sc_type_constancy_mask) ? 'SCgNode' : 'SCgNodeEmpty';
                classStyle += ' ' + SCgAlphabet.classLevel(d);
                return self.classState(d, classStyle);
            });
        eventsWrap(g);
        self.appendNodeVisual(g);

        g.append('svg:text')
            .attr('class', 'SCgText')
            .attr('x', function (d) {
                return d.scale.x / 1.3;
            })
            .attr('y', function (d) {
                return d.scale.y / 1.3;
            })
            .text(function (d) {
                return d.text;
            });

        this.d3_nodes.exit().remove();

        // add links that haven't visual
        this.d3_links = this.d3_links.data(this.scene.links, function (d) {
            return d.id;
        });

        g = this.d3_links.enter().append('svg:g')
            .attr("transform", function (d) {
                return 'translate(' + d.position.x + ', ' + d.position.y + ')scale(' + SCgAlphabet.classScale(d) + ')';
            })

        g.append('svg:rect')
            .attr('class', function (d) {
                let linkType = 'SCgLink';
                if (d.sc_type & sc_type_var) linkType += ' Var';
                return self.classState(d, linkType);
            })
            .attr('class', 'sc-no-default-cmd ui-no-tooltip');

        g.append('svg:foreignObject')
            .attr('transform', 'translate(' + self.linkBorderWidth * 0.5 + ',' + self.linkBorderWidth * 0.5 + ')')
            .attr("width", "100%")
            .attr("height", "100%")
            .append("xhtml:link_body")
            .style("background", "transparent")
            .style("margin", "0 0 0 0")
            .style("cursor", "pointer")
            .html(function (d) {
                return '<div id="link_' + self.containerId + '_' + d.id + '" class=\"SCgLinkContainer\"><div id="' + d.containerId + '" style="display: inline-block;" class="impl"></div></div>';
            });

        // Add identifier to sc-link, default (x, y) position
        g.append('svg:text')
            .attr('class', 'SCgText')
            .text(function (d) {
                return d.text;
            })
            .attr('x', function (d) {
                return d.scale.x + self.linkBorderWidth * 2;
            })
            .attr('y', function (d) {
                return d.scale.y + self.linkBorderWidth * 4;
            });

        eventsWrap(g);

        this.d3_links.exit().remove();

        // update connectors visual
        this.d3_connectors = this.d3_connectors.data(this.scene.connectors, function (d) {
            return d.id;
        });

        // add connectors that haven't visual
        g = this.d3_connectors.enter().append('svg:g')
            .attr('class', function (d) {
                const classStyle = 'SCgConnector ' + SCgAlphabet.classLevel(d);
                return self.classState(d, classStyle);
            })
            .attr('pointer-events', 'visibleStroke');

        eventsWrap(g);

        this.d3_connectors.exit().remove();

        // update contours visual
        this.d3_contours = this.d3_contours.data(this.scene.contours, function (d) {
            return d.id;
        });

        g = this.d3_contours.enter().append('svg:polygon')
            .attr('class', function (d) {
                return self.classState(d, 'SCgContour');
            })
            .attr('points', function (d) {
                var verticiesString = "";
                for (var i = 0; i < d.points.length; i++) {
                    var vertex = d.points[i].x + ', ' + d.points[i].y + ' ';
                    verticiesString = verticiesString.concat(vertex);
                }
                return verticiesString;
            })
            .attr('title', function (d) {
                return d.text;
            });
        eventsWrap(g);

        this.d3_contours.exit().remove();

        // update buses visual
        this.d3_buses = this.d3_buses.data(this.scene.buses, function (d) {
            return d.id;
        });

        g = this.d3_buses.enter().append('svg:g')
            .attr('class', function (d) {
                return self.classState(d, 'SCgBus');
            })
            .attr('pointer-events', 'visibleStroke');
        eventsWrap(g);

        this.d3_buses.exit().remove();

        this.updateObjects();
    },

    updateRemovedObjects: function (removableObjects) {
        function eventsUnwrap(selector) {
            selector.on('mouseover', null)
                .on('mouseout', null)
                .on('mousedown', null)
                .on('mouseup', null)
                .on("dblclick", null);
        }

        const objects = this.d3_container.append('svg:g').selectAll('g');
        const d3_removable_objects = objects.data(removableObjects, function (d) {
            return d.id;
        });

        const g = d3_removable_objects.enter().append('svg:g');

        eventsUnwrap(g);

        d3_removable_objects.exit().remove();
    },

    // -------------- update objects --------------------------
    updateObjects: function () {
        let self = this;
        this.d3_nodes.each(function (d) {
            if (!d.need_observer_sync) return; // do nothing
            d.need_observer_sync = false;

            let g = d3.select(this)
                .attr("transform", function (d) {
                    return 'translate(' + d.position.x + ', ' + d.position.y + ')scale(' + SCgAlphabet.classScale(d) + ')';
                })
                .attr('class', function (d) {
                    let classStyle = (d.sc_type & sc_type_constancy_mask) ? 'SCgNode' : 'SCgNodeEmpty';
                    classStyle += ' ' + SCgAlphabet.classLevel(d);
                    return self.classState(d, classStyle);
                });

            g.select('use')
                .attr('xlink:href', function (d) {
                    return '#' + SCgAlphabet.getDefId(d.sc_type);
                })
                .attr("sc_addr", function (d) {
                    return d.sc_addr;
                });

            g.selectAll('text').text(function (d) {
                return d.text;
            });
        });

        this.d3_links.each(function (d) {
            if (!d.need_observer_sync && d.contentLoaded) return; // do nothing

            if (!d.contentLoaded) {
                let links = {};
                links[d.containerId] = {addr: d.sc_addr, content: d.content, contentType: d.contentType, state: d.state};
                self.sandbox.createViewersForScLinks(links);

                if (d.state !== SCgObjectState.NewInMemory || d.content.length) d.contentLoaded = true;
            }
            else d.need_observer_sync = false;

            let linkDiv = $(document.getElementById("link_" + self.containerId + "_" + d.id));
            if (!d.content.length) {
                d.content = linkDiv.find('.impl').html();
            }
            if (!linkDiv.find('.impl').html().length) {
                linkDiv.find('.impl').html(d.content)
            }

            const imageDiv = linkDiv.find('img');
            const pdfDiv = linkDiv.children().find('canvas');
            let g = d3.select(this);
            g.select('rect')
                .attr('width', function (d) {
                    if (imageDiv.length && !isNaN(imageDiv[0].width)) {
                        d.scale.x = imageDiv[0].width;
                    } else if (pdfDiv.length && !isNaN(pdfDiv[0].width)) {
                        d.scale.x = pdfDiv[0].width;
                    } else {
                        d.scale.x = Math.min(linkDiv.find('.impl').outerWidth(), 450) + 10;
                    }
                    return d.scale.x + self.linkBorderWidth * 2;
                })
                .attr('height', function (d) {
                    if (imageDiv.length && !isNaN(imageDiv[0].height)) {
                        d.scale.y = imageDiv[0].height;
                    } else if (pdfDiv.length && !isNaN(pdfDiv[0].height)) {
                        d.scale.y = pdfDiv[0].height;
                    } else {
                        d.scale.y = Math.min(linkDiv.outerHeight(), 350);
                    }
                    return d.scale.y + self.linkBorderWidth * 2;
                })
                .attr('class', function (d) {
                    let classStyle = 'SCgLink ' + SCgAlphabet.classLevel(d);
                    if (d.sc_type & sc_type_var) classStyle += ' Var';
                    return self.classState(d, classStyle);
                })
                .attr("sc_addr", function (d) {
                    return d.sc_addr;
                });

            g.selectAll(function () {
                return this.getElementsByTagName("foreignObject");
            })
                .attr('width', function (d) {
                    return d.scale.x;
                })
                .attr('height', function (d) {
                    return d.scale.y;
                });

            g.attr("transform", function (d) {
                return 'translate(' + (d.position.x - (d.scale.x + self.linkBorderWidth) * 0.5)
                    + ', ' + (d.position.y - (d.scale.y + self.linkBorderWidth) * 0.5)
                    + ')scale(' + SCgAlphabet.classScale(d) + ')';
            });

            // Update sc-link identifier (x, y) position according to the sc-link width
            g.selectAll('text')
                .text(function (d) {
                    return d.text;
                })
                .attr('x', function (d) {
                    return d.scale.x + self.linkBorderWidth * 2;
                })
                .attr('y', function (d) {
                    return d.scale.y + self.linkBorderWidth * 4;
                });
        });

        this.d3_connectors.each(function (d) {
            if (!d.need_observer_sync) return; // do nothing
            d.need_observer_sync = false;

            if (d.need_update)
                d.update();
            let d3_connector = d3.select(this);

            SCgAlphabet.updateConnector(d, d3_connector, self.containerId);
            d3_connector.attr('class', function (d) {
                const classStyle = 'SCgConnector ' + SCgAlphabet.classLevel(d);
                return self.classState(d, classStyle);
            })
                .attr("sc_addr", function (d) {
                    return d.sc_addr;
                });
        });

        this.d3_contours.each(function (d) {
            d3.select(this).attr('d', function (d) {
                if (!d.need_observer_sync) return; // do nothing

                if (d.need_update)
                    d.update();

                let d3_contour = d3.select(this);

                d3_contour.attr('class', function (d) {
                    return self.classState(d, 'SCgContour');
                });

                d3_contour.attr('points', function (d) {
                    var verticiesString = "";
                    for (var i = 0; i < d.points.length; i++) {
                        var vertex = d.points[i].x + ', ' + d.points[i].y + ' ';
                        verticiesString = verticiesString.concat(vertex);
                    }
                    return verticiesString;
                });

                d3_contour.attr('title', function (d) {
                    return d.text;
                });

                d.need_update = false;
                d.need_observer_sync = false;

                return self.d3_contour_line(d.points) + 'Z';
            })
                .attr("sc_addr", function (d) {
                    return d.sc_addr;
                });
        });

        this.d3_buses.each(function (d) {
            if (!d.need_observer_sync) return; // do nothing
            d.need_observer_sync = false;

            if (d.need_update)
                d.update();
            var d3_bus = d3.select(this);
            SCgAlphabet.updateBus(d, d3_bus);
            d3_bus.attr('class', function (d) {
                return self.classState(d, 'SCgBus');
            });
        });

        this.updateLinePoints();
    },

    updateLink: function () {
        let self = this;
        this.d3_links.each(function (d) {
            if (!d.contentLoaded) {
                let links = {};
                links[d.containerId] = {addr: d.sc_addr, content: d.content, contentType: d.contentType, state: d.state};
                self.sandbox.createViewersForScLinks(links);

                if (d.state !== SCgObjectState.NewInMemory || d.content.length) d.contentLoaded = true;
            }
            else d.need_observer_sync = false;

            let linkDiv = $(document.getElementById("link_" + self.containerId + "_" + d.id));
            if (!d.content.length) {
                d.content = linkDiv.find('.impl').html();
            }
            if (!linkDiv.find('.impl').html().length) {
                linkDiv.find('.impl').html(d.content)
            }

            const imageDiv = linkDiv.find('img');
            const pdfDiv = linkDiv.children().find('canvas');
            let g = d3.select(this);
            g.select('rect')
                .attr('width', function (d) {
                    if (imageDiv.length && !isNaN(imageDiv[0].width)) {
                        d.scale.x = imageDiv[0].width;
                    } else if (pdfDiv.length && !isNaN(pdfDiv[0].width)) {
                        d.scale.x = pdfDiv[0].width;
                    } else {
                        d.scale.x = Math.min(linkDiv.find('.impl').outerWidth(), 450) + 10;
                    }
                    return d.scale.x + self.linkBorderWidth * 2;
                })
                .attr('height', function (d) {
                    if (imageDiv.length && !isNaN(imageDiv[0].height)) {
                        d.scale.y = imageDiv[0].height;
                    } else if (pdfDiv.length && !isNaN(pdfDiv[0].height)) {
                        d.scale.y = pdfDiv[0].height;
                    } else {
                        d.scale.y = Math.min(linkDiv.outerHeight(), 350);
                    }
                    return d.scale.y + self.linkBorderWidth * 2;
                })
                .attr('class', function (d) {
                    let classStyle = 'SCgLink ' + SCgAlphabet.classLevel(d);
                    if (d.sc_type & sc_type_var) classStyle += ' Var';
                    return self.classState(d, classStyle);
                })
                .attr("sc_addr", function (d) {
                    return d.sc_addr;
                });

            g.selectAll(function () {
                return this.getElementsByTagName("foreignObject");
            })
                .attr('width', function (d) {
                    return d.scale.x;
                })
                .attr('height', function (d) {
                    return d.scale.y;
                });

            g.attr("transform", function (d) {
                return 'translate(' + (d.position.x - (d.scale.x + self.linkBorderWidth) * 0.5)
                    + ', ' + (d.position.y - (d.scale.y + self.linkBorderWidth) * 0.5)
                    + ')scale(' + SCgAlphabet.classScale(d) + ')';
            });

            // Update sc-link identifier (x, y) position according to the sc-link width
            g.selectAll('text')
                .text(function (d) {
                    return d.text;
                })
                .attr('x', function (d) {
                    return d.scale.x + self.linkBorderWidth * 2;
                })
                .attr('y', function (d) {
                    return d.scale.y + self.linkBorderWidth * 4;
                });
        });
        this.updateLinePoints();
    },

    updateTexts: function () {
        this.d3_nodes.select('text').text(function (d) {
            return d.text;
        });
        this.d3_links.select('text').text(function (d) {
            return d.text;
        });
    },

    requestUpdateAll: function () {
        this.d3_nodes.each(function (d) {
            d.need_observer_sync = true;
        });
        this.d3_links.each(function (d) {
            d.need_observer_sync = true;
        });
        this.d3_connectors.each(function (d) {
            d.need_observer_sync = true;
            d.need_update = true;
        });
        this.d3_contours.each(function (d) {
            d.need_observer_sync = true;
            d.need_update = true;
        });
        this.d3_buses.each(function (d) {
            d.need_observer_sync = true;
            d.need_update = true;
        });
        this.update();
    },

    requestUpdateObjects: function () {
        this.d3_nodes.each(function (d) {
            d.need_observer_sync = true;
        });
        this.d3_links.each(function (d) {
            d.need_observer_sync = true;
        });
        this.d3_connectors.each(function (d) {
            d.need_observer_sync = true;
            d.need_update = true;
        });
        this.d3_contours.each(function (d) {
            d.need_observer_sync = true;
            d.need_update = true;
        });
        this.d3_buses.each(function (d) {
            d.need_observer_sync = true;
            d.need_update = true;
        });
    },

    updateDragLine: function () {
        var self = this;


        this.d3_drag_line.classed('SCgBus', this.scene.edit_mode == SCgEditMode.SCgModeBus)
            .classed('dragline', true)
            .classed('draglineBus', this.scene.edit_mode == SCgEditMode.SCgModeBus);

        // remove old points
        drag_line_points = this.d3_dragline.selectAll('use.SCgRemovePoint');
        points = drag_line_points.data(this.scene.drag_line_points, function (d) {
            return d.idx;
        })
        points.exit().remove();

        points.enter().append('svg:use')
            .attr('class', 'SCgRemovePoint')
            .attr('xlink:href', '#removePoint')
            .attr('transform', function (d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            })
            .on('mouseover', function (d) {
                d3.select(this).classed('SCgRemovePointHighlighted', true);
            })
            .on('mouseout', function (d) {
                d3.select(this).classed('SCgRemovePointHighlighted', false);
            })
            .on('mousedown', function (d) {
                self.scene.revertDragPoint(d.idx);
                d3.event.stopPropagation();
            });


        if (this.scene.edit_mode == SCgEditMode.SCgModeBus || this.scene.edit_mode == SCgEditMode.SCgModeContour) {
            this.d3_accept_point.classed('hidden', this.scene.drag_line_points.length == 0);
            if (this.scene.drag_line_points.length > 0) {
                var pos = this.scene.drag_line_points[0];
                if (this.scene.edit_mode == SCgEditMode.SCgModeBus)
                    pos = this.scene.drag_line_points[this.scene.drag_line_points.length - 1];
                this.d3_accept_point.attr('transform', 'translate(' + (pos.x + 24) + ',' + pos.y + ')');
            }
        } else {
            this.d3_accept_point.classed('hidden', true);
        }

        if (this.scene.drag_line_points.length < 1) {
            this.d3_drag_line.classed('hidden', true);
        } else {

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
        }
    },

    updateLinePoints: function () {
        var self = this;
        var oldPoints;

        line_points = this.d3_line_points.selectAll('use');
        points = line_points.data(this.scene.line_points, function (d) {
            return d.idx;
        })
        points.exit().remove();

        if (this.scene.line_points.length == 0)
            this.line_points_idx = -1;

        points.enter().append('svg:use')
            .classed('SCgLinePoint', true)
            .attr('xlink:href', '#linePoint')
            .attr('transform', function (d) {
                return 'translate(' + d.pos.x + ',' + d.pos.y + ')';
            })
            .on('mouseover', function (d) {
                d3.select(this).classed('SCgLinePointHighlighted', true);
            })
            .on('mouseout', function (d) {
                d3.select(this).classed('SCgLinePointHighlighted', false);
            })
            .on('mousedown', function (d) {
                if (self.line_point_idx < 0) {
                    oldPoints = $.map(self.scene.selected_objects[0].points, function (vertex) {
                        return $.extend({}, vertex);
                    });
                    self.line_point_idx = d.idx;
                } else {
                    var newPoints = $.map(self.scene.selected_objects[0].points, function (vertex) {
                        return $.extend({}, vertex);
                    });
                    self.scene.commandManager.execute(new SCgCommandMovePoint(self.scene.selected_objects[0],
                        oldPoints,
                        newPoints,
                        self.scene),
                        true);
                    self.line_point_idx = -1;
                }
            })
            .on('dblclick', function (d) {
                self.line_point_idx = -1;
            })
            .on('mouseup', function (d) {
                self.scene.appendAllElementToContours();
            });

        line_points.each(function (d) {
            d3.select(this).attr('transform', function (d) {
                return 'translate(' + d.pos.x + ',' + d.pos.y + ')';
            });
        });
    },

    _changeContainerTransform: function (translate, scale) {
        if (translate) {
            this.translate[0] = translate[0];
            this.translate[1] = translate[1];
            this.scale = scale || this.scale;
        }
        this.d3_container.attr("transform", "translate(" + this.translate + ")scale(" + this.scale + ")");
    },

    changeScale: function (mult) {
        if (mult === 0)
            throw "Invalid scale multiplier";

        this.scale *= mult;
        var scale = Math.max(2, Math.min(0.1, this.scale));
        this._changeContainerTransform();
    },

    changeTranslate: function (delta) {

        this.translate[0] += delta[0] * this.scale;
        this.translate[1] += delta[1] * this.scale;

        this._changeContainerTransform();
    },

    // --------------- Events --------------------
    _correctPoint: function (p) {
        p[0] -= this.translate[0];
        p[1] -= this.translate[1];

        p[0] /= this.scale;
        p[1] /= this.scale;
        return p;
    },

    onMouseDown: function (window, render) {
        var point = this._correctPoint(d3.mouse(window));
        if (render.scene.onMouseDown(point[0], point[1]))
            return;

        this.translate_started = true;
    },

    onMouseUp: function (window, render) {

        if (this.translate_started) {
            this.translate_started = false;
            return;
        }

        var point = this._correctPoint(d3.mouse(window));

        if (this.line_point_idx >= 0) {
            this.line_point_idx = -1;
            d3.event.stopPropagation();
            return;
        }

        if (render.scene.onMouseUp(point[0], point[1]))
            d3.event.stopPropagation();
    },

    onMouseMove: function (window, render) {

        if (this.translate_started)
            this.changeTranslate([d3.event.movementX, d3.event.movementY]);

        var point = this._correctPoint(d3.mouse(window));

        if (this.line_point_idx >= 0) {
            this.scene.setLinePointPos(this.line_point_idx, { x: point[0], y: point[1] });
            d3.event.stopPropagation();
        }

        if (render.scene.onMouseMove(point[0], point[1]))
            d3.event.stopPropagation();
    },

    onMouseDoubleClick: function (window, render) {
        var point = this._correctPoint(d3.mouse(window));
        if (this.scene.onMouseDoubleClick(point[0], point[1]))
            d3.event.stopPropagation();
    },

    onKeyDown: function (event) {
        // do not send event to other listeners, if it processed in scene
        if (this.scene.onKeyDown(event))
            d3.event.stopPropagation();
    },

    onMouseWheelUp: function (event) {
        // do not send event to other listeners, if it processed in scene
        if (this.scene.onKeyUp(event))
            d3.event.stopPropagation();
    },

    onMouseWheelDown: function (event) {
        // do not send event to other listeners, if it processed in scene
        if (this.scene.onKeyUp(event))
            d3.event.stopPropagation();
    },

    onKeyUp: function (event) {
        // do not send event to other listeners, if it processed in scene
        if (this.scene.onKeyUp(event))
            d3.event.stopPropagation();
    },

    // ------- help functions -----------
    getContainerSize: function () {
        const el = document.getElementById(this.containerId);
        return [el.clientWidth, el.clientHeight];
    }
}
