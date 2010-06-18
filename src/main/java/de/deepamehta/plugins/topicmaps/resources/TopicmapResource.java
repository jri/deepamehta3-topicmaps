package de.deepamehta.plugins.topicmaps.resources;

import de.deepamehta.plugins.topicmaps.model.Topicmap;

import de.deepamehta.core.model.Topic;
import de.deepamehta.core.plugin.DeepaMehtaPlugin;
import de.deepamehta.core.service.DeepaMehtaService;
import de.deepamehta.core.util.JSONHelper;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.PUT;
import javax.ws.rs.POST;
import javax.ws.rs.DELETE;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.Consumes;
import javax.ws.rs.CookieParam;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Cookie;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;



@Path("/")
@Consumes("application/json")
@Produces("application/json")
public class TopicmapResource {

    private DeepaMehtaService dms = DeepaMehtaPlugin.getService();

    private Logger logger = Logger.getLogger(getClass().getName());

    @GET
    @Path("/{id}")
    public JSONObject getTopicmap(@PathParam("id") long id) throws JSONException {
        return new Topicmap(id, dms).toJSON();
    }



    // ***********************
    // *** Private Helpers ***
    // ***********************



}
