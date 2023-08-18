SCWeb.core.DefaultSCgSearcher = function (sandbox, structAddr) {
    let self = this;
    this.maxSCgTriplesNumber = 300;

    sandbox.layout = (scene) => scene.layout();
    sandbox.postLayout = (scene) => scene.updateRender();

    const splitArray = function (result, maxNumberOfTriplets) {
        if (result.length < maxNumberOfTriplets) return result;
        return result.splice(0, maxNumberOfTriplets);
    };
    const filterTriples = function (triples, sceneElementTypes, filterList) {
        triples = triples.filter((triple, index) => sceneElementTypes[index].isEdge());
        sceneElementTypes = sceneElementTypes.filter(type => type.isEdge());
        if (filterList) triples = triples.filter(triple => !filterList.some(element => element === triple.get("_scene_edge").value));
        triples = splitArray(triples, self.maxSCgTriplesNumber);
        sceneElementTypes = splitArray(sceneElementTypes, self.maxSCgTriplesNumber);
        return [triples, sceneElementTypes];
    };

    const searchStructureElements = async function () {
        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            structAddr,
            [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
            [sc.ScType.Unknown, "_scene_edge"],
        );
        let triples = (await scClient.templateSearch(scTemplate)).map((triple) => {
            return {
                connectorFromScene: triple.get("_edge_from_scene"),
                sceneElement: triple.get("_scene_edge"),
            };
        });
        let sceneElementTypes = await scClient.checkElements(triples.map(triple => triple.sceneElement));
        [triples, sceneElementTypes] = filterTriples(triples, sceneElementTypes, null);

        for (let i = 0; i < triples.length; ++i) {
            const triple = triples[i];
            triple.isAdded = true;
            triple.sceneElementType = sceneElementTypes[i];

            sandbox.eventStructUpdate(triple);
        }
    }

    return {
        searchContent: async function () {
            return await searchStructureElements();
        },
    };
};

SCWeb.core.DistanceBasedSCgSearcher = function (sandbox, structAddr) {
    const searchAllLevelEdges = async function (elementsArr, visitedElements, tracedElements) {
        let newElementsArr = [];
        for (let i = 0; i < elementsArr.length; i++) {

            let levelElements = elementsArr[i];
            for (let elementHash in levelElements) {
                if (visitedElements.has(elementHash)) continue;
                visitedElements.add(elementHash);

                const element = new sc.ScAddr(parseInt(elementHash));

                const [elementType, level, edgeFromScene] = Object.values(levelElements[elementHash]);
                const nextLevel = level >= SCgObjectLevel.Count - 1 ? SCgObjectLevel.Seventh : level + 1;

                const searchFunc = elementType.isEdge() ? searchLevelEdgeElements : searchLevelEdges;
                const newElements = await searchFunc(
                    edgeFromScene, element, elementType, level, nextLevel, tracedElements);
                if (Object.keys(newElements).length) newElementsArr.push(newElements);
            }
        }

        if (newElementsArr.length) await searchAllLevelEdges(newElementsArr, visitedElements, tracedElements);
    };

    const searchLevelEdges = async function (
        edgeFromScene, mainElement, mainElementType, level, nextLevel, tracedElements) {
        let nextLevelElements = {};

        await searchLevelEdgesByDirection(
            edgeFromScene, mainElement, mainElementType,
            level, nextLevel, nextLevelElements, tracedElements, true
        );
        await searchLevelEdgesByDirection(
            edgeFromScene, mainElement, mainElementType,
            level, nextLevel, nextLevelElements, tracedElements, false
        );

        return nextLevelElements;
    };

    const searchLevelEdgeElements = async function (
        edgeFromScene, mainElement, mainElementType, level, nextLevel, tracedElements) {
        let nextLevelElements = {};

        await searchLevelConnectorElements(
            edgeFromScene, mainElement, mainElementType,
            level, nextLevel, nextLevelElements, tracedElements
        );
        await searchLevelEdgesByDirection(
            edgeFromScene, mainElement, mainElementType,
            level, nextLevel, nextLevelElements, tracedElements, true
        );
        await searchLevelEdgesByDirection(
            edgeFromScene, mainElement, mainElementType,
            level, nextLevel, nextLevelElements, tracedElements, false
        );

        return nextLevelElements;
    };

    const searchLevelConnectorElements = async function (
        edgeFromScene, mainElement, mainElementType,
        level, nextLevel, nextLevelElements, tracedElements
    ) {
        const mainElementHash = mainElement.value;
        if (tracedElements.has(mainElementHash)) return;
        tracedElements.add(mainElementHash);

        let sourceElement, targetElement;
        if (edgeFromScene) {
            [sourceElement, targetElement] = await window.scHelper.getConnectorElements(mainElement);
        } else {
            let scTemplateSearchEdgeElements = new sc.ScTemplate();
            scTemplateSearchEdgeElements.tripleWithRelation(
                [sc.ScType.Unknown, "_source"],
                mainElement,
                [sc.ScType.Unknown, "_target"],
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
                structAddr,
            );
            const result = await scClient.templateSearch(scTemplateSearchEdgeElements);
            if (!result.length) return;
            [sourceElement, targetElement] = [result[0].get("_source"), result[0].get("_target")];
            edgeFromScene = result[0].get("_edge_from_scene");
        }
        [sourceElementType, targetElementType] = await scClient.checkElements([sourceElement, targetElement]);

        const sourceElementHash = sourceElement.value;
        nextLevelElements[sourceElementHash] = {type: sourceElementType, level: nextLevel};

        const targetElementHash = targetElement.value;
        nextLevelElements[targetElementHash] = {type: targetElementType, level: nextLevel};

        sandbox.eventStructUpdate({
            isAdded: true,
            connectorFromScene: edgeFromScene,
            sceneElement: mainElement,
            sceneElementType: mainElementType,
            sceneElementLevel: level,
            sceneElementSource: sourceElement,
            sceneElementSourceType: sourceElementType,
            sceneElementSourceLevel: nextLevel,
            sceneElementTarget: targetElement,
            sceneElementTargetType: targetElementType,
            sceneElementTargetLevel: nextLevel,
        });
    }

    const searchLevelEdgesByDirection = async function (
        edgeFromScene, mainElement, mainElementType,
        level, nextLevel, nextLevelElements, tracedElements, withIncomingEdge) {
        let scTemplate = new sc.ScTemplate();
        scTemplate.triple(
            structAddr,
            [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
            [sc.ScType.Unknown, "_scene_edge"],
        );
        if (withIncomingEdge) {
            scTemplate.triple(
                [sc.ScType.Unknown, "_scene_edge_source"],
                "_scene_edge",
                mainElement,
            );
        } else {
            scTemplate.triple(
                mainElement,
                "_scene_edge",
                [sc.ScType.Unknown, "_scene_edge_target"],
            );
        }
        const constructions = await scClient.templateSearch(scTemplate);

        const sceneEdgeTypes = await scClient.checkElements(
            constructions.map(triple => triple.get("_scene_edge")));
        const sceneEdgeElementTypes = await scClient.checkElements(
            constructions.map(triple => withIncomingEdge
                ? triple.get("_scene_edge_source") : triple.get("_scene_edge_target")));

        for (let i = 0; i < constructions.length; ++i) {
            const construction = constructions[i];

            edgeFromScene = construction.get("_edge_from_scene");

            const sceneEdge = construction.get("_scene_edge");
            const sceneEdgeHash = sceneEdge.value;
            const sceneEdgeType = sceneEdgeTypes[i];

            const sceneEdgeElement = withIncomingEdge
                ? construction.get("_scene_edge_source")
                : construction.get("_scene_edge_target");
            // if we searched scene structure we'll skip it
            if (sceneEdgeElement.equal(structAddr)) continue;

            if (tracedElements.has(sceneEdgeHash)) continue;
            tracedElements.add(sceneEdgeHash);
            nextLevelElements[sceneEdgeHash] = {
                type: sceneEdgeType, level: nextLevel, connectorFromScene: edgeFromScene};

            const sceneEdgeElementHash = sceneEdgeElement.value;
            const sceneEdgeElementType = sceneEdgeElementTypes[i];
            nextLevelElements[sceneEdgeElementHash] = {type: sceneEdgeElementType, level: nextLevel};

            sandbox.eventStructUpdate({
                isAdded: true,
                connectorFromScene: edgeFromScene,
                sceneElement: sceneEdge,
                sceneElementType: sceneEdgeType,
                sceneElementLevel: nextLevel,
                sceneElementSource: withIncomingEdge ? sceneEdgeElement : mainElement,
                sceneElementSourceType: withIncomingEdge ? sceneEdgeElementType : mainElementType,
                sceneElementSourceLevel: withIncomingEdge ? nextLevel : level,
                sceneElementTarget: withIncomingEdge ? mainElement : sceneEdgeElement,
                sceneElementTargetType: withIncomingEdge ? mainElementType : sceneEdgeElementType,
                sceneElementTargetLevel: withIncomingEdge ? level : nextLevel,
            });
        }
    };

    const verifyStructureElements = async function (structure, elements) {
        let structureElements = [];
        for (let element of elements) {
            let template = new sc.ScTemplate();
            template.triple(
                structure,
                [sc.ScType.EdgeAccessVarPosPerm, "_edge_from_scene"],
                [element, "_main_node"]
            );

            const result = await scClient.templateSearch(template);
            if (!result.length) continue;
            result.map((triple) => {
                return {connectorFromStructure: triple.get("_edge_from_scene"), structureElement: triple.get("_main_node")};
            });
            structureElements.push(result[0]);
        }

        return structureElements;
    };

    const searchFromKeyElements = async function (keyElements) {
        keyElements = keyElements
            ? await verifyStructureElements(structAddr, keyElements)
            : await window.scHelper.getStructureMainKeyElements(structAddr);
        if (!keyElements.length) keyElements = await window.scHelper.getStructureKeyElements(structAddr);
        if (!keyElements.length) return false;

        const elementTypes = await scClient.checkElements(keyElements.map(triple => triple.structureElement));

        let mainElements = {};
        for (let i = 0; i < keyElements.length; ++i) {
            const triple = keyElements[i];
            const edgeFromScene = triple.connectorFromStructure;
            const sceneElement = triple.structureElement;
            const sceneElementType = elementTypes[i];
            const level = SCgObjectLevel.First;

            mainElements[sceneElement.value] = {
                type: sceneElementType, level: level, connectorFromScene: edgeFromScene};

            sandbox.eventStructUpdate({
                isAdded: true,
                connectorFromScene: edgeFromScene,
                sceneElement: sceneElement,
                sceneElementType: sceneElementType,
                sceneElementLevel: level,
            });
        }

        await searchAllLevelEdges([mainElements], new Set(), new Set());
        return true;
    }

    if (SCWeb.core.Main.viewMode === SCgViewMode.DistanceBasedSCgView) {
        const debouncedFunc = (func, wait) => {
            let timerId;

            const clear = () => {
                clearTimeout(timerId);
            };

            const debouncedCall = () => {
                clearTimeout(timerId);
                timerId = setTimeout(func, wait);
            };

            return [debouncedCall, clear];
        };

        this.updateContentDelayTime = 200;
        [this.debouncedUpdateContent] = debouncedFunc(
            async () => await self.updateContent(),
            this.updateContentDelayTime
        );
    }

    return {
        searchContent: async function (keyElements) {
            sandbox.layout = (scene) => keyElements ? scene.updateRender() : scene.layout();
            sandbox.postLayout = (scene) => keyElements ? scene.layout() : scene.updateRender();

            return await searchFromKeyElements(keyElements);
        },

        searchStructureElementsFromElements: async function (elements, unvisitableElements) {
            await searchAllLevelEdges([elements], unvisitableElements, new Set());
        }
    };
};

SCWeb.core.SCgLinkContentSearcher = function (sandbox, linkAddr) {
    let self = this;
    this.contentBucket = [];
    this.contentBucketSize = 20;
    this.appendContentTimeoutId = 0;
    this.appendContentTimeout = 2;

    const forceAppendData = async (oldBucket) => {
        for (let content of oldBucket) {
            await sandbox.eventDataAppend(content.data);
        }
    };

    const sliceAndForceAppendData = async () => {
        const oldBucket = self.contentBucket.slice();
        self.contentBucket = [];
        await forceAppendData(await scClient.getLinkContents(oldBucket));
    };

    const searchData = async (element) => {
        self.contentBucket.push(element);
        if (self.appendContentTimeoutId) clearTimeout(self.appendContentTimeoutId);

        if (self.contentBucket.length > self.contentBucketSize) {
            clearTimeout(self.appendContentTimeoutId);
            await sliceAndForceAppendData();
        }
        else {
            self.appendContentTimeoutId = setTimeout(sliceAndForceAppendData, self.appendContentTimeout);
        }
    };

    return {
        searchContent: async function () {
            await searchData(linkAddr);
        }
    };
}
