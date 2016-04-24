/**
 * Created by rizhi-kote on 24.4.16.
 */
SCWeb.ui.KeyboardHandler = {

    windowManager: null,
    init: function (windowManager) {
        this.windowManager = windowManager;

        var keyHandler = this;

        d3.select(window)
            .on('keydown', function (d3_event) {
                keyHandler.onKeyDown(d3_event);
            })
            .on('keyup', function (d3_event) {
                keyHandler.onKeyDown(d3_event);
            })
            .on('keypress', function (d3_event) {
                keyHandler.onKeyPress(d3_event);
            });
    },

    onKeyDown: function (d3_event) {
        this.getActiveWindow().onKeyDown(d3_event);
    },

    onKeyUp: function (d3_event) {
        this.getActiveWindow().onKeyUp(d3_event);
    },

    onKeyPress: function (d3_event) {
        this.getActiveWindow().onKeyPress(d3_event);
    },
    
    getActiveWindow: function () {
        return this.windowManager.getActiveWindow();
    }
}