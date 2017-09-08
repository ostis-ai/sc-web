SCWeb.ui.Locker = {
    counter: 0,

    update: function () {
        if (this.counter < 0) throw "Counter of ui locker less than 0";

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
        this.counter--;
        this.update();
    }
};
