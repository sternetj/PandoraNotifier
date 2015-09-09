var alwaysShow = document.getElementById("alwaysShow");
var firstLoad = document.getElementById("firstLoad");

function ghost() {
  alwaysShow.style.color = !alwaysShow.isActivated.checked ? 'graytext' : 'black';
  firstLoad.style.color = !firstLoad.isActivated.checked ? 'graytext' : 'black';
                                              // The label color.
}

window.addEventListener('load', function() {
  // Initialize the option controls.
  alwaysShow.isActivated.checked = JSON.parse(localStorage.alwaysShow);
  firstLoad.isActivated.checked = JSON.parse(localStorage.firstLoad);

  ghost();

  alwaysShow.isActivated.onchange = function() {
    localStorage.alwaysShow = alwaysShow.isActivated.checked;
    if (alwaysShow.isActivated.checked){
      localStorage.firstLoad = false;
      firstLoad.isActivated.checked = false;
    }
    ghost();
  };

  firstLoad.isActivated.onchange = function() {
    localStorage.firstLoad = firstLoad.isActivated.checked;
    if (firstLoad.isActivated.checked){
      localStorage.alwaysShow = false;
      alwaysShow.isActivated.checked = false;
    }
    ghost();
  };
});
