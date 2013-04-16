$.namespace('Repo.edit');


Repo.edit.Form = {
    
    init: function(sourcePath) {
        Repo.edit.Editor.init('#edit-container');
        
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
        this.modalSummary = $('#summary');
        
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

        this.summaryApproved = false;
        this.modalSummary.bind('input', $.proxy(this.onSummaryChanged, this));
        this.onSummaryChanged();
        
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
            async: false,
            success: function(data) {
                Repo.edit.Editor.setValue(data);
                Repo.edit.Editor.setChangedCallback(self.processPanelsFileChanged);
                
                self.processResetContent();
            },
            complete: function(data) { 
                Repo.locker.Lock.hide();
                
                Repo.edit.Editor.setReadOnly(!self.lockedForEdit);
            }
        });
    },
    
    /** Callback for file change callback
     */
    processPanelsFileChanged: function() {
        $('#info-panel-errors').addClass('hidden');
        $('#info-panel-not-saved').removeClass('hidden');
        $('#info-panel-saved').addClass('hidden');
    },
    
    processFileSaved: function() {
        $('#info-panel-saved').removeClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
    },
    
    processFileSaveError: function() {
        $('#info-panel-errors').removeClass('hidden');
        $('#info-panel-saved').addClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
    },
    
    processResetContent: function() {
        $('#info-panel-errors').addClass('hidden');
        $('#info-panel-saved').addClass('hidden');
        $('#info-panel-not-saved').addClass('hidden');
        
    },
    
    /** Process summary changes
     */
    onSummaryChanged: function() {
        var value = this.modalSummary.val();
        
        if (value.length < 10) {
            this.modalSummary.addClass('edit-summary-input-invalid');
            this.summaryApproved = false;
            this.modalSaveButton.addClass('disabled');
        } else {
            this.modalSummary.removeClass('edit-summary-input-invalid');
            this.summaryApproved = true;
            this.modalSaveButton.removeClass('disabled');
        }
        
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
                    
                    Repo.edit.Editor.setReadOnly(false);
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
        
        if (!this.summaryApproved)
            return; // do nothing
        
        var self = this;
        var summary = this.modalSummary.val();
        
        self.stopUpdateInterval();
        self.saveModal.modal('hide');
        
        $.ajax({
                type: 'POST',
                url: '/repo/api/save',
                data: { 
                        'path': Repo.edit.Form.sourcePath,
                        'data': Repo.edit.Editor.getValue(),
                        'summary': summary
                        },
                success: function(data) {
                    if (data.success) {
                        self.processFileSaved();
                    } else {
                        self.processFileSaveError();
                    }
                    
                    self.unlockFile();
                },
                complete: function(data) {
                    self.startUpdateInterval();
                },
                error: function(data) {
                    self.processFileSaveError();
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
                    
                    
                },
                complete: function(data) {
                    
                    self.lockedForEdit = !data.success;
                    self.lockAuthor = null;
                    self.lockTime = null;
                    
                    self.onLockChanged();
                    
                    Repo.edit.Editor.setReadOnly(true);
                    
                    self.startUpdateInterval();
                },
                error: function(data) {
                    self.processFileSaveError();
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
                    
                    if (self.lockedForEdit != data.lockLive)
                        Repo.edit.Editor.setReadOnly(!data.lockLive);
                    
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
    
    editor: null,

    init: function(container) {
        var self = this;
        
        this.onChangeCallback = $.proxy(this.onChange, this);
        this.container = $(container);
        this.readOnly = true;
        this.value = '';
        this.onChange = null;
        
        this.createEditor();
        
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
    
    /** Create new instance of editor and revome older
     */
    createEditor: function() {
        
        if (this.editor)
        {
            this.editor.off("change", this.onChangeCallback);
            delete this.editor;
            this.editor = null;
        }
        
        this.container.empty();
        this.container.html('<textarea id="code"></textarea>');
        
        this.editor = CodeMirror.fromTextArea(
            document.getElementById("code"),
            {
                lineNumbers: true, 
                mode: "scs",
                lineWrapping: false
            //    value: this.value,
             //   readOnly: this.readOnly
            });
            
            
        this.editor.on("change", this.onChangeCallback);
    },

    setValue: function(data) {
        this.editor.setValue(data);
        this.value = data;
    },

    getValue: function() {
        return this.value;
    },
    
    setChangedCallback: function(callback) {
        this.onChange = callback;
    },
    
    setReadOnly: function(readOnly) {
        /*this.readOnly = readOnly;
        this.createEditor();*/
        this.editor.setOption('readOnly', readOnly);
    },
    
    onChange: function() {
        
        this.value = this.editor.getValue();
        
        if (this.onChange) {
            this.onChange();
        }
    }
    
}



