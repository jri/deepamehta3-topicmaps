function dm3_topicmaps() {

    add_topic_type("Topicmap", {
        fields: [
            {id: "Title",       model: {type: "text"}, view: {editor: "single line"}, content: ""},
            {id: "Description", model: {type: "html"}, view: {editor: "multi line"},  content: ""}
        ],
        view: {
            icon_src: "vendor/dm3-topicmaps/images/network.png"
        },
        implementation: "PlainDocument"
    })

    css_stylesheet("vendor/dm3-topicmaps/style/dm3-topicmaps.css")

    var LOG_TOPICMAPS = false

    var topicmaps = {}  // Loaded topicmaps (key: topicmap ID, value: Topicmap object)
    var topicmap        // Selected topicmap (Topicmap object)



    /**************************************************************************************************/
    /**************************************** Overriding Hooks ****************************************/
    /**************************************************************************************************/



    this.init = function() {

        var topicmaps = get_all_topicmaps()
        create_default_topicmap()
        create_topicmap_menu()
        create_topicmap_dialog()
        load_topicmap()

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
            update_topicmap_menu(topicmaps)
        }

        function create_topicmap_dialog() {
            var topicmap_dialog = $("<div>").attr("id", "topicmap_dialog")
            var input = $("<input>").attr({id: "topicmap_name", size: 30})
            topicmap_dialog.append("Title:")
            topicmap_dialog.append($("<form>").submit(do_create_topicmap).append(input))
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

    this.post_hide_topic_from_canvas = function(topic_id) {
        topicmap.hide_topic(topic_id)
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

    this.post_delete = function(doc) {
        if (doc.type == "Topic") {
            // 1) Possibly remove topic from all topicmap models 
            if (LOG_TOPICMAPS) log("Deleting topic " + doc._id + " from all topicmaps")
            for (var id in topicmaps) {
                topicmaps[id].delete_topic(doc._id)
            }
            // 2) Update the topicmap menu if the deleted topic was a topicmap
            if (doc.topic_type == "Topicmap") {
                // remove topicmap model
                delete topicmaps[doc._id]
                //
                var topicmap_id = get_topicmap_id()
                if (topicmap_id == doc._id) {
                    if (LOG_TOPICMAPS) log("... updating the topicmap menu and selecting the first item (the deleted topic was the CURRENT topicmap)")
                    if (!size(topicmaps)) {
                        create_topicmap("untitled")
                    }
                    update_topicmap_menu()
                    select_topicmap(get_topicmap_id())
                } else {
                    if (LOG_TOPICMAPS) log("... updating the topicmap menu and restoring the selection (the deleted topic was ANOTHER topicmap)")
                    update_topicmap_menu()
                    select_menu_item(topicmap_id)  // restore selection
                }
            }
        }
    }



    /************************************************************************************************/
    /**************************************** Custom Methods ****************************************/
    /************************************************************************************************/



    function get_all_topicmaps() {
        return get_topics_by_type("Topicmap")
    }

    /**
     * Returns the ID of the currently selected topicmap.
     */
    function get_topicmap_id() {
        return ui.menu_item("topicmap-menu").value
    }

    function create_topicmap(name) {
        if (LOG_TOPICMAPS) log("Creating topicmap \"" + name + "\"")
        var topicmap = create_topic("Topicmap", {"Title": name})
        if (LOG_TOPICMAPS) log("..... " + topicmap._id)
        return topicmap
    }

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
        var topicmap_id = create_topicmap(name)._id
        update_topicmap_menu()
        select_menu_item(topicmap_id)
        select_topicmap(topicmap_id)
        return false
    }

    function update_topicmap_menu(topicmaps) {
        if (!topicmaps) {
            topicmaps = get_all_topicmaps()
        }
        // add menu items
        ui.empty_menu("topicmap-menu")
        var icon_src = get_icon_src("Topicmap")
        for (var i = 0, topicmap; topicmap = topicmaps[i]; i++) {
            ui.add_menu_item("topicmap-menu", {label: topicmap.label, value: topicmap.id, icon: icon_src})
        }
        ui.add_menu_separator("topicmap-menu")
        ui.add_menu_item("topicmap-menu", {label: "New Topicmap...", value: "_new", is_trigger: true})
    }

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
        var topics = {}     // topics of this topicmap (key: topic ID, value: Topic object)
        var relations = {}  // relations of this topicmap (key: relation ID, value: Relation object)

        load()

        this.display_on_canvas = function() {

            // track loading of topic type images
            var image_tracker = create_image_tracker(display_on_canvas)
            for (var id in topics) {
                var topic = topics[id]
                if (topic.visible) {
                    image_tracker.add_type(topic.type)
                }
            }
            image_tracker.check()

            function display_on_canvas() {
                canvas.clear()
                for (var id in topics) {
                    var topic = topics[id]
                    if (topic.visible) {
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
                var ref_fields = {
                    topic_pos: {x: x, y: y},
                    topic_visible: true
                }
                var ref = create_relation("Topic Ref", topicmap_id, id, ref_fields)
                // update model
                topics[id] = new Topic(id, type, label, x, y, true, ref._id)
            } else if (!topic.visible) {
                if (LOG_TOPICMAPS) log("Showing topic " + id + " (\"" + topic.label + "\") on topicmap " + topicmap_id)
                topic.set_visible(true)
                return {x: topic.x, y: topic.y}
            } else {
                if (LOG_TOPICMAPS) log("Topic " + id + " (\"" + label + "\") already visible in topicmap " + topicmap_id)
            }
        }

        this.add_relation = function(id, doc1_id, doc2_id) {
            if (!relations[id]) {
                if (LOG_TOPICMAPS) log("Adding relation " + id + " to topicmap " + topicmap_id)
                // update DB
                var ref = create_relation("Relation Ref", topicmap_id, id)
                // update model
                relations[id] = new Relation(id, doc1_id, doc2_id, ref._id)
            } else {
                if (LOG_TOPICMAPS) log("Relation " + id + " already in topicmap " + topicmap_id)
            }
        }

        this.move_topic = function(id, x, y) {
            var topic = topics[id]
            // update DB
            var ref = db.open(topic.ref_id)
            ref.topic_pos = {x: x, y: y}
            if (LOG_TOPICMAPS) log("Moving topic " + id + " (x=" + x + " y=" + y + ")")
            save_document(ref)
            // update model
            topic.x = x
            topic.y = y
        }

        this.hide_topic = function(id) {
            var topic = topics[id]
            if (LOG_TOPICMAPS) log("Hiding topic " + id + " (\"" + topic.label + "\") on topicmap " + topicmap_id)
            topic.set_visible(false)
        }

        this.delete_topic = function(id) {
            // Note: all topic references are deleted already
            delete topics[id]
        }

        this.remove_relation = function(id) {
            // 1) update DB
            if (LOG_TOPICMAPS) log("Removing relation " + id + " from topicmap " + topicmap_id)
            var ref = db.open(relations[id].ref_id)
            if (ref) {
                // delete relation reference
                db.deleteDoc(ref)
            } else {
                if (LOG_TOPICMAPS) log("### ERROR at Topicmap.remove_relation: Reference for relation " + id +
                    " in topicmap " + topicmap_id + " not found in DB.")
            }
            // 2) update model
            delete relations[id]
        }

        this.get_topic = function(id) {
            return topics[id]
        }

        function load() {

            load_topics()
            load_relations()

            function load_topics() {
                // Round 1: load topic references and init position
                if (LOG_TOPICMAPS) log("Loading topicmap " + topicmap_id)
                var rows = db.view("deepamehta3/dm3-topicmaps", {key: [topicmap_id, "Topic"]}).rows
                var topic_ids = []
                if (LOG_TOPICMAPS) log("..... " + rows.length + " topics")
                for (var i = 0, row; row = rows[i]; i++) {
                    var topic_id = row.value.topic_id
                    var pos = row.value.pos
                    var visible = row.value.visible
                    topic_ids.push(topic_id)
                    topics[topic_id] = new Topic(topic_id, undefined, undefined, pos.x, pos.y, visible, row.id)
                }
                // Round 2: init topic type and topic label
                var tpcs = get_topics(topic_ids)
                for (var i = 0, t; t = tpcs[i]; i++) {
                    var topic = topics[t.id]
                    if (LOG_TOPICMAPS) log(".......... " + t.id + " (\"" + t.label + "\"), visible=" + topic.visible)
                    topic.type = t.type
                    topic.label = t.label
                }
            }

            function load_relations() {
                // Round 1: load relation references
                var rows = db.view("deepamehta3/dm3-topicmaps", {key: [topicmap_id, "Relation"]}).rows
                var rel_ids = []
                if (LOG_TOPICMAPS) log("..... " + rows.length + " relations")
                for (var i = 0, row; row = rows[i]; i++) {
                    var rel_id = row.value.relation_id
                    rel_ids.push(rel_id)
                    relations[rel_id] = new Relation(rel_id, undefined, undefined, row.id)
                }
                // Round 2: init doc IDs
                var rltns = get_relations(rel_ids)
                for (var i = 0, r; r = rltns[i]; i++) {
                    if (LOG_TOPICMAPS) log(".......... " + r.id)
                    var rel = relations[r.id]
                    rel.doc1_id = r.doc1_id
                    rel.doc2_id = r.doc2_id
                }
            }
        }

        /*** Model Classes ***/

        function Topic(id, type, label, x, y, visible, ref_id) {
            this.id = id
            this.type = type
            this.label = label
            this.x = x
            this.y = y
            this.visible = visible
            this.ref_id = ref_id

            this.set_visible = function(visible) {
                // update DB
                var ref = db.open(this.ref_id)
                if (ref) {
                    ref.topic_visible = visible
                    save_document(ref)
                } else {
                    if (LOG_TOPICMAPS) log("### ERROR at Topicmap.Topic.set_visible: Reference for topic " + this.id + " (\"" +
                        this.label + "\") in topicmap " + topicmap_id + " not found in DB (visible=" + visible + ").")
                }
                // update model
                this.visible = visible
            }
        }

        function Relation(id, doc1_id, doc2_id, ref_id) {
            this.id = id
            this.doc1_id = doc1_id
            this.doc2_id = doc2_id
            this.ref_id = ref_id
        }
    }
}
