SCg.RenderObject = function(params) {
    this.model_object = params.model_object; // pointer to observed object in model
    if (this.model_object)
        this.model_object.observer = this;
    this.force_sync = true;

    this.render = params.render;
    this.d3_group = null;
    this.d3_text = null;
};

SCg.RenderObject.prototype = {

    parseParams: function(params) {
        this.model_object = params.model_object;
        this.render = params.render;
    }
};

/**
 * Calculate connector point
 * @param {SCg.Vector3} from
 *      Position of second point of connector from this
 * @param {Float} dotPos
 *      Dot position (relative position on this object). It depend on object type
 */
SCg.RenderObject.prototype.getConnectionPos = function(from, dotPos) {
    if (this.need_observer_sync)
        this.sync();
};

// ------------ Node ------------


SCg.RenderNode = function(params) {

    SCg.RenderObject.call(this, params);

    this.parseParams(params);
    
    this.d3_basis = null;
};

SCg.RenderNode.prototype = Object.create( SCg.RenderObject.prototype );

SCg.RenderNode.prototype.sync = function() {

    if (!this.model_object.need_observer_sync && !this.force_sync)
        return; // do nothing

                
    position = this.model_object.position;
    scale = this.model_object.scale;
        
    if (!this.d3_basis)
        this.d3_basis = this.d3_group.append("circle").attr("r", scale.x / 2.0).attr("class", "SCgNode");
    if (!this.d3_text && this.model_object.text)
        this.d3_text = this.d3_group.append("text").text(this.model_object.text).attr("x", scale.x / 1.3).attr("y", scale.y / 1.3).attr("class", "SCgText");


    /*this.d3_basis.transition().delay(100).duration(1000).attr("r", scale.x / 2.0).attr("cx", position.x).attr("cy", position.y);
    this.d3_text.transition().delay(100).duration(1000).attr("cx", position.x + scale.x / 2.0).attr("cy", position.y);*/
    
    this.d3_group.attr("transform", "translate(" + position.x.toString() + ", " + position.y.toString() + ")");
    //this.d3_text.attr("cx", position.x + scale.x / 2.0).attr("cy", position.y + scale.y / 2.0);
    
};

SCg.RenderNode.prototype.getConnectionPos = function(from, dotPos) {

    SCg.RenderObject.prototype.getConnectionPos.call(this, from, dotPos);

    var radius = this.model_object.scale.x * 0.8;
    var center = this.model_object.position;
    
    var result = new SCg.Vector3(0, 0, 0);
    
    result.copy(from).sub(center).normalize();
    result.multiplyScalar(radius).add(center);

    return result;
};

SCg.RenderNode.prototype.parseParams = function(params) {
    SCg.RenderObject.prototype.parseParams.call(this, params);


};


// ------------ Edge -------------

SCg.RenderEdge = function(params) {

    SCg.RenderObject.call(this, params);

    this.parseParams(params);
    
    this.d3_line = null;
};

SCg.RenderEdge.prototype = Object.create(SCg.RenderObject.prototype);

SCg.RenderEdge.prototype.sync = function() {

    if (!this.model_object.need_observer_sync && !this.force_sync)
        return; // do nothing

    p1 = this.model_object.begin_pos;
    p2 = this.model_object.end_pos;
        
    if (!this.d3_line)
        this.d3_line = this.d3_group.append("line").style("stroke", "#000").style("stroke-width", 2);
        
    this.d3_line.attr("x1", p1.x).attr("x2", p2.x).attr("y1", p1.y).attr("y2", p2.y);
};

SCg.RenderEdge.prototype.parseParams = function(params) {
    SCg.RenderObject.prototype.parseParams.call(this, params);

};

SCg.RenderEdge.prototype.hasArrow = function() {
    if (!this.model_object)
        return false;
        
    return this.model_object.sc_type & (sc_type_arc_access | sc_type_arc_common);
};


