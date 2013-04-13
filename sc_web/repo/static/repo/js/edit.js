$.namespace('Repo.edit');


Repo.edit.Form = {
    
    init: function(sourcePath) {
        Repo.edit.Editor.init();
        
        this.sourcePath = sourcePath;
        this.updateFileContent();
        this.updateInterval = setInterval($.proxy(this.update, this), 10 * 1000); // 10 seconds
        
        this.saveModal = $('#edit-save-changes-modal');
        this.modalSaveButton = $('#edit-modal-save-button');

        this.editLockButton = $('#edit-lock-button');
        this.editSaveButton = $('#edit-save-button');
        this.editResetButton = $('#edit-reset-button');

        
        var self = this;
        
        this.lockedForEdit = false;
        this.lockAuthor = null;
        this.lockTime = null;

        this.modalSaveButton.click($.proxy(self.saveFile, self));
        this.editLockButton.click($.proxy(self.lockFile, self));
        this.editSaveButton.click(function() {
            self.saveModal.modal('show');
        });
        this.editResetButton.click($.proxy(self.updateFileContent, self));

        $('#cancel').click(function () {
            //TODO
        });
        
        // initial state update
        this.update();
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
                self.onResetContent();
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
        
        self.saveModal.modal('hide');
        
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
    },
    
    onResetContent: function() {
        
        $('#info-panel-errors').addClass('hidden');
        $('#info-panel-saved').addClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
    },
    
    /** Process lock changes
     */
    onLockChanged: function() {
        
        var lockPanel = $('#info-panel-locked');
        
        if (this.lockedForEdit) {
            this.editLockButton.button('locked');
            lockPanel.addClass('hidden');
            this.updateFileContent();
        } else {
            this.editLockButton.button('reset');

            // if file is locked, then author isn't null
            if (this.lockAuthor != null) {
                var lockTime = new Date(this.lockTime * 1000);
                lockPanel.html('Locked by <b>' + this.lockAuthor + '</b> on ' + lockTime.toUTCString());
                
                lockPanel.removeClass('hidden');
            } else {
                lockPanel.addClass('hidden');
            }
        }
        
        
        
    },
    
    /** Locks file for edit
     */
    lockFile: function() {
        var self = this;
        
        Repo.locker.Lock.show();
        
        $.ajax({
                type: 'GET',
                url: '/repo/api/lock',
                data: { 
                        'path': self.sourcePath
                        },
                success: function(data) {
                    self.lockedForEdit = data.success;
                    self.lockAuthor = data.lockAuthor;
                    self.lockTime = data.lockTime;
                    self.onLockChanged();
                },
                complete: function(data) {
                     Repo.locker.Lock.hide();
                },
                error: function(data) {
                }
            });
    },
    
    /** Function to sync edit state with server
     */
    update: function() {
        
        var self = this;
        
        $.ajax({
                type: 'GET',
                url: '/repo/api/update',
                data: { 
                        'path': self.sourcePath
                        },
                success: function(data) {
                    
                    self.lockedForEdit = data.lockLive;
                    self.lockAuthor = data.lockAuthor;
                    self.lockTime = data.lockTime;
                    
                    self.onLockChanged();
                },
                complete: function(data) {
                },
                error: function(data) {
                }
            });
        
    },
    
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
    },
    
}



