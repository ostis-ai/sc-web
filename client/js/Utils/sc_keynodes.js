ScKeynodes = function (helper) {
  this.helper = helper;
  this.sctp_client = helper.sctp_client;
};

ScKeynodes.prototype.init = async function () {
  await this.resolveKeynode([
    'nrel_system_identifier',
    'nrel_main_idtf',
    'nrel_idtf',
    'nrel_answer',

    'ui_user',
    'ui_user_registered',
    'ui_main_menu',
    'ui_user_command_class_atom',
    'ui_user_command_class_noatom',
    'ui_external_languages',
    'ui_rrel_command_arguments',
    'ui_rrel_command',
    'ui_nrel_command_result',
    'ui_nrel_user_answer_formats',

    'nrel_ui_commands_decomposition',

    'ui_command_initiated',
    'ui_command_finished',
    'ui_nrel_user_used_language',
    'ui_nrel_user_default_ext_language',

    'languages',
    'lang_ru',

    'binary_types',
    'binary_float',
    'binary_int8',
    'binary_int16',
    'binary_int32',
    'binary_int64',
    'format_pdf',
    'format_png',
    'format_html',
    'nrel_format']
  );
};

ScKeynodes.prototype.resolveKeynode = async function (sys_idtf, property) {
  if (property) {
    throw new Error("Renaming of keynode is not supported");
  }
  if (!Array.isArray(sys_idtf)) {
    sys_idtf = [sys_idtf];
  }
  let request = sys_idtf.map(x => {
    return {idtf: x, type: sc.ScType.Unknown}
  });
  let result = await this.sctp_client.ResolveKeynodes(request);
  sys_idtf.forEach(x => {
    let addr = result[x];
    if (addr.isValid()) {
      console.log('Resolved keynode: ' + x + ' = ' + addr.value);
      this[sys_idtf] = addr;
    } else {
      throw "Can't resolve keynode " + x;
    }
  });
};
