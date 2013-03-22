$.namespace('Repo.edit');

Repo.edit.Form = {
    
    init: function(sourcePath) {
        this.sourcePath = sourcePath;
        this.sourceEditArea = $('.source-edit-textarea');
        this.updateFileContent();
    },
    
    /** Updates file content from server
     */
    updateFileContent: function() {
        var self = this;
        
        $.ajax({
            type: 'GET',
            url: '/repo/api/content',
            data: { 'path': self.sourcePath },
            success: function(data) {
                self.sourceEditArea.val(data);
            },
            complete: function(data) { 
            }
        });
    }

}



