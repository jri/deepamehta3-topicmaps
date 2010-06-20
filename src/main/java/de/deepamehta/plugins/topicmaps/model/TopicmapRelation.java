package de.deepamehta.plugins.topicmaps.model;

import de.deepamehta.core.model.Relation;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;



class TopicmapRelation extends Relation {

    private long refId;

    TopicmapRelation(Relation relation, long refId) {
        super(relation);
        this.refId = refId;
    }

    @Override
    public JSONObject toJSON() throws JSONException {
        JSONObject o = super.toJSON();
        o.put("ref_id", refId);
        return o;
    }
}
