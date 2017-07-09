SCWeb.ui.TaskPanel = {
    _container: '#task_panel',
    _text_container: '#task_num',
    _task_num: 0,

    init: function (callback) {
        var dfd = new jQuery.Deferred();

        SCWeb.core.Server.appendListener(this);
        dfd.resolve();

        return dfd.promise();
    },

    /*!
     * Updates task panel view
     */
    updatePanel: function () {
//        if (this._task_num == 0) {
//            $(this._container).removeClass('active');
//        }else{
//            $(this._container).addClass('active');
//        }
//        var text = ''
//        if (this._task_num > 0)
//            text = this._task_num.toString();
//        $(this._text_container).text(text);
    },

    // ------- Server listener --------
    taskStarted: function () {
        this._task_num++;
        this.updatePanel();
        //SCWeb.ui.Locker.show();
    },

    taskFinished: function () {
        this._task_num--;
        this.updatePanel();
        //SCWeb.ui.Locker.hide();
    }
};
