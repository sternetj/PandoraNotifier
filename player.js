let popupWin = null;
let firstTime = true;
let lastRequest = {};
let tab = null;
let shouldNotify = true;

function sendMessage(action, callback, waitForPandora) {
  chrome.tabs.query({ url: "*://*.pandora.com/*" }, function([pandoraTab]) {
    if (pandoraTab) {
      tab = pandoraTab;
      if (waitForPandora) {
        shouldNotify = false;
        setTimeout(() => (shouldNotify = true), 1000);
      }
      chrome.tabs.sendMessage(tab.id, action, function(status) {
        callback(status, tab);
      });
    }
  });
}

function showTab(tab) {
  if (!tab || !tab.id) return;

  chrome.tabs.update(tab.id, {
    active: true
  });
}

function updatePlayer(request) {
  var views = chrome.extension.getViews();
  if (views.length > 1) {
    var miniPlayerIndex = 0;
    var doc = views[miniPlayerIndex].document;
    while (
      miniPlayerIndex < views.length - 1 &&
      !(doc.location.href.indexOf("popout.html") > -1)
    ) {
      doc = views[++miniPlayerIndex].document;
    }
    if (!(doc.location.href.indexOf("popout.html") > -1)) {
      function addSecond(str, sec) {
        var time =
          parseInt(str.split(":")[0]) * 60 + parseInt(str.split(":")[1]);
        time++;
        return (
          String(Math.floor(time / 60)) +
          ":" +
          (time % 60 < 10 ? "0" : "") +
          String(time % 60)
        );
      }
      setTimeout(function() {
        request.remaining = addSecond(request.remaining, 1);
        request.elapsed = addSecond(request.remaining, 1);
        updatePlayer(request);
      }, 1000);
      return;
    }

    const albumImage =
      (request && request.image) ||
      "http://www.pandora.com/img/no_album_art.png";
    if (doc.getElementById("albumImage").src != albumImage) {
      doc.getElementById("albumImage").src = albumImage;
    }
    doc.getElementById("track").innerHTML = request.name;
    doc.getElementById("artist").innerHTML = request.artist;
    if (request.album) {
      $(doc.getElementById("albumSection")).show();
    } else {
      $(doc.getElementById("albumSection")).hide();
    }
    doc.getElementById("album").innerHTML = request.album;
    doc.getElementById("trackLength").innerHTML = request.remaining;
    doc.getElementById("elapsedTime").innerHTML = request.elapsed;

    doc.defaultView.onbeforeunload = function() {
      console.log("unloading");
      sendMessage("getTrackInfoUpdate", function(request, tab) {
        setTimeout(function() {
          notify(request);
        }, 10);
      });
    };

    doc.getElementById("playButton").onclick = function() {
      sendMessage(
        "play",
        function(status) {
          if (status === "ok") {
            console.log("play request success!");
            doc.getElementById("playButton").classList.add("hidden");
            doc.getElementById("pauseButton").classList.remove("hidden");
          }
        },
        true
      );
    };
    doc.getElementById("pauseButton").onclick = function() {
      sendMessage(
        "pause",
        function(status) {
          if (status === "ok") {
            console.log("pause request success!");
            doc.getElementById("pauseButton").classList.add("hidden");
            doc.getElementById("playButton").classList.remove("hidden");
          }
        },
        true
      );
    };
    doc.getElementById("skipButton").onclick = function() {
      sendMessage("skip", function(status) {
        if (status === "ok") {
          console.log("skip request success!");
        }
      });
    };
    doc.getElementById("likeButton").onclick = function() {
      sendMessage(
        "like",
        function(status) {
          if (status === "ok") {
            doc.getElementById("likeButton").classList.toggle("liked");
            console.log("like song request success!");
          }
        },
        true
      );
    };
    doc.getElementById("dislikeButton").onclick = function() {
      sendMessage(
        "dislike",
        function(status) {
          if (status === "ok") {
            console.log("dislike song request success!");
          }
        },
        true
      );
    };
    doc.getElementById("tiredButton").onclick = function() {
      sendMessage("tiredOfSong", function(status) {
        if (status === "ok") {
          console.log("tired of song request success!");
        }
      });
    };
    doc.getElementById("track").onclick = function() {
      sendMessage("seeSong", function(status, tab) {
        if (status === "ok") {
          console.log("view song info request success!");
          showTab(tab);
        }
      });
    };
    doc.getElementById("artist").onclick = function() {
      sendMessage("seeArtist", function(status, tab) {
        showTab(tab);
      });
    };
    doc.getElementById("album").onclick = function() {
      sendMessage("seeAlbum", function(status, tab) {
        showTab(tab);
      });
    };
    doc.getElementById("showPandora").onclick = function() {
      sendMessage("showPandora", function(status, tab) {
        showTab(tab);
      });
    };
    doc.getElementById("keepListening").onclick = function() {
      sendMessage(
        "keepListening",
        function(status) {
          if (status === "ok") {
            console.log("keep listening success!");
          }
        },
        true
      );
    };

    $(doc.getElementById("enablePanels")).click(function() {
      const windowsOnTopUrl = "https://www.howtogeek.com/howto/13784";
      chrome.tabs.query({ url: `${windowsOnTopUrl}*` }, function(tabs) {
        if (!tabs.length) {
          chrome.tabs.create({ url: windowsOnTopUrl });
        } else {
          chrome.tabs.update(tabs[0].id, {
            active: true
          });
        }
      });
    });

    if (request.isPlaying) {
      doc.getElementById("playButton").classList.add("hidden");
      doc.getElementById("pauseButton").classList.remove("hidden");
    } else {
      doc.getElementById("playButton").classList.remove("hidden");
      doc.getElementById("pauseButton").classList.add("hidden");
    }

    if (request.songIsLiked) {
      doc.getElementById("likeButton").classList.add("liked");
    } else {
      doc.getElementById("likeButton").classList.remove("liked");
    }

    doc.getElementById("dislikeButton").classList.remove("dislike");

    if (request.isInAd) {
      $(doc.getElementById("songInfo")).hide();
      $(doc.getElementById("likeButton")).unbind("click");
      $(doc.getElementById("dislikeButton")).unbind("click");
      $(doc.getElementById("tiredButton")).unbind("click");
      $(doc.getElementById("skipButton")).unbind("click");

      doc.querySelector("#buttons").classList.add("disabled");
    } else {
      $(doc.getElementById("songInfo")).show();
      doc.querySelector("#buttons").classList.remove("disabled");
    }

    if (request.areYouStillListening) {
      doc.querySelector("#StillListening").classList.add("show");
      doc.querySelector("#playbackControl").classList.remove("show");
    } else {
      doc.querySelector("#StillListening").classList.remove("show");
    }
  }
}

function notify(request) {
  var views = chrome.extension.getViews();
  var miniPlayerExists = views.length > 1;
  if (miniPlayerExists) {
    var miniPlayerIndex = 0;
    var doc = views[miniPlayerIndex].document;
    miniPlayerExists = doc.location.href.indexOf("popout.html") > -1;
    while (!miniPlayerExists && miniPlayerIndex < views.length - 1) {
      doc = views[++miniPlayerIndex].document;
      miniPlayerExists = doc.location.href.indexOf("popout.html") > -1;
    }
  }

  if (!miniPlayerExists) {
    createMiniPlayerWindow(request);
    rebindOptions();
  } else {
    updatePlayer(request);

    if (request.showNow) {
      const urlPattern = "chrome-extension://*/popout.html*";
      chrome.tabs.query({ url: urlPattern }, function(tabs) {
        if (tabs.length) {
          showTab(tabs[0]);
        }
      });
    }
  }
}

function createMiniPlayerWindow(request) {
  const frameWidth = 9;
  const toolbarHeight = 30;
  const imageSide = 298;
  const width = imageSide + frameWidth * 2;
  const height = imageSide + frameWidth + toolbarHeight;
  const left = screen.width - width;
  const top = screen.height - height;
  const alwaysShow = JSON.parse(localStorage.alwaysShow);
  const firstLoad = JSON.parse(localStorage.firstLoad);
  if (!(alwaysShow || (firstLoad && firstTime) || request.showNow)) {
    firstTime = false;
    return;
  }

  let url = "popout.html?utm_campaign=fall";

  if (request.showNow) {
    url += "&utm_medium=show_mini_player";
  } else {
    url += "&utm_medium=always_show";
  }

  if (firstTime) {
    url += "&utm_source=create_first_time";
  } else {
    url += "&utm_source=reopen";
  }

  firstTime = false;

  chrome.windows.create(
    {
      url,
      type: "popup",
      height,
      width,
      top,
      left
    },
    function(win) {
      popupWin = win;
      console.log(win);
      setTimeout(function() {
        updatePlayer(request);
      }, 500);
    }
  );
}

chrome.runtime.onMessage.addListener(function(request, sender, pauseFunc) {
  console.log(request);
  chrome.storage.sync.get(null, function(o) {
    if (o.hasOwnProperty("alwaysShow")) {
      localStorage.alwaysShow = o.alwaysShow;
    }
    if (o.hasOwnProperty("firstLoad")) {
      localStorage.firstLoad = o.firstLoad;
    }
    if (o.hasOwnProperty("hasRated")) {
      localStorage.hasRated = o.hasRated;
    }
    localStorage.showNormal = o.hasOwnProperty("showNormal")
      ? o.showNormal
      : false;
    localStorage.showNormalInitialized = o.hasOwnProperty("showNormal");
  });

  if (request && request.split && request.split("-")[0] === "volume") {
    var volume = +request.split("-")[1];
    if (Math.abs(lastRequest.volume - volume) > 0.001) {
      sendMessage("setVolume-" + volume, function(status) {
        if (status === "ok") {
          console.log("volume change success!");
        }
      });
    }
  } else if (request && request.action === "notify") {
    lastRequest = request;
    shouldNotify && notify(request);
  } else if (request && request.action === "close") {
    localStorage.firstLoad = true;
    firstTime = true;
    chrome.windows.remove(popupWin.id, function() {});
    popupWin = null;
  }
});

//Add Page Action
chrome.runtime.onInstalled.addListener(function(details) {
  if (!localStorage.isInitialized) {
    localStorage.alwaysShow = false;
    localStorage.firstLoad = true;
    localStorage.hasRated = false;
  }

  if (details.reason == "update") {
    //first time/already installed
    chrome.storage.sync.get(null, function(o) {
      if (Object.keys(o).length == 0) {
        chrome.storage.sync.set(
          {
            alwaysShow: JSON.parse(localStorage.alwaysShow),
            firstLoad: JSON.parse(localStorage.firstLoad),
            hasRated: JSON.parse(localStorage.hasRated)
          },
          function(o) {
            localStorage.alwaysShow = o.alwaysShow;
            localStorage.firstLoad = o.firstLoad;
            localStorage.showNormal = false;
          }
        );
        //if given a rating
      }
      if (JSON.parse(localStorage.hasRated)) {
        chrome.storage.sync.set(
          {
            hasRated: true
          },
          function(o) {}
        );
      }
    });
  } else {
    chrome.storage.sync.get(null, function(o) {
      if (Object.keys(o).length == 0) {
        chrome.storage.sync.set(
          {
            alwaysShow: false,
            firstLoad: true,
            hasRated: false
          },
          function(o) {
            localStorage.alwaysShow = false;
            localStorage.firstLoad = true;
            localStorage.showNormal = false;
          }
        );
      }
    });
  }
});

function setOptionsPopUp(tab) {
  chrome.browserAction.setPopup({
    tabId: tab.id,
    popup: "options.html"
  });
}

function rebindOptions() {
  chrome.tabs.query({ url: "*://*.pandora.com/*" }, function(tabs) {
    tabs.forEach(setOptionsPopUp);
  });
}

chrome.tabs.onUpdated.addListener(function(id, change, tab) {
  if (/\.pandora\.com/i.test(change.url)) {
    setOptionsPopUp(tab);
  }
});

chrome.browserAction.onClicked.addListener(function(activeTab) {
  var newURL = "http://pandora.com";
  chrome.tabs.query({ url: "*://*.pandora.com/*" }, function(tabs) {
    if (tabs.length) {
      showTab(tabs[0]);
    } else {
      chrome.tabs.create({ url: newURL }, setOptionsPopUp);
    }
  });
});

rebindOptions();
