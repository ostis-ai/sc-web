$.namespace('Repo.view');


Repo.view.Tree = {
    
    repoPath: '',
    listItems: [], // list of displayed items
    
    init: function() {
        this.newFileNameInput = $('#tree-browser-filename-input');
        this.newFileNameErrorText = $('#tree-browser-filename-error');
        this.newFileCreateButton = $('#tree-browser-filecreate-button');
        this.newFileModal = $('#new-file-modal');
        
        this.newDirNameInput = $('#tree-browser-dirname-input');
        this.newDirNameErrorText = $('#tree-browser-dirname-error');
        this.newDirCreateButton = $('#tree-browser-dircreate-button');
        this.newDirModal = $('#new-dir-modal');
        
        this.newFileNameInput.bind('input', $.proxy(this.onNewFileNameChanged, this));
        this.newDirNameInput.bind('input', $.proxy(this.onNewDirNameChanged, this));
        
        this.newFileCreateButton.click($.proxy(this.onNewFileCreate, this));
        this.newDirCreateButton.click($.proxy(this.onNewDirCreate, this));
        
        this.updateToRepoPath(this.repoPath);
    },
    
    /** Updates view to specified repository path
     * @param {path} Path in repository
     */
    updateToRepoPath: function(path) {
        
        Repo.locker.Lock.show();
        
        this.repoPath = path;
        
        this.updateRepoPath(path);
        this.updatePathFilesList(path);
        this.updateLastCommit();
        
        this.onNewFileNameChanged();
        this.onNewDirNameChanged();
        
        Repo.locker.Lock.hide();
    },
    
    /** Function to update current path in repository
     * @param {path} Path in repository
     */
    updateRepoPath: function(path) {
        
        repoPathTag = $('#repo-path')
        
        // split path to subdirectories
        var dirs = path.split('/');
        var resHtml = '<li><a href="#" class="dir-path" repo_path="">repo</a><span class="divider">/</span></li>';
        
        var relPath = '';
        for(var i = 0; i < dirs.length; i++) 
        {
            if (i > 0)
                relPath += '/';
            relPath += dirs[i];
            if (i < dirs.length - 1) {
                resHtml += '<li><a href="#" class="dir-path" repo_path="' + relPath + '">' + dirs[i] + '</a> <span class="divider">/</span></li>';
            } else {
                resHtml += '<li>' + dirs[i] + '</li>';
            }
        }
        
        repoPathTag.empty();
        repoPathTag.append(resHtml);
    },
    
    /** Updates directory files list
     * @param {path} Path to directory for update
     */
    updatePathFilesList: function(path) {
        
        var self = this;
        $.ajax({
            type: 'GET',
            url: '/repo/api/files',
            data: {'path': path},
            async: false,
            success: function(data) { 
                filesTableTag = $("#files-list-table");
                self.listItems = data.slice(0);
                
                var resHtml = '';
                for (var i = 0; i < self.listItems.length; i++) {
                    var item = self.listItems[i];

                    resHtml += '<tr>';
                    if (item.is_dir) {
                        resHtml += '<td><a class="files-item-dir dir-path" repo_path="' + item.path + '">' + item.name + '</a></td>';
                    } else {
                        resHtml += '<td><a href="/repo/edit/' + item.path + '" class="files-item-file" repo_path="' + item.path + '">' + item.name + '</a></td>';
                    }
                    resHtml += '<td class="commit-author"><i class="icon-user commit-autho-icon"></i>' + item.author + '</td>';
                    var date = new Date(item.date * 1000);
                    resHtml += '<td class="commit-date">' + date.toLocaleDateString() + '</td>';
                    delete date;
                    resHtml += '<td class="commit-summary">' + item.summary + '</td>';
                    
                    resHtml += '</tr>';
                }
                
                filesTableTag.empty();
                filesTableTag.append(resHtml);
                
                $('.dir-path').click(function() {
                    var path = $(this).attr('repo_path');
                    self.updateToRepoPath(path);
                    return true;
                });
                
                
            },
            complete: function(data) { 
                
            }
        });
    },
     
    /** Updates last commit information
     */
    updateLastCommit: function() {
        lastCommitTag = $('#last-commit');
        
        lastCommitTag.empty();
        $.ajax({
            type: 'GET',
            url: '/repo/api/commit',
            data: {},
            async: false,
            success: function(data) {
                lastCommitTag.append(data.summary);
            },
            complete: function(data) { 
            }
        });
    },
    
    /** Callback for new file name input value changes
     */
    onNewFileNameChanged: function() {
        this.updateNewDialog(this.newFileNameInput,
                            this.newFileNameErrorText,
                            this.newFileCreateButton,
                            '.scs');
    },
    
    /** Callback for new directory name input value changes
     */
    onNewDirNameChanged: function() {
        this.updateNewDialog(this.newDirNameInput,
                            this.newDirNameErrorText,
                            this.newDirCreateButton,
                            '');
    },
    
    /** Update new file/dir modal dialog state
     * @param {nameInput} jquery object for name input
     * @param {nameErrorText} jquery object for error text
     * @param {createButton} jquery object for create button
     * @param {fileNameExt} file extension (used in new file dialog)
     */
    updateNewDialog: function(nameInput, nameErrorText, createButton, fileNameExt) {
        var value = nameInput.val().toLowerCase();
        var approved = true;
        
        for (var i = 0; i < this.listItems.length; i++) {
            var item = this.listItems[i];
            
            if (item["name"].toLowerCase() == (value + fileNameExt)) {
                approved = false;
                break;
            }
        }
        
        // update state
        if (approved) {
            nameInput.removeClass('tree-browser-filename-input-invalid');
            nameErrorText.hide();
            createButton.show();
        } else {
            nameInput.addClass('tree-browser-filename-input-invalid');
            nameErrorText.show();
            createButton.hide();
        }
    },
    
    /** Callback fucntion on new file create button click
     */
    onNewFileCreate: function() {
        var self = this;
        var path = this.newFileNameInput.val() + '.scs';
        var abspath = this.absRepoPath(path);
        
        
        $.ajax({
                type: 'POST',
                url: '/repo/api/create',
                data: { 
                        'path': abspath,
                        'is_dir': false
                        },
                success: function(data) {

                },
                complete: function(data) {
                    self.newFileModal.modal('hide');
                    self.updateToRepoPath(self.repoPath);
                },
                error: function(data) {
                    alert("Erro while create file: " + abspath);
                }
        });
    },
    
    /** Callback function on new directory create button click
     */
    onNewDirCreate: function() {
        
        var self = this;
        var path = this.newDirNameInput.val();
        var abspath = this.absRepoPath(path);
        
        
        $.ajax({
                type: 'POST',
                url: '/repo/api/create',
                data: { 
                        'path': abspath,
                        'is_dir': true
                        },
                success: function(data) {

                },
                complete: function(data) {
                    self.newDirModal.modal('hide');
                    self.updateToRepoPath(self.repoPath);
                },
                error: function(data) {
                    alert("Erro while create directory: " + abspath);
                }
        });
    },
    
    /** Returns abs repo path depending on current path
     */
    absRepoPath: function(path) {
        if (this.repoPath.length == 0)
            return path
        
        return this.repoPath + '/' + path
    }
}

$(document).ready(function() {
    Repo.view.Tree.init();    
});
