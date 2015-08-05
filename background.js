// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
  Displays a notification with the current time. Requires "notifications"
  permission in the manifest file (or calling
  "Notification.requestPermission" beforehand).
*/
// function show() {
//   var time = /(..)(:..)/.exec(new Date());     // The prettyprinted time.
//   var hour = time[1] % 12 || 12;               // The prettyprinted hour.
//   var period = time[1] < 12 ? 'a.m.' : 'p.m.'; // The period of the day.
//   new Notification(hour + time[2] + ' ' + period, {
//     icon: '48.png',
//     body: 'Time to make the toast.'
//   });
// }

// // Conditionally initialize the options.
// if (!localStorage.isInitialized) {
//   localStorage.isActivated = true;   // The display activation.
//   localStorage.frequency = 1;        // The display frequency, in minutes.
//   localStorage.isInitialized = true; // The option initialization.
// }

// // Test for notification support.
// if (window.Notification) {
//   // While activated, show notifications at the display frequency.
//   if (JSON.parse(localStorage.isActivated)) { show(); }

//   var interval = 0; // The display interval, in minutes.

//   setInterval(function() {
//     interval++;

//     if (
//       JSON.parse(localStorage.isActivated) &&
//         localStorage.frequency <= interval
//     ) {
//       show();
//       interval = 0;
//     }
//   }, 60000);
// }

console.log("Welcome to Pandora!");

function ti () {
  this.name = "";
  this.artist = "";
  this.album = "";
  this.image = "";
}

function ti (name, artist, album, imgUrl) {
  this.name = name;
  this.artist = artist;
  this.album = album;
  this.image = imgUrl;
}

ti.prototype.equals = function (obj){
    return this.name == obj.name &&
           this.artist == obj.artist &&
           this.album == obj.album;

  }

function init(){
  setInterval(checkForSongChange, 750);
}

var trackInfo = new ti();

function checkForSongChange() {
  var newTi = new ti($(".playerBarSong")[0].text,
                     $(".playerBarArtist")[0].text,
                     $(".playerBarAlbum")[0].text,
                     $(".playerBarArt")[0].src);

  var time = $(".elapsedTime")[0].textContent.split(":");
  var elapsed = parseInt(time[0]) + parseInt(time[1]);
//http://www.pandora.com/img/no_album_art.png
  if (!trackInfo.equals(newTi) && elapsed > 0){
    trackInfo = newTi;

    var track  = trackInfo.name;
    var artist = trackInfo.artist;
    var album  = trackInfo.album;
    var image  = trackInfo.image;
    var nt = new Notification(track, {
        icon: image,
        body: 'by ' + artist + ' on ' + album,
    });

    // var options = {
    //   iconUrl: image,
    //   title: track,
    //   message: 'by ' + artist,
    //   contextMessage: ' on ' + album,
    //   buttons: [
    //     {
    //       tite: "Skip",
    //       iconUrl: "http://www.pandora.com/img/player-controls/btn_skip.png"
    //     },
    //     {
    //       tite: "Like",
    //       iconUrl: "http://www.pandora.com/img/player-controls/btn_up.png"
    //     }
    //   ],
    //   isClickable: true
    // }

    //var nt2 = chrome.notifications.create("PandoraApp", options, function () {});

    // nt2.onClicked = function () { nt2.close();};
    // setTimeout(function(){
    //     nt2.close();
    // },120000);

    nt.onclick = function () { nt.close();};
    setTimeout(function(){
        nt.close();
    },120000);

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
