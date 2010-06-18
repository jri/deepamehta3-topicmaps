package de.deepamehta.plugins.topicmaps.model;

import de.deepamehta.core.model.Relation;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;



class TopicmapRelation extends Relation {

    TopicmapRelation(Relation relation) {
        super(relation);
    }

    @Override
    public JSONObject toJSON() throws JSONException {
        JSONObject o = super.toJSON();
        return o;
    }
}
