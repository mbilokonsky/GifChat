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

    static Map<String, Set<WebSocket.Out<String>>> sockets = new HashMap<String, Set<WebSocket.Out<String>>>();

    @BodyParser.Of(value = BodyParser.Json.class, maxLength = 1000000 * 1024)
    public static Result uploadImage() throws InterruptedException {
        String fileGuid = UUID.randomUUID().toString();
        String fileName = "public/images/" + fileGuid + ".gif";

        byte[] ba = Base64.decode(request().body().asJson().get("payload").asText());

        try {
            FileOutputStream fos = new FileOutputStream(new File(fileName));
            fos.write(ba);
            fos.flush();
            fos.close();
        } catch(Exception e) {
            return internalServerError(e.toString());
        }

        return ok("{\"fileName\":\"/images/" + fileGuid + ".gif\"}");
    }

    public static WebSocket<String> connectToSocket(final String socket) {
    	WebSocket<String> sock = new WebSocket<String>() {
    		public void onReady(final WebSocket.In<String> in, final WebSocket.Out<String> out) {
                if (!sockets.containsKey(socket)) {
                    sockets.put(socket, new HashSet<Out<String>>());
                }

                sockets.get(socket).add(out);

                in.onMessage(new F.Callback<String>() {
    				public void invoke(String event) {
    					for (WebSocket.Out<String> output : sockets.get(socket)) {
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

    			out.write("{\"user\": \"[server]\", \"text\": \"hello!\", \"image\":\"/images/server.gif\"}");
    		}
    	};

        return sock;
    }
}
