$.namespace('Repo.edit');


Repo.edit.Form = {
    
    init: function(sourcePath) {
        Repo.edit.Editor.init();
        
        this.sourcePath = sourcePath;
        this.updateFileContent();
        
        var self = this;

        $('#save').click($.proxy(self.saveFile, self));

        $('#cancel').click(function () {
            //TODO
        });
        
    },
    
    /** Updates file content from server
     */
    updateFileContent: function() {
        var self = this;
        
        Repo.locker.Lock.show();
        
        $.ajax({
            type: 'GET',
            url: '/repo/api/content',
            data: { 'path': self.sourcePath },
            success: function(data) {
                Repo.edit.Editor.setValue(data);
                Repo.edit.Editor.setChangedCallback(self.onFileChanged);
            },
            complete: function(data) { 
                Repo.locker.Lock.hide();
            }
        });
    },
    
    /** Save file changes
     */
    saveFile: function() {
        
        var self = this;
        
        $.ajax({
                type: 'POST',
                url: '/repo/api/save',
                data: { 
                        'path': Repo.edit.Form.sourcePath,
                        'data': Repo.edit.Editor.getValue(),
                        'summary': $('#summary').val()
                        },
                success: function(data) {
                    self.onSaved();
                },
                complete: function(data) {
                },
                error: function(data) {
                    self.onError();
                }
            });
        
        
    },
    
    /** Callback for file change callback
     */
    onFileChanged: function() {
        $('#info-panel-errors').addClass('hidden');
        $('#info-panel-not-saved').removeClass('hidden');
        $('#info-panel-saved').addClass('hidden');
    },
    
    onSaved: function() {
        $('#info-panel-saved').removeClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
    },
    
    onError: function() {
        $('#info-panel-errors').removeClass('hidden');
        $('#info-panel-saved').addClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
    }
}


Repo.edit.Editor = {

    init: function() {
        var self = this;
        var codeArea = document.getElementById("code");
        this.editor = CodeMirror.fromTextArea(codeArea,
            {
                lineNumbers:true,
                mode:"scs",
                lineWrapping: false,
                
            });
            
        
        
        
        $('.editorSettings button').click(function(){
            var state = !$(this).attr("class").match("active");
            var name = $(this).attr("name");
            self.editor.setOption(name, state);
        });

        $('.editorViews button').click(function(){
            var isActive = $(this).attr("class").match("active");
            if (isActive) {
                return;
            }

            var name = $(this).attr("name");
            if (name == "code") {
               //TODO
            } else if (name == "preview") {
                //TODO
            }
        });
    },

    setValue: function(data) {
        this.editor.setValue(data);
    },

    getValue: function() {
        return this.editor.getValue();
    },
    
    setChangedCallback: function(callback) {
        this.editor.on("change", callback);
    }
}



