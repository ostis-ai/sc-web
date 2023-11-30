module.exports = function (grunt) {

    var githubDirPath = 'components/github/';
    var htmlDirPath = 'components/html/';
    var scgDirPath = 'components/scg/';
    var scsDirPath = 'components/scs/';
    var webCoreCompPath = 'client/js/';
    var clientJsDirPath = 'client/static/components/js/';
    var clientCssDirPath = 'client/static/components/css/';
    var clientHtmlDirPath = 'client/static/components/html/';
    var clientImgDirPath = 'client/static/components/images/';

    var webCoreScgCompPath = 'client/scgJs/';

    grunt.initConfig({
        concat: {
            webcore: {
                src: [
                    "node_modules/ts-sc-client/build/sc.js",
                    webCoreCompPath + 'Utils/sc_types.js',
                    webCoreCompPath + 'Utils/sc_keynodes.js',
                    webCoreCompPath + 'Utils/utils.js',
                    webCoreCompPath + 'Utils/sc_helper.js',
                    webCoreCompPath + 'Utils/stringview.js',
                    webCoreCompPath + 'Utils/cache.js',
                    webCoreCompPath + 'Utils/cookie.js',
                    webCoreCompPath + 'Utils/fqueue.js',
                    webCoreCompPath + 'Utils/binary.js',
                    webCoreCompPath + 'Utils/triples.js',
                    webCoreCompPath + 'Utils/sc_link_helper.js',
                    webCoreCompPath + 'Core/namespace.js',
                    webCoreCompPath + 'Core/debug.js',
                    webCoreCompPath + 'Core/main.js',
                    webCoreCompPath + 'Core/server.js',
                    webCoreCompPath + 'Core/arguments.js',
                    webCoreCompPath + 'Core/componentsandbox.js',
                    webCoreCompPath + 'Core/translation.js',
                    webCoreCompPath + 'Core/componentmanger.js',
                    webCoreCompPath + 'Core/scg-content-searcher.js',
                    webCoreCompPath + 'Core/eventmanager.js',
                    webCoreCompPath + 'Ui/namespace.js',
                    webCoreCompPath + 'Ui/menu.js',
                    webCoreCompPath + 'Ui/langpanel.js',
                    webCoreCompPath + 'Ui/locker.js',
                    webCoreCompPath + 'Ui/core.js',
                    webCoreCompPath + 'Ui/searchpanel.js',
                    webCoreCompPath + 'Ui/KeyboardHandler.js',
                    webCoreCompPath + 'Ui/taskpanel.js',
                    webCoreCompPath + 'Ui/argumentspanel.js',
                    webCoreCompPath + 'Ui/windowmanager.js',
                    webCoreCompPath + 'Ui/OpenComponentHandler.js',
                    webCoreCompPath + 'Ui/userpanel.js',
                    webCoreCompPath + 'Ui/expertmodepanel.js',
                    webCoreCompPath + 'Ui/ExpertModeHandler.js',
                ],
                dest: clientJsDirPath + 'sc-web-core.js',
            },
            webcoreScg: {
                src: ["node_modules/ts-sc-client/build/sc.js",
                    webCoreScgCompPath + 'utils/sc_types.js',
                    webCoreScgCompPath + 'utils/sc_keynodes.js',
                    webCoreScgCompPath + 'utils/utils.js',
                    webCoreScgCompPath + 'utils/sc_helper.js',
                    webCoreScgCompPath + 'utils/stringview.js',
                    webCoreScgCompPath + 'utils/cache.js',
                    webCoreScgCompPath + 'utils/fqueue.js',
                    webCoreScgCompPath + 'utils/binary.js',
                    webCoreScgCompPath + 'utils/triples.js',
                    webCoreScgCompPath + 'utils/sc_link_helper.js',

                    webCoreScgCompPath + 'core/namespace.js',
                    webCoreScgCompPath + 'core/debug.js',
                    webCoreScgCompPath + 'core/main.js',
                    webCoreScgCompPath + 'core/server.js',
                    webCoreScgCompPath + 'core/arguments.js',
                    webCoreScgCompPath + 'core/componentsandbox.js',
                    webCoreScgCompPath + 'core/translation.js',
                    webCoreScgCompPath + 'core/componentmanger.js',
                    webCoreScgCompPath + 'core/scg-content-searcher.js',
                    webCoreScgCompPath + 'core/eventmanager.js',

                    webCoreScgCompPath + 'ui/namespace.js',
                    webCoreScgCompPath + 'ui/locker.js',
                    webCoreScgCompPath + 'ui/core.js',
                    webCoreScgCompPath + 'ui/KeyboardHandler.js',
                    webCoreScgCompPath + 'ui/taskpanel.js',
                    webCoreScgCompPath + 'ui/windowmanager.js',
                    webCoreScgCompPath + 'ui/OpenComponentHandler.js',
                    webCoreScgCompPath + 'ui/expertmodepanel.js',
                ],
                dest: clientJsDirPath + `scg-web-core.js`,
            },
            github: {
                src: [githubDirPath + 'src/*.js'],
                dest: githubDirPath + 'static/components/js/github/github.js'
            },
            html: {
                src: [htmlDirPath + 'src/*.js'],
                dest: htmlDirPath + 'static/components/js/html/html.js'
            },
            scg: {
                src: [
                    scgDirPath + '/src/gwf-file-creater.js',
                    scgDirPath + '/src/gwf-file-loader.js',
                    scgDirPath + '/src/gwf-model-objects.js',
                    scgDirPath + '/src/gwf-object-info-reader.js',
                    scgDirPath + '/src/scg-object-builder.js',
                    scgDirPath + '/src/scg.js',
                    scgDirPath + '/src/scg-debug.js',
                    scgDirPath + '/src/scg-math.js',
                    scgDirPath + '/src/scg-model-objects.js',
                    scgDirPath + '/src/scg-alphabet.js',
                    scgDirPath + '/src/scg-render.js',
                    scgDirPath + '/src/scg-scene.js',
                    scgDirPath + '/src/scg-layout.js',
                    scgDirPath + '/src/scg-tree.js',
                    scgDirPath + '/src/scg-struct.js',
                    scgDirPath + '/src/scg-object-creator.js',
                    scgDirPath + '/src/scg-component.js',
                    scgDirPath + '/src/listener/*.js',
                    scgDirPath + '/src/command/append-object.js',
                    scgDirPath + '/src/command/command-manager.js',
                    scgDirPath + '/src/command/create-node.js',
                    scgDirPath + '/src/command/create-edge.js',
                    scgDirPath + '/src/command/create-bus.js',
                    scgDirPath + '/src/command/create-contour.js',
                    scgDirPath + '/src/command/create-link.js',
                    scgDirPath + '/src/command/change-idtf.js',
                    scgDirPath + '/src/command/change-content.js',
                    scgDirPath + '/src/command/change-type.js',
                    scgDirPath + '/src/command/delete-objects.js',
                    scgDirPath + '/src/command/move-object.js',
                    scgDirPath + '/src/command/move-line-point.js',
                    scgDirPath + '/src/deleteScgButtons.js',
                    scgDirPath + '/src/command/get-node-from-memory.js',
                    scgDirPath + '/src/command/wrapper-command.js'],
                dest: scgDirPath + 'static/components/js/scg/scg.js'
            },
            scs: {
                src: [scsDirPath + 'src/scs.js',
                scsDirPath + 'src/scs-viewer.js',
                scsDirPath + 'src/scs-output.js',
                scsDirPath + 'src/scs-types.js',
                scsDirPath + 'src/scn-output.js',
                scsDirPath + 'src/scn-tree.js',
                scsDirPath + 'src/scn-highlighter.js',
                scsDirPath + 'src/scs-expert-mode.js',
                scsDirPath + 'src/scn-component.js'],
                dest: scsDirPath + 'static/components/js/scs/scs.js'
            },
        },
        copy: {
            githubJs: {
                cwd: githubDirPath + 'static/components/js/github/',
                src: 'github.js',
                dest: clientJsDirPath + 'github/',
                expand: true,
                flatten: true
            },
            htmlJs: {
                cwd: htmlDirPath + 'static/components/js/html/',
                src: 'html.js',
                dest: clientJsDirPath + 'html/',
                expand: true,
                flatten: true
            },
            scgJs: {
                cwd: scgDirPath + 'static/components/js/scg/',
                src: 'scg.js',
                dest: clientJsDirPath + 'scg/',
                expand: true,
                flatten: true
            },
            scsJs: {
                cwd: scsDirPath + 'static/components/js/scs/',
                src: 'scs.js',
                dest: clientJsDirPath + 'scs/',
                expand: true,
                flatten: true
            },
            githubCss: {
                cwd: githubDirPath + 'static/components/css/',
                src: 'github.css',
                dest: clientCssDirPath,
                expand: true,
                flatten: true
            },
            htmlCss: {
                cwd: htmlDirPath + 'static/components/css/',
                src: 'html.css',
                dest: clientCssDirPath,
                expand: true,
                flatten: true
            },
            scgCss: {
                cwd: scgDirPath + 'static/components/css/',
                src: 'scg.css',
                dest: clientCssDirPath,
                expand: true,
                flatten: true
            },
            scsCss: {
                cwd: scsDirPath + 'static/components/css/',
                src: 'scs.css',
                dest: clientCssDirPath,
                expand: true,
                flatten: true
            },
            bootOverCss: {
                cwd: scgDirPath + 'static/components/css/',
                src: 'bootstrap-override.css',
                dest: clientCssDirPath,
                expand: true,
                flatten: true
            },
            scgHtml: {
                cwd: scgDirPath + 'static/components/html/',
                src: ['**/*.html'],
                dest: clientHtmlDirPath,
                expand: true,
                flatten: true
            },
            htmlImg: {
                cwd: htmlDirPath + 'static/components/images/html/',
                src: '**/*.png',
                dest: clientImgDirPath + 'html/',
                expand: true,
                flatten: true
            },
            scgImg: {
                cwd: scgDirPath + 'static/components/images/scg/',
                src: '*.svg',
                dest: clientImgDirPath + 'scg/',
                expand: true,
                flatten: true
            },
            scgImgAlphabet: {
                cwd: scgDirPath + 'static/components/images/scg/alphabet/',
                src: '*.png',
                dest: clientImgDirPath + 'scg/alphabet',
                expand: true,
                flatten: true
            }
        },
        watch: {
            core: {
                files: webCoreCompPath + '**',
                tasks: ['concat:webcore'],
            },
            githubJs: {
                files: githubDirPath + 'src/**',
                tasks: ['concat:github', 'copy:githubJs'],
            },
            htmlJs: {
                files: htmlDirPath + 'src/**',
                tasks: ['concat:html', 'copy:htmlJs'],
            },
            scgJs: {
                files: scgDirPath + 'src/**',
                tasks: ['concat:scg', 'copy:scgJs'],
            },
            scsJs: {
                files: scsDirPath + 'src/**',
                tasks: ['concat:scs', 'copy:scsJs'],
            },
            githubCss: {
                files: githubDirPath + 'static/components/css/**',
                tasks: ['copy:githubCss'],
            },
            htmlCss: {
                files: htmlDirPath + 'static/components/css/**',
                tasks: ['copy:htmlCss'],
            },
            scgCss: {
                files: scgDirPath + 'static/components/css/**',
                tasks: ['copy:scgCss'],
            },
            scsCss: {
                files: scsDirPath + 'static/components/css/**',
                tasks: ['copy:scsCss'],
            },
            bootstrapOverrideCss: {
                files: scgDirPath + 'static/components/css/**',
                tasks: ['copy:bootstrapOverrideCss'],
            },
            scgHtml: {
                files: [scgDirPath + 'static/components/html/**'],
                tasks: ['copy:scgHtml'],
            },
            htmlImg: {
                files: [htmlDirPath + 'static/components/images/html/**',],
                tasks: ['copy:htmlImg'],
            },
            scgImg: {
                files: [scgDirPath + 'static/components/images/scg/**'],
                tasks: ['copy:scgImg', 'copy:scgImgAlphabet'],
            },
            options: {
                livereload: true,
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'copy', 'watch']);
    grunt.registerTask('build', ['concat', 'copy']);

};
