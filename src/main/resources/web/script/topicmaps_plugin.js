function topicmaps_plugin() {

    dm3c.css_stylesheet("/de.deepamehta.3-topicmaps/style/dm3-topicmaps.css")

    var LOG_TOPICMAPS = false

    var topicmaps = {}  // The topicmaps cache (key: topicmap ID, value: Topicmap object)
    var topicmap        // Selected topicmap (Topicmap object)

    // ------------------------------------------------------------------------------------------------ Overriding Hooks



    // *******************************
    // *** Overriding Client Hooks ***
    // *******************************



    this.init = function() {

        extend_rest_client()

        var topicmaps = get_all_topicmaps()
        create_default_topicmap()
        create_topicmap_menu()
        create_topicmap_dialog()
        select_initial_topicmap()

        function extend_rest_client() {
            dm3c.restc.get_topicmap = function(topicmap_id) {
                return this.request("GET", "/topicmap/" + topicmap_id)
            }
            dm3c.restc.add_topic_to_topicmap = function(topic_id, x, y, topicmap_id) {
                return this.request("PUT", "/topicmap/" + topicmap_id, {topic_id: topic_id, x: x, y: y})
            }
            dm3c.restc.add_relation_to_topicmap = function(relation_id, topicmap_id) {
                return this.request("PUT", "/topicmap/" + topicmap_id, {relation_id: relation_id})
            }
            dm3c.restc.remove_relation_from_topicmap = function(relation_id, ref_id, topicmap_id) {
                return this.request("DELETE", "/topicmap/" + topicmap_id, {relation_id: relation_id, ref_id: ref_id})
            }
        }

        function create_default_topicmap() {
            if (!topicmaps.length) {
                create_topicmap_topic("untitled")
                topicmaps = get_all_topicmaps()
            }
        }

        function create_topicmap_menu() {
            var topicmap_label = $("<span>").attr("id", "topicmap-label").text("Topicmap")
            var topicmap_menu = $("<div>").attr("id", "topicmap-menu")
            var topicmap_form = $("<div>").attr("id", "topicmap-form").append(topicmap_label).append(topicmap_menu)
            $("#workspace-form").after(topicmap_form)   // TODO: make topicmaps plugin independant from workspace plugin
            dm3c.ui.menu("topicmap-menu", do_select_topicmap)
            rebuild_topicmap_menu(undefined, topicmaps)
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

        function select_initial_topicmap() {
            if (location.search.match(/topicmap=(\d+)/)) {
                var topicmap_id = RegExp.$1
                select_menu_item(topicmap_id)
            } else {
                var topicmap_id = get_topicmap_id_from_menu()
            }
            display_topicmap(topicmap_id)
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
    this.post_hide_relation_from_canvas = function(relation) {
        topicmap.hide_relation(relation.id)
    }

    /**
     * @param   topic   a CanvasTopic object
     */
    this.post_move_topic_on_canvas = function(topic) {
        topicmap.move_topic(topic.id, topic.x, topic.y)
    }

    this.post_set_topic_label = function(topic_id, label) {
        if (LOG_TOPICMAPS) dm3c.log("Setting label of topic " + topic_id + " to \"" + label + "\"")
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
        // 1) Remove topic from all topicmap models 
        if (LOG_TOPICMAPS) dm3c.log("Deleting topic " + topic.id + " from all topicmaps")
        for (var id in topicmaps) {
            topicmaps[id].delete_topic(topic.id)
        }
        // 2) Update the topicmap menu if the deleted topic was a topicmap
        if (topic.type_uri == "de/deepamehta/core/topictype/Topicmap") {
            // remove topicmap model
            delete topicmaps[topic.id]
            //
            var topicmap_id = get_topicmap_id_from_menu()
            if (topicmap_id == topic.id) {
                if (LOG_TOPICMAPS) dm3c.log("..... updating the topicmap menu and selecting the first item " +
                    "(the deleted topic was the CURRENT topicmap)")
                if (!js.size(topicmaps)) {
                    create_topicmap_topic("untitled")
                }
                rebuild_topicmap_menu()
                display_topicmap(get_topicmap_id_from_menu())
            } else {
                if (LOG_TOPICMAPS) dm3c.log("..... updating the topicmap menu and restoring the selection " +
                    "(the deleted topic was ANOTHER topicmap)")
                rebuild_topicmap_menu()
            }
        }
    }

    this.post_delete_relation = function(relation_id) {
        // Remove relation from all topicmap models 
        if (LOG_TOPICMAPS) dm3c.log("Deleting relation " + relation_id + " from all topicmaps")
        for (var id in topicmaps) {
            topicmaps[id].delete_relation(relation_id)
        }
    }



    // ***************************************
    // *** Overriding Access Control Hooks ***
    // ***************************************



    this.user_logged_in = function(user) {
        rebuild_topicmap_menu()
    }

    this.user_logged_out = function() {
        rebuild_topicmap_menu()
    }



    // ------------------------------------------------------------------------------------------------------ Public API

    /**
     * @return  ID of the selected topicmap
     */
    this.get_topicmap_id = function() {
        return topicmap.get_id()
    }

    /**
     * Creates a topicmap with the given name, puts it in the topicmap menu, and displays the topicmap.
     *
     * @return  the topicmap topic.
     */
    this.create_topicmap = function(name) {
        return create_topicmap(name)
    }

    /**
     * Selects a topicmap programmatically.
     * The respective item from the topicmap menu is selected and the topicmap is displayed on the canvas.
     */
    this.select_topicmap = function(topicmap_id) {
        select_topicmap(topicmap_id)
    }

    /**
     * Reloads a topicmap from DB and displays it on the canvas.
     *
     * Prerequisite: the topicmap is already selected in the topicmap menu. 
     */
    this.refresh_topicmap = function(topicmap_id) {
        delete topicmaps[topicmap_id]
        display_topicmap(topicmap_id)
    }

    // ----------------------------------------------------------------------------------------------- Private Functions

    function get_all_topicmaps() {
        return dm3c.restc.get_topics("de/deepamehta/core/topictype/Topicmap")
    }

    /**
     * Reads out the topicmap menu and returns the topicmap ID.
     * If the topicmap menu has no items yet, undefined is returned.
     */
    function get_topicmap_id_from_menu() {
        var item = dm3c.ui.menu_item("topicmap-menu")
        if (item) {
            return item.value
        }
    }

    function open_topicmap_dialog() {
        $("#topicmap_dialog").dialog("open")
    }

    function do_create_topicmap() {
        $("#topicmap_dialog").dialog("close")
        var name = $("#topicmap_name").val()
        create_topicmap(name)
        return false
    }

    /**
     * Invoked when the user made a selection from the topicmap menu.
     */
    function do_select_topicmap(menu_item) {
        var topicmap_id = menu_item.value
        if (topicmap_id == "_new") {
            open_topicmap_dialog()
        } else {
            display_topicmap(topicmap_id)
        }
    }

    // ---

    /**
     * Creates a topicmap with the given name, puts it in the topicmap menu, and displays the topicmap.
     *
     * High-level method called from public API.
     *
     * @return  the topicmap topic.
     */
    function create_topicmap(name) {
        var topicmap = create_topicmap_topic(name)
        rebuild_topicmap_menu(topicmap.id)
        display_topicmap(topicmap.id)
        return topicmap
    }

    /**
     * Creates a new empty topicmap in the DB.
     */
    function create_topicmap_topic(name) {
        if (LOG_TOPICMAPS) dm3c.log("Creating topicmap \"" + name + "\"")
        var properties = {"de/deepamehta/core/property/Title": name}
        var topicmap = dm3c.create_topic("de/deepamehta/core/topictype/Topicmap", properties)
        if (LOG_TOPICMAPS) dm3c.log("..... " + topicmap.id)
        return topicmap
    }

    /**
     * Selects a topicmap programmatically.
     * The respective item from the topicmap menu is selected and the topicmap is displayed on the canvas.
     *
     * High-level method called from public API.
     */
    function select_topicmap(topicmap_id) {
        select_menu_item(topicmap_id)
        display_topicmap(topicmap_id)
    }

    /**
     * Displays a topicmap on the canvas.
     * If not already in cache, the topicmap is loaded and put in the cache.
     *
     * Updates global state: "topicmap", the selected topicmap.
     *
     * Prerequisite: the topicmap is already selected in the topicmap menu. 
     */
    function display_topicmap(topicmap_id) {
        if (LOG_TOPICMAPS) dm3c.log("Selecting topicmap " + topicmap_id)
        topicmap = get_topicmap(topicmap_id)    // update global state
        topicmap.display_on_canvas()
    }

    // ---

    /**
     * @param   topicmap_id     Optional: ID of the topicmap to select.
     *                          If not given, the current selection is maintained.
     */
    function rebuild_topicmap_menu(topicmap_id, topicmaps) {
        if (!topicmap_id) {
            topicmap_id = get_topicmap_id_from_menu()
        }
        if (!topicmaps) {
            topicmaps = get_all_topicmaps()
        }
        //
        dm3c.ui.empty_menu("topicmap-menu")
        var icon_src = dm3c.get_icon_src("de/deepamehta/core/topictype/Topicmap")
        // add topicmaps to menu
        for (var i = 0, topicmap; topicmap = topicmaps[i]; i++) {
            dm3c.ui.add_menu_item("topicmap-menu", {label: topicmap.label, value: topicmap.id, icon: icon_src})
        }
        // add "New..." to menu
        if (dm3c.has_create_permission("de/deepamehta/core/topictype/Topicmap")) {
            dm3c.ui.add_menu_separator("topicmap-menu")
            dm3c.ui.add_menu_item("topicmap-menu", {label: "New Topicmap...", value: "_new", is_trigger: true})
        }
        //
        select_menu_item(topicmap_id)
    }

    /**
     * Selects an item from the topicmap menu.
     */
    function select_menu_item(topicmap_id) {
        dm3c.ui.select_menu_item("topicmap-menu", topicmap_id)
    }

    /**
     * Loads a topicmap from DB, and returns it.
     *
     * If already in cache, the cached topicmap is returned.
     * If not already in cache, the topicmap is loaded from DB and put in the cache.
     */
    function get_topicmap(topicmap_id) {
        // load topicmap on-demand
        if (!topicmaps[topicmap_id]) {
            topicmaps[topicmap_id] = new Topicmap(topicmap_id)
        }
        //
        return topicmaps[topicmap_id]
    }

    // ------------------------------------------------------------------------------------------------- Private Classes

    /**
     * An in-memory representation (model) of a persistent topicmap. There are methods for:
     *  - building the in-memory representation by loading a topicmap from DB.
     *  - displaying the in-memory representation on the canvas.
     *  - manipulating the in-memory representation by e.g. adding/removing topics and relations,
     *    while synchronizing the DB accordingly.
     */
    function Topicmap(topicmap_id) {

        // Model
        var topics = {}     // topics of this topicmap (key: topic ID, value: TopicmapTopic object)
        var relations = {}  // relations of this topicmap (key: relation ID, value: TopicmapRelation object)

        load()

        // --- Public API ---

        this.get_id = function() {
            return topicmap_id
        }

        this.display_on_canvas = function() {

            // track loading of topic type images
            var image_tracker = dm3c.create_image_tracker(display_on_canvas)
            for (var id in topics) {
                var topic = topics[id]
                if (topic.visibility) {
                    image_tracker.add_type(topic.type)
                }
            }
            image_tracker.check()

            function display_on_canvas() {
                dm3c.canvas.clear()
                for (var id in topics) {
                    var topic = topics[id]
                    if (topic.visibility) {
                        dm3c.canvas.add_topic(topic.id, topic.type, topic.label, false, false, topic.x, topic.y)
                    }
                }
                for (var id in relations) {
                    var rel = relations[id]
                    dm3c.canvas.add_relation(rel.id, rel.doc1_id, rel.doc2_id)
                }
                dm3c.canvas.refresh()
            }
        }

        this.show_topic = function(id, type, label, x, y) {
            var topic = topics[id]
            if (!topic) {
                if (LOG_TOPICMAPS) dm3c.log("Adding topic " + id + " (\"" + label + "\") to topicmap " + topicmap_id)
                // update DB
                var response = dm3c.restc.add_topic_to_topicmap(id, x, y, topicmap_id)
                // update model
                topics[id] = new TopicmapTopic(id, type, label, x, y, true, response.ref_id)
            } else if (!topic.visibility) {
                if (LOG_TOPICMAPS)
                    dm3c.log("Showing topic " + id + " (\"" + topic.label + "\") on topicmap " + topicmap_id)
                topic.set_visibility(true)
                return {x: topic.x, y: topic.y}
            } else {
                if (LOG_TOPICMAPS)
                    dm3c.log("Topic " + id + " (\"" + label + "\") already visible in topicmap " + topicmap_id)
            }
        }

        this.add_relation = function(id, doc1_id, doc2_id) {
            if (!relations[id]) {
                if (LOG_TOPICMAPS) dm3c.log("Adding relation " + id + " to topicmap " + topicmap_id)
                // update DB
                var response = dm3c.restc.add_relation_to_topicmap(id, topicmap_id)
                // update model
                relations[id] = new TopicmapRelation(id, doc1_id, doc2_id, response.ref_id)
            } else {
                if (LOG_TOPICMAPS) dm3c.log("Relation " + id + " already in topicmap " + topicmap_id)
            }
        }

        this.move_topic = function(id, x, y) {
            var topic = topics[id]
            if (LOG_TOPICMAPS) dm3c.log("Moving topic " + id + " (\"" + topic.label + "\") to x=" + x + ", y=" + y)
            topic.move_to(x, y)
        }

        this.hide_topic = function(id) {
            var topic = topics[id]
            if (LOG_TOPICMAPS) dm3c.log("Hiding topic " + id + " (\"" + topic.label + "\") on topicmap " + topicmap_id)
            topic.set_visibility(false)
        }

        this.delete_topic = function(id) {
            // Note: all topic references are deleted already
            delete topics[id]
        }

        this.hide_relation = function(id) {
            if (LOG_TOPICMAPS) dm3c.log("Removing relation " + id + " from topicmap " + topicmap_id)
            relations[id].remove()
        }

        this.delete_relation = function(id) {
            if (LOG_TOPICMAPS) dm3c.log("Removing relation " + id + " from topicmap " + topicmap_id +
                " (part of delete operation)")
            delete relations[id]
        }

        this.get_topic = function(id) {
            return topics[id]
        }

        // --- Private Functions ---

        function load() {

            if (LOG_TOPICMAPS) dm3c.log("Loading topicmap " + topicmap_id)

            var topicmap = dm3c.restc.get_topicmap(topicmap_id)

            if (LOG_TOPICMAPS) dm3c.log("..... " + topicmap.topics.length + " topics")
            load_topics()

            if (LOG_TOPICMAPS) dm3c.log("..... " + topicmap.relations.length + " relations")
            load_relations()

            function load_topics() {
                for (var i = 0, topic; topic = topicmap.topics[i]; i++) {
                    var vis = topic.visualization
                    if (LOG_TOPICMAPS) dm3c.log(".......... ID " + topic.id + ": type_uri=\"" + topic.type_uri +
                        "\", label=\"" + topic.label + "\", x=" + vis.x + ", y=" + vis.y + ", visibility=" +
                        vis.visibility + ", ref_id=" + topic.ref_id)
                    topics[topic.id] = new TopicmapTopic(topic.id, topic.type_uri, topic.label, vis.x, vis.y,
                        vis.visibility, topic.ref_id)
                }
            }

            function load_relations() {
                for (var i = 0, relation; relation = topicmap.relations[i]; i++) {
                    if (LOG_TOPICMAPS)
                        dm3c.log(".......... ID " + relation.id + ": src_topic_id=" + relation.src_topic_id +
                        ", dst_topic_id=" + relation.dst_topic_id + ", ref_id=" + relation.ref_id)
                    relations[relation.id] = new TopicmapRelation(relation.id,
                        relation.src_topic_id, relation.dst_topic_id, relation.ref_id)
                }
            }
        }

        // --- Private Classes ---

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
                dm3c.restc.set_relation_properties(ref_id, {x: x, y: y})
                // update model
                this.x = x
                this.y = y
            }

            this.set_visibility = function(visibility) {
                // update DB
                dm3c.restc.set_relation_properties(ref_id, {visibility: visibility})
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

            this.remove = function() {
                // update DB
                dm3c.restc.remove_relation_from_topicmap(id, ref_id, topicmap_id)
                // update model
                delete relations[id]
            }
        }
    }
}
