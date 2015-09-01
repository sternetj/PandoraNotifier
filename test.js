var id = "PandoraNotification";
var priority = 2;
var setKeepAlive = false;
var pendingNotifications = {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        pendingNotifications = pendingNotifications ? pendingNotifications : {};

        /* Create a notification and store references
         * of its "re-spawn" timer and event-listeners */
        function createNotification(details, listeners, notifId) {
            (notifId !== undefined) || (notifId = "");
            chrome.notifications.create(notifId, details, function(id) {
                    console.log('Created notification "' + id + '" !');
                    if (pendingNotifications[id] !== undefined) {
                        clearTimeout(pendingNotifications[id].timer);
                    }

                    pendingNotifications[id] = {
                        priority: 2,
                        listeners: listeners,
                        timer: setTimeout(function() {
                                console.log('Re-spawning notification "' + id + '"...');
                                    chrome.notifications.update(id, {
                                            priority: priority++ % 2 + 1
                                        });
                                    // destroyNotification(id, function(wasCleared) {
                                    //     if (wasCleared) {
                                    //         createNotification(details, listeners, id);
                                    //     }
                                    // });
                                }, 10000)
                        };
                    });
            }

            /* Completely remove a notification, cancelling its "re-spawn" timer (if any)
             * Optionally, supply it with a callback to execute upon successful removal */
            function destroyNotification(notifId, callback) {

                /* Cancel the "re-spawn" timer (if any) */
                if (pendingNotifications[notifId] !== undefined) {
                    clearTimeout(pendingNotifications[notifId].timer);
                    delete(pendingNotifications[notifId]);
                }

                /* Remove the notification itself */
                chrome.notifications.clear(notifId, function(wasCleared) {
                    console.log('Destroyed notification "' + notifId + '" !');

                    /* Execute the callback (if any) */
                    callback && callback(wasCleared);
                });
            }

            /* Respond to the user's clicking one of the buttons */
            chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
                if (pendingNotifications[notifId] !== undefined) {
                    var handler = pendingNotifications[notifId].listeners.onButtonClicked;
                    destroyNotification(notifId, handler(btnIdx));
                }
            });

            /* Respond to the user's clicking on the notification message-body */
            chrome.notifications.onClicked.addListener(function(notifId) {
                if (pendingNotifications[notifId] !== undefined) {
                    var handler = pendingNotifications[notifId].listeners.onClicked;
                    destroyNotification(notifId, handler());
                }
            });

            /* Respond to the user's clicking on the small 'x' in the top right corner */
            chrome.notifications.onClosed.addListener(function(notifId, byUser) {
                if (pendingNotifications[notifId] !== undefined) {
                    var handler = pendingNotifications[notifId].listeners.onClosed;
                    destroyNotification(notifId, handler(byUser));
                }
            });


            console.log(request);
            if (request && request.action === 'notify') {
                id = !id ? "PandoraNotification" : id;
                priority = !priority ? 2 : priority;
                destroyNotification(id, function() {});
                var id = Math.random().toString(36).substring(7);
                var details = {
                    iconUrl: request.image,
                    title: request.name,
                    type: 'list',
                    message: '',
                    items: [{
                        title: "by",
                        message: request.artist
                    }, {
                        title: "on",
                        message: request.album
                    }],
                    buttons: [{
                        title: 'Pause'
                    }, {
                        title: 'Skip'
                    }],
                    isClickable: true,
                    priority: 2,
                };

                var listeners = {
                    onButtonClicked: function(btnIdx) {
                        if (btnIdx === 0) {
                            console.log(dateStr + ' - Clicked: "yes"');
                        } else if (btnIdx === 1) {
                            console.log(dateStr + ' - Clicked: "no"');
                        }
                    },
                    onClicked: function() {
                        console.log(dateStr + ' - Clicked: "message-body"');
                    },
                    onClosed: function(byUser) {
                        console.log(dateStr + ' - Closed: ' + (byUser ? 'by user' : 'automagically (!?)'));
                    }
                };

                /* Create the notification */
                createNotification(details, listeners, id);

                if (!setKeepAlive) {
                    setKeepAlive = true;
                    var keepAlive = function() {
                        chrome.notifications.update(id, {
                            priority: priority++ % 2 + 1
                        }, function() {});

                        console.log("updating priority");
                    }
                    setInterval(keepAlive, 500);
                }

                chrome.windows.create({
                    url: request.url
                }, function(win) {
                    sendResponse(win)
                });
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