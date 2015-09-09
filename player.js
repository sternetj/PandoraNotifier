var popupWin = null;
var firstTime = true;
var lastRequest = {};

if (!localStorage.isInitialized) {
    localStorage.alwaysShow = true;
    localStorage.firstLoad = false;
}

chrome.runtime.onMessage.addListener(function(request, sender, pauseFunc) {
    console.log(request);
    console.log(sender);
    if (request && request.action === 'notify') {

        var t = JSON.parse(localStorage.alwaysShow);
        var t2 = JSON.parse(localStorage.firstLoad);
        if (!(t || (t2 && firstTime))) {
            firstTime = false;
            return;
        }
        firstTime = false;

        var updatePlayer = function() {
            var views = chrome.extension.getViews();
            if (views.length > 1) {
                var miniPlayerIndex = 1;
                var doc = views[miniPlayerIndex].document;
                while (miniPlayerIndex < views.length - 1 && !(doc.location.href.indexOf("popout.html") > -1)) {
                    doc = views[++miniPlayerIndex].document;
                }
                if (!(doc.location.href.indexOf("popout.html") > -1)){
                    return;
                }
                //doc.title = " ";
                var body = doc.body;
                doc.getElementById("track").innerHTML = request.name;
                doc.getElementById("artist").innerHTML = request.artist;
                doc.getElementById("album").innerHTML = request.album;
                doc.getElementById("remainingTime").innerHTML = request.remaining;
                doc.getElementById("elapsedTime").innerHTML = request.elapsed;
                doc.getElementById("albumImage").src = (request && request.image) ? request.image : "http://www.pandora.com/img/no_album_art.png";

                var sendMessage = function(action, callback) {
                    var innerCallback = function(status) {
                        callback(status)
                    }
                    chrome.tabs.query({}, function(tabs) {
                        for (var tInd in tabs) {
                            chrome.tabs.sendMessage(tabs[tInd].id, action, function(status) {
                                callback(status, tabs[tInd]);
                            });
                        }
                    });
                }

                doc.getElementById("playButton").onclick = function() {
                    sendMessage("play", function(status) {
                        if (status === "ok") {
                            console.log("success!");
                            doc.getElementById("playButton").classList.add("hidden");
                            doc.getElementById("pauseButton").classList.remove("hidden");
                        }
                    });
                };
                doc.getElementById("pauseButton").onclick = function() {
                    sendMessage("pause", function(status) {
                        if (status === "ok") {
                            console.log("success!");
                            doc.getElementById("pauseButton").classList.add("hidden");
                            doc.getElementById("playButton").classList.remove("hidden");
                        }
                    });
                };
                doc.getElementById("skipButton").onclick = function() {
                    sendMessage("skip", function(status) {
                        if (status === "ok") {
                            console.log("success!");
                        }
                    });
                };
                doc.getElementById("likeButton").onclick = function() {
                    sendMessage("like", function(status) {
                        if (status === "ok") {
                            doc.getElementById("likeButton").classList.toggle("liked");
                            console.log("success!");
                        }
                    });
                };
                doc.getElementById("dislikeButton").onclick = function() {
                    sendMessage("dislike", function(status) {
                        if (status === "ok") {
                            console.log("success!");
                        }
                    });
                };
                doc.getElementById("track").onclick = function() {
                    sendMessage("seeSong", function(status) {
                        if (status === "ok") {
                            console.log("success!");
                        }
                    });
                };
                doc.getElementById("artist").onclick = function() {
                    sendMessage("seeArtist", function(status) {
                        if (status === "ok") {
                            console.log("success!");
                        }
                    });
                };
                doc.getElementById("album").onclick = function() {
                    sendMessage("seeAlbum", function(status, tab) {
                        if (status === "ok") {
                            console.log("success!");
                            chrome.tabs.update(tab.id, {
                                highlighted: true
                            });
                        }
                    });
                };

                if (request.isPlaying) {
                    doc.getElementById("playButton").classList.add("hidden");
                    doc.getElementById("pauseButton").classList.remove("hidden");
                } else {
                    doc.getElementById("pauseButton").classList.add("hidden");
                    doc.getElementById("playButton").classList.remove("hidden");
                }

                if (request.songIsLiked) {
                    doc.getElementById("likeButton").classList.add("liked");
                } else {
                    doc.getElementById("likeButton").classList.remove("liked");
                }
            }
        }
        var w = 300;
        var h = 320;
        var left = (screen.width) - (w);
        var top = (screen.height) - (h);
        var views = chrome.extension.getViews();
        miniPlayerExists = views.length > 1;
        if (miniPlayerExists) {
            var miniPlayerIndex = 1;
            var doc = views[miniPlayerIndex].document;
            miniPlayerExists = (doc.location.href.indexOf("popout.html") > -1);
            while (!miniPlayerExists && miniPlayerIndex < views.length - 1) {
                doc = views[++miniPlayerIndex].document;
                miniPlayerExists = (doc.location.href.indexOf("popout.html") > -1);
            }
        }
        if (!miniPlayerExists) {
            chrome.windows.create({
                url: 'popout.html',
                type: "popup",
                height: h,
                width: w,
                top: top + 19,
                left: left
            }, function(win) {
                timeOut = setTimeout(function() {
                    updatePlayer();
                }, 100);
            });
        } else {
            updatePlayer();
        }
    }
});

//Add Page Action
chrome.runtime.onInstalled.addListener(function() {
    // Replace all rules ...
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        // With a new rule ...
        chrome.declarativeContent.onPageChanged.addRules([{
            // That fires when a page's URL contains a 'g' ...
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        hostContains: '.pandora.'
                    },
                })
            ],
            // And shows the extension's page action.
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});