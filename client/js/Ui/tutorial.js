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
        // this.addStageCompletionListener(this.currentStage);
    },

    focusActiveElem: function(elemID) {
        $(this.tutorialStageSelectors[this.currentStage]).addClass('tutorial-focused-elem');
    },

    blurActiveElem: function() {
        $(this.tutorialStageSelectors[this.currentStage]).removeClass('tutorial-focused-elem');
    },
        })
    }
}