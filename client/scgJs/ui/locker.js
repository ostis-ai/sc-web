SCWeb.ui.Locker = {
    counter: 0,

    update: function () {
        if (this.counter > 0) {
            $('#sc-ui-locker').addClass('shown');
        } else {
            $('#sc-ui-locker').removeClass('shown');
        }
    },

    show: function () {
        this.counter++;
        this.update();
    },

    hide: function () {
        if (this.counter) {
            this.counter--;
        }
        this.update();
    }
};
