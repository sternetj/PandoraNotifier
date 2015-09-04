console.log("Welcome to Pandora!");

function ti() {
  this.name = "";
  this.artist = "";
  this.album = "";
  this.image = "";
}

function ti(name, artist, album, imgUrl) {
  this.name = name;
  this.artist = artist;
  this.album = album;
  this.image = imgUrl;
}

ti.prototype.equals = function(obj) {
  return this.name == obj.name &&
    this.artist == obj.artist &&
    this.album == obj.album;

}

var trackInfo = new ti();
var isPlaying = true;
var timeout = null;
var nt = null;
var checks = 0;
var timeOut = null;

function init() {
  trackInfo = new ti();
  isPlaying = true;
  timeout = null;
  nt = null;
  checks = 0;
  timeOut = null;
  setInterval(checkForSongChange, 750);
  $(".pauseButton, .playButton, .skipButton, .thumbUpButton, .thumbDownButton").click(function () {
      var newTi = new ti($(".playerBarSong")[0].text,
                     $(".playerBarArtist")[0].text,
                     $(".playerBarAlbum")[0].text,
                     $(".playerBarArt")[0].src);

    isPlaying = $($(".pauseButton")[0]).is(":visible");
    trackInfo.action = 'notify';
    trackInfo.isPlaying = isPlaying;
    trackInfo.songIsLiked = $($(".thumbUpButton")[0]).hasClass("indicator");
    trackInfo.elapsed = $(".elapsedTime")[0].textContent;
    trackInfo.remaining = $(".remainingTime")[0].textContent;
    chrome.runtime.sendMessage(trackInfo,function() {});
  });
}

function checkForSongChange() {
  var newTi = new ti($(".playerBarSong")[0].text,
                     $(".playerBarArtist")[0].text,
                     $(".playerBarAlbum")[0].text,
                     $(".playerBarArt")[0].src);

  var time = $(".elapsedTime")[0].textContent.split(":");
  var elapsed = parseInt(time[0]) * 60 + parseInt(time[1]);
  var time2 = $(".remainingTime")[0].textContent.split(":");
  var toGo = parseInt(time2[0]) * -60 + parseInt(time2[1]);

  //if user paused on pandora send pause update
  //change to events
  if (isPlaying != $($(".pauseButton")[0]).is(":visible")){
    isPlaying = !isPlaying;
    trackInfo.isPlaying = isPlaying;
    chrome.runtime.sendMessage(trackInfo,function() {});
  }

  //http://www.pandora.com/img/no_album_art.png
  if (!trackInfo.equals(newTi) &&
    toGo > 0 &&
    (trackInfo.image != newTi.image ||
      (trackInfo.image == "http://www.pandora.com/img/no_album_art.png" && checks++ > 4))) {
    trackInfo = newTi;
  checks = 0;

    isPlaying = $($(".pauseButton")[0]).is(":visible");

    //Station Name:
    //$(".shuffleStationLabelCurrent").find(".stationNameText").text().trim()

    trackInfo.action = 'notify';
    trackInfo.isPlaying = isPlaying;
    trackInfo.songIsLiked = $($(".thumbUpButton")[0]).hasClass("indicator");
    trackInfo.elapsed = $(".elapsedTime")[0].textContent;
    trackInfo.remaining = $(".remainingTime")[0].textContent;
    chrome.runtime.sendMessage(trackInfo,function() {});

    var track = trackInfo.name;
    var artist = trackInfo.artist;
    var album = trackInfo.album;
    var image = trackInfo.image;

    window.document.title = track + " by " + artist;

    var options = {
      icon: image,
      body: 'by ' + artist + '\r\non ' + album,
      sticky: true
    };

    if (nt){
      nt.close();
      nt = null;
    }

    //nt = new Notification(track, options);

    var noteClicked = function() {
      if ($($(".pauseButton")[0]).is(":visible")) {
        $(".pauseButton").click();
        clearTimeout(timeOut);
        timeOut = null;
        nt = new Notification("Paused - " + track, options);
        nt.onclick = noteClicked;
      } else {
        this.title = track;
        $(".playButton").click();
        nt = new Notification(track, options);
        nt.onclick = noteClicked;
        timeOut = setTimeout(function() {
          nt.close();
        }, (toGo) * 1000);
      }
      return false;
    }

    //nt.onclick = noteClicked;

    // timeOut = setTimeout(function() {
    //   nt.close();
    // }, (toGo) * 1000);

    console.log("Next Song is: " + trackInfo.name);
  }
}

function waitTilLoaded() {
  setTimeout(
    function() {
      console.log("loop called");
      if ($(".songTitle").length <= 0 || !($(".songTitle")[0].text)) {
        waitTilLoaded();
      } else {
        console.log("title exists!");
        init();
      }
    }, 750);
}

$(window).bind("load", function() {
  console.log("Page Loaded!");
  // $(".skipButton").after('
  //   <div class=".showMiniPlayer" style="display: block; float: left; margin: auto auto auto 25px;">
  //     <img src="http://i.stack.imgur.com/To3El.png" style="width: 36px; height: 38px; -webkit-filter: invert(100%);"></img>
  //   </div>');
  waitTilLoaded();
});

chrome.runtime.onMessage.addListener(function(action, _, sendResponse) {
  if (action === "pause"){
    $(".pauseButton").click();
    sendResponse("ok");
  }else if (action === "play"){
    $(".playButton").click();
    sendResponse("ok");
  }else if (action === "like"){
    $(".thumbUpButton").click();
    sendResponse("ok");
  }else if (action === "dislike"){
    $(".thumbDownButton").click();
    sendResponse("ok");
  }else if (action === "skip"){
    $(".skipButton").click();
    sendResponse("ok");
  }else if (action === "seeSong"){
    $(".songTitle").click();
    sendResponse("ok");
  }else if (action === "seeArtist"){
    $(".artistSummary").click();
    sendResponse("ok");
  }else if (action === "seeAlbum"){
    $(".albumTitle").click();
    sendResponse("ok");
  }else {
    sendResponse("error: no action - " + action);
  }
});