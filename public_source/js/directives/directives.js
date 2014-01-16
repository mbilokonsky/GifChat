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
                scope.status = "dormant";
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

                var pc;
                var isInitiator = false;
                var isRunning = false;

                function initializeRPC() {
                    var socketURL = "ws://" + window.location.host + "/videoSocket/" + scope.session;
                    console.log("Connecting to websocket: " + socketURL);
                    var vs = new WebSocket(socketURL);

                    lv1.src = Camera.streamUrl;
                    lv1.play();

                    lv2.src = Camera.streamUrl;
                    lv2.play();

                    lv3.src = Camera.streamUrl;
                    lv3.play();

                    scope.status = "initializing";

                    vs.onopen = function(event) {
                        console.log("Connected to video socket!");
                        scope.status = "connected, waiting for peer";
                        scope.$apply();
                    };


                    vs.onmessage = function(event) {
                        var message = JSON.parse(event.data);

                        console.log("Message received from video socket server: [" + message.action + "]");

                        if (message.action == "handshake") {
                            isInitiator = message.initiate;
                            scope.status = "peer found, ready to chat!";
                            scope.ready = true;
                            scope.$apply();

                            initPC();
                        } else if (message.action == "ice") {
                            try {
                                var candidate = new RTCIceCandidate({
                                    sdpMLineIndex: message.label,
                                    candidate: message.candidate
                                })
                                pc.addIceCandidate(candidate);
                            } catch (ex) {
                                console.error("Error setting ice: " + ex);
                            }

                        } else if (message.action == "desc") {
                            // initialize if you haven't done that yet
                            console.log(message.desc);

                            try {
                                pc.setRemoteDescription(new RTCSessionDescription(message.desc));
                            } catch (ex) {
                                console.error("Error setting desc: " + ex);
                            }

                            if (!isInitiator) {
                                doAnswer();
                            }
                        } else if (message.action == "end") {
                            scope.status = "chat terminated."
                            scope.$apply();
                            isRunning = false;
                        } else if (message.action == "error") {
                            console.error(message);
                        } else if (message.action == "ready" && isInitiator) {
                            console.log("OK remote peer is ready, time to start!");
                            startVideoChat();
                        }
                    };

                    function doCall() {
                        pc.createOffer(setLocalAndSendMessage, null, { mandatory: { OfferToReceiveVideo: true } });
                    }

                    function doAnswer() {
                        pc.createAnswer(setLocalAndSendMessage, null, { mandatory: { OfferToReceiveVideo: true } });
                    }

                    function setLocalAndSendMessage(desc) {
                        console.log("Got desc1: ")
                        console.log(desc);
                        pc.setLocalDescription(new RTCSessionDescription(desc));
                        vs.send(JSON.stringify({action: "desc", desc: desc}));
                    }

                    function initPC() {
                        pc = new webkitRTCPeerConnection({"iceServers": [{"url": "stun:stun.l.google.com:19302"}]});
                        pc.addStream(Camera.stream);

                        pc.onicecandidate = function(e) {
                            if (e.candidate) {
                                vs.send(JSON.stringify({
                                    action: "ice",
                                    label: e.candidate.sdpMLineIndex,
                                    candidate: e.candidate.candidate
                                }));
                            }
                        }

                        pc.onconnecting = function(e) {
                            console.log("peer connecting!");
                        }

                        pc.onopen = function(e) {
                            console.log("Video chat session opened.");
                        }

                        pc.onaddstream = function(e) {
                            console.log("Wow, a remote video stream came through!");
                            var url = webkitURL.createObjectURL(e.stream);

                            rv1.src = url;
                            rv1.play();

                            rv2.src = url;
                            rv2.play();

                            rv3.src = url;
                            rv3.play();

                        }

                        pc.onremovestream = function(e) {
                            console.log("A remote video stream was removed.");
                        }

                        vs.send(JSON.stringify({action: "ready"}));
                    }

                    function startVideoChat() {
                        if (isInitiator) {
                            doCall();
                        }
                    };
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
