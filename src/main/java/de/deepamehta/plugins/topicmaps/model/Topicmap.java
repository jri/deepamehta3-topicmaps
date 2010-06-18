package de.deepamehta.plugins.topicmaps.model;

import de.deepamehta.core.model.RelatedTopic;
import de.deepamehta.core.service.DeepaMehtaService;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import static java.util.Arrays.asList;
import java.util.ArrayList;
import java.util.List;



public class Topicmap {

    private List<TopicmapTopic> topics = new ArrayList();
    private List<TopicmapRelation> relations = new ArrayList();

    private DeepaMehtaService dms;

    public Topicmap(long id, DeepaMehtaService dms) {
        this.dms = dms;
        List<RelatedTopic> relTopics = dms.getRelatedTopics(id, null, asList("TOPICMAP_TOPIC;INCOMING"), null);
        for (RelatedTopic relTopic : relTopics) {
            addTopic(new TopicmapTopic(relTopic.getTopic()));
        }
    }

    // ---

    void addTopic(TopicmapTopic topic) {
        topics.add(topic);
    }

    void addRelation(TopicmapRelation relation) {
        relations.add(relation);
    }

    // ---

    public JSONObject toJSON() throws JSONException {
        JSONArray topics = new JSONArray();
        for (TopicmapTopic topic : this.topics) {
            topics.put(topic.toJSON());
        }
        //
        JSONArray relations = new JSONArray();
        for (TopicmapRelation relation : this.relations) {
            relations.put(relation.toJSON());
        }
        //
        JSONObject topicmap = new JSONObject();
        topicmap.put("topics", topics);
        topicmap.put("relations", relations);
        return topicmap;
    }
}
