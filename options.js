var alwaysShow = document.getElementById("alwaysShow");
var firstLoad = document.getElementById("firstLoad");

function ghost() {
  alwaysShow.style.color = !alwaysShow.isActivated.checked ? 'graytext' : 'black';
  firstLoad.style.color = !firstLoad.isActivated.checked ? 'graytext' : 'black';
}

window.addEventListener('load', function() {
  // Initialize the option controls.
  alwaysShow.isActivated.checked = false;
  firstLoad.isActivated.checked = true;
  chrome.storage.sync.get(null, function (o){
    if (o.hasOwnProperty('alwaysShow')){
      alwaysShow.isActivated.checked = o.alwaysShow;
    }
    if (o.hasOwnProperty('firstLoad')){
      firstLoad.isActivated.checked = o.firstLoad;
    }
      ghost();
  });

  ghost();

  alwaysShow.isActivated.onchange = function() {
    chrome.storage.sync.set({"alwaysShow": alwaysShow.isActivated.checked});
    localStorage.alwaysShow = alwaysShow.isActivated.checked;
    if (alwaysShow.isActivated.checked){
      chrome.storage.sync.set({"firstLoad": false});
      localStorage.firstLoad = false;
      firstLoad.isActivated.checked = false;
    }
    ghost();
  };

  firstLoad.isActivated.onchange = function() {
    chrome.storage.sync.set({"firstLoad": firstLoad.isActivated.checked});
    localStorage.firstLoad = firstLoad.isActivated.checked;
    if (firstLoad.isActivated.checked){
      chrome.storage.sync.set({"alwaysShow": false});
      localStorage.alwaysShow = false;
      alwaysShow.isActivated.checked = false;
    }
    ghost();
  };
});
