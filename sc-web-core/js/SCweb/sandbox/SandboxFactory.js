SCWeb.sandbox.SandboxFactory = (function() {

    return {
        buildSandbox : function(container) {

            var newSandbox = new SCWeb.sandbox.ComponentSandbox(container);
            newSandbox.init();
            newSandbox.init = null;
            return newSandbox;
        }
    };
})();