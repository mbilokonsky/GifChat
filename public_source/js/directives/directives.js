var sockets = require("./socket");
var gumHelper = require("../../bower_components/gumhelper/gumhelper.js");
var AnimatedGif = require("../../bower_components/animated-gif/src/Animated_GIF.js");
var $ = require("../../bower_components/jquery/jquery.min.js");


angular.module("GifChat.directives", [])
    .factory("SocketService", function() {
        return sockets;
    })
    .directive("chat", ["SocketService", function ($SocketService) {
        return {
            restrict: "E",
            scope: {},
            templateUrl: "/partials/chat.html",
            replace: true,
            link: function(scope, element) {
                // first, initialize video feed.
                var videoFeed;
                gumHelper.startVideoStreaming(function(err, stream, videoElement, width, height) {
                    if (err) {
                        alert("Oh noes!");
                        console.error(err);
                        return;
                    }

                    addVideo(videoElement);
                });

                function addVideo(videoElement) {
                    videoFeed = videoElement;
                    $(element.children()[3]).append(videoElement);
                }

                scope.messages = [];
                scope.socket = $SocketService.connect("foo");

                scope.socket.onmessage = function(e) {
                    console.log("Woo:");
                    console.log(e);
                    scope.appendMessage(e.data);
                    scope.$apply();
                };

                scope.appendMessage = function(message) {
                    scope.messages.push(message);
                };

                scope.postNewMessage = function(message, callback) {
                    var ag = new AnimatedGif( {
                        workerPath: '/js/worker.js'
                    });

                    ag.setSize(320, 240);
                    var pending_frames = 10;
                    captureFrame();

                    function captureFrame() {
                        if (videoFeed) {
                            console.log("Adding a frame...");
                            ag.addFrame(videoFeed);
                            pending_frames--;
                        }

                        if (pending_frames > 0) {
                            setTimeout(captureFrame, 100);
                        } else {
                            ag.getBase64GIF(function(image) {
                                var img = document.createElement("img");
                                img.src = image;
                                element.append(img);
                                console.log("Image composed and appended!");

                                console.log("Now posting message!");
                                scope.socket.send(message);

                                console.log("Now executing callback:");
                                callback();
                            });
                        }
                    }
                };

                scope.appendMessage("---> You just joined the chat!");
            },
            controller: ["$scope", function($scope) {
                $scope.submit = function() {
                    $scope.postNewMessage($scope.messageToSend, function(err) {
                        if (err) {
                            // TODO
                        }
                        $scope.messageToSend = "";
                    });

                }
            }]
        }
    }]);
