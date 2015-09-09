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
var firstTime = true;

function sendMessage(callback) {
    isPlaying = $($(".pauseButton")[0]).is(":visible");
    trackInfo.action = 'notify';
    trackInfo.isPlaying = isPlaying;
    trackInfo.songIsLiked = $($(".thumbUpButton")[0]).hasClass("indicator");
    trackInfo.elapsed = $(".elapsedTime")[0].textContent;
    trackInfo.remaining = $(".remainingTime")[0].textContent;

    chrome.runtime.sendMessage(trackInfo, callback);
}

function init() {
    trackInfo = new ti();
    isPlaying = true;
    timeout = null;
    nt = null;
    checks = 0;
    timeOut = null;
    setInterval(checkForSongChange, 750);
    $(".pauseButton, .playButton, .skipButton, .thumbUpButton, .thumbDownButton").mouseup(function() {
        setTimeout(function() {
            sendMessage(function() {});
        }, 200);
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

    //http://www.pandora.com/img/no_album_art.png
    if (!trackInfo.equals(newTi) &&
        toGo > 0 && 
        (trackInfo.image != newTi.image ||
            (trackInfo.image == "http://www.pandora.com/img/no_album_art.png" && checks++ > 4)
        )
    ) {
        trackInfo = newTi;
        checks = 0;

        sendMessage(function() {});

        var track = trackInfo.name;
        var artist = trackInfo.artist;

        window.document.title = track + " by " + artist;

        //console.log("Next Song is: " + track);
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

waitTilLoaded();

chrome.runtime.onMessage.addListener(function(action, _, sendResponse) {
    if (action === "pause") {
        $(".pauseButton").click();
        sendResponse("ok");
    } else if (action === "play") {
        $(".playButton").click();
        sendResponse("ok");
    } else if (action === "like") {
        $(".thumbUpButton").click();
        sendResponse("ok");
    } else if (action === "dislike") {
        $(".thumbDownButton").click();
        sendResponse("ok");
    } else if (action === "skip") {
        $(".skipButton").click();
        sendResponse("ok");
    } else if (action === "seeSong") {
        $(".songTitle").click();
        sendResponse("ok");
    } else if (action === "seeArtist") {
        $(".artistSummary").click();
        sendResponse("ok");
    } else if (action === "seeAlbum") {
        $(".albumTitle").click();
        sendResponse("ok");
    } else {
        sendResponse("error: no action - " + action);
    }
});