let ScFileLinkTypes = {
    html: "html",
    pdf: "pdf",
    image: "image"
};

class ScFileLinkHelper {
    constructor(file, fileArrayBuffer) {
        this.file = file;
        this.type = this.getFileType();
        this.fileArrayBuffer = fileArrayBuffer;
    }

    getFileType() {
        const type = this.file.type;
        if (type.indexOf(ScFileLinkTypes.image) > -1) {
            return ScFileLinkTypes.image;
        } else if (type.indexOf(ScFileLinkTypes.html) > -1) {
            return ScFileLinkTypes.html;
        } else if (type.indexOf(ScFileLinkTypes.pdf) > -1) {
            return ScFileLinkTypes.pdf;
        } else {
            throw "Error in ScFileLinkHelper.getFileType"
        }
    }

    toBase64(arrayBuffer) {
        return btoa(
            new Uint8Array(arrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
    }

    htmlViewResult() {
        switch (this.type) {
            case ScFileLinkTypes.html:
                return this.htmlView();
            case ScFileLinkTypes.pdf:
                return this.pdfView();
            case ScFileLinkTypes.image:
                return this.imageView();
            default:
                throw "Error in ScFileLinkHelper.htmlViewResult"
        }
    }
    htmlView() {
        this.parseHtml();
    }
    pdfView() {
        return this.toBase64(this.fileArrayBuffer);
    }
    imageView() {
        return this.toBase64(this.fileArrayBuffer)
    }
}
