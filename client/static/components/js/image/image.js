ImageComponent = {
    formats: ['format_png', 'format_jpg', 'format_gif'],
    factory: function(sandbox) {
        return new ImageViewer(sandbox);
    }
};

var ImageViewer = function(sandbox){
    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;

    function toDataUrl(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.send();
    }

    // ---- window interface -----
    this.receiveData = function(data) {
        var dfd = new jQuery.Deferred();

        $(this.container).empty();
        $(this.container).append('<img src="' + data + '" style="width: 100%; height: 100%;"></img>');

        dfd.resolve();
        return dfd.promise();
    };

    var self = this;
    if (this.sandbox.addr) {
        toDataUrl('api/link/content/?addr=' + this.sandbox.addr, function(base64Img) {
            self.receiveData(base64Img);
        });
    }
};


SCWeb.core.ComponentManager.appendComponentInitialize(ImageComponent);
