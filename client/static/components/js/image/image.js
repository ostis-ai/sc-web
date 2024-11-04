ImageComponent = {
    formats: ['format_png', 'format_jpg', 'format_gif'],
    factory: function(sandbox) {
        return new ImageViewer(sandbox);
    }
};

const ImageViewer = function (sandbox) {
    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;

    // ---- window interface -----
    this.receiveData = function (mimeType, data) {
        $(this.container).empty();

        let img = $('<img>').attr('src', 'data:' + mimeType + ';base64,' + data).css({
            'max-width': sandbox.contentStyle ? sandbox.contentStyle.maxWidth : '300px',
            'max-height': sandbox.contentStyle ? sandbox.contentStyle.maxHeight :'300px'
        }).on('load', function() {
            SCWeb.core.EventManager.emit("render/update");
        });

        $(this.container).append(img);
    };

    const getMimeType = async function (formatAddr) {
        const MIME_TYPE = "_mime_type";

        const template = new sc.ScTemplate();
        template.quintuple(
            new sc.ScAddr(formatAddr),
            sc.ScType.VarCommonArc,
            [sc.ScType.VarNodeLink, MIME_TYPE],
            sc.ScType.VarPermPosArc,
            new sc.ScAddr(window.scKeynodes["nrel_mimetype"]),
        );
        const result = await scClient.searchByTemplate(template);
        if (result.length) {
            const mimeLink = result[0].get(MIME_TYPE);
            const contents = await scClient.getLinkContents([mimeLink]);

            if (contents.length) {
                return contents[0].data;
            }

            return "";
        }

        return "";
    }

    if (this.sandbox.addr.isValid() && !this.sandbox.content) {
        window.scClient.getLinkContents([this.sandbox.addr]).then((contents) => {
            if (contents.length) {
                let base64 = contents[0].data;
                getMimeType(this.sandbox.format_addr).then((mimeType) => {
                    this.receiveData(mimeType, base64);
                });
            }
        });
    }
    else {
        let base64 = this.sandbox.content;
        getMimeType(this.sandbox.format_addr).then((mimeType) => {
            this.receiveData(mimeType, base64);
        });
    }
};

SCWeb.core.ComponentManager.appendComponentInitialize(ImageComponent);
