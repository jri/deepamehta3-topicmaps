package de.deepamehta.plugins.topicmaps.model;

import de.deepamehta.core.model.Topic;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import java.util.Map;



class TopicmapTopic extends Topic {

    private Map visualizationProperties;
    private long refId;

    TopicmapTopic(Topic topic, Map visualizationProperties, long refId) {
        super(topic);
        this.visualizationProperties = visualizationProperties;
        this.refId = refId;
    }

    @Override
    public JSONObject toJSON() throws JSONException {
        JSONObject o = super.toJSON();
        o.put("visualization", visualizationProperties);
        o.put("ref_id", refId);
        return o;
    }
}
