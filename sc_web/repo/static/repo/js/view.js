$.namespace('Repo.view');

Repo.view.Tree = {
    
    repoPath: '/',
    
    init: function() {
        this.updateRepoPath(this.repoPath);
        this.updatePathFilesList(this.repoPath);
    },
    
    /** Function to update current path in repository
     * @param {path} Path in repository
     */
    updateRepoPath: function(path) {
        repoPathTag = $('#repo-path')
        
        // split path to subdirectories
        var dirs = path.split('/');
        var resHtml = '';
        
        for(var i = 0; i < dirs.length; i++) 
        {
            if (i < dirs.length - 1) {
                resHtml += '<li><a href="#">' + dirs[i] + '</a> <span class="divider">/</span></li>';
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
        
        $.ajax({
            type: 'GET',
            url: 'files',
            data: {'path': path},
            success: function(data) { 
                filesTableTag = $("#files-list-table");
                
                var resHtml = '';
                
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    var itemClass = "files-item-file";
                    
                    if (item.is_dir)
                        itemClass = "files-item-dir";
                    
                    
                    resHtml += '<tr>';
                    resHtml += '<td><div class="' + itemClass + '">' + item.path + '</div></td>';
                    
                    resHtml += '</tr>';
                }
                
                filesTableTag.empty();
                filesTableTag.append(resHtml);
            },
            complete: function(data) { 
                
            }
        });
     }
}

$(document).ready(function() {
    Repo.view.Tree.init();    
});
