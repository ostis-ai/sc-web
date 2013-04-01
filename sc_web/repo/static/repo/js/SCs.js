CodeMirror.defineMode("scs", function() {

    var ERRORCLASS = 'error';

    var CONNECTORS = new RegExp("^((\\.\\.>)|(<\\.\\.)|" +
        "(\\->)|(<\\-)|(<=>)|(_<=>)|(=)|(=>)|(<=)|(_=>)|(_<=)|(_\\->)|(_<\\-)|(\\-\\|>)|(<\\|\\-)|(_\\-\\|>)|" +
        "(_<\\|\\-)|(\\-/>)|(</\\-)|(_\\-/>)|(_</\\-)|" +
        "(~\\|>)|(<\\|~)|(_~\\|>)|(_<~)|(~>)|(<~)|(_~>)|(_<~)|(~/>)|(</~)|(_~/>)|(_</~)|(<>)|(<)|(>))");

    var NAME = new RegExp("^[\\.a-zA-Z0-9_#]+");

    var LPAR_CONT = new RegExp("^\\[");
    var RPAR_CONT = new RegExp("^\\]");

    var ALIASNONAME = new RegExp("^\\*{3}");

    var PARENTHESES = new RegExp("^((\\(\\*)|(\\*\\))|(\\{)|(\\})|(<)|(>)|(\\()|(\\)))");

    var SEPARATORS = new RegExp("^((\\|)|(:)|(;;)|(;)|(=))");

    var URL = new RegExp("^\"");

    var LINE_COMMENT = new RegExp("^//");
    var BLOCK_COMMENT = new RegExp("^/!\\*");

    var ELEMTYPE = new RegExp('^((sc_arc_main)|(sc_arc_common)|(sc_link)|(sc_node)|(sc_edge)|(sc_arc_access))\\b');


    //tokenizer
    function tokenBase(stream, state) {

        if (stream.eatSpace()) {
            return null;
        }

        var ch = stream.peek();

        //handle comments
        if (ch == "/") {
            if (stream.match(BLOCK_COMMENT)) {
                state.tokenize = tokenComment;
                return tokenComment(stream, state);
            }
            if (stream.match(LINE_COMMENT)) {
                stream.skipToEnd();
                return "comment";
            }
        }

        if (stream.match(ELEMTYPE)) {
            return "elemType";
        }

        // Handle urls
        if (stream.match(URL)) {
            state.tokenize = tokenStringFactory(stream.current());
            return state.tokenize(stream, state);
        }

        // Handle connectors
        if (stream.match(CONNECTORS)) {
           return "connector";
        }

        if (stream.match(SEPARATORS)) {
            return "separator";
        }

        // Handle content
        if (stream.match(LPAR_CONT)) {
            state.tokenize = tokenContentFactory();
            return "parenthes";
        }
        if (stream.match(RPAR_CONT)) {
            return "parenthes";
        }

        // Handle parentheses
        if (stream.match(PARENTHESES)) {
            return "parenthes";
        }

        if (stream.match(NAME)) {
            if(stream.match(/^\s?:/, false))
                return "attribute";
            return "name";
        }

        if (stream.match(ALIASNONAME)) {
            return "aliasNoName";
        }

        // Handle non-detected items
        stream.next();
        return ERRORCLASS;
    }

    function tokenStringFactory(delimiter) {

        var OUTCLASS = 'url';

        function tokenString(stream, state) {
            while (!stream.eol()) {
                stream.eatWhile(/[^\"]/);
                if (stream.match(delimiter)) {
                    state.tokenize = tokenBase;
                    return OUTCLASS;
                }
            }
            return OUTCLASS;
        }
        return tokenString;
    }

    function tokenContentFactory() {

        var OUTCLASS = 'content';

        function tokenContent(stream, state) {
            while (!stream.eol()) {
                stream.eatWhile(/[^\]]/);
                if (stream.match(/^\]/, false)) {
                    state.tokenize = tokenBase;
                    return OUTCLASS;
                }
            }
            return OUTCLASS;
        }
        return tokenContent;
    }

    function tokenComment(stream, state) {
        var maybeEnd = false, ch;
        while (ch = stream.next()) {
            if (ch == "/" && maybeEnd) {
                state.tokenize = tokenBase;
                break;
            }
            maybeEnd = (ch == "*");
        }
        return "comment";
    }


    //interface

    var external = {
        startState: function() {
            return {
                tokenize: tokenBase
            };
        },

        token: function(stream, state) {
            var style = state.tokenize(stream, state);
            return style;
        }

    };

    return external;
});

