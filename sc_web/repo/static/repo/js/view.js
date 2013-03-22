$.namespace('Repo.view');

Repo.view.Tree = {
    
    repoPath: '',
    
    init: function() {
        this.updateToRepoPath(this.repoPath);
    },
    
    /** Updates view to specified repository path
     * @param {path} Path in repository
     */
    updateToRepoPath: function(path) {
        this.updateRepoPath(path);
        this.updatePathFilesList(path);
        this.updateLastCommit();
        
        this.repoPath = path;
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
     */
    updatePathFilesList: function(path) {
        
        var self = this;
        $.ajax({
            type: 'GET',
            url: '/repo/api/files',
            data: {'path': path},
            success: function(data) { 
                filesTableTag = $("#files-list-table");
                
                var resHtml = '';
                
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];

                    resHtml += '<tr>';
                    if (item.is_dir) {
                        resHtml += '<td><a class="files-item-dir dir-path" repo_path="' + item.path + '">' + item.name + '</a></td>';
                    } else {
                        resHtml += '<td><a href="/repo/edit/' + item.path + '" class="files-item-file" repo_path="' + item.path + '">' + item.name + '</a></td>';
                    }
                    resHtml += '<td><i class="icon-user"></i>' + item.author + '</td>';
                    var date = new Date(item.date * 1000);
                    resHtml += '<td>' + date.toLocaleDateString() + '</td>';
                    delete date;
                    resHtml += '<td>' + item.summary + '</td>';
                    
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
            success: function(data) {
                lastCommitTag.append(data.summary);
            },
            complete: function(data) { 
            }
        });
    }
}

$(document).ready(function() {
    Repo.view.Tree.init();    
});
