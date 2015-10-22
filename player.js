var popupWin = null;
var firstTime = true;
var lastRequest = {};

chrome.runtime.onMessage.addListener(function(request, sender, pauseFunc) {
    console.log(request);
    chrome.storage.sync.get(null, function(o) {
        if (o.hasOwnProperty('alwaysShow')){
          localStorage.alwaysShow = o.alwaysShow;
        }
        if (o.hasOwnProperty('firstLoad')){
          localStorage.firstLoad = o.firstLoad;
        }
        if (o.hasOwnProperty('hasRated')){
          localStorage.hasRated = o.hasRated;
        }
    });

    if (request && request.action === 'notify') {
        var showTab = function(tab) {
            if (!tab || !tab.id) return;

            chrome.tabs.update(tab.id, {
                highlighted: true
            });

            if (!tab.windowId) return;
            chrome.windows.get(tab.windowId, function(win) {
                var options = {
                    focused: true
                }
                if (win.state === "minimized") {
                    options.state = "docked";
                }

                chrome.windows.update(tab.windowId, options);
            });
        };

        // var setPlayerOnTop = function(isOnTop){
        //     chrome.tabs.query({}, function(tabs) {
        //         var tab = null;
        //         for (var tInd in tabs) {
        //             if (tabs[tInd].url.indexOf("popout.html") > -1) {
        //                 tab = tabs[tInd];
        //                 break;
        //             }
        //         }
        //         if(tab){
        //             chrome.windows.update(tab.windowId, {alwaysOnTop: true});
        //         }
        //     });
        // };
        var updatePlayer = function() {
            var views = chrome.extension.getViews();
            if (views.length > 1) {
                var miniPlayerIndex = 0;
                var doc = views[miniPlayerIndex].document;
                while (miniPlayerIndex < views.length - 1 && !(doc.location.href.indexOf("popout.html") > -1)) {
                    doc = views[++miniPlayerIndex].document;
                }
                if (!(doc.location.href.indexOf("popout.html") > -1)) {
                    function addSeconds(str, sec, neg){
                        var time = parseInt(str.split(":")[0]) * (neg ? -60 : 60) + parseInt(str.split(":")[1]);
                        time += sec;
                        return String(Math.floor(time / 60)) + ':' + (time % 60 < 10 ? '0' : '') + String(time % 60);
                    }
                    setTimeout(function (){
                        request.remaining = "-" + addSeconds(request.remaining, -1, true);
                        request.elapsed = addSeconds(request.remaining, 1, false);
                        updatePlayer();
                    },1000);
                    return;
                }

                //doc.title = " ";
                var body = doc.body;
                doc.getElementById("albumImage").src = (request && request.image) ? request.image : "http://www.pandora.com/img/no_album_art.png";
                doc.getElementById("track").innerHTML = request.name;
                doc.getElementById("artist").innerHTML = request.artist;
                doc.getElementById("album").innerHTML = request.album;
                doc.getElementById("remainingTime").innerHTML = request.remaining;
                doc.getElementById("elapsedTime").innerHTML = request.elapsed;
                var $menu = $(doc).find("#menu");
                $menu.empty();
                request.stations.forEach(function(st, i){
                    $menu.append("<div class='" + (st.playing ? "playing" : "") + " " +
                                        (st.selected ? "selected" : "") + "''>" + 
                                        (request.stations[0].selected && i != 0 ?
                                            "<input type='checkbox' " +
                                            (st.checked ? "checked": "") + "/>" : "") + 
                                        "<a title=\"" + st.name + "\" value='" + i + "'>" +
                                        st.name + "</a><div>")
                });

                var sendMessage = function(action, callback) {
                    chrome.tabs.query({}, function(tabs) {
                        var tab = null;
                        for (var tInd in tabs) {
                            if (tabs[tInd].url.indexOf("pandora.com") > -1) {
                                tab = tabs[tInd];
                                break;
                            }
                        }
                        chrome.tabs.sendMessage(tab.id, action, function(status) {
                            callback(status, tab);
                        });
                    });
                };

                doc.getElementById("playButton").onclick = function() {
                    sendMessage("play", function(status) {
                        if (status === "ok") {
                            console.log("play request success!");
                            doc.getElementById("playButton").classList.add("hidden");
                            doc.getElementById("pauseButton").classList.remove("hidden");
                        }
                    });
                };
                doc.getElementById("pauseButton").onclick = function() {
                    sendMessage("pause", function(status) {
                        if (status === "ok") {
                            console.log("pause request success!");
                            doc.getElementById("pauseButton").classList.add("hidden");
                            doc.getElementById("playButton").classList.remove("hidden");
                        }
                    });
                };
                doc.getElementById("skipButton").onclick = function() {
                    sendMessage("skip", function(status) {
                        if (status === "ok") {
                            console.log("skip request success!");
                        }
                    });
                };
                doc.getElementById("likeButton").onclick = function() {
                    sendMessage("like", function(status) {
                        if (status === "ok") {
                            doc.getElementById("likeButton").classList.toggle("liked");
                            console.log("like song request success!");
                        }
                    });
                };
                doc.getElementById("dislikeButton").onclick = function() {
                    sendMessage("dislike", function(status) {
                        if (status === "ok") {
                            console.log("dislike song request success!");
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
                $(doc).find("#menu > div > a").click(function() {
                    sendMessage("changeStation-" + $(this).attr("value"), function(status) {
                    });
                });
                $(doc).find("#menu > div > input").change(function() {
                    sendMessage("addDropShuffleStation-" + $(this).parent().find("a").attr("value"), function(status) {
                    });
                });
                // $(doc.getElementById("showOnTop")).change(function () {
                //     setPlayerOnTop(this.checked);
                // });

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

                doc.getElementById("dislikeButton").classList.remove("dislike");
            }
        }

        var w = 300;
        var h = 320;
        var left = (screen.width) - (w);
        var top = (screen.height) - (h);
        var views = chrome.extension.getViews();
        var miniPlayerExists = views.length > 1;
        if (miniPlayerExists) {
            var miniPlayerIndex = 1;
            var doc = views[miniPlayerIndex].document;
            miniPlayerExists = (doc.location.href.indexOf("popout.html") > -1);
            while (!miniPlayerExists && miniPlayerIndex < views.length - 1) {
                doc = views[++miniPlayerIndex].document;
                miniPlayerExists = (doc.location.href.indexOf("popout.html") > -1);
            }
        }

        var showNow = ('showNow' in request) && request.showNow;
        if (!miniPlayerExists) {

            var alwaysShow = JSON.parse(localStorage.alwaysShow);
            var firstLoad = JSON.parse(localStorage.firstLoad);
            if (!(alwaysShow || (firstLoad && firstTime) || showNow)) {
                firstTime = false;
                return;
            }
            
            var url = 'popout.html?utm_campaign=fall';

            if (showNow){
                url += '&utm_medium=show_mini_player';
            }else{
                url += '&utm_medium=always_show';
            }

            if (firstTime){
                url += '&utm_source=create_first_time';
            }else {
                url += '&utm_source=reopen';
            }

            firstTime = false;

            chrome.windows.create({
                url: url,
                type: "popup",
                height: h,
                width: w,
                top: top,
                left: left
            }, function(win) {
                timeOut = setTimeout(function() {
                    updatePlayer();
                }, 50);
            });
        } else {
            updatePlayer();

            if (showNow){

                chrome.tabs.query({}, function(tabs) {
                    var tab = null;
                    for (var tInd in tabs) {
                        if (tabs[tInd].url.indexOf("popout.html") > -1) {
                            tab = tabs[tInd];
                            break;
                        }
                    }
                    showTab(tab);
                });
            }
        }
    }
});

//Add Page Action
chrome.runtime.onInstalled.addListener(function(details) {
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

    if (!localStorage.isInitialized) {
        localStorage.alwaysShow = false;
        localStorage.firstLoad = true;
        localStorage.hasRated = false;
    }

    if (details.reason == "update"){
        //first time/already installed
        chrome.storage.sync.get(null, function(o) {
            if(Object.keys(o).length == 0){
                chrome.storage.sync.set({
                    "alwaysShow": JSON.parse(localStorage.alwaysShow),
                    "firstLoad": JSON.parse(localStorage.firstLoad),
                    "hasRated": JSON.parse(localStorage.hasRated)
                }, function(o) {
                    localStorage.alwaysShow = o.alwaysShow;
                    localStorage.firstLoad = o.firstLoad;
                });
            //if given a rating
            }
            if (JSON.parse(localStorage.hasRated)){
                chrome.storage.sync.set({
                    "hasRated": true
                }, function(o) {});
            }
        });
    }else{
        chrome.storage.sync.get(null, function(o) {
            if(Object.keys(o).length == 0){
                chrome.storage.sync.set({
                    "alwaysShow": false,
                    "firstLoad": true,
                    "hasRated": false
                }, function(o) {
                    localStorage.alwaysShow = o.alwaysShow;
                    localStorage.firstLoad = o.firstLoad;
                });
            }
        });
    }
});