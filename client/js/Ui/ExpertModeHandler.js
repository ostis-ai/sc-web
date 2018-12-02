var c;

var button;

$(document).ready(function () {
    SCWeb.core.ExpertModeEnabled = false;
    c = document.querySelector('#mode-switching-checkbox');
    c.checked = SCWeb.core.ExpertModeEnabled;
    c.onclick = function () {
        document.getElementsByClassName("mode-switching-panel")[0].style.display = c.checked ? "" : "none";
        SCWeb.core.ExpertModeEnabled = c.checked;
        SCWeb.core.EventManager.emit("expert_mode_changed");
    };
});