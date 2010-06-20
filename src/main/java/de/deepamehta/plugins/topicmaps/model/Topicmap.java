package de.deepamehta.plugins.topicmaps.model;

import de.deepamehta.core.model.RelatedTopic;
import de.deepamehta.core.model.Relation;
import de.deepamehta.core.model.Topic;
import de.deepamehta.core.service.DeepaMehtaService;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import static java.util.Arrays.asList;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;



public class Topicmap {

    private List<TopicmapTopic> topics = new ArrayList();
    private List<TopicmapRelation> relations = new ArrayList();

    private DeepaMehtaService dms;

    private Logger logger = Logger.getLogger(getClass().getName());

    // ---

    public Topicmap(long topicmapId, DeepaMehtaService dms) {
        this.dms = dms;
        logger.info("Loading topicmap " + topicmapId);
        //
        loadTopics(topicmapId);
        loadRelations(topicmapId);
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

    // ---

    private void loadTopics(long topicmapId) {
        List<RelatedTopic> relTopics = dms.getRelatedTopics(topicmapId, null, asList("TOPICMAP_TOPIC;INCOMING"), null);
        for (RelatedTopic relTopic : relTopics) {
            Relation refRelation = relTopic.getRelation();
            addTopic(new TopicmapTopic(relTopic.getTopic(), refRelation.properties, refRelation.id));
        }
    }

    private void loadRelations(long topicmapId) {
        List<RelatedTopic> relTopics = dms.getRelatedTopics(topicmapId, asList("Topicmap Relation Ref"),
                                                                        asList("RELATION;INCOMING"), null);
        for (RelatedTopic relTopic : relTopics) {
            Topic refTopic = relTopic.getTopic();
            long relationId = (Long) refTopic.getProperty("relation_id");
            addRelation(new TopicmapRelation(dms.getRelation(relationId), refTopic.id));
        }
    }
}
