package de.deepamehta.plugins.topicmaps.model;

import de.deepamehta.core.model.Topic;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;



class TopicmapTopic extends Topic {

    TopicmapTopic(Topic topic) {
        super(topic);
    }

    @Override
    public JSONObject toJSON() throws JSONException {
        JSONObject o = super.toJSON();
        return o;
    }
}
