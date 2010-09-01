package de.deepamehta.plugins.topicmaps.resources;

import de.deepamehta.plugins.topicmaps.model.Topicmap;

import de.deepamehta.core.model.Topic;
import de.deepamehta.core.model.Relation;
import de.deepamehta.core.service.CoreService;
import de.deepamehta.core.service.Plugin;
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

    private CoreService dms = Plugin.getService();

    private Logger logger = Logger.getLogger(getClass().getName());

    @GET
    @Path("/{id}")
    public JSONObject getTopicmap(@PathParam("id") long topicmapId) throws JSONException {
        return new Topicmap(topicmapId, dms).toJSON();
    }

    @PUT
    @Path("/{id}")
    public JSONObject addItemToTopicmap(@PathParam("id") long topicmapId, JSONObject item) throws JSONException {
        if (item.has("topic_id")) {
            long topicId = item.getLong("topic_id");
            int x = item.getInt("x");
            int y = item.getInt("y");
            long refId = addTopicToTopicmap(topicId, x, y, topicmapId);
            JSONObject response = new JSONObject();
            response.put("ref_id", refId);
            return response;
        } else if (item.has("relation_id")) {
            long relationId = item.getLong("relation_id");
            long refId = addRelationToTopicmap(relationId, topicmapId);
            JSONObject response = new JSONObject();
            response.put("ref_id", refId);
            return response;
        } else {
            throw new IllegalArgumentException("item does not contain a relation reference");
        }
    }

    @DELETE
    @Path("/{id}")
    public void removeItemFromTopicmap(@PathParam("id") long topicmapId, JSONObject item) throws JSONException {
        if (item.has("relation_id")) {
            long refTopicId = item.getLong("ref_id");
            removeRelationFromTopicmap(refTopicId);
        } else {
            throw new IllegalArgumentException("item does not contain a relation reference");
        }
    }



    // ***********************
    // *** Private Helpers ***
    // ***********************



    private long addTopicToTopicmap(long topicId, int x, int y, long topicmapId) {
        Map properties = new HashMap();
        properties.put("x", x);
        properties.put("y", y);
        properties.put("visibility", true);
        Relation refRel = dms.createRelation("TOPICMAP_TOPIC", topicmapId, topicId, properties);
        return refRel.id;
    }

    private long addRelationToTopicmap(long relationId, long topicmapId) {
        // TODO: do this in a transaction. Extend the core service to let the caller begin a transaction.
        Map properties = new HashMap();
        properties.put("de/deepamehta/core/property/RelationID", relationId);
        Topic refTopic = dms.createTopic("de/deepamehta/core/topictype/TopicmapRelationRef", properties, null);
        dms.createRelation("RELATION", topicmapId, refTopic.id, null);
        return refTopic.id;
    }

    /**
     * @param   refTopicId  ID of the "Topicmap Relation Ref" topic of the relation to remove.
     */
    private void removeRelationFromTopicmap(long refTopicId) {
        dms.deleteTopic(refTopicId);
    }
}
