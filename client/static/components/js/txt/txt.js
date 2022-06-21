TextComponent = {
    formats: ['format_txt'],
    factory: function(sandbox) {
        return new TextViewer(sandbox);
    }
};

var TextViewer = function(sandbox){

    this.sandbox = sandbox;
    this.container = '#' + sandbox.container;
    
    // ---- window interface -----
    this.receiveData = async (data) => {
        var container = $(this.container);
        var self = this;

        container.empty();

        let template = new sc.ScTemplate();
        template.Triple(
          [sc.ScType.NodeVar, "x"],
          sc.ScType.EdgeAccessVarPosPerm,
          new sc.ScAddr(self.sandbox.addr)
        );
        template.Triple(
          new sc.ScAddr(scKeynodes.binary_types),
          sc.ScType.EdgeAccessVarPosPerm,
          "x"
        );
        let result = await sctpClient.TemplateSearch(template);
        if (result.length) {
            let type_addr = result[0].Get("x");
            var str = '';

            if (type_addr == scKeynodes.binary_float) {
                var float32 = new Float32Array(data);
                str = float32[0];
            } else if (type_addr == scKeynodes.binary_int8) {
                var int8 = new Int8Array(data);
                str = int8[0];
            } else if (type_addr == scKeynodes.binary_int16) {
                var int16 = new Int16Array(data);
                str = int16[0];
            } else if (type_addr == scKeynodes.binary_int32) {
                var int32 = new Int32Array(data);
                str = int32[0];
            } else {
                str = ArrayBuffer2String(data);
            }

            /// TODO: possible doesn't need to setup binary class, when type unknown and string used
            container.addClass('sc-content-binary');
            container.text(str);

        } else {

            container.addClass('sc-content-string');
            container.text(data);
        }
    };

    this.sandbox.eventDataAppend = this.receiveData;
    this.sandbox.updateContent('binary');
};



SCWeb.core.ComponentManager.appendComponentInitialize(TextComponent);
