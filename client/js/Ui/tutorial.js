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

        })
    }
}