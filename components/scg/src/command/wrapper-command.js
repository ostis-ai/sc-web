SCgWrapperCommand = function (commands) {
    this.commands = commands;
};

SCgWrapperCommand.prototype = {

    constructor: SCgWrapperCommand,

    undo: function () {
        this.commands.forEach(function (command) {
            command.undo();
        });
    },

    execute: function () {
        this.commands.forEach(function (command) {
            command.execute();
        });
    }

};
