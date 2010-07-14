function dm3_topicmaps() {

    css_stylesheet("/de.deepamehta.3-topicmaps/style/dm3-topicmaps.css")

    var LOG_TOPICMAPS = false

    var topicmaps = {}  // Loaded topicmaps (key: topicmap ID, value: Topicmap object)
    var topicmap        // Selected topicmap (Topicmap object)



    /**************************************************************************************************/
    /**************************************** Overriding Hooks ****************************************/
    /**************************************************************************************************/



    this.init = function() {

        extend_rest_client()

        var topicmaps = get_all_topicmaps()
        create_default_topicmap()
        create_topicmap_menu()
        create_topicmap_dialog()
        load_topicmap()

        function extend_rest_client() {
            dmc.get_topicmap = function(topicmap_id) {
                return this.request("GET", "/topicmap/" + topicmap_id)
            }
            dmc.add_topic_to_topicmap = function(topic_id, x, y, topicmap_id) {
                return this.request("PUT", "/topicmap/" + topicmap_id, {topic_id: topic_id, x: x, y: y})
            }
            dmc.add_relation_to_topicmap = function(relation_id, topicmap_id) {
                return this.request("PUT", "/topicmap/" + topicmap_id, {relation_id: relation_id})
            }
            dmc.remove_relation_from_topicmap = function(relation_id, ref_id, topicmap_id) {
                return this.request("DELETE", "/topicmap/" + topicmap_id, {relation_id: relation_id, ref_id: ref_id})
            }
        }

        function create_default_topicmap() {
            if (!topicmaps.length) {
                create_topicmap("untitled")
                topicmaps = get_all_topicmaps()
            }
        }

        function create_topicmap_menu() {
            var topicmap_label = $("<span>").attr("id", "topicmap-label").text("Topicmap")
            var topicmap_menu = $("<div>").attr("id", "topicmap-menu")
            var topicmap_form = $("<div>").attr("id", "topicmap-form").append(topicmap_label).append(topicmap_menu)
            $("#workspace-form").after(topicmap_form)   // TODO: make topicmaps plugin independant from workspace plugin
            ui.menu("topicmap-menu", topicmap_selected)
            rebuild_topicmap_menu(topicmaps)
        }

        function create_topicmap_dialog() {
            var topicmap_dialog = $("<div>").attr("id", "topicmap_dialog")
            var input = $("<input>").attr({id: "topicmap_name", size: 30})
            topicmap_dialog.append("Title:")
            topicmap_dialog.append($("<form>").attr("action", "#").submit(do_create_topicmap).append(input))
            $("body").append(topicmap_dialog)
            $("#topicmap_dialog").dialog({modal: true, autoOpen: false, draggable: false, resizable: false, width: 350,
                title: "New Topicmap", buttons: {"OK": do_create_topicmap}})
        }

        function load_topicmap() {
            select_topicmap(get_topicmap_id())
        }
    }

    /**
     * @param   topic   a CanvasTopic object
     */
    this.post_add_topic_to_canvas = function(topic) {
        var pos = topicmap.show_topic(topic.id, topic.type, topic.label, topic.x, topic.y)
        // restore topic position if topic was already contained in this topicmap but hidden
        if (pos) {
            topic.move_to(pos.x, pos.y)
        }
    }

    /**
     * @param   relation   a CanvasAssoc object
     */
    this.post_add_relation_to_canvas = function(relation) {
        topicmap.add_relation(relation.id, relation.doc1_id, relation.doc2_id)
    }

    /**
     * @param   topic   a CanvasTopic object
     */
    this.post_hide_topic_from_canvas = function(topic) {
        topicmap.hide_topic(topic.id)
    }

    /**
     * @param   relation   a CanvasAssoc object
     */
    this.post_remove_relation_from_canvas = function(relation) {
        topicmap.remove_relation(relation.id)
    }

    /**
     * @param   topic   a CanvasTopic object
     */
    this.post_move_topic_on_canvas = function(topic) {
        topicmap.move_topic(topic.id, topic.x, topic.y)
    }

    this.post_set_topic_label = function(topic_id, label) {
        if (LOG_TOPICMAPS) log("Setting label of topic " + topic_id + " to \"" + label + "\"")
        for (var id in topicmaps) {
            var topic = topicmaps[id].get_topic(topic_id)
            if (topic) {
                topic.label = label
            }
        }
    }

    /**
     * @param   topic   a Topic object
     */
    this.post_delete_topic = function(topic) {
        // 1) Possibly remove topic from all topicmap models 
        if (LOG_TOPICMAPS) log("Deleting topic " + topic.id + " from all topicmaps")
        for (var id in topicmaps) {
            topicmaps[id].delete_topic(topic.id)
        }
        // 2) Update the topicmap menu if the deleted topic was a topicmap
        if (topic.type_uri == "de/deepamehta/core/topictype/Topicmap") {
            // remove topicmap model
            delete topicmaps[topic.id]
            //
            var topicmap_id = get_topicmap_id()
            if (topicmap_id == topic.id) {
                if (LOG_TOPICMAPS) log("..... updating the topicmap menu and selecting the first item " +
                    "(the deleted topic was the CURRENT topicmap)")
                if (!size(topicmaps)) {
                    create_topicmap("untitled")
                }
                rebuild_topicmap_menu()
                select_topicmap(get_topicmap_id())
            } else {
                if (LOG_TOPICMAPS) log("..... updating the topicmap menu and restoring the selection " +
                    "(the deleted topic was ANOTHER topicmap)")
                rebuild_topicmap_menu()
                select_menu_item(topicmap_id)  // restore selection
            }
        }
    }



    /************************************************************************************************/
    /**************************************** Custom Methods ****************************************/
    /************************************************************************************************/



    function get_all_topicmaps() {
        return dmc.get_topics("de/deepamehta/core/topictype/Topicmap")
    }

    /**
     * Returns the ID of the selected topicmap.
     */
    function get_topicmap_id() {
        return ui.menu_item("topicmap-menu").value
    }

    function create_topicmap(name) {
        if (LOG_TOPICMAPS) log("Creating topicmap \"" + name + "\"")
        var properties = {"de/deepamehta/core/property/Title": name}
        var topicmap = create_topic("de/deepamehta/core/topictype/Topicmap", properties)
        if (LOG_TOPICMAPS) log("..... " + topicmap.id)
        return topicmap
    }

    /**
     * Invoked when the user selects a topicmap.
     */
    function topicmap_selected(menu_item) {
        var topicmap_id = menu_item.value
        if (topicmap_id == "_new") {
            open_topicmap_dialog()
        } else {
            select_topicmap(topicmap_id)
        }
    }

    function select_topicmap(topicmap_id) {
        if (LOG_TOPICMAPS) log("Selecting topicmap " + topicmap_id)
        topicmap = get_topicmap(topicmap_id)
        topicmap.display_on_canvas()
    }

    function open_topicmap_dialog() {
        $("#topicmap_dialog").dialog("open")
    }

    function do_create_topicmap() {
        $("#topicmap_dialog").dialog("close")
        var name = $("#topicmap_name").val()
        var topicmap_id = create_topicmap(name).id
        rebuild_topicmap_menu()
        select_menu_item(topicmap_id)
        select_topicmap(topicmap_id)
        return false
    }

    function rebuild_topicmap_menu(topicmaps) {
        if (!topicmaps) {
            topicmaps = get_all_topicmaps()
        }
        // add menu items
        ui.empty_menu("topicmap-menu")
        var icon_src = get_icon_src("de/deepamehta/core/topictype/Topicmap")
        for (var i = 0, topicmap; topicmap = topicmaps[i]; i++) {
            ui.add_menu_item("topicmap-menu", {label: topicmap.label, value: topicmap.id, icon: icon_src})
        }
        ui.add_menu_separator("topicmap-menu")
        ui.add_menu_item("topicmap-menu", {label: "New Topicmap...", value: "_new", is_trigger: true})
    }

    /**
     * Selects a topicmap programmatically.
     */
    function select_menu_item(topicmap_id) {
        ui.select_menu_item("topicmap-menu", topicmap_id)
    }

    function get_topicmap(id) {
        // load topicmap on-demand
        if (!topicmaps[id]) {
            topicmaps[id] = new Topicmap(id)
        }
        //
        return topicmaps[id]
    }



    /************************************/
    /********** Custom Classes **********/
    /************************************/



    /**
     * An in-memory representation (model) of a persistent topicmap. There are methods for:
     *  - loading a topicmap from DB and building the in-memory representation.
     *  - displaying the in-memory representation on the canvas.
     *  - manipulating the in-memory representation by e.g. adding/removing topics and relations,
     *    while synchronizing the DB accordingly.
     */
    function Topicmap(topicmap_id) {

        // Model
        var topics = {}     // topics of this topicmap (key: topic ID, value: TopicmapTopic object)
        var relations = {}  // relations of this topicmap (key: relation ID, value: TopicmapRelation object)

        load()

        this.display_on_canvas = function() {

            // track loading of topic type images
            var image_tracker = create_image_tracker(display_on_canvas)
            for (var id in topics) {
                var topic = topics[id]
                if (topic.visibility) {
                    image_tracker.add_type(topic.type)
                }
            }
            image_tracker.check()

            function display_on_canvas() {
                canvas.clear()
                for (var id in topics) {
                    var topic = topics[id]
                    if (topic.visibility) {
                        canvas.add_topic(topic.id, topic.type, topic.label, false, false, topic.x, topic.y)
                    }
                }
                for (var id in relations) {
                    var rel = relations[id]
                    canvas.add_relation(rel.id, rel.doc1_id, rel.doc2_id)
                }
                canvas.refresh()
            }
        }

        this.show_topic = function(id, type, label, x, y) {
            var topic = topics[id]
            if (!topic) {
                if (LOG_TOPICMAPS) log("Adding topic " + id + " (\"" + label + "\") to topicmap " + topicmap_id)
                // update DB
                var response = dmc.add_topic_to_topicmap(id, x, y, topicmap_id)
                // update model
                topics[id] = new TopicmapTopic(id, type, label, x, y, true, response.ref_id)
            } else if (!topic.visibility) {
                if (LOG_TOPICMAPS) log("Showing topic " + id + " (\"" + topic.label + "\") on topicmap " + topicmap_id)
                topic.set_visibility(true)
                return {x: topic.x, y: topic.y}
            } else {
                if (LOG_TOPICMAPS)
                    log("Topic " + id + " (\"" + label + "\") already visible in topicmap " + topicmap_id)
            }
        }

        this.add_relation = function(id, doc1_id, doc2_id) {
            if (!relations[id]) {
                if (LOG_TOPICMAPS) log("Adding relation " + id + " to topicmap " + topicmap_id)
                // update DB
                var response = dmc.add_relation_to_topicmap(id, topicmap_id)
                // update model
                relations[id] = new TopicmapRelation(id, doc1_id, doc2_id, response.ref_id)
            } else {
                if (LOG_TOPICMAPS) log("Relation " + id + " already in topicmap " + topicmap_id)
            }
        }

        this.move_topic = function(id, x, y) {
            var topic = topics[id]
            if (LOG_TOPICMAPS) log("Moving topic " + id + " (\"" + topic.label + "\") to x=" + x + ", y=" + y)
            topic.move_to(x, y)
        }

        this.hide_topic = function(id) {
            var topic = topics[id]
            if (LOG_TOPICMAPS) log("Hiding topic " + id + " (\"" + topic.label + "\") on topicmap " + topicmap_id)
            topic.set_visibility(false)
        }

        this.delete_topic = function(id) {
            // Note: all topic references are deleted already
            delete topics[id]
        }

        this.remove_relation = function(id) {
            if (LOG_TOPICMAPS) log("Removing relation " + id + " from topicmap " + topicmap_id)
            // update DB
            dmc.remove_relation_from_topicmap(id, relations[id].ref_id, topicmap_id)
            // update model
            delete relations[id]
        }

        this.get_topic = function(id) {
            return topics[id]
        }

        function load() {

            if (LOG_TOPICMAPS) log("Loading topicmap " + topicmap_id)

            var topicmap = dmc.get_topicmap(topicmap_id)

            if (LOG_TOPICMAPS) log("..... " + topicmap.topics.length + " topics")
            load_topics()

            if (LOG_TOPICMAPS) log("..... " + topicmap.relations.length + " relations")
            load_relations()

            function load_topics() {
                for (var i = 0, topic; topic = topicmap.topics[i]; i++) {
                    var vis = topic.visualization
                    if (LOG_TOPICMAPS) log(".......... ID " + topic.id + ": type_uri=\"" + topic.type_uri +
                        "\", label=\"" + topic.label + "\", x=" + vis.x + ", y=" + vis.y + ", visibility=" +
                        vis.visibility + ", ref_id=" + topic.ref_id)
                    topics[topic.id] = new TopicmapTopic(topic.id, topic.type_uri, topic.label, vis.x, vis.y,
                        vis.visibility, topic.ref_id)
                }
            }

            function load_relations() {
                for (var i = 0, relation; relation = topicmap.relations[i]; i++) {
                    if (LOG_TOPICMAPS) log(".......... ID " + relation.id + ": src_topic_id=" + relation.src_topic_id +
                        ", dst_topic_id=" + relation.dst_topic_id + ", ref_id=" + relation.ref_id)
                    relations[relation.id] = new TopicmapRelation(relation.id,
                        relation.src_topic_id, relation.dst_topic_id, relation.ref_id)
                }
            }
        }

        /*** Model Classes ***/

        function TopicmapTopic(id, type, label, x, y, visibility, ref_id) {

            this.id = id
            this.type = type
            this.label = label
            this.x = x
            this.y = y
            this.visibility = visibility
            this.ref_id = ref_id            // ID of the TOPICMAP_TOPIC relation that is used
                                            // by the topicmap to reference this topic.

            this.move_to = function(x, y) {
                // update DB
                dmc.set_relation_properties(ref_id, {x: x, y: y})
                // update model
                this.x = x
                this.y = y
            }

            this.set_visibility = function(visibility) {
                // update DB
                dmc.set_relation_properties(ref_id, {visibility: visibility})
                // update model
                this.visibility = visibility
            }
        }

        function TopicmapRelation(id, doc1_id, doc2_id, ref_id) {
            this.id = id
            this.doc1_id = doc1_id
            this.doc2_id = doc2_id
            this.ref_id = ref_id            // ID of the "Topicmap Relation Ref" topic that is used
                                            // by the topicmap to reference this relation.
        }
    }
}
