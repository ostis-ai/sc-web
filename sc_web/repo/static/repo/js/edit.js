$.namespace('Repo.edit');


Repo.edit.Form = {
    
    init: function(sourcePath) {
        Repo.edit.Editor.init();
        
        this.sourcePath = sourcePath;
        this.updateFileContent();
        this.updateInterval = null;
        this.startUpdateInterval();
        
        this.saveModal = $('#edit-save-changes-modal');
        this.modalSaveButton = $('#edit-modal-save-button');

        this.editLockButton = $('#edit-lock-button');
        this.editSaveButton = $('#edit-save-button');
        this.editResetButton = $('#edit-reset-button');
        
        this.lockPanel = $('#info-panel-locked');

        
        var self = this;
        
        this.lockedForEdit = false;
        this.lockAuthor = null;
        this.lockTime = null;

        this.modalSaveButton.click($.proxy(self.saveFile, self));
        this.editLockButton.click($.proxy(self.lockFile, self));
        this.editSaveButton.click(function() {
            
            if (self.lockedForEdit) {
                self.saveModal.modal('show');
            }
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
                Repo.edit.Editor.setChangedCallback(self.updatePanelsFileChanged);
                self.updateResetContent();
            },
            complete: function(data) { 
                Repo.locker.Lock.hide();
            }
        });
    },
    
    /** Callback for file change callback
     */
    updatePanelsFileChanged: function() {
        $('#info-panel-errors').addClass('hidden');
        $('#info-panel-not-saved').removeClass('hidden');
        $('#info-panel-saved').addClass('hidden');
    },
    
    updateFileSaved: function() {
        $('#info-panel-saved').removeClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
    },
    
    updateFileSaveError: function() {
        $('#info-panel-errors').removeClass('hidden');
        $('#info-panel-saved').addClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
    },
    
    updateResetContent: function() {
        $('#info-panel-errors').addClass('hidden');
        $('#info-panel-saved').addClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
    },
    
    /** Process lock changes
     */
    onLockChanged: function() {
        
        
        if (this.lockedForEdit) {
            this.editLockButton.button('locked');
            this.lockPanel.addClass('hidden');
            
            this.editSaveButton.removeClass('disabled');
            this.editLockButton.addClass('disabled');
            
        } else {
            this.editLockButton.button('reset');
            this.editSaveButton.addClass('disabled');
            this.editLockButton.removeClass('disabled');

            // if file is locked, then author isn't null
            if (this.lockAuthor != null) {
                var lockTime = new Date(this.lockTime * 1000);
                this.lockPanel.html('Locked by <b>' + this.lockAuthor + '</b> on ' + lockTime.toLocaleString());
                this.lockPanel.removeClass('hidden');
            } else {
                this.lockPanel.addClass('hidden');
            }
        }
        
        
        
    },
    
    /** Locks file for edit
     */
    lockFile: function() {
        var self = this;
        
        if (this.lockedForEdit)
            return; // do nothing, if file already locked
        
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
                    
                    self.updateFileContent();
                    self.onLockChanged();
                },
                complete: function(data) {
                     Repo.locker.Lock.hide();
                },
                error: function(data) {
                }
            });
    },
    
    /** Save file changes
     */
    saveFile: function() {
        
        var self = this;
        
        self.stopUpdateInterval();
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
                    self.updateFileSaved();
                    self.unlockFile();
                },
                complete: function(data) {
                    self.startUpdateInterval();
                },
                error: function(data) {
                    self.updateFileSaveError();
                }
            });
        
    },
    
    /** Unlock file
     */
    unlockFile: function() {
        var self = this;
        
        $.ajax({
                type: 'GET',
                url: '/repo/api/unlock',
                data: { 
                        'path': Repo.edit.Form.sourcePath,
                        },
                success: function(data) {
                    
                    self.lockedForEdit = !data.success;
                    self.lockAuthor = null;
                    self.lockTime = null;
                    
                    self.onLockChanged();
                },
                complete: function(data) {
                    self.startUpdateInterval();
                },
                error: function(data) {
                    self.updateFileSaveError();
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
    
    /** Starts update interval
     */
    startUpdateInterval: function() {
        this.updateInterval = setInterval($.proxy(this.update, this), 10 * 1000); // 10 seconds
    },
    
    /** Stops interval updates
     */
    stopUpdateInterval: function() {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
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
    },
    
}



