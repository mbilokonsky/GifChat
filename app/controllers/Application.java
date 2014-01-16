package controllers;

import com.sun.org.apache.xerces.internal.impl.dv.util.Base64;
import play.libs.F;
import play.mvc.BodyParser;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.WebSocket;

import java.io.File;
import java.io.FileOutputStream;
import java.util.*;

public class Application extends Controller {

    @BodyParser.Of(value = BodyParser.Json.class, maxLength = 1000000 * 1024)
    public static Result uploadImage() throws InterruptedException {
        String fileGuid = UUID.randomUUID().toString();
        String fileName = "gifs/" + fileGuid + ".gif";

        byte[] ba = Base64.decode(request().body().asJson().get("payload").asText());

        try {
            FileOutputStream fos = new FileOutputStream(new File(fileName));
            fos.write(ba);
            fos.flush();
            fos.close();
            System.out.println("Saved a file!");
        } catch(Exception e) {
            return internalServerError(e.toString());
        }
        return ok("{\"fileName\":\"" + fileName + "\"}");
    }

    public static Result loadImage(String name) {
        File file = new File("gifs/" + name);
        return ok(file);
    }

    static Map<String, Set<WebSocket.Out<String>>> chatSockets = new HashMap<String, Set<WebSocket.Out<String>>>();
    public static WebSocket<String> connectToSocket(final String socket) {
    	WebSocket<String> sock = new WebSocket<String>() {
    		public void onReady(final WebSocket.In<String> in, final WebSocket.Out<String> out) {
                if (!chatSockets.containsKey(socket)) {
                    chatSockets.put(socket, new HashSet<Out<String>>());
                }

                chatSockets.get(socket).add(out);

                in.onMessage(new F.Callback<String>() {
    				public void invoke(String event) {
    					for (WebSocket.Out<String> output : chatSockets.get(socket)) {
                            output.write(event);
                        }
    				}
    			});

    			in.onClose(new F.Callback0() {
    				public void invoke() {
    					System.out.println("Socket Connection Closed.");
                        chatSockets.get(socket).remove(out);
    				}
    			});

    			out.write("{\"user\": \"[server]\", \"text\": \"hello!\", \"image\":\"/images/server.gif\"}");
    		}
    	};

        return sock;
    }

    static Map<String, VideoConversation> videoSockets = new HashMap<String, VideoConversation>();
    public static WebSocket<String> connectToVideoSocket(final String channel) {
        System.out.println("OK, video socket connected!");

        WebSocket<String> socket = new WebSocket<String>() {
            @Override
            public void onReady(final In<String> in, final Out<String> out) {
                if (!videoSockets.containsKey(channel)) {
                    System.out.println("Initializing channel " + channel);
                    videoSockets.put(channel, new VideoConversation(channel, out, in));
                    return;
                }

                try {
                    videoSockets.get(channel).join(out, in);
                } catch (VideoConversation.ConversationFullException e) {
                    out.write("{\"action\":\"error\", \"payload\": \"Channel is already full.\"");
                }
            }
        };

        return socket;
    }

    private static class VideoConversation {
        final public String channel;
        final public WebSocket.Out<String> hostOut;
        final public WebSocket.In<String> hostIn;

        public WebSocket.Out<String> guestOut;
        public WebSocket.In<String> guestIn;

        public boolean isFull = false;

        public VideoConversation(String channel, WebSocket.Out<String> hostOut, WebSocket.In<String> hostIn) {
            this.channel = channel;
            this.hostOut = hostOut;
            this.hostIn = hostIn;
            System.out.println("Initialized front half of video chat!");
        }

        public void join(WebSocket.Out<String> guestOut, WebSocket.In<String> guestIn) throws ConversationFullException {
            if (isFull) {
                throw new ConversationFullException();
            }

            this.guestOut = guestOut;
            this.guestIn = guestIn;
            this.isFull = true;
            handshake();
        }

        public void end() {
            System.out.println("Now terminating conversation.");
            hostOut.write("{\"action\" : \"end\"}");
            guestOut.write("{\"action\" : \"end\"}");
        }

        private void handshake() {
            hostIn.onMessage(new F.Callback<String>() {
                @Override
                public void invoke(String s) throws Throwable {
                    guestOut.write(s);
                }
            });

            guestIn.onMessage(new F.Callback<String>() {

                @Override
                public void invoke(String s) throws Throwable {
                    hostOut.write(s);
                }
            });

            hostOut.write("{\"action\":\"handshake\", \"initiate\": true}");
            guestOut.write("{\"action\":\"handshake\", \"initiate\": false}");

//            hostOut.write("{\"action\":\"accept\", \"icecandidate\": " + guestDesc.toString() + "}");
//            guestOut.write("{\"action\":\"offer\", \"icecandidate\": " + hostDesc.toString() + "}");
        }

        private class ConversationFullException extends Throwable {
            public ConversationFullException() {
                super("Conversation full!");
            }
        }
    }
}
