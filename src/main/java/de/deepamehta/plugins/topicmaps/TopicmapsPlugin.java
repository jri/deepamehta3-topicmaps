package de.deepamehta.plugins.topicmaps;

import de.deepamehta.core.model.Topic;
import de.deepamehta.core.model.Relation;
import de.deepamehta.core.plugin.DeepaMehtaPlugin;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;



public class TopicmapsPlugin extends DeepaMehtaPlugin {

    private Logger logger = Logger.getLogger(getClass().getName());



    // ************************
    // *** Overriding Hooks ***
    // ************************



    @Override
    public void providePropertiesHook(Topic topic) {
        if (topic.typeId.equals("Topicmap Relation Ref")) {
            Object relation_id = dms.getTopicProperty(topic.id, "relation_id");
            topic.setProperty("relation_id", relation_id);
        }
    }

    @Override
    public void providePropertiesHook(Relation relation) {
        if (relation.typeId.equals("TOPICMAP_TOPIC")) {
            // transfer all relation properties
            Map<String, Object> properties = dms.getRelation(relation.id).properties;
            for (String key : properties.keySet()) {
                relation.setProperty(key, properties.get(key));
            }
        }
    }
}
