function isTripleSystem(set, triple) {
    return set[triple[0].addr] || set[triple[1].addr] || set[triple[2].addr];
}

function removeSystemTriples(set, triples) {
    return triples.filter((triple) => !isTripleSystem(set, triple));
}

removeNrelSystemIdentification = function ({triples, ...data}, nrelSystemIdentifier) {
    const tripleUtils = new TripleUtils();
    for (const triple of triples) {
        tripleUtils.appendTriple(triple);
    }
    const nrelSystemIdentifierTriples = tripleUtils.find3_f_a_a(nrelSystemIdentifier, 0, 0);
    let newVar = {
        ...data,
        triples: removeSystemTriples([].concat.apply([], nrelSystemIdentifierTriples)),
    };
    return newVar;
}