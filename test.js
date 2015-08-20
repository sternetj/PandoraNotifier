	var image = "ttp://www.pandora.com/img/player-controls/no_album_art.png";
	var track = "Test";
	var artist = "Teddy"
	var album = "Testing"
    var options = {
      iconUrl: image,
      title: track,
      message: 'by ' + artist,
      contextMessage: ' on ' + album,
      buttons: [
        {
          tite: "Skip",
          iconUrl: "http://www.pandora.com/img/player-controls/btn_skip.png"
        },
        {
          tite: "Like",
          iconUrl: "http://www.pandora.com/img/player-controls/btn_up.png"
        }
      ],
      isClickable: true
    }

    var nt2 = chrome.notifications.create("PandoraApp", options, function () {});

    nt2.onClicked = function () { nt2.close();};
    setTimeout(function(){
        nt2.close();
    },120000);