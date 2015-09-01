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

function init() {
  setInterval(checkForSongChange, 750);
}

var trackInfo = new ti();
var isPlaying = true;
var timeout = null;
var nt = null;
var checks = 0;
var timeOut = null;
function checkForSongChange() {
  var newTi = new ti($(".playerBarSong")[0].text,
                     $(".playerBarArtist")[0].text,
                     $(".playerBarAlbum")[0].text,
                     $(".playerBarArt")[0].src);

  var time = $(".elapsedTime")[0].textContent.split(":");
  var elapsed = parseInt(time[0]) * 60 + parseInt(time[1]);
  var time2 = $(".remainingTime")[0].textContent.split(":");
  var toGo = parseInt(time2[0]) * -60 + parseInt(time2[1]);
  //http://www.pandora.com/img/no_album_art.png
  if (!trackInfo.equals(newTi) &&
    (trackInfo.image != newTi.image ||
      (trackInfo.image == "http://www.pandora.com/img/no_album_art.png" && checks++ > 4))) {
    trackInfo = newTi;

    //Station Name:
    //$(".shuffleStationLabelCurrent").find(".stationNameText").text().trim()

    trackInfo.action = 'notify';
    chrome.runtime.sendMessage(trackInfo,
        function(createdWindow) {
          console.log("notified!");
        });

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

    nt = new Notification(track, options);

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

    nt.onclick = noteClicked;

    timeOut = setTimeout(function() {
      nt.close();
    }, (toGo) * 1000);

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
  waitTilLoaded();
});