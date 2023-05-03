SCWeb.ui.Tutorial = {
    inProgress: false,
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

    focusActiveElem: function(elemID) {
        $(this.tutorialStageSelectors[this.currentStage]).addClass('tutorial-focused-elem');
    },

    blurActiveElem: function() {
        $(this.tutorialStageSelectors[this.currentStage]).removeClass('tutorial-focused-elem');
    },

    addStageCompletionListener: function(stageNumber) {
        switch(stageNumber) {
            case 0:
                this.focusActiveElem();
                $("#search-panel").on('click', () => {
                    if (this.isInProgress()) {
                        this.commenceToNextStage();
                        $("#search-panel").off('click');
                    }
                });
                break;
            case 1:
                this.focusActiveElem();
                $("#search-input").on('keyup', event => {
                    if (this.isInProgress() && 'транзитивное'.includes(event.originalEvent.target.value)) {
                        $("#search-input").off('keyup');
                        this.commenceToNextStage();
                    }
                });
                break;
            case 2:
                $("#search-input").on('keyup', () => {
                    if (this.isInProgress()) {
                        const suggestion = $(".tt-suggestion")
                            .toArray()
                            .find(suggestion => suggestion.innerText === 'транзитивное отношение')
                            .getElementsByTagName('p')[0];
                        suggestion.setAttribute('id', 'tutorial-suggestion');
                        this.focusActiveElem();
                        console.log(suggestion);
                        suggestion.addEventListener('click', () => {
                            if (this.isInProgress()) {
                                $("#search-input").off('keyup');
                                this.commenceToNextStage();
                            }
                        });
                    }
                });
                break;
            case 3:
                this.focusActiveElem();
                $("#mode-switching-checkbox").on('click', () => {
                    if (this.isInProgress()) {
                        this.commenceToNextStage();
                        $("mode-switching-checkbox").off('click');
                    }
                })
                break;
            case 4:
                $(document).ready(() => {
                    this.focusActiveElem();
                });
        }
    }
}