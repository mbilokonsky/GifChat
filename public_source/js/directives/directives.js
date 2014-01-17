var sockets = require("./socket");
require("../../bower_components/angular-video-chat/main.js");

angular.module("GifChat.directives", [])
    .factory("SocketService", function() {
        return sockets;
    })
    .directive("navbar", [function() {
        return {
            restrict: "E",
            scope: {},
            replace: true,
            templateUrl: "/partials/directives/navbar_directive.html",
            link: function(scope, element) {

            },
            controller: ["$scope", "User", function($scope, User) {
                console.log("NavController initialized!");
                $scope.user = User;
                $scope.logout = function() {
                    User.name = "[anonymous]";
                }
            }]
        };
    }])
    .directive("messageRenderer", [function() {
        return {
            restrict: "E",
            scope: {
                message: "="
            },
            templateUrl: "/partials/directives/message_renderer_directive.html",
            link: function(scope, element) {
                var img = document.createElement("img");
                img.src = scope.message.image;
                img.width = 160;
                img.height = 120;

                element.prepend(img);
                // this would be a good place to dispatch a notification!
            },
            controller: ["$scope", function($scope) {

            }]
        }
    }])
    .directive("videoChat", ["VideoChat", function(VideoChat) {

        return {
            restrict: "E",
            scope: {
                session:"@"
            },
            templateUrl: "/partials/directives/video_chat_directive.html",
            link: function(scope, element) {
                scope.status = "dormant";
                var localVideoElements = element.find('video');
                var lv1 = localVideoElements[0];
                var rv1 = localVideoElements[1];

                var socketURL = "ws://" + window.location.host + "/videoSocket/" + scope.session;
                console.log("Connecting to websocket: " + socketURL);
                var vs = new WebSocket(socketURL);

                scope.status = "initializing";

                vs.onopen = function() {
                    console.log("Connected to video socket!");
                    scope.status = "connected, waiting for peer";
                    scope.$apply();
                    VideoChat(lv1, rv1, vs);
                };

            }
        };
    }])
    .directive("chat", ["Socket", "Camera", "VideoShooter", "User", "$http", function (Socket, Camera, $VideoShooter, User, $http) {
        var shooter;
        return {
            restrict: "E",
            scope: {},
            templateUrl: "/partials/directives/chat_directive.html",
            replace: true,
            link: function(scope, element) {
                // first, initialize video feed.

                if (shooter) {
                    showPreview(Camera);
                } else {
                    Camera.register(function() {
                        shooter = new $VideoShooter(Camera.videoElement);
                        showPreview(Camera);
                    });
                }


                function showPreview(camera) {
                    var video = element.find("video")[0];
                    video.src = camera.streamUrl;
                    video.play();
                }

                scope.messages = [];
                var socket = Socket.register("ws://" + window.location.host + "/socket/foo", {
                    onopen: function(e) {
                        console.log("Socket connection initialized.");
                    },
                    onmessage: function(e) {
                        scope.appendMessage(JSON.parse(e.data));
                        scope.$apply();
                    },
                    onclose: function(e) {
                        console.log("socket connection closed.");
                    }
                });

                scope.appendMessage = function(message) {
                    scope.messages.push(message);
                    while (scope.messages.length > 30) {
                        scope.messages.shift();
                    }

                    updateScrolling();
                };

                function updateScrolling() {
                    // TODO update scroll position
                }

                var previousProgress = 0;
                function updateProgress(percent) {
                    if (percent == 1) {
                        previousProgress = 0;
                    }
                }

                scope.postNewMessage = function(message, callback) {
                    shooter.getShot(function(image) {
                        var img = image.substr(22);
                        $http.post("/upload", JSON.stringify({payload: img}))
                            .success(function(result) {
                                socket.send(JSON.stringify({user: User.name, text: message, image: result.fileName}));
                                callback();
                            })
                            .error(function(err) {
                                console.err(err);
                                socket.send(JSON.stringify({user: User.name, text: message, image: "/images/error.gif"}));
                            });
                    }, 10, 0.2, updateProgress);
                };

                scope.appendMessage({user: "[root]", text: "---> You're in the chat now, be prepared!", image: "/images/local.gif"});
            },
            controller: ["$scope", function($scope) {
                $scope.inputEnabled = true;
                $scope.submit = function() {

                    $scope.inputEnabled = false;
                    $scope.postNewMessage($scope.messageToSend, function(err) {
                        if (err) {
                            // TODO
                        }
                        $scope.inputEnabled = true;
                    });
                    $scope.messageToSend = "";



                }
            }]
        }
    }]);
