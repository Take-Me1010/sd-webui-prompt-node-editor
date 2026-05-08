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
            this.addWidget("toggle", tag, false, () => {
            });
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
        /**
         * @type {import("litegraph.js").ITextWidget}
         */
        this._widget = this.addWidget("text", "prompt", "");
    }

    onExecute() {
        const prompt = this.getInputData(0) ?? "";
        if (prompt === this._prompt) return;
        this._prompt = prompt;
        this._widget.value = prompt;

        const textarea = gradioApp().querySelector("#pne-prompt-output textarea");
        if (textarea) {
            const setter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, "value"
            )?.set;
            if (setter) setter.call(textarea, prompt);
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
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

    setupButtons();

    fetch("/sd-webui-prompt-node-editor/node-definitions")
        .then(r => r.json())
        .then(defs => buildAmdStartGraph(graph, defs))
        .catch(err => console.error("[PNE] Failed to load node definitions:", err));
});

function setupButtons() {
    const copyBtn = document.getElementById("pne-copy-btn");
    const txt2imgBtn = document.getElementById("pne-send-txt2img-btn");
    const img2imgBtn = document.getElementById("pne-send-img2img-btn");

    if (!copyBtn) {
        console.warn("[PNE] Button #pne-copy-btn not found.");
    } else {
        copyBtn.addEventListener("click", () => {
            const prompt = window._pneGetPrompt();
            navigator.clipboard.writeText(prompt).then(() => {
                const original = copyBtn.textContent;
                copyBtn.textContent = "✅ Copied!";
                setTimeout(() => { copyBtn.textContent = original; }, 1500);
            });
        });
    }

    /** @param {string} selector */
    function sendPromptTo(selector) {
        const prompt = window._pneGetPrompt();
        const textarea = gradioApp().querySelector(selector);
        if (!textarea) {
            console.error("[PNE] Textarea not found:", selector);
            return;
        }
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, "value"
        )?.set;
        if (nativeInputValueSetter) nativeInputValueSetter.call(textarea, prompt);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (!txt2imgBtn) {
        console.warn("[PNE] Button #pne-send-txt2img-btn not found.");
    } else {
        txt2imgBtn.addEventListener("click", () => {
            sendPromptTo("#txt2img_prompt textarea");
        });
    }

    if (!img2imgBtn) {
        console.warn("[PNE] Button #pne-send-img2img-btn not found.");
    } else {
        img2imgBtn.addEventListener("click", () => {
            sendPromptTo("#img2img_prompt textarea");
        });
    }
}

/**
 * @param {import("litegraph.js").LGraph} graph
 * @param {{ title: string, tags: string[] }[]} definitions
 */
async function buildAmdStartGraph(graph, definitions) {
    graph.clear();
    const nodes = [];

    for (let i = 0; i < definitions.length; i++) {
        const def = definitions[i];
        const node = LiteGraph.createNode("prompt/PromptNode");
        node.title = def.title;
        node.addTags(def.tags);
        node.pos = [50 + i * 280, 100];
        graph.add(node);
        nodes.push(node);
    }

    const outputNode = LiteGraph.createNode("prompt/OutputNode");
    outputNode.pos = [50 + definitions.length * 280, 100];
    graph.add(outputNode);

    for (let i = 0; i < nodes.length - 1; i++) {
        nodes[i].connect(0, nodes[i + 1], 0);
    }
    if (nodes.length > 0) {
        nodes[nodes.length - 1].connect(0, outputNode, 0);
    }

    graph.start();
}
