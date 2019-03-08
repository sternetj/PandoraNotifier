const pageTitle = window.document.title;
var $, chrome;

const defaultElement = $(document.createElement("div"))[0];
function getSafeEl(selector) {
  return $(selector)[0] || defaultElement;
}

class TrackInfo {
  constructor(obj = {}) {
    this.name = obj.name || "";
    this.artist = obj.artist || "";
    this.album = obj.album || "";
    this.image = obj.imgUrl || "";
    this.isPlaying = obj.isPlaying;
    this.songIsLiked = obj.songIsLiked;
    this.elapsed = obj.elapsed;
    this.remaining = obj.remaining;
    this.action = "notify";
    this.showNow = obj.showNow;
    this.volume = obj.volume;
    this.isInAd = obj.isInAd;
    this.areYouStillListening = obj.areYouStillListening;
  }

  static getLatest(showPlayer = false) {
    let imgUrl = getSafeEl(".nowPlayingTopInfo__artContainer__art")
      .style.backgroundImage.replace('url("', "")
      .replace('")', "");

    if (!imgUrl) {
      imgUrl = getSafeEl(".ImageLoader__loaded.ImageLoader__cover").src;
      imgUrl = imgUrl && imgUrl.replace("90W_90H", "500W_500H");
    }

    if (imgUrl && imgUrl.startsWith("/")) {
      imgUrl = location.origin + imgUrl;
    }

    return new TrackInfo({
      name:
        getSafeEl(".Marquee__wrapper__content").textContent ||
        getSafeEl(".Tuner__Audio__TrackDetail__title").text,
      artist: getSafeEl(
        ".nowPlayingTopInfo__current__artistName, .Tuner__Audio__TrackDetail__artist"
      ).text,
      album: getSafeEl(".nowPlayingTopInfo__current__albumName ").text,
      imgUrl,
      showNow: showPlayer,
      isPlaying: $($("[data-qa='pause_button']")[0]).is(":visible"),
      songIsLiked:
        getSafeEl(".ThumbUpButton").getAttribute("aria-checked") === "true",
      elapsed: getSafeEl("[data-qa='elapsed_time']").textContent,
      remaining: getSafeEl("[data-qa='remaining_time']").textContent,
      volume: getSafeEl("audio").volume,
      isInAd: $(".nowPlayingTopInfo__current__audioAdMessage").length,
      areYouStillListening: $(".StillListeningBody").length
    });
  }

  equals(obj) {
    return (
      this.name == obj.name &&
      this.artist == obj.artist &&
      this.album == obj.album &&
      // http://www.pandora.com/img/no_album_art.png
      this.image == obj.image &&
      this.isPlaying == obj.isPlaying &&
      this.isInAd == obj.isInAd &&
      this.areYouStillListening == obj.areYouStillListening &&
      this.songIsLiked == obj.songIsLiked
    );
  }
}

function sendMessage(callback, showPlayer) {
  chrome.runtime.sendMessage(
    TrackInfo.getLatest(showPlayer),
    callback || function() {}
  );
}

let trackInfo = new TrackInfo();
let checkLoopInterval = undefined;
const checkLoopTime = 300;

function setupCheckLoop() {
  checkLoopInterval = setInterval(checkForSongChange, checkLoopTime);
}

function resetCheckLoop(inMs = 1000) {
  clearInterval(checkLoopInterval);
  setTimeout(setupCheckLoop, inMs - checkLoopTime);
}

function init() {
  trackInfo = new TrackInfo();
  setupCheckLoop();
  $(
    "[data-qa='pause_button'], [data-qa='play_button'], [data-qa='skip_button'], [data-qa='thumbs_up_button'], [data-qa='thumb_down_button']"
  ).mouseup(function() {
    setTimeout(function() {
      sendMessage();
    }, 200);
  });

  window.onbeforeunload = function() {
    chrome.runtime.sendMessage({ action: "close" }, function() {});
  };

  const injectedPageScript = document.createElement("script");
  injectedPageScript.textContent = `
  function snoozeFirstSlide() {
    document.getElementsByClassName("nowPlayingTopInfo__hitArea__topLevelMenu__more")[0].click();
    document.querySelector('[data-qa="album_menu_tiredoftrack_button"').click();
  }`;

  (document.head || document.documentElement).appendChild(injectedPageScript);
}

function checkForSongChange() {
  const newTi = TrackInfo.getLatest();
  const time = newTi.elapsed.split(":");
  const elapsed = parseInt(time[0]) * 60 + parseInt(time[1]);

  if (
    !trackInfo.equals(newTi) ||
    (elapsed > 0 && elapsed < 2 && trackInfo.isPlaying)
  ) {
    trackInfo = newTi;

    sendMessage();

    window.document.title = trackInfo.isInAd
      ? pageTitle
      : `${trackInfo.name} by ${trackInfo.artist}`;
  }
}

function addMiniPlayerButton() {
  const showPlayerButton =
    '<li class="NavHorizontal__item miniplayer" role="presentation"><a href="javascript:void(0)" class="NavHorizontal__item__link" data-qa="header_my_stations_link" role="menuitem"><span>Show Mini-Player</span></a></li>';
  $(".NavHorizontal").append(showPlayerButton);

  $(".miniplayer").mouseup(function() {
    setTimeout(function() {
      sendMessage(function() {}, true);
    }, 200);
  });
}

let buttonLoaded = false;
function waitTilLoaded() {
  setTimeout(function() {
    if (!buttonLoaded && $(".NavHorizontal").length > 0) {
      addMiniPlayerButton();
      buttonLoaded = true;
    }
    if (TrackInfo.getLatest().name) {
      init();
    } else {
      waitTilLoaded();
    }
  }, 750);
}

waitTilLoaded();

chrome.runtime.onMessage.addListener(function(action, _, sendResponse) {
  if (action === "pause") {
    resetCheckLoop();
    $("[data-qa='pause_button']").click();
    trackInfo.isPlaying = false;
    sendResponse("ok");
  } else if (action === "play") {
    resetCheckLoop();
    $("[data-qa='play_button']").click();
    trackInfo.isPlaying = true;
    sendResponse("ok");
  } else if (action === "like") {
    resetCheckLoop();
    $("[data-qa='thumbs_up_button']").click();
    trackInfo.songIsLiked = true;
    sendResponse("ok");
  } else if (action === "dislike") {
    $("[data-qa='thumbs_down_button']").click();
    sendResponse("ok");
  } else if (action === "skip") {
    $("[data-qa='skip_button']").click();
    sendResponse("ok");
  } else if (action === "seeSong") {
    $(".nowPlayingTopInfo__current__trackName")[0].click();
    sendResponse("ok");
  } else if (action === "seeArtist") {
    $(".nowPlayingTopInfo__current__artistName")[0].click();
    sendResponse("ok");
  } else if (action === "seeAlbum") {
    $(".nowPlayingTopInfo__current__albumName")[0].click();
    sendResponse("ok");
  } else if (action === "keepListening") {
    resetCheckLoop();
    $(".StillListeningBody button")[0].click();
    trackInfo.areYouStillListening = false;
    sendResponse("ok");
  } else if (action === "getTrackInfo") {
    sendResponse(TrackInfo.getLatest(true));
  } else if (action === "getTrackInfoUpdate") {
    sendResponse(TrackInfo.getLatest());
  } else if (action.split("-")[0] === "setVolume") {
    const setVolume = +action.split("-")[1];
    if (!isNaN(setVolume)) {
      resetCheckLoop();
      getSafeEl("audio").volume = setVolume;
      trackInfo.volume = setVolume;
    }
    sendResponse("ok");
  } else if (action === "tiredOfSong") {
    var script = document.createElement("script");
    script.textContent = "snoozeFirstSlide()";
    (document.head || document.documentElement).appendChild(script);
    setTimeout(function() {
      script.parentNode.removeChild(script);
    }, 500);

    sendResponse("ok");
  } else {
    sendResponse("error: no action - " + action);
  }
});
