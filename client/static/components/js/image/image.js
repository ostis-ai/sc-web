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
        $(this.container).append('<img src="data:' + mimeType + ';base64,' + data + '" style="width: 100%; height: 100%;"></img>');
    };

    const getMimeType = async function (link) {
        const FORMAT = "_format";
        const MIME_TYPE = "_mime_type";

        const template = new sc.ScTemplate();
        template.tripleWithRelation(
            new sc.ScAddr(link),
            sc.ScType.EdgeDCommonVar,
            [sc.ScType.NodeVar, FORMAT],
            sc.ScType.EdgeAccessVarPosPerm,
            new sc.ScAddr(window.scKeynodes["nrel_format"]),
        );
        template.tripleWithRelation(
            FORMAT,
            sc.ScType.EdgeDCommonVar,
            [sc.ScType.NodeVar, MIME_TYPE],
            sc.ScType.EdgeAccessVarPosPerm,
            new sc.ScAddr(window.scKeynodes["nrel_mimetype"]),
        );
        const result = await scClient.templateSearch(template);
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

    if (this.sandbox.addr) {
        window.scClient.getLinkContents([new sc.ScAddr(this.sandbox.addr)]).then((contents) => {
            if (contents.length) {
                let base64 = contents[0].data;
                getMimeType(this.sandbox.addr).then((mimeType) => {
                    this.receiveData(mimeType, base64);
                });
            }
        });
    }
};

SCWeb.core.ComponentManager.appendComponentInitialize(ImageComponent);
