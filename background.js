class TrackInfo {
  constructor(name, artist, album, imgUrl) {
    this.name = name || "";
    this.artist = artist || "";
    this.album = album || "";
    this.image = imgUrl || "";
    this.isPlaying = undefined;
    this.songIsLiked = undefined;
    this.elapsed = undefined;
    this.remaining = undefined;
    this.action = undefined;
    this.showNow = undefined;
    this.volume = undefined;
    this.isInAd = undefined;
    this.stations = [];
  }

  equals(obj) {
    return (
      this.name == obj.name &&
      this.artist == obj.artist &&
      this.album == obj.album
    );
  }
}

let trackInfo = new TrackInfo();
let isPlaying = true;
let timeout = null;
let nt = null;
let checks = 0;
let timeOut = null;
let firstTime = true;
let volume = null;
var $, chrome;

function getQueryVariable(query, variable) {
  return; //for now
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (decodeURIComponent(pair[0]) == variable) {
      return decodeURIComponent(pair[1]);
    }
  }
}

function getTrackName() {
  var trackElement = $(".Marquee__wrapper__content")[0];
  if (trackElement) {
    return trackElement.textContent;
  }

  trackElement = $(".Marquee__wrapper__content__child")[0];
  if (trackElement) {
    return trackElement.textContent;
  }

  return "";
}

function getTrackInfo(showPlayer) {
  var newTi = new TrackInfo(
    getTrackName(),
    $(".nowPlayingTopInfo__current__artistName")[0].text,
    $(".nowPlayingTopInfo__current__albumName ")[0].text,
    $(".nowPlayingTopInfo__artContainer__art")[0]
      .style.backgroundImage.replace('url("', "")
      .replace('")', "")
  );

  isPlaying = $($("[data-qa='pause_button']")[0]).is(":visible");
  trackInfo.action = "notify";
  trackInfo.showNow = false;
  if (showPlayer) {
    trackInfo.showNow = true;
  }
  trackInfo.isPlaying = isPlaying;
  trackInfo.songIsLiked = $($("[data-qa='thumbs_up_button']")[0]).hasClass(
    "indicator"
  );
  trackInfo.elapsed = $("[data-qa='elapsed_time']")[0].textContent;
  trackInfo.remaining = $("[data-qa='remaining_time']")[0].textContent;

  var audioControls = $("audio");
  for (var i = 0; i < audioControls.length; i++) {
    if (!audioControls[i].paused) {
      trackInfo.volume = audioControls[i].volume;
      break;
    }
  }

  var inAd = !$($("#trackInfo .info")[0]).is(":visible");
  trackInfo.isInAd = false; //inAd;

  //Get stations TODO fix this
  // var stations = $(".StationListItem__title").not(".notSelectableStation");
  var stationsObj = [];
  // stations.each(function(index) {
  //     stationsObj.push({
  //         name: $(this).text().trim(),
  //         selected: $(this).parent().parent().parent().hasClass("selected") || $(this).parent().parent().parent().parent().hasClass("selected"),
  //         checked: $(this).parent().find(".checkbox").hasClass("checked"),
  //         playing: $(this).parent().hasClass("shuffleStationLabelCurrent")
  //     });
  // });
  trackInfo.stations = stationsObj;

  return trackInfo;
}

function sendMessage(callback, showPlayer) {
  chrome.runtime.sendMessage(
    getTrackInfo(showPlayer),
    callback || function() {}
  );
}

function init() {
  trackInfo = new TrackInfo();
  isPlaying = true;
  timeout = null;
  nt = null;
  checks = 0;
  timeOut = null;
  setInterval(checkForSongChange, 300);
  setTimeout(checkForSongChange, 1000);
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

  var actualCode = [
    "function snoozeFirstSlide(){",
    ' fireEvent(document.getElementsByClassName("nowPlayingTopInfo__hitArea__topLevelMenu__sessionHistory")[0], "mouseover");',
    " setTimeout(function() {",
    ' document.getElementsByClassName("nowPlayingTopInfo__hitArea__topLevelMenu__more")[0].click();',
    " document.querySelector(\"[data-qa='album_menu_tiredoftrack_button'\").click();",
    ' fireEvent(document.getElementsByClassName("nowPlayingTopInfo__hitArea__topLevelMenu__sessionHistory")[0], "mouseout");',
    " }, 500);",
    " }",
    " function addDropShuffleStation(index){",
    ' var $span = $($(".stationName li span")[index]);',
    " $span.mousedown().mouseup().click().change();",
    " }",
    " function fireEvent( element, eventName ){",
    " if( element != null ){",
    " if( element.fireEvent ){",
    ' element.fireEvent( "on" + eventName );',
    " } else {",
    ' var evObj = document.createEvent( "Events" );',
    " evObj.initEvent( eventName, true, false );",
    " element.dispatchEvent( evObj );",
    " }",
    " }",
    "}"
  ].join("\n");

  var script = document.createElement("script");
  script.textContent = actualCode;
  (document.head || document.documentElement).appendChild(script);
}

function checkForSongChange() {
  var newTi = new TrackInfo(
    getTrackName(),
    $(".nowPlayingTopInfo__current__artistName")[0].text,
    $(".nowPlayingTopInfo__current__albumName ")[0].text,
    $(".nowPlayingTopInfo__artContainer__art")[0]
      .style.backgroundImage.replace('url("', "")
      .replace('")', "")
  );

  var time = $('[data-qa="elapsed_time"]')[0].textContent.split(":");
  var elapsed = parseInt(time[0]) * 60 + parseInt(time[1]);
  var time2 = $('[data-qa="remaining_time"]')[0].textContent.split(":");
  var toGo = parseInt(time2[0]) * -60 + parseInt(time2[1]);

  //http://www.pandora.com/img/no_album_art.png
  if (trackInfo.image != newTi.image || !trackInfo.equals(newTi)) {
    trackInfo = newTi;
    checks = 0;

    sendMessage();

    var track = trackInfo.name;
    var artist = trackInfo.artist;

    if (volume !== null) {
      var audioControls = $("audio");
      for (var i = 0; i < audioControls.length; i++) {
        if (audioControls[i].paused) continue;
        audioControls[i].volume = volume;
      }
    }

    window.document.title = track + " by " + artist;
  }

  isPlaying = $($("[data-qa='pause_button']")[0]).is(":visible");
  if (elapsed > 0 && elapsed < 2 && isPlaying) {
    sendMessage();
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

var buttonLoaded = false;

function waitTilLoaded() {
  setTimeout(function() {
    if (!buttonLoaded && $(".NavHorizontal").length > 0) {
      addMiniPlayerButton();
      buttonLoaded = true;
    }
    if (getTrackName()) {
      init();
    } else {
      waitTilLoaded();
    }
  }, 750);
}

waitTilLoaded();

chrome.runtime.onMessage.addListener(function(action, _, sendResponse) {
  if (action === "pause") {
    $("[data-qa='pause_button']").click();
    sendResponse("ok");
  } else if (action === "play") {
    $("[data-qa='play_button']").click();
    sendResponse("ok");
  } else if (action === "like") {
    $("[data-qa='thumbs_up_button']").click();
    sendResponse("ok");
  } else if (action === "dislike") {
    $("[data-qa='thumb_down_button']").click();
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
  } else if (action === "getTrackInfo") {
    sendResponse(getTrackInfo(true));
  } else if (action === "getTrackInfoUpdate") {
    sendResponse(getTrackInfo());
  } else if (action.split("-")[0] === "setVolume") {
    var setVolume = +action.split("-")[1];
    if (!isNaN(setVolume)) {
      volume = setVolume;
      var audioControls = $("audio");
      for (var i = 0; i < audioControls.length; i++) {
        if (audioControls[i].paused) continue;
        audioControls[i].volume = volume;
      }
    }
    sendResponse("ok");
  } else if (action.split("-")[0] === "changeStation") {
    var index = parseInt(action.split("-")[1]);
    if (index >= 0) {
      $($(".stationListItem li div")[index]).click();
      setTimeout(function() {
        sendMessage();
      }, 200);
    }
    sendResponse("ok");
  } else if (action.split("-")[0] === "addDropShuffleStation") {
    var index = parseInt(action.split("-")[1]);
    if (index > 0) {
      index -= 1;

      var actualCode = [
        'var $span = $($(".stationName li span")[' + index + "]);",
        " $span.mousedown().mouseup().click().change();"
      ].join("\n");

      var script = document.createElement("script");
      script.textContent = actualCode;
      (document.head || document.documentElement).appendChild(script);
      setTimeout(function() {
        script.parentNode.removeChild(script);
      }, 500);

      setTimeout(function() {
        sendMessage();
      }, 800);
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
