function _unit_test_sctp_common() {
    window.sctpClient.create_node(sc_type_node_abstract).done(function (res) {
        console.log('node: ' + res);
        var addr = res;
        window.sctpClient.check_element(addr).done(function (res) {
            console.log('exist');
            window.sctpClient.get_element_type(addr).done(function (res) {
                console.log(res);
                console.log(sc_type_node_abstract);
                console.log('check type: ' + (res & sc_type_node_abstract));
            });
        }).fail(function () {
            console.log('not exist');
        });

        window.sctpClient.create_link().done(function (res) {
            var addr2 = res;
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, addr, addr2).done(function (res) {
                console.log('arc: ' + res);
            });
        });
    });
}

function _unit_test_sctp_links() {
    var link_tests = [56, -78, 34.565, -78.232, 'a', 'test', new String('test2')];
    var link_types = ['int', 'int', 'float', 'float', 'string', 'string', 'string']
    for (var i = 0; i < link_tests.length; ++i) {
        (function (v, t) {
            window.sctpClient.create_link().done(function (res) {
                var addr = res;
                window.sctpClient.set_link_content(addr, v).done(function () {
                    window.sctpClient.get_link_content(addr, t).done(function (res) {
                        console.log('Integet test: ' + v + ' -> ' + res + ' [' + (v == res ? 'ok' : 'fail') + ']');
                    });
                });
            });
        })(link_tests[i], link_types[i]);
    }
}

function _unit_test_sctp_iter_constr() {
    window.sctpClient.iterate_constr(
        SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
            [window.scKeynodes.nrel_system_identifier,
                sc_type_arc_common | sc_type_const,
                sc_type_link,
                sc_type_arc_pos_const_perm,
                window.scKeynodes.nrel_main_idtf
            ],
            {"x": 2}),
        SctpConstrIter(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
            [window.scKeynodes.lang_ru,
                sc_type_arc_pos_const_perm,
                "x"
            ])
    ).done(function (results) {
        console.log(results);
        //! @todo: make results check

        console.log("x: " + results.get(0, "x"));
        window.sctpClient.get_link_content(results.get(0, "x")).done(function (res) {
            console.log("x: " + res);
        });
    });
}

window._unit_tests = function () {

    //! @todo: make queued
    console.log('--- Unit testing ---');
    //_unit_test_sctp_links();
    //_unit_test_sctp_common();
    _unit_test_sctp_iter_constr();
};