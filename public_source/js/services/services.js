var AnimatedGif = require("../../bower_components/animated-gif/src/Animated_GIF.js");
require("../../bower_components/angular-gum/main.js");
require("../../bower_components/angular-socket/main.js");


angular.module("GifChat.services", ["myk.camera", "myk.videochat", "myk.sockets"])
    .value("version", "0.1")
    .service("VideoShooter", function() {
        return function(videoElement) {
            this.getShot = function(callback, numFrames, interval, progressCallback) {
                numFrames = numFrames !== undefined ? numFrames : 3;
                interval = interval !== undefined ? interval : 0.1;

                var pendingFrames = numFrames;
                var ag = new AnimatedGif({workerPath: '/js/worker.js'});
                ag.setSize(160, 120);
                ag.setDelay(interval);
                captureFrame();

                function captureFrame() {
                    ag.addFrame(videoElement);
                    pendingFrames--;

                    progressCallback((numFrames - pendingFrames) / numFrames);

                    if (pendingFrames > 0) {
                        setTimeout(captureFrame, interval * 1000);
                    } else {
                        ag.getBase64GIF(callback);

                    }
                }
            }
        }
    })
    .service("User", function() {
        var user = {
            name: "[anonymous]"
        };
        return user;
    });