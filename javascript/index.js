// @ts-check
/// <reference path="../globals.d.ts" />

class PromptNode extends LGraphNode {
    constructor() {
        super();
        this.addInput("prompt", "string");
        this.addOutput("prompt", "string");
        this.title = "Prompt Node";
        this.color = "#2a3a4a";
        this.bgcolor = "#1a2a3a";
    }

    /** @param {string[]} tags */
    addTags(tags) {
        for (const tag of tags) {
            this.addWidget("toggle", tag, false, () => {});
        }
    }

    /**
     * 
     * @returns {import("litegraph.js").Vector2}
     */
    computeSize() {
        const widgetCount = this.widgets ? this.widgets.length : 0;
        return [200, Math.max(80, 80 + widgetCount * 24)];
    }

    onExecute() {
        const input = this.getInputData(0) ?? "";
        const selected = this.widgets
            .filter(w => w.value === true)
            .map(w => w.name);
        const output = selected.length > 0
            ? (input ? input + ", " + selected.join(", ") : selected.join(", "))
            : input;
        this.setOutputData(0, output);
    }
}

onUiLoaded(() => {
    const canvasEl = document.getElementById("prompt-node-editor-canvas");
    if (!canvasEl) {
        console.error("[PNE] Canvas element #prompt-node-editor-canvas not found.");
        return;
    }

    LiteGraph.registerNodeType("prompt/PromptNode", PromptNode);

    const graph = new LGraph();
    const canvas = new LGraphCanvas("#prompt-node-editor-canvas", graph);

    // @ts-ignore config に型がない
    graph.config.align_to_grid = true;
    canvas.render_connections_border = false;
    LiteGraph.node_title_color = "#ccc";
    LiteGraph.DEFAULT_GROUP_FONT_SIZE = 14;

    graph.start();
});
