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
        var updatePlayer = function() {
            var views = chrome.extension.getViews();
            if (views.length > 1) {
                var doc = views[views.length - 1].document;
                doc.title = "";
                var body = doc.body;
                body.style.backgroundImage = "url('" + request.image + "')";
                doc.getElementById("track").innerHTML = request.name;
                doc.getElementById("artist").innerHTML = request.artist;
                doc.getElementById("album").innerHTML = request.album;
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
                updatePlayer();
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