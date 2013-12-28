package controllers;

import play.libs.F;
import play.mvc.Controller;
import play.mvc.WebSocket;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class Application extends Controller {

    static Map<String, Set<WebSocket.Out<String>>> sockets = new HashMap<String, Set<WebSocket.Out<String>>>();

    public static WebSocket<String> connectToSocket(final String socket) {
    	WebSocket<String> sock = new WebSocket<String>() {
    		public void onReady(final WebSocket.In<String> in, final WebSocket.Out<String> out) {
                if (!sockets.containsKey(socket)) {
                    sockets.put(socket, new HashSet<Out<String>>());
                }

                sockets.get(socket).add(out);

                in.onMessage(new F.Callback<String>() {
    				public void invoke(String event) {
    					System.out.println("Input Received: " + event);
                        for (WebSocket.Out<String> output : sockets.get(socket)) {
                            System.out.println("\tForwarding message to: " + out);
                            output.write(event);
                        }
    				}
    			});

    			in.onClose(new F.Callback0() {
    				public void invoke() {
    					System.out.println("Socket Connection Closed.");
                        sockets.get(socket).remove(out);
    				}
    			});

    			out.write("Hello!");
    		}
    	};





        return sock;
    }
}
