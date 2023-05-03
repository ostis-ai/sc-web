SCWeb.ui.Tutorial = {
    inProgress: false,
    activeElem: undefined,
    tutorialStageSelectors: [
        "#search-panel",
        "#search-input",
        "#tutorial-suggestion",
        "#expert_mode_container",
        "#window-type-select-button",
        "#scg-mode-toggle-button",
        "#create-node-button",
        "#expert_mode_container"
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
        this.blurActiveElem();
        this.inProgress = false;
    },

    commenceToNextStage: function() {
        if (this.currentStage >= 0) {
            this.blurActiveElem();
        }
        this.currentStage++;
        if (this.currentStage >= this.tutorialStageSelectors.length) {
            this.end();
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

    addStageCompletionListener: function(stageNumber) {
        switch(stageNumber) {
            case 0:
                this.setActiveElem();
                this.focusActiveElem();
                this.activeElem.on('click', () => {
                    if (this.isInProgress()) {
                        this.activeElem.off('click');
                        this.commenceToNextStage();
                    }
                });
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
                            console.log(suggestion, this.activeElem);
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
                this.setActiveElem();
                this.focusActiveElem();
                this.activeElem.on('click', () => {
                    if (this.isInProgress()) {
                        this.activeElem.off('click');
                        this.commenceToNextStage();
                    }
                })
                break;
            case 4:
                $(document).ready(() => {
                    this.setActiveElem();
                    this.focusActiveElem();
                });
        }
    }
}