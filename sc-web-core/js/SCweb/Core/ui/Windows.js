SCWeb.core.ui.Windows = (function() {

    var _container = "#tabs_container";
    var _wndCounter = 0;
    var _windows = {}; // map of currently created windows
    var _activeWnd = null;

    var _getNewContainerEventData = function(containerId, outLang, cmpType) {

        var newWndEventData = {};
        newWndEventData.container = containerId;
        newWndEventData.outLang = outLang;
        newWndEventData.cmpType = cmpType;
        return newWndEventData;
    };

    var _buildWndContainerId = function(wndNum) {

        return "window_data_" + wndNum;
    };

    var _getActiveWnd = function() {

        return _buildWndContainerId(_activeWnd);
    };

    return {
        init : function(callback) {

            SCWeb.core.Environment.on(SCWeb.core.events.Translation.UPDATE, $
                    .proxy(this.updateTranslation, this));
            SCWeb.core.Environment.registerResource(
                    SCWeb.core.Resources.ACTIVE_WND, $.proxy(_getActiveWnd,
                            this));

            $('#btn_add_new_window').click($.proxy(this.onCreateWindow, this));

            $(document).on("click", ".sc_window", function(event) {

                var idx = $(this).attr('window_num');
                SCWeb.core.ui.Windows.setActiveWindow(idx);
            });
            var self = this;
            $('#tabs_container').delegate('button.close', 'click',
                    function(event) {

                        var wndNum = $(this).attr('window_num');
                        self.destroyWindow(wndNum);
                        // to prevent handling 'click' event on a '.sc_window'
                        // tab
                        event.stopPropagation();
                    });
        },

        /**
         * Event hadler for new window button
         */
        onCreateWindow : function() {

            var outputLang = SCWeb.core.Environment
                    .getResource(SCWeb.core.Resources.OUTPUT_LANGUAGE);
            if (outputLang) {
                this.createWindow(outputLang);
            }
        },

        /**
         * Create new window with specified output language
         * 
         * @param {String}
         *            outputLang SC-addr of output language
         * @return Returns created window id
         */
        createWindow : function(outputLang) {

            var wndNumStr = (++_wndCounter).toString();
            var wndId = "window_" + wndNumStr;
            var newWndContainer = _buildWndContainerId(_wndCounter);

            // fist of all we need to append tab
            $('#tabs_container')
                    .append(
                            '<li id="'
                                    + wndId
                                    + '" class="sc_window" window_num="'
                                    + wndNumStr
                                    + '"><a href="#">Window '
                                    + wndNumStr
                                    + '</a><button class="close" window_num="'
                                    + wndNumStr
                                    + '"><i class="icon-remove-sign"></i></button></li>');
            $('#tabs_data_container').append(
                    '<div id="' + newWndContainer
                            + '" class="sc_window_data" window_num="'
                            + wndNumStr + '"></div>');
            var newWndEventData = _getNewContainerEventData(newWndContainer,
                    outputLang, SCWeb.core.ComponentType.viewer);
            SCWeb.core.Environment.fire(
                    SCWeb.core.events.Component.NEW_CONTAINER, newWndEventData);
            _windows[_wndCounter] = $(newWndContainer);
            this.setActiveWindow(_wndCounter);
            return newWndContainer;
        },

        /**
         * Setup specified window as active
         * 
         * @param {String}
         *            windowId Id of window, that need to be activated
         */
        setActiveWindow : function(windowId) {

            _activeWnd = null;
            var wndIdStr = windowId.toString();
            var wndActivator = $.proxy(function(index, element) {

                var v = $(element).attr('window_num');
                $(element).removeClass('active');
                if (v == wndIdStr) {
                    $(element).addClass('active');
                    _activeWnd = windowId;
                }
            }, this);
            $(_container + ' .sc_window').each(wndActivator);

            var wndDisabler = $.proxy(function(index, element) {

                var v = $(element).attr('window_num');
                if (v == wndIdStr) {
                    $(element).removeClass('no_display');
                    _activeWnd = windowId;
                } else {
                    $(element).addClass('no_display');
                }
            }, this);
            $('#tabs_data_container .sc_window_data').each(wndDisabler);
            // translate activated window
            // this.updateTranslation();
        },

        destroyWindow : function(wndNum) {

            var wndContainer = _buildWndContainerId(wndNum);
            SCWeb.core.Environment
                    .fire(SCWeb.core.events.Component.DESTROY_CONTAINER,
                            wndContainer);
            delete _windows[windowId];
            var tabSelector = '#tabs_container li[window_num=' + windowId + ']';
            var dataContainerSelector = '#tabs_data_container div[window_num='
                    + windowId + ']';
            $(tabSelector).remove();
            $(dataContainerSelector).remove();
            if (_activeWnd == windowId) {
                _activeWnd = null;
                var w;
                for (w in _windows) {
                    _activeWnd = w;
                    this.setActiveWindow(w);
                    break;
                }
            }
        },

        /**
         * Returns sc-addr of output language for currently active window If
         * there are no any active windows, thern returns null
         */
        getActiveWindowOtputLanguage : function() {

            if (_activeWnd) {
                var window = _windows[_activeWnd];
                if (window) {
                    // TODO IZh: _outputLang not available in window any more.
                    return window._outputLang;
                }
            }

            return null;
        },

        // ---------- Translation listener interface ------------
        updateTranslation : function(namesMap) {

            // var wind = _windows[_activeWnd];
            // if (wind) {
            // var current_language = SCWeb.core.Translation.current_language;
            // if (wind.getIdentifiersLanguage() != current_language) {
            // wind.translateIdentifiers(current_language);
            // }
            // }
        },

        /**
         * Create viewers for specified sc-links
         * 
         * @param {Array}
         *            linkAddrs List of sc-link addrs
         * @param {Object}
         *            containers Map of viewer containers (key: sc-link addr,
         *            value: container)
         * @param {Object}
         *            can contains the following list of functions: <br>
         *            {Function} success Function that calls on success result<br>
         *            {Function} error Function that calls on error result<br>
         *            some function can be missed.
         */
        createViewersForScLinks : function(linkAddrs, container,
                resultCallBacks) {

            var newViewerCallback = $
                    .proxy(
                            function(formats) {

                                for ( var i = 0; i < linkAddrs.length; i++) {
                                    var fmt = formats[linkAddrs[i]];
                                    if (fmt) {
                                        var newWndEventData = _getNewContainerEventData(
                                                container, fmt,
                                                SCWeb.core.ComponentType.viewer);
                                        newWndEventData.format = fmt;
                                        newWndEventData.dataAddr = linkAddrs[i];
                                        SCWeb.core.Environment
                                                .fire(
                                                        SCWeb.core.events.Component.NEW_CONTAINER,
                                                        newWndEventData);
                                    }
                                }

                                if (resultCallBacks && resultCallBacks.success) {
                                    resultCallBacks.success();
                                }
                            }, this);
            SCWeb.core.Server.getLinksFormat(linkAddrs, newViewerCallback,
                    resultCallBacks);
        }
    };
})();
