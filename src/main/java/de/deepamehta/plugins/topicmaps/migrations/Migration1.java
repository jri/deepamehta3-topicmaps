package de.deepamehta.plugins.topicmaps.migrations;

import de.deepamehta.core.service.Migration;



public class Migration1 extends Migration {

    @Override
    public void run() throws Exception {
        readTypesFromFile("/types.json");
    }
}
