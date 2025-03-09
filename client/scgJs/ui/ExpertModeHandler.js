var expertModeCheckbox;
var modeSwitchingButtons;

var button;

$(document).ready(function () {
    SCWeb.core.ExpertModeEnabled = false;
    expertModeCheckbox = document.querySelector('#mode-switching-checkbox');
    modeSwitchingButtons = document.getElementsByClassName("mode-switching-panel")[0];
    if (expertModeCheckbox) {
      expertModeCheckbox.checked = SCWeb.core.ExpertModeEnabled;
      if (!expertModeCheckbox.checked) {
         modeSwitchingButtons.style.display = "none";
      }
      expertModeCheckbox.onclick = function () {
         modeSwitchingButtons.style.display = expertModeCheckbox.checked ? "" : "none";
         SCWeb.core.ExpertModeEnabled = expertModeCheckbox.checked;
         SCWeb.core.EventManager.emit("expert_mode_changed");
      };
   }
});
