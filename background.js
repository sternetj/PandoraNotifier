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

function sendMessage(callback, showPlayer) {
    isPlaying = $($(".pauseButton")[0]).is(":visible");
    trackInfo.action = 'notify';
    if (showPlayer){
        trackInfo.showNow = true;
    }
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

function addMiniPlayerButton(){
        //Add mini-player button
    var css = '\
        .miniplayer_icon:hover {\
            color: #fff;\
            text-decoration: underline;\
        }\
\
        .miniplayer_icon {\
            width: 51px;\
            height: 20px;\
            cursor: pointer;\
            font-size: 12px;\
            font-weight: normal;\
            color: #d6deea;\
            padding-top: 6px;\
            white-space: nowrap;\
        }\
\
        .miniplayer_icon > svg {\
            cursor: pointer;\
            display: inline-block;\
            margin-right: 4px;\
            color:#d6deea;\
            fill:#C2CBDA;\
            vertical-align: text-bottom;\
        }\
\
        .miniplayer_icon:hover > svg {\
            fill: #d6deea;\
        }\
\
        .miniplayer {\
            padding: 0 20px 0 4px;\
            float: left;\
            line-height:15px;\
            height:15px;\
        }\
    ',
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');

    style.type = 'text/css';
    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
    var showPlayerButton = '<div class="miniplayer"><div class="miniplayer_icon"><svg viewBox="0 0 24 24" height="15px" width="15px" preserveAspectRatio="xMidYMid meet" fit=""><g><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path></g></svg>Show Mini-Player</div></div>'
    $(".myprofile").after(showPlayerButton);

    $(".miniplayer").mouseup(function() {
        setTimeout(function() {
            sendMessage(function() {}, true);
        }, 200);
    });
}

var buttonLoaded = false;
function waitTilLoaded() {
    setTimeout(
        function() {
            if(!buttonLoaded && $(".myprofile").length > 0){
                addMiniPlayerButton();
                buttonLoaded = true;
            }
            if ($(".songTitle").length <= 0 || !($(".songTitle")[0].text)) {
                waitTilLoaded();
            } else {
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