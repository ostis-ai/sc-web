GithubComponent = {
    formats: ['format_github_source_link'],
    factory: function(sandbox) {
        var viewer = new GithubViewer(sandbox);
        viewer.init();
        return viewer;
    }
};

var GithubViewer = function(sandbox) {
    this.data = {};
    this.container = '#' + sandbox.container;
    this.sandbox = sandbox;
    this.languages = {'m': 'objectivec',
						'h': 'cpp'};
};

GithubViewer.prototype.init = function() {
    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.updateContent();
};

GithubViewer.prototype.receiveData = function(data) {
    var dfd = new jQuery.Deferred();

    // parse data
    var values = data.split(";");
    for (v in values) {
        var item = values[v];
        var pair = item.trim().split("=");

        if (pair.length === 2) {
            this.data[pair[0].trim()] = pair[1].trim();
        }
    }

    function error(str) {
        $(this.container).html('<span style="color: #ff0000;>' + str + '</span>');
    }

    $(this.container).addClass("loading").addClass('github-window');

    if (this.data['owner'] && this.data['repo'] && this.data['path']) {
        $.ajax({
            url: 'https://api.github.com/repos/' + this.data['owner'] + '/' + this.data['repo'] + '/contents/' + this.data['path'],
            success: $.proxy(function(info) {
				var lang = this.data['syntax'];
				if (!lang) {
					// get file extension
					var path = this.data['path'];
					var i = path.lastIndexOf('.');
					var ext = '';
					if (i >= 0) {
						ext = path.substr(i + 1);
					}
					var lang = this.languages[ext];
					if (!lang) {
						lang = ext;
					}
				}
                var result = hljs.highlight(lang, Base64.decode(info.content));
                $(this.container).html('<pre>' + result.value + '</pre>');
            }, this),
            error: function() {
                error("Can't get data from GitHub");
            },
            complete: $.proxy(function() {
                $(this.container).removeClass("loading");
            }, this)
        });
    } else {
        error('Invalid params');
    }
    
    dfd.resolve();

    return dfd.promise();
};


SCWeb.core.ComponentManager.appendComponentInitialize(GithubComponent);
