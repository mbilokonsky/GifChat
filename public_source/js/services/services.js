var AnimatedGif = require("../../bower_components/animated-gif/src/Animated_GIF.js");
var gumHelper = require("../../bower_components/gumhelper/gumhelper.js");

angular.module("GifChat.services", [])
    .value("version", "0.1")
    .service("Camera", function() {
        var listeners = [];
        var camera = {
            videoElement: null,
            register: function(callback) {
                listeners.push(callback);
            }
        }

        gumHelper.startVideoStreaming(function(err, stream, videoElement, width, height) {
            if (err) {
                alert("Oh noes!");
                console.error(err);
                return;
            }

            videoElement.width = 160;
            videoElement.height = 120;

            camera.videoElement = videoElement;
            listeners.forEach(function(callback) {
                callback(camera.videoElement);
            });
        });

        return camera;
    })
    .service("VideoShooter", function() {
        return function(videoElement) {
            this.getShot = function(callback, numFrames, interval, progressCallback) {
                numFrames = numFrames !== undefined ? numFrames : 3;
                interval = interval !== undefined ? interval : 0.1;

                var pendingFrames = numFrames;
                var ag = new AnimatedGif({workerPath: '/js/worker.js'});
                ag.setSize(videoElement.videoWidth, videoElement.videoHeight);
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