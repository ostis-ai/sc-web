var c;

var button;

$(document).ready(function () {
    SCWeb.core.ExpertModeEnabled = false;
    c = document.querySelector('#mode-switching-checkbox');
    c.checked = SCWeb.core.ExpertModeEnabled;
    c.onclick = function () {
        if (c.checked) {
            document.getElementsByClassName("mode-switching-panel")[0].style.display = "";
            SCWeb.core.ExpertModeEnabled = true;
            SCWeb.core.EventManager.emit("expert_mode_enabled");
        } else {
            document.getElementsByClassName("mode-switching-panel")[0].style.display = "none";
            SCWeb.core.ExpertModeEnabled = false;
            SCWeb.core.EventManager.emit("expert_mode_disabled");
        }
    };
});