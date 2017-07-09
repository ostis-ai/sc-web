ScKeynodes = function (helper) {
    this.helper = helper;
    this.sctp_client = helper.sctp_client;
};

ScKeynodes.prototype.init = function () {
    var dfd = new jQuery.Deferred();
    var self = this;

    $.when(
        this.resolveKeynode('nrel_system_identifier'),
        this.resolveKeynode('nrel_main_idtf'),
        this.resolveKeynode('nrel_idtf'),
        this.resolveKeynode('nrel_answer'),

        this.resolveKeynode('ui_user'),
        this.resolveKeynode('ui_user_registered'),
        this.resolveKeynode('ui_main_menu'),
        this.resolveKeynode('ui_user_command_class_atom'),
        this.resolveKeynode('ui_user_command_class_noatom'),
        this.resolveKeynode('ui_external_languages'),
        this.resolveKeynode('ui_rrel_command_arguments'),
        this.resolveKeynode('ui_rrel_command'),
        this.resolveKeynode('ui_nrel_command_result'),
        this.resolveKeynode('ui_nrel_user_answer_formats'),

        this.resolveKeynode('nrel_ui_commands_decomposition'),

        this.resolveKeynode('ui_command_initiated'),
        this.resolveKeynode('ui_command_finished'),
        this.resolveKeynode('ui_nrel_user_used_language'),
        this.resolveKeynode('ui_nrel_user_default_ext_language'),

        this.resolveKeynode('languages'),
        this.resolveKeynode('lang_ru'),

        this.resolveKeynode('binary_types'),
        this.resolveKeynode('binary_float'),
        this.resolveKeynode('binary_int8'),
        this.resolveKeynode('binary_int16'),
        this.resolveKeynode('binary_int32'),
        this.resolveKeynode('binary_int64'),
        this.resolveKeynode('format_html'),
        this.resolveKeynode('nrel_format')
    ).done(function () {
        dfd.resolve();
    }).fail(function () {
        throw "Can't resolve keynode";
    });

    return dfd.promise();
};

ScKeynodes.prototype.resolveKeynode = function (sys_idtf, property) {
    var dfd = new jQuery.Deferred();
    var self = this;

    this.sctp_client.find_element_by_system_identifier(sys_idtf).done(function (res) {

        console.log('Resolved keynode: ' + sys_idtf + ' = ' + res);
        if (property) {
            self[property] = res;
        } else {
            self[sys_idtf] = res;
        }

        dfd.resolve(res);
    }).fail(function () {
        throw "Can't resolve keynode " + sys_idtf;
        dfd.reject();
    });

    return dfd.promise();
};
