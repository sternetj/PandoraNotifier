var popupWin = null;
chrome.runtime.onMessage.addListener(function(request, sender, pauseFunc) {
    console.log(request);
    console.log(sender);
    if (request && request.action === 'pause') {
        console.log("pause me please");
        request.pause();
    } else if (request && request.action === 'notify') {
        // var details = {
        //     iconUrl: request.image,
        //     title: request.name,
        //     type: 'list',
        //     message: '',
        //     items: [{
        //         title: "by",
        //         message: request.artist
        //     }, {
        //         title: "on",
        //         message: request.album
        //     }],
        //     buttons: [{
        //         title: 'Pause'
        //     }, {
        //         title: 'Skip'
        //     }],
        //     isClickable: true,
        //     priority: 2,
        // };

        var updatePlayer = function() {
            var views = chrome.extension.getViews();
            if (views.length > 1) {
                var doc = views[views.length - 1].document;
                //doc.title = " ";
                var body = doc.body;
                doc.getElementById("albumImage").src = request.image;
                doc.getElementById("track").innerHTML = request.name;
                doc.getElementById("artist").innerHTML = request.artist;
                doc.getElementById("album").innerHTML = request.album;
                doc.getElementById("remainingTime").innerHTML = request.remaining;
                doc.getElementById("elapsedTime").innerHTML = request.elapsed;

                var sendMessage = function(action, callback){
                    chrome.tabs.query({}, function(tabs) {
                        for (var tInd in tabs){
                            chrome.tabs.sendMessage(tabs[tInd].id, action, callback);
                        }                               
                    });
                }

                doc.getElementById("playButton").onclick = function() {
                    sendMessage( "play", function (status) {
                                if (status === "ok"){
                                    console.log("success!");
                                    doc.getElementById("playButton").classList.add("hidden");
                                    doc.getElementById("pauseButton").classList.remove("hidden");
                                }
                            });
                };
                doc.getElementById("pauseButton").onclick = function() {
                    sendMessage("pause", function (status) {
                                if (status === "ok"){
                                    console.log("success!");
                                    doc.getElementById("pauseButton").classList.add("hidden");
                                    doc.getElementById("playButton").classList.remove("hidden");
                                }
                            });
                };
                doc.getElementById("skipButton").onclick = function() {
                    sendMessage("skip", function (status) {
                                if (status === "ok"){
                                    console.log("success!");
                                }
                            });
                };
                doc.getElementById("likeButton").onclick = function() {
                    sendMessage("like", function (status) {
                                if (status === "ok"){
                                    doc.getElementById("likeButton").classList.toggle("liked");
                                    console.log("success!");
                                }
                            });
                };
                doc.getElementById("dislikeButton").onclick = function() {
                    sendMessage("dislike", function (status) {
                                if (status === "ok"){
                                    console.log("success!");
                                }
                            });
                };
                doc.getElementById("track").onclick = function() {
                    sendMessage("seeSong", function (status) {
                                if (status === "ok"){
                                    console.log("success!");
                                }
                            });
                };
                doc.getElementById("artist").onclick = function() {
                    sendMessage("seeArtist", function (status) {
                                if (status === "ok"){
                                    console.log("success!");
                                }
                            });
                };
                doc.getElementById("album").onclick = function() {
                    sendMessage("seeAlbum", function (status) {
                                if (status === "ok"){
                                    console.log("success!");
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

                if (request.songIsLiked){
                    doc.getElementById("likeButton").classList.add("liked");
                }else{
                    doc.getElementById("likeButton").classList.remove("liked");
                }
            }
        }
        var w = 300;
        var h = 300;
        var left = (screen.width) - (w);
        var top = (screen.height) - (h);
        if (chrome.extension.getViews().length <= 1) {
            chrome.windows.create({
                url: 'popout.html',
                type: "popup",
                height: h,
                width: w,
                top: top,
                left: left
            }, function(win) {
                timeOut = setTimeout(function() {
                    updatePlayer();
                }, 10);
            });
        } else {
            updatePlayer();
        }
    }
});
// var options = {
//   icon: image,
//   body: 'by ' + artist + '\r\non ' + album,
//   sticky: true
// };
// if (nt){
//   nt.close();
//   nt = null;
// }
// nt = new Notification(track, options);
// function ti(name, artist, album, imgUrl) {
//   this.name = name;
//   this.artist = artist;
//   this.album = album;
//   this.image = imgUrl;
// }