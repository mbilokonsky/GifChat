var sockets = require("./socket");

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
    .directive("videoChat", ["User", "Camera", function(User, Camera) {

        return {
            restrict: "E",
            scope: {
                session:"@"
            },
            templateUrl: "/partials/directives/video_chat_directive.html",
            link: function(scope, element) {
                var localVideoElements = element.find('video');
                var lv1 = localVideoElements[0];
                var lv2 = localVideoElements[1];
                var lv3 = localVideoElements[2];

                var rv1 = localVideoElements[3];
                var rv2 = localVideoElements[4];
                var rv3 = localVideoElements[5];


                if (Camera.stream) {
                    initializeRPC();
                } else {
                    Camera.register(initializeRPC);
                }

                var pc1;
                var pc2;

                function initializeRPC() {
                    lv1.src = Camera.streamUrl;
                    lv1.play();

                    lv2.src = Camera.streamUrl;
                    lv2.play();

                    lv3.src = Camera.streamUrl;
                    lv3.play();

                    console.log(Camera);

                    pc1 = new webkitRTCPeerConnection(
                        { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] }
                    );

                    pc2 = new webkitRTCPeerConnection(
                        { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] }
                    );

                    pc1.addStream(Camera.stream);
                    pc1.createOffer(gotDesc1, null, { mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true } });

                    function gotDesc1(desc) {
                        console.log("Got desc1: ")
                        console.log(desc);
                        pc1.setLocalDescription(desc);
                        pc2.setRemoteDescription(desc);
                        pc2.createAnswer(gotDesc2);
                    }

                    function gotDesc2(desc) {
                        console.log("Got desc2: ");
                        console.log(desc);
//                        pc1.setRemoteDescription(desc);
//                        pc2.setLocalDescription(desc);
                    }

                    pc2.onaddstream = function(e) {
                        console.log("Got stream in 2!");

                        var remoteSource = webkitURL.createObjectURL(e.stream);

                        rv1.src = remoteSource;
                        rv1.play();

                        rv2.src = remoteSource;
                        rv2.play();

                        rv3.src = remoteSource;
                        rv3.play();
                    }


                    /*
                    pc1.onaddstream = function(remoteStream) {
                        console.log("Remote stream was just added, wow.");
                        rv1.src = window.URL.createObjectURL(remoteStream);
                    };

                    pc1.onicecandidate = function(event) {
                        if (!pc1 || !event || !event.candidate) {
                            console.err("onicecandidate just gave me shit I don't know how to handle.");
                        }
                        console.log("So, onIceCandidate just fired.");
                        console.log(event);

                        var candidate = event.candidate;
                    }
                    */
                }





            },
            controller: ["$scope", function($scope) {
                $scope.createNewSession = function() {

                }

                $scope.joinExistingSession = function() {

                }
            }]

        };
    }])
    .directive("chat", ["SocketService", "Camera", "VideoShooter", "User", "$http", function ($SocketService, Camera, $VideoShooter, User, $http) {
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
                } else if (Camera.videoElement) {
                    shooter = new $VideoShooter(Camera.videoElement);
                    showPreview(Camera);
                } else {
                    Camera.register(function(videoElement) {
                        shooter = new $VideoShooter(videoElement);
                        showPreview(Camera);
                    });
                }


                function showPreview(camera) {
                    var video = element.find("video")[0];
                    video.src = camera.streamUrl;
                    video.play();
                }

                scope.messages = [];
                scope.socket = $SocketService.connect("foo");

                scope.socket.onmessage = function(e) {
                    scope.appendMessage(JSON.parse(e.data));
                    scope.$apply();
                };

                scope.appendMessage = function(message) {
                    scope.messages.push(message);
                    while (scope.messages.length > 30) {
                        scope.messages.shift();
                    }
                };

                var previousProgress = 0;
                function updateProgress(percent) {
                    if (percent == 1) {
                        previousProgress = 0;
                    }
                }

                scope.postNewMessage = function(message, callback) {
                    shooter.getShot(function(image) {
                        console.log("Shot taken, now posting!");
                        console.log("Posting message: " + message);
                        var img = image.substr(22);
                        $http.post("/upload", JSON.stringify({payload: img}))
                            .success(function(result) {
                                scope.socket.send(JSON.stringify({user: User.name, text: message, image: result.fileName}));
                                callback();
                            })
                            .error(function(err) {
                                console.err(err);
                                scope.socket.send(JSON.stringify({user: User.name, text: message, image: "/images/error.gif"}));
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
