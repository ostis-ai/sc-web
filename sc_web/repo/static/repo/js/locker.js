$.namespace('Repo.locker');

Repo.locker.Lock = {
    
    init: function() {
        this.locker = $('#uilocker');
    },
    
    show: function() {
        this.locker.removeClass('hidden');
        this.locker.addClass('shown');
    },
    
    hide: function() {
        // hide locker
        this.locker.removeClass('shown');
        this.locker.addClass('hidden');
    }
}

$(document).ready(function() {
    Repo.locker.Lock.init();    
});
