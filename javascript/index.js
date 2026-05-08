// @ts-check
/// <reference path="../globals.d.ts" />

class PromptNode extends LGraphNode {
    constructor() {
        super("Prompt Node");
        this.addInput("prompt", "string");
        this.addOutput("prompt", "string");
        this.color = "#2a3a4a";
        this.bgcolor = "#1a2a3a";

        /**
         * HACK: 型宣言のみ行う。
         * @type {import("litegraph.js").IToggleWidget[]}
        */
        this.widgets
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
            .filter(w => w.value)
            .map(w => w.name);
        const output = selected.length > 0
            ? (input ? input + ", " + selected.join(", ") : selected.join(", "))
            : input;
        this.setOutputData(0, output);
    }
}

class OutputNode extends LGraphNode {
    constructor() {
        super("Output");
        this.addInput("prompt", "string");
        this._prompt = "";
        /**@type {import("litegraph.js").Vector2} */
        this.size = [300, 120];
        this.color = "#3a2a1a";
        this.bgcolor = "#2a1a0a";
    }

    onExecute() {
        this._prompt = this.getInputData(0) ?? "";
        this.setDirtyCanvas(true, false);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    onDrawForeground(ctx) {
        if (!this._prompt) return;
        ctx.fillStyle = "#ddd";
        ctx.font = "11px Arial";
        const maxWidth = this.size[0] - 20;
        const words = this._prompt.split(" ");
        let line = "";
        let y = 20;
        for (const word of words) {
            const testLine = line ? line + " " + word : word;
            if (ctx.measureText(testLine).width > maxWidth && line) {
                ctx.fillText(line, 10, y);
                line = word;
                y += 14;
            } else {
                line = testLine;
            }
        }
        if (line) ctx.fillText(line, 10, y);
    }
}

onUiLoaded(() => {
    const canvasEl = document.getElementById("prompt-node-editor-canvas");
    if (!canvasEl) {
        console.error("[PNE] Canvas element #prompt-node-editor-canvas not found.");
        return;
    }

    LiteGraph.registerNodeType("prompt/PromptNode", PromptNode);
    LiteGraph.registerNodeType("prompt/OutputNode", OutputNode);

    const graph = new LGraph();
    const canvas = new LGraphCanvas("#prompt-node-editor-canvas", graph);

    // @ts-ignore config に型がない
    graph.config.align_to_grid = true;
    canvas.render_connections_border = false;
    LiteGraph.node_title_color = "#ccc";
    LiteGraph.DEFAULT_GROUP_FONT_SIZE = 14;

    window._pneGetPrompt = () => graph.findNodesByType("prompt/OutputNode")[0]?._prompt ?? "";

    graph.start();
});
