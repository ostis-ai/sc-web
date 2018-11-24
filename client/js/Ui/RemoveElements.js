var c;

var button;

$(document).ready(function () {
    c = document.querySelector('#mode-switching-checkbox');
    c.onclick = function () {
        if (c.checked) {
            document.getElementsByClassName("mode-switching-panel")[0].style.display = "";
        } else {
            document.getElementsByClassName("mode-switching-panel")[0].style.display = "none";
        }
    };
    button = document.querySelector('#button-for-view-advanced-elements');
    button.onclick = async () => {
        var cont_idtf = document.getElementById("input-for-view-advanced-elements").value;
        const addr = await scKeynodes.resolveKeynode(cont_idtf);
        const for_remove = await  new Promise((resolve, reject) => getElementsForRemove(addr).then(resolve, reject));
        SCWeb.core.Main.doDefaultCommand([for_remove]); // для отображения на ui результата работы функции
    }
});

// button.onclick = getElementsForRemove(cont_idtf);
export function getElementsForRemove(addr) {
    var for_remove = new Set(); //удаляемые элементы
    var dfd = $.Deferred();
    //создание узла, содержащего удаляемые элементы
    return window.sctpClient.create_node(sc_type_node).done(function (res) {
        // for_remove = res;
        //поиск исходных данных (контура) по idtf
        var cont = addr;
        //перебор всех элементов в контуре
        return window.sctpClient.iterate_constr(
            SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_3F_A_A,
                [cont,
                    sc_type_arc_pos_const_perm,
                    0
                ])
        ).done(function (results) {
            //запись узла nrel_system_identifier в удаляемые
            // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, window.scKeynodes.nrel_system_identifier);
            for_remove.add(scKeynodes.nrel_system_identifier);
            results.results.forEach(function (elem) {
                //поиск конструкций с nrel_system_identifier
                window.sctpClient.iterate_constr(
                    SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                        [elem[2],
                            sc_type_arc_common | sc_type_const,
                            0,          //можно заменить на sc_type_link, наверное.
                            sc_type_arc_pos_const_perm,
                            window.scKeynodes.nrel_system_identifier
                        ])
                ).done(function (results) {
                    //запись элементов [2-4] из пятерки в удаляемые элементы
                    results.results.forEach(function (res) {
                        // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, res[1]);
                        // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, res[2]);
                        // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, res[3]);
                        for_remove.add(res[1]);
                        for_remove.add(res[2]);
                        for_remove.add(res[3]);
                    });
                });

                //поиск конструкций elem => nrel_main_idtf: node
                var current_lang = SCWeb.core.ComponentSandbox.prototype.getCurrentLanguage();
                window.sctpClient.iterate_constr(
                    SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                        [elem[2],
                            sc_type_arc_common | sc_type_const,
                            0,
                            sc_type_arc_pos_const_perm,
                            window.scKeynodes.nrel_main_idtf
                        ])
                ).done(function (results) {
                    results.results.forEach(function (main_idtf_5_iterator) {
                        //поиск конструкции some_lang -> node
                        window.sctpClient.iterate_constr(
                            SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_3A_A_F,
                                [0,
                                    sc_type_arc_pos_const_perm,
                                    main_idtf_5_iterator[2]
                                ])
                        ).done(function (results) {
                            results.results.forEach(function (current_language_3_iterator) {
                                //поиск конструкции languages -> some_lang
                                window.sctpClient.iterate_constr(
                                    SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                        [window.scKeynodes.languages,
                                            sc_type_arc_pos_const_perm,
                                            current_language_3_iterator[0]
                                        ])
                                ).done(function (results) {
                                    results.results.forEach(function (belong_to_languages_3_iterator) {
                                        if (belong_to_languages_3_iterator[2] != current_lang) {
                                            // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, current_language_3_iterator[0]);
                                            // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, current_language_3_iterator[1]);
                                            // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, main_idtf_5_iterator[1]);
                                            // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, main_idtf_5_iterator[2]);
                                            // window.sctpClient.create_arc(sc_type_arc_pos_const_perm, for_remove, main_idtf_5_iterator[3]);
                                            for_remove.add(current_language_3_iterator[0]);
                                            for_remove.add(current_language_3_iterator[1]);
                                            for_remove.add(main_idtf_5_iterator[1]);
                                            for_remove.add(main_idtf_5_iterator[2]);
                                            for_remove.add(main_idtf_5_iterator[3]);
                                        }
                                    });

                                });
                            });
                        });
                    });
                });
            });
            dfd.resolve(for_remove);
        });
    });
    return dfd.promise();
}
