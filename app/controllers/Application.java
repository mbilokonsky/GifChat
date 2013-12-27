package controllers;

import play.libs.F;
import play.mvc.Controller;
import play.mvc.WebSocket;

public class Application extends Controller {

    public static WebSocket<String> connectToSocket(String socket) {
    	return new WebSocket<String>() {
    		public void onReady(WebSocket.In<String> in, WebSocket.Out<String> out) {
    			in.onMessage(new F.Callback<String>() {
    				public void invoke(String event) {
    					System.out.println("Input Received: " + event);
    				}
    			});

    			in.onClose(new F.Callback0() {
    				public void invoke() {
    					System.out.println("Socket Connection Closed.");	
    				}
    			});

    			out.write("Hello!");
    		}
    	};
    }
}
