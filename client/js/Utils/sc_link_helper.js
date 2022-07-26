var ScFileLinkTypes = {
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
    getFileType() {
        var type = this.file.type;
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
    htmlView() {
        return new TextDecoder().decode(this.fileArrayBuffer);
    }
    pdfView() {
        return "[PDF file]";
    }
    imageView() {
        return '<img src="data:image/png;base64,' + btoa(String.fromCharCode.apply(null, new Uint8Array(this.fileArrayBuffer))) + '" alt="Image">'
    }
}
