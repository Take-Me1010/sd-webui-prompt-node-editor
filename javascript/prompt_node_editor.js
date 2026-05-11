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
        const inputCount = this.inputs ? this.inputs.length : 0;
        const parts = [];
        for (let i = 0; i < inputCount; i++) {
            const val = this.getInputData(i) ?? "";
            if (val) parts.push(val);
        }
        const prompt = parts.join(", ");
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

const initLiteGraph = () => {
    LiteGraph.registerNodeType("prompt/PromptNode", PromptNode);
    LiteGraph.registerNodeType("prompt/OutputNode", OutputNode);

    LiteGraph.node_title_color = "#ccc";
    LiteGraph.DEFAULT_GROUP_FONT_SIZE = 14;
}

class PromptNodeEditor {

    /**
     * @argument {string} canvasId
     */
    constructor(canvasId) {
        /**@type {import("litegraph.js").LGraph} */
        this.graph = new LGraph();
        /**@type {import("litegraph.js").LGraphCanvas} */
        this.canvas = new LGraphCanvas(canvasId, this.graph);
    }

    getOutputPrompt() {
        return this.#findOutputNode()._prompt;
    }

    /**@returns {OutputNode}*/
    #findOutputNode() {
        // @ts-ignore
        return this.graph.findNodesByType("prompt/OutputNode")[0]
    }
}

onUiLoaded(() => {
    /**@type {HTMLCanvasElement | null} */
    // @ts-ignore 実際に canvas なので
    const canvasEl = document.getElementById("prompt-node-editor-canvas");
    if (!canvasEl) {
        console.error("[PNE] Canvas element #prompt-node-editor-canvas not found.");
        return;
    }

    initLiteGraph();

    const graph = new LGraph();
    const canvas = new LGraphCanvas("#prompt-node-editor-canvas", graph);

    // @ts-ignore config に型がない
    graph.config.align_to_grid = true;
    canvas.render_connections_border = false;

    // TODO: PromptNodeEditor で置き換える
    window._pneGetPrompt = () => graph.findNodesByType("prompt/OutputNode")[0]?._prompt ?? "";

    // TODO: 動的リサイズの処理だけ切り出してリファクタ
    // 親要素のサイズ変化に追従してcanvasを動的リサイズ
    const CANVAS_HEIGHT = 700;
    canvasEl.height = CANVAS_HEIGHT;
    const container = canvasEl.parentElement;
    if (container) {
        const syncSize = () => {
            const w = container.clientWidth;
            if (w > 0 && canvasEl.width !== w) {
                canvasEl.width = w;
                canvas.resize(w, CANVAS_HEIGHT);
            }
        };
        syncSize();
        new ResizeObserver(syncSize).observe(container);
    }

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
 * @param {{ title: string, group: string, tags: string[] }[]} definitions
 */
async function buildAmdStartGraph(graph, definitions) {
    graph.clear();

    /** @type {Map<string, { title: string, group: string, tags: string[] }[]>} */
    const categoryMap = new Map();
    for (const def of definitions) {
        if (!categoryMap.has(def.group)) categoryMap.set(def.group, []);
        categoryMap.get(def.group).push(def);
    }

    const categories = [...categoryMap.keys()];
    const maxChainLength = Math.max(...[...categoryMap.values()].map(d => d.length), 0);

    /**@type {OutputNode} */
    const outputNode = LiteGraph.createNode("prompt/OutputNode");
    for (const cat of categories) {
        outputNode.addInput(cat, "string");
    }
    outputNode.pos = [50 + maxChainLength * 280, 100];
    graph.add(outputNode);

    let categoryIndex = 0;
    for (const [, defs] of categoryMap) {
        const nodes = [];
        for (let i = 0; i < defs.length; i++) {
            /**@type {PromptNode} */
            const node = LiteGraph.createNode("prompt/PromptNode");
            node.title = defs[i].title;
            node.addTags(defs[i].tags);
            node.pos = [50 + i * 280, 100 + categoryIndex * 200];
            graph.add(node);
            nodes.push(node);
        }
        for (let i = 0; i < nodes.length - 1; i++) {
            nodes[i].connect(0, nodes[i + 1], 0);
        }
        if (nodes.length > 0) {
            nodes[nodes.length - 1].connect(0, outputNode, categoryIndex);
        }
        categoryIndex++;
    }

    graph.start();
}
