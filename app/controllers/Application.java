package controllers;

import play.libs.F;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.WebSocket;
import views.html.index;

public class Application extends Controller {

    public static Result index() {
        return ok(index.render("Your new application is ready."));
    }

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
