

SCg.Render = function() {
    this.scene = null;
};

SCg.Render.prototype = {

    init: function(params) {
        this.containerId = params.containerId;
        
        var scgViewer = $('#scg-viewer');
        this.d3_drawer = d3.select('#' + this.containerId)
            .append("svg:svg")
            .attr("pointer-events", "all")
            .attr("width", "100%")
            .attr("height", "100%");
        
        d3.select('#' + this.containerId);//.attr('style', 'display: block');
        
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

        this.d3_accept_point = this.d3_container.append('svg:use')
                    .attr('class', 'SCgAcceptPoint hidden')
                    .attr('xlink:href', '#acceptPoint')
                    .on('mouseover', function(d) {
                        d3.select(this).classed('SCgAcceptPointHighlighted', true);
                    })
                    .on('mouseout', function(d) {
                        d3.select(this).classed('SCgAcceptPointHighlighted', false);
                    })
                    .on('mousedown', function(d) {
                        if (self.scene.edit_mode == SCgEditMode.SCgModeBus) 
                            self.scene.finishBusCreation();
                        else if (self.scene.edit_mode == SCgEditMode.SCgModeContour)
                            self.scene.finishContourCreation();
                        else
                            SCgDebug.error('Invalid edit mode ' + self.scene.edit_mode);

                        d3.event.stopPropagation();
                    });
                
        this.d3_contour_line = d3.svg.line().interpolate("cardinal-closed");
                        
        this.d3_contours = this.d3_container.append('svg:g').selectAll('path');
        this.d3_edges = this.d3_container.append('svg:g').selectAll('path');
        this.d3_nodes = this.d3_container.append('svg:g').selectAll('g');
        this.d3_buses = this.d3_container.append('svg:g').selectAll('path');
        this.d3_dragline = this.d3_container.append('svg:g');
        this.d3_line_points = this.d3_container.append('svg:g');
        
        this.line_point_idx = -1;
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
    
    classState: function(obj, base) {
            
            var res = 'SCgElement';
            
            if (base)
                res += ' ' + base;
            
            if (obj.is_selected)
                res += ' SCgStateSelected';
            
            if (obj.is_highlighted)
                res += ' SCgStateHighlighted ';
            
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
            };
                        
            return res;
    },
    
    classToogle: function(o, cl, flag) {
        
        var item = d3.select(o);
        var str = item.attr("class");
        var res = str.replace(cl, '');
        if (flag)
            res += ' ' + cl;
        item.attr("class", res);
    },
    
    // -------------- draw -----------------------
    update: function() {

        var self = this;
        
        // update nodes visual
        this.d3_nodes = this.d3_nodes.data(this.scene.nodes, function(d) { return d.id; });
        
        // add nodes that haven't visual
        var g = this.d3_nodes.enter().append('svg:g')
            .attr('class', function(d) {
                return self.classState(d, (d.sc_type & sc_type_constancy_mask) ? 'SCgNode' : 'SCgNodeEmpty');
            })
            .attr("transform", function(d) {
                return 'translate(' + d.position.x + ', ' + d.position.y + ')';
            })
            .on('mouseover', function(d) {
                self.classToogle(this, 'SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                self.classToogle(this, 'SCgStateHighlighted', false);
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
            .attr('class', function(d) {
                return self.classState(d, 'SCgEdge');
            })
            .attr('pointer-events', 'visibleStroke')
            .on('mouseover', function(d) {
                self.classToogle(this, 'SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                self.classToogle(this, 'SCgStateHighlighted', false);
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
            });
        
        this.d3_edges.exit().remove();

        // update contours visual
        this.d3_contours = this.d3_contours.data(this.scene.contours, function(d) { return d.id; });

        g = this.d3_contours.enter().append('svg:polygon')
            .attr('class', function(d) {
                return self.classState(d, 'SCgContour');
            })
            .attr('points', function(d) {
                var verticiesString = "";
                for (var i = 0; i < d.points.length; i++) {
                    var vertex = d.points[i].x + ', ' + d.points[i].y + ' ';
                    verticiesString = verticiesString.concat(vertex);
                }
                return verticiesString;
            })
            .on('mouseover', function(d) {
                self.classToogle(this, 'SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                self.classToogle(this, 'SCgStateHighlighted', false);
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
            });

        this.d3_contours.exit().remove();
        
        // update buses visual
        this.d3_buses = this.d3_buses.data(this.scene.buses, function(d) { return d.id; });

        this.d3_buses.enter().append('svg:g')
            .attr('class', function(d) {
                return self.classState(d, 'SCgBus');
            })
            .attr('pointer-events', 'visibleStroke')
            .on('mouseover', function(d) {
                self.classToogle(this, 'SCgStateHighlighted', true);
                self.scene.onMouseOverObject(d);
            })
            .on('mouseout', function(d) {
                self.classToogle(this, 'SCgStateHighlighted', false);
                self.scene.onMouseOutObject(d);
            })
            .on('mousedown', function(d) {
                self.scene.onMouseDownObject(d);
            })
            .on('mouseup', function(d) {
                self.scene.onMouseUpObject(d);
            });
        this.d3_buses.exit().remove();

        this.updateObjects();
    },

    updateObjects: function() {

        var self = this;
        this.d3_nodes.each(function (d) {
            
            if (!d.need_observer_sync) return; // do nothing
            
            d.need_observer_sync = false;
            
            var g = d3.select(this)
                        .attr("transform", 'translate(' + d.position.x + ', ' + d.position.y + ')')
                        .attr('class', function(d) {
                            return self.classState(d, (d.sc_type & sc_type_constancy_mask) ? 'SCgNode' : 'SCgNodeEmpty');
                        })
                            
            g.select('use')
                .attr('xlink:href', function(d) {
                    return '#' + SCgAlphabet.getDefId(d.sc_type); 
                })
                .attr("sc_addr", function(d) {
                    return d.sc_addr;
                });
            
            g.selectAll('text').text(function(d) { return d.text; });;
        });
        
        this.d3_edges.each(function(d) {
            
            if (!d.need_observer_sync) return; // do nothing
            d.need_observer_sync = false;
            
            if (d.need_update)
                d.update();
            var d3_edge = d3.select(this);
            SCgAlphabet.updateEdge(d, d3_edge);
            d3_edge.attr('class', function(d) {
                return self.classState(d, 'SCgEdge');
            });
        });
        
        this.d3_contours.each(function(d) {
        
            d3.select(this).attr('d', function(d) { 

                if (!d.need_observer_sync) return; // do nothing

                if (d.need_update)
                    d.update();

                var d3_contour = d3.select(this);

                d3_contour.attr('class', function(d) {
                    return self.classState(d, 'SCgContour');
                });

                d3_contour.attr('points', function(d) {
                    var verticiesString = "";
                    for (var i = 0; i < d.points.length; i++) {
                        var vertex = d.points[i].x + ', ' + d.points[i].y + ' ';
                        verticiesString = verticiesString.concat(vertex);
                    }
                    return verticiesString;
                });

                d.need_update = false;
                d.need_observer_sync = false;

                return self.d3_contour_line(d.points) + 'Z';
            });
        });

        this.d3_buses.each(function(d) {
            
            if (!d.need_observer_sync) return; // do nothing
            d.need_observer_sync = false;
            
            if (d.need_update)
                d.update();
            var d3_bus = d3.select(this);
            SCgAlphabet.updateBus(d, d3_bus);
            d3_bus.attr('class', function(d) {
                return self.classState(d, 'SCgBus');
            });
        });
    },
    
    updateTexts: function() {
        this.d3_nodes.select('text').text(function(d) { return d.text; });
    },
    
    updateDragLine: function() {
        var self = this;
        

        this.d3_drag_line.classed('SCgBus', this.scene.edit_mode == SCgEditMode.SCgModeBus)
                    .classed('dragline', true)
                    .classed('draglineBus', this.scene.edit_mode == SCgEditMode.SCgModeBus);

        // remove old points
        drag_line_points = this.d3_dragline.selectAll('use.SCgRemovePoint');
        points = drag_line_points.data(this.scene.drag_line_points, function(d) { return d.idx; })
        points.exit().remove();

        points.enter().append('svg:use')
            .attr('class', 'SCgRemovePoint')
            .attr('xlink:href', '#removePoint')
            .attr('transform', function(d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            })
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgRemovePointHighlighted', true);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgRemovePointHighlighted', false);
            })
            .on('mousedown', function(d) {
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
    
    updateLinePoints: function() {
        var self = this;
        
        line_points = this.d3_line_points.selectAll('use');
        points = line_points.data(this.scene.line_points, function(d) { return d.idx; })
        points.exit().remove();
        
        if (this.scene.line_points.length == 0)
            this.line_points_idx = -1;
        
        points.enter().append('svg:use')
            .classed('SCgLinePoint', true)
            .attr('xlink:href', '#linePoint')
            .attr('transform', function(d) {
                return 'translate(' + d.pos.x + ',' + d.pos.y + ')';
            })
            .on('mouseover', function(d) {
                d3.select(this).classed('SCgLinePointHighlighted', true);
            })
            .on('mouseout', function(d) {
                d3.select(this).classed('SCgLinePointHighlighted', false);
            })
            .on('mousedown', function(d) {
                self.line_point_idx = d.idx;
            });
            /*.on('mouseup', function(d) {
                self.scene.pointed_object = null;
            });*/
            
        line_points.each(function(d) {
            d3.select(this).attr('transform', function(d) {
                return 'translate(' + d.pos.x + ',' + d.pos.y + ')';
            });
        });
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
        
         if (this.line_point_idx >= 0) {
             this.line_point_idx = -1;
             d3.event.stopPropagation();
             return;
         }
        
        render.scene.onMouseUp(point[0], point[1]);
    },
    
    onMouseMove: function(window, render) {
        var point = d3.mouse(window);
        
        if (this.line_point_idx >= 0) {
            this.scene.setLinePointPos(this.line_point_idx, {x: point[0], y: point[1]});
            d3.event.stopPropagation();
        }
        
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
