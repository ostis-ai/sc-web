$.namespace('Repo.edit');

Repo.edit.Form = {
    
    init: function(sourcePath) {
        this.sourcePath = sourcePath;
        this.updateFileContent();
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
            },
            complete: function(data) { 
                Repo.locker.Lock.hide();
            }
        });
    }
}


Repo.edit.Editor = {

    init: function() {
        var self = this;
        var codeArea = document.getElementById("code");
        this.editor = CodeMirror.fromTextArea(codeArea,
            {   lineNumbers:true,
                mode:"scs",
                lineWrapping: false
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

        $('#save').click(function () {
            //TODO
        });

        $('#cancel').click(function () {
            //TODO
        });
    },

    setValue: function(data) {
        this.editor.setValue(data);
    },

    getValue: function() {
        this.editor.getValue();
    }
}



