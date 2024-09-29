var SCgAlphabet = {

    scType2Str: {},

    /**
     * Initialize all definitions, for svg drawer
     */
    initSvgDefs: function (defs, containerId) {

        this.initTypesMapping();

        const nodeLineStroke = 1.3;

        // edge markers
        defs.append('svg:marker')
            .attr('id', 'end-arrow-access_' + containerId).attr('viewBox', '0 -5 10 10').attr('refX', 0)
            .attr('markerWidth', 8).attr('markerHeight', 14).attr('orient', 'auto')
            .attr('markerUnits', 'userSpaceOnUse')
            .append('svg:path')
            .attr('d', 'M0,-4L10,0L0,4').attr('fill', '#000');

        defs.append('svg:marker')
            .attr('id', 'end-arrow-common_' + containerId).attr('viewBox', '0 -5 10 10').attr('refX', 0)
            .attr('markerWidth', 10).attr('markerHeight', 16).attr('orient', 'auto')
            .attr('markerUnits', 'userSpaceOnUse')
            .append('svg:path')
            .attr('d', 'M0,-4L10,0L0,4').attr('fill', '#000');

        // nodes
        defs.append('svg:circle').attr('id', 'scg.const.node.outer').attr('cx', '0').attr('cy', '0').attr('r', '10');
        defs.append('svg:rect').attr('id', 'scg.var.node.outer').attr('x', '-10').attr('y', '-10').attr('width', '20').attr('height', '20');

        defs.append('svg:clip-path')
            .attr('id', 'scg.const.node.clip')
            .append('svg:use')
            .attr('xlink:href', '#scg.const.node.clip');

        defs.append('svg:clip-path')
            .attr('id', 'scg.var.node.clip')
            .append('svg:use')
            .attr('xlink:href', '#scg.var.node.clip');


        //  ----- define constant nodes -----      
        var g = defs.append('svg:g').attr('id', 'scg.node');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '5');
        g.append('svg:text').attr('x', '7').attr('y', '15').attr('class', 'SCgText');

        g = defs.append('svg:g').attr('id', 'scg.const.node');
        g.append('svg:use').attr('xlink:href', '#scg.const.node.outer');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.const.node.tuple');
        g.append('svg:use').attr('xlink:href', '#scg.const.node.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', nodeLineStroke);
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.const.node.struct');
        g.append('svg:use').attr('xlink:href', '#scg.const.node.outer');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '2').attr('stroke', 'none').attr('fill', '#000');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.const.node.role');
        g.append('svg:use').attr('xlink:href', '#scg.const.node.outer');
        g.append('svg:line').attr('x1', '0').attr('x2', '0').attr('y1', '-10').attr('y2', '10').attr('stroke-width', nodeLineStroke);
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', nodeLineStroke);
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.const.node.norole');
        g.append('svg:use').attr('xlink:href', '#scg.const.node.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', nodeLineStroke).attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', nodeLineStroke).attr('transform', 'rotate(-45, 0, 0)');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.const.node.class');
        g.append('svg:use').attr('xlink:href', '#scg.const.node.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3').attr('stroke-width', nodeLineStroke)
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3').attr('stroke-width', nodeLineStroke);
        g.append('svg:line').attr('x1', '-3').attr('x2', '-3').attr('y1', '-10').attr('y2', '10').attr('stroke-width', nodeLineStroke);
        g.append('svg:line').attr('x1', '3').attr('x2', '3').attr('y1', '-10').attr('y2', '10').attr('stroke-width', nodeLineStroke);
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.const.node.superclass');
        g.append('svg:use').attr('xlink:href', '#scg.const.node.outer');
        // Draw the circumflex shape
        g.append('svg:line').attr('x1', '-7').attr('x2', '0').attr('y1', '7').attr('y2', '-7').attr('stroke-width', nodeLineStroke);
        g.append('svg:line').attr('x1', '7').attr('x2', '0').attr('y1', '7').attr('y2', '-7').attr('stroke-width', nodeLineStroke);
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.const.node.material');//.attr('clip-path', 'url(#scg.const.node.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.const.node.outer');
        var g2 = g.append('svg:g').attr('stroke-width', nodeLineStroke).attr('transform', 'rotate(-45, 0, 0)');
        g2.append('svg:line').attr('x1', '-9').attr('x2', '9').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-9').attr('x2', '9').attr('y1', '6').attr('y2', '6');
        this.appendText(g);


        //  ----- define variable nodes -----
        g = defs.append('svg:g').attr('id', 'scg.var.node');
        g.append('svg:use').attr('xlink:href', '#scg.var.node.outer');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.var.node.tuple');
        g.append('svg:use').attr('xlink:href', '#scg.var.node.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', nodeLineStroke);
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.var.node.struct');
        g.append('svg:use').attr('xlink:href', '#scg.var.node.outer');
        g.append('svg:circle').attr('cx', '0').attr('cy', '0').attr('r', '2').attr('stroke', 'none').attr('fill', '#000');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.var.node.role');
        g.append('svg:use').attr('xlink:href', '#scg.var.node.outer');
        g.append('svg:line').attr('x1', '0').attr('x2', '0').attr('y1', '-10').attr('y2', '10').attr('stroke-width', nodeLineStroke);
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '0').attr('y2', '0').attr('stroke-width', nodeLineStroke);
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.var.node.norole');
        g.append('svg:use').attr('xlink:href', '#scg.var.node.outer');
        g.append('svg:line').attr('x1', '-12').attr('x2', '12').attr('y1', '0').attr('y2', '0').attr('stroke-width', nodeLineStroke).attr('transform', 'rotate(45, 0, 0)');
        g.append('svg:line').attr('x1', '-12').attr('x2', '12').attr('y1', '0').attr('y2', '0').attr('stroke-width', nodeLineStroke).attr('transform', 'rotate(-45, 0, 0)');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.var.node.class');
        g.append('svg:use').attr('xlink:href', '#scg.var.node.outer');
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '-3').attr('y2', '-3').attr('stroke-width', nodeLineStroke)
        g.append('svg:line').attr('x1', '-10').attr('x2', '10').attr('y1', '3').attr('y2', '3').attr('stroke-width', nodeLineStroke);
        g.append('svg:line').attr('x1', '-3').attr('x2', '-3').attr('y1', '-10').attr('y2', '10').attr('stroke-width', nodeLineStroke);
        g.append('svg:line').attr('x1', '3').attr('x2', '3').attr('y1', '-10').attr('y2', '10').attr('stroke-width', nodeLineStroke);
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.var.node.superclass');
        g.append('svg:use').attr('xlink:href', '#scg.var.node.outer');
        // Draw the circumflex shape
        g.append('svg:line').attr('x1', '-9').attr('x2', '0').attr('y1', '9').attr('y2', '-7').attr('stroke-width', nodeLineStroke);
        g.append('svg:line').attr('x1', '9').attr('x2', '0').attr('y1', '9').attr('y2', '-7').attr('stroke-width', nodeLineStroke);
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.var.node.material');//.attr('clip-path', 'url(#scg.var.node.clip)');
        g.append('svg:use').attr('xlink:href', '#scg.var.node.outer');
        var g2 = g.append('svg:g').attr('stroke-width', nodeLineStroke).attr('transform', 'rotate(-45, 0, 0)');
        g2.append('svg:line').attr('x1', '-9').attr('x2', '9').attr('y1', '-6').attr('y2', '-6');
        g2.append('svg:line').attr('x1', '-11').attr('x2', '11').attr('y1', '-3').attr('y2', '-3');
        g2.append('svg:line').attr('x1', '-13').attr('x2', '13').attr('y1', '0').attr('y2', '0');
        g2.append('svg:line').attr('x1', '-11').attr('x2', '11').attr('y1', '3').attr('y2', '3');
        g2.append('svg:line').attr('x1', '-9').attr('x2', '9').attr('y1', '6').attr('y2', '6');
        this.appendText(g);

        g = defs.append('svg:g').attr('id', 'scg.node.link');
        g.append('svg:rect').attr('fill', '#aaa').attr('stroke-width', '3');
    },

    /**
     * Append sc.g-text to definition
     */
    appendText: function (def, x, y) {
        def.append('svg:text')
            .attr('x', '17')
            .attr('y', '21')
            .attr('class', 'SCgText')
    },

    /**
     * Return definition name by sc-type
     */
    getDefId: function (sc_type) {
        if (this.scType2Str.hasOwnProperty(sc_type)) {
            return this.scType2Str[sc_type];
        }

        return 'scg.node';
    },

    /**
     * Initialize sc-types mapping
     */
    initTypesMapping: function () {
        this.scType2Str[sc_type_node] = 'scg.node';
        this.scType2Str[sc_type_const | sc_type_node] = 'scg.const.node';
        this.scType2Str[sc_type_const | sc_type_node | sc_type_node_material] = 'scg.const.node.material';
        this.scType2Str[sc_type_const | sc_type_node | sc_type_node_abstract] = 'scg.const.node.superclass';
        this.scType2Str[sc_type_const | sc_type_node | sc_type_node_class] = 'scg.const.node.class';
        this.scType2Str[sc_type_const | sc_type_node | sc_type_node_structure] = 'scg.const.node.struct';
        this.scType2Str[sc_type_const | sc_type_node | sc_type_node_norole] = 'scg.const.node.norole';
        this.scType2Str[sc_type_const | sc_type_node | sc_type_node_role] = 'scg.const.node.role';
        this.scType2Str[sc_type_const | sc_type_node | sc_type_node_tuple] = 'scg.const.node.tuple';

        this.scType2Str[sc_type_var | sc_type_node] = 'scg.var.node';
        this.scType2Str[sc_type_var | sc_type_node | sc_type_node_material] = 'scg.var.node.material';
        this.scType2Str[sc_type_var | sc_type_node | sc_type_node_abstract] = 'scg.var.node.superclass';
        this.scType2Str[sc_type_var | sc_type_node | sc_type_node_class] = 'scg.var.node.class';
        this.scType2Str[sc_type_var | sc_type_node | sc_type_node_structure] = 'scg.var.node.struct';
        this.scType2Str[sc_type_var | sc_type_node | sc_type_node_norole] = 'scg.var.node.norole';
        this.scType2Str[sc_type_var | sc_type_node | sc_type_node_role] = 'scg.var.node.role';
        this.scType2Str[sc_type_var | sc_type_node | sc_type_node_tuple] = 'scg.var.node.tuple';

        this.scType2Str[sc_type_node_link] = 'scg.node.link';
        this.scType2Str[sc_type_node_link | sc_type_const] = 'scg.const.node.link';
        this.scType2Str[sc_type_node_link | sc_type_var] = 'scg.var.node.link';
    },

    classLevel: function (obj) {
        let levelStyle;
        switch (obj.level) {
            case SCgObjectLevel.First:
                levelStyle = 'DBSCgFirstLevelView';
                break;
            case SCgObjectLevel.Second:
                levelStyle = 'DBSCgSecondLevelView';
                break;
            case SCgObjectLevel.Third:
                levelStyle = 'DBSCgThirdLevelView';
                break;
            case SCgObjectLevel.Fourth:
                levelStyle = 'DBSCgFourthLevelView';
                break;
            case SCgObjectLevel.Fifth:
                levelStyle = 'DBSCgFifthLevelView';
                break;
            case SCgObjectLevel.Sixth:
                levelStyle = 'DBSCgSixthLevelView';
                break;
            case SCgObjectLevel.Seventh:
                levelStyle = 'DBSCgSeventhLevelView';
                break;
            default:
                levelStyle = '';
        }

        return levelStyle;
    },

    classScale: function (obj) {
        let scale;
        switch (obj.level) {
            case SCgObjectLevel.First:
                scale = 2.3;
                break;
            case SCgObjectLevel.Second:
                scale = 1.8;
                break;
            case SCgObjectLevel.Third:
                scale = 1.5;
                break;
            case SCgObjectLevel.Fourth:
            case SCgObjectLevel.Fifth:
            case SCgObjectLevel.Sixth:
            case SCgObjectLevel.Seventh:
            default:
                scale = 1;
        }

        return scale;
    },

    /**
     * All sc.g-edges represented by group of paths, so we need to update whole group.
     * This function do that work
     * @param edge {SCg.ModelEdge} Object that represent sc.g-edge
     * @param d3_group Object that represents svg group
     */
    updateEdge: function (edge, d3_group, containerId) {
        // first of all we need to determine if edge has an end marker
        let has_marker = edge.hasArrow();

        // now calculate target and source positions
        let pos_src = edge.source_pos.clone();
        let pos_trg = edge.target_pos.clone();

        // if we have an arrow, then need to fix end position
        if (has_marker) {
            let prev_pos = pos_src;
            if (edge.points.length > 0) {
                prev_pos = new SCg.Vector3(edge.points[edge.points.length - 1].x, edge.points[edge.points.length - 1].y, 0);
            }

            let dv = pos_trg.clone().sub(prev_pos);
            let len = dv.length();
            dv.normalize();
            pos_trg = prev_pos.clone().add(dv.multiplyScalar(len - 10));
        }

        // make position path
        let position_path = 'M' + pos_src.x + ',' + pos_src.y;
        for (let idx in edge.points) {
            position_path += 'L' + edge.points[idx].x + ',' + edge.points[idx].y;
        }
        position_path += 'L' + pos_trg.x + ',' + pos_trg.y;

        const sc_type_str = edge.sc_type.toString();
        if (d3_group['sc_type'] !== sc_type_str) {
            d3_group.attr('sc_type', sc_type_str);

            // remove old
            d3_group.selectAll('path').remove();

            d3_group.append('svg:path').classed('SCgEdgeSelectBounds', true).attr('d', position_path);

            // if it accessory, then append main line
            if (edge.sc_type & sc_type_membership_arc) {

                let main_style = 'SCgEdgeAccessPerm';
                if (edge.sc_type & sc_type_temp_arc) {
                    main_style = edge.sc_type & sc_type_var ? 'SCgEdgeAccessTempVar' : 'SCgEdgeAccessTemp';
                }

                main_style += ' ' + SCgAlphabet.classLevel(edge);
                var p = d3_group.append('svg:path')
                    .classed(main_style, true)
                    .classed('SCgEdgeEndArrowAccess', true)
                    .style("marker-end", "url(#end-arrow-access_" + containerId + ")")
                    .attr('d', position_path);

                if (edge.sc_type & sc_type_constancy_mask) {
                    p.classed('SCgEdgeVarDashAccessPerm', (edge.sc_type & sc_type_var) && (edge.sc_type & sc_type_perm_arc));
                } else {
                    d3_group.append('svg:path')
                        .classed('SCgEdgeAccessCommonDash', true)
                        .attr('d', position_path);
                }

                if (edge.sc_type & sc_type_neg_arc) {
                    d3_group.append('svg:path')
                        .classed('SCgEdgePermNegDash ' + SCgAlphabet.classLevel(edge), true)
                        .attr('d', position_path);
                }
            } else if (edge.sc_type & (sc_type_common_arc | sc_type_common_edge)) {
                let main_style = 'SCgEdgeCommonBack';
                if (edge.sc_type & sc_type_common_edge) {
                    if (edge.sc_type & sc_type_var) {
                        d3_group.append('svg:path')
                            .classed('SCgEdgeVarDashCommon ' + SCgAlphabet.classLevel(edge), true)
                            .attr('d', position_path);
                    }
                    else {
                        d3_group.append('svg:path')
                            .classed(main_style, true)
                            .attr('d', position_path);
                    }
                }

                if (edge.sc_type & sc_type_common_arc) {
                    if (edge.sc_type & sc_type_var) {
                        d3_group.append('svg:path')
                            .classed('SCgEdgeVarDashCommon ' + SCgAlphabet.classLevel(edge), true)
                            .classed('SCgEdgeEndArrowCommon ' + SCgAlphabet.classLevel(edge), true)
                            .style("marker-end", "url(#end-arrow-common_" + containerId + ")")
                            .attr('d', position_path);
                    }
                    else {
                        d3_group.append('svg:path')
                            .classed('SCgEdgeCommonBack', true)
                            .classed('SCgEdgeEndArrowCommon ' + SCgAlphabet.classLevel(edge), true)
                            .style("marker-end", "url(#end-arrow-common_" + containerId + ")")
                            .attr('d', position_path);
                    }
                }

                d3_group.append('svg:path')
                    .classed('SCgEdgeCommonForeground ' + SCgAlphabet.classLevel(edge), true)
                    .attr('d', position_path)

                if ((edge.sc_type & sc_type_constancy_mask) === 0)
                {
                    d3_group.append('svg:path')
                        .classed('SCgEdgeVarDashCommon ' + SCgAlphabet.classLevel(edge), true)
                        .attr('d', position_path);
                }

            } else {
                // unknown
                let main_style = 'SCgEdgeUnknown ' + SCgAlphabet.classLevel(edge);
                d3_group.append('svg:path')
                    .classed(main_style, true)
                    .attr('d', position_path);
            }

        } else {
            // update existing
            d3_group.selectAll('path')
                .attr('d', position_path);
        }

        // now we need to draw fuz markers (for now it is not supported)
        if (edge.sc_type & sc_type_fuz_arc) {
            d3_group.selectAll('path').attr('stroke', '#f00');
            d3_group.append('svg:path')
                .classed('SCgEdgeFuzDash', true)
                .attr('d', position_path)
                .attr('stroke', '#f00');
        }

    },

    updateBus: function (bus, d3_group) {

        var pos_src = bus.source_pos.clone();

        // make position path
        var position_path = 'M' + pos_src.x + ',' + pos_src.y;
        for (idx in bus.points) {
            position_path += 'L' + bus.points[idx].x + ',' + bus.points[idx].y;
        }

        if (d3_group[0][0].childElementCount == 0) {

            d3_group.append('svg:path').classed('SCgBusPath', true).attr('d', position_path);

            // if it accessory, then append main line


        } else {
            // update existing
            d3_group.selectAll('path')
                .attr('d', position_path);
        }

    }
};
