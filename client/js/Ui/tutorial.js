SCWeb.ui.Tutorial = {
    inProgress: false,
    activeElem: undefined,
    tutorialNodeCreated: false,
    tutorialEdgeCreated: false,
    tutorialStages: [
        "#search-panel",
        "#search-input",
        "#tutorial-suggestion",
        "#expert_mode_container",
        "#window-type-select-button",
        "#scg-mode-toggle-button",
        "#window-container",
        "#scg-tool-edge",
        "#window-container"
    ],

    init: function() {
        return new Promise(resolve => {
            resolve();
        });
    },

    isInProgress: function() {
        return this.inProgress;
    },

    begin: function() {
        this.inProgress = true;
        this.currentStage = -1;
        this.commenceToNextStage();
    },

    end: function() {
        this.inProgress = false;
    },

    commenceToNextStage: function() {
        if (this.currentStage >= 0) {
            this.blurActiveElem();
        }
        this.currentStage++;
        if (this.currentStage === this.tutorialStageSelectors.length) {
            this.end();
            return;
        }
        this.addStageCompletionListener(this.currentStage);
    },

    setActiveElem: function() {
        this.activeElem = $(this.tutorialStageSelectors[this.currentStage]);
    },

    focusActiveElem: function() {
        this.activeElem.addClass('tutorial-focused-elem');
    },

    blurActiveElem: function() {
        this.activeElem.removeClass('tutorial-focused-elem');
    },

    fireTutorialNodeCreatedEvent: function() {
        this.tutorialNodeCreated = true;
    },

    fireTutorialEdgeCreatedEvent: function() {
        this.tutorialEdgeCreated = true;
    },

    clickListener: function() {
        this.setActiveElem();
        this.focusActiveElem();
        this.activeElem.on('click', () => {
            if (this.isInProgress()) {
                this.activeElem.off('click');
                this.commenceToNextStage();
            }
        });
    },

    addStageCompletionListener: function(stageNumber) {
        switch(stageNumber) {
            case 0:
                this.clickListener();
                break;
            case 1:
                this.setActiveElem();
                this.focusActiveElem();
                this.activeElem.on('keyup', event => {
                    if (this.isInProgress() && 'транзитивное'.includes(event.originalEvent.target.value)) {
                        this.activeElem.off('keyup');
                        this.commenceToNextStage();
                    }
                });
                break;
            case 2:
                $("#search-input").on('keyup', () => {
                    if (this.isInProgress()) {
                        const suggestion = $(".tt-suggestion")
                            .toArray()
                            .find(suggestion => suggestion.innerText === 'транзитивное отношение')?.getElementsByTagName('p')[0];
                        if (suggestion) {
                            suggestion.setAttribute('id', 'tutorial-suggestion');
                            this.setActiveElem();
                            this.focusActiveElem();
                            suggestion.addEventListener('click', () => {
                                if (this.isInProgress()) {
                                    $("#search-input").off('keyup');
                                    this.commenceToNextStage();
                                }
                            });
                        }
                    }
                });
                break;
            case 3:
                this.clickListener();
                break;
            case 4:
                $(document).ready(() => {
                    this.clickListener();
                });
                break;
            case 5:
                const scgModeButton = $('#history-item-langs')
                    .find("li")
                    .toArray()
                    .find(listpoint => listpoint.innerText === 'sc.g-текст');
                scgModeButton.setAttribute('id', 'scg-mode-toggle-button');
                this.setActiveElem();
                this.focusActiveElem();
                this.activeElem.on('click', () => {
                    if (this.isInProgress()) {
                        this.activeElem.off('click');
                        this.commenceToNextStage();
                    }
                });
                break;
            case 6:
                this.setActiveElem();
                this.focusActiveElem();
                const nodeInterval = setInterval(() => {
                    if (this.tutorialNodeCreated) {
                        clearInterval(nodeInterval);
                        this.commenceToNextStage();
                    }
                }, 200)
                break;
            case 7:
                this.clickListener();
            case 8:
                this.setActiveElem();
                this.focusActiveElem();
                const edgeInterval = setInterval(() => {
                    if (this.tutorialEdgeCreated) {
                        clearInterval(edgeInterval);
                        this.commenceToNextStage();
                    }
                }, 200)
                break;
        }
    }
}