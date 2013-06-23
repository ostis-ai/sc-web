SCWeb.core.ui.TaskPanel = (function() {

    var _container = '#task_panel';
    var _text_container = '#task_num';
    var _task_num = 0;
    return {
        init : function() {

            var proxyFunc = $.proxy(this.taskStarted, this);
            SCWeb.core.Environment
                    .on(SCWeb.core.events.Task.STARTED, proxyFunc);
            proxyFunc = $.proxy(this.taskFinished, this);
            SCWeb.core.Environment.on(SCWeb.core.events.Task.FINISHED,
                    proxyFunc);
        },

        /*
         * ! Updates task panel view
         */
        updatePanel : function() {

            if (_task_num == 0) {
                $(_container).removeClass('active');
            } else {
                $(_container).addClass('active');
            }
            var text = '';
            if (_task_num > 0) {
                text = _task_num.toString();
            }
            $(_text_container).text(text);
        },

        // ------- Server listener --------
        taskStarted : function() {

            _task_num++;
            this.updatePanel();
        },

        taskFinished : function() {

            _task_num--;
            this.updatePanel();
        }
    };
})();
