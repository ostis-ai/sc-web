/**
 * Create new instance of component sandbox.
 * @param {String} container Id of dom object, that will contain component
 * @param {String} link_addr sc-addr of link, that edit or viewed with sandbox
 */
SCWeb.core.ComponentSandbox = function(container, link_addr) {
    this.container = container;
    this.link_addr = link_addr;
    
    this.eventGetObjectsToTranslate = null;
    this.eventApplyTranslation = null;
    this.eventArgumentsUpdate = null;
    this.eventWindowActiveChanged = null;
    this.eventDataAppend = null;
    
    SCWeb.core.Translation.registerListener(this);
    SCWeb.core.Arguments.registerListener(this);
};

SCWeb.core.ComponentSandbox.prototype = {
    constructor: SCWeb.core.ComponentSandbox
};

// ------------------ Core functions --------------------------
/**
 * Destroys component sandbox
 */
SCWeb.core.ComponentSandbox.prototype.destroy = function() {
    SCWeb.core.Translation.unregisterListener(this);
    SCWeb.core.Arguments.unregisterListener(this);
};


// ------------------ Functions to call from component --------
SCWeb.core.ComponentSandbox.prototype.getIdentifiers = function(addr_list, callback) {
	SCWeb.core.Server.resolveIdentifiers(addr_list, callback);
};

SCWeb.core.ComponentSandbox.prototype.getLinkContent = function(addr, callback_success, callback_error) {
	SCWeb.core.Server.getLinkContent(addr, callback_success, callback_error);
};

/**
 * Create viewers for specified sc-links
 * @param {Object} containers_map Map of viewer containers (key: sc-link addr, value: id of container)
 * @param {Function} callback_success Function that calls on success result. It takes one object as parameter. That object 
 * is a dictionary that contains created snadboxes for links sc-addr
 * @param {Function} callback_error Function that calls on error result
 */
SCWeb.core.ComponentSandbox.prototype.createViewersForScLinks = function(containers_map, callback_success, callback_error) {
	var linkAddrs = [];
	for (var addr in containers_map)
			linkAddrs.push(addr);
                
	SCWeb.core.Server.getLinksFormat(linkAddrs,
		function(formats) {
			
			var result = {};
			for (var i = 0; i < linkAddrs.length; i++) {
				var addr = linkAddrs[i];
				var fmt = formats[addr];
				if (fmt) {
					
					sandbox = SCWeb.core.ComponentManager.createWindowSandbox(fmt, addr, containers_map[addr]);
					
					if (sandbox) {
						result[addr] = sandbox;
					}
				}
			}
			
			callback_success(result);
		},
		callback_error
	);
};

// ------ Translation ---------
/**
 * This function returns list of objects, that can be translated.
 * Just for internal usage in core.
 */
SCWeb.core.ComponentSandbox.prototype.getObjectsToTranslate = function() {
    if (this.eventGetObjectsToTranslate)
        return this.eventGetObjectsToTranslate();
        
    return [];
};

/**
 * This function apply translation to component.
 * Just for internal usage in core
 * @param {Object} translation_map Dictionary of translation
 */
SCWeb.core.ComponentSandbox.prototype.updateTranslation = function(translation_map) {
    if (this.eventApplyTranslation)
       this.eventApplyTranslation(translation_map);
};

// ----- Arguments ------
SCWeb.core.ComponentSandbox.prototype._fireArgumentsChanged = function() {
    if (this.eventArgumentsUpdate)
        this.eventArgumentsUpdate(SCWeb.core.Arguments._arguments.slice(0));
};

/**
 * Calls when new argument added
 * @param {String} argument sc-addr of argument
 * @param {Integer} idx Index of argument
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentAppended = function(argument, idx) {
    this._fireArgumentsChanged();
};

/**
 * Calls when new argument removed
 * @param {String} argument sc-addr of argument
 * @param {Integer} idx Index of argument
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentRemoved = function(argument, idx) {
    this._fireArgumentsChanged();
};

/**
 * Calls when arguments list cleared
 */
SCWeb.core.ComponentSandbox.prototype.onArgumentCleared = function() {
    this._fireArgumentsChanged();
};

// --------- Window -----------
SCWeb.core.ComponentSandbox.prototype.onWindowActiveChanged = function(is_active) {
    if (this.eventWindowActiveChanged)
        this.eventWindowActiveChanged(is_active);
};

// --------- Data -------------
SCWeb.core.ComponentSandbox.prototype.onDataAppend = function(data) {
	if (this.eventDataAppend)
		this.eventDataAppend(data);
		
	SCWeb.core.Translation.translate(this.getObjectsToTranslate(), $.proxy(this.updateTranslation, this));
};
