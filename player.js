var popupWin = null;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request);
    if (request && request.action === 'notify') {
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
        var sendMe = function () {
            sendResponse("test");
        }

        var updatePlayer = function() {
            var views = chrome.extension.getViews();
            if (views.length > 1) {
                var doc = views[views.length - 1].document;
                //doc.title = " ";
                var body = doc.body;
                body.style.backgroundImage = "url('" + request.image + "')";
                doc.getElementById("track").innerHTML = request.name;
                doc.getElementById("artist").innerHTML = request.artist;
                doc.getElementById("album").innerHTML = request.album;
                doc.getElementById("remainingTime").innerHTML = request.remaining;
                doc.getElementById("elapsedTime").innerHTML = request.elapsed;
                doc.getElementById("playButton").onclick = function() {
                    request.playButton.onclick.apply(request.playButton);
                };
                doc.getElementById("pauseButton").onclick = function() {
                    request.pauseButton.onclick.apply(request.pauseButton);
                };
                doc.getElementById("skipButton").onclick = function() {
                    request.skipButton.onclick.apply(request.skipButton);
                };

                if (request.isPlaying) {
                    doc.getElementById("playButton").classList.add("hidden");
                    doc.getElementById("pauseButton").classList.remove("hidden");
                } else {
                    doc.getElementById("pauseButton").classList.add("hidden");
                    doc.getElementById("playButton").classList.remove("hidden");
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
                }, 250);                
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