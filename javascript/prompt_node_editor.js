// @ts-check

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

    LiteGraph.NODE_TITLE_COLOR = "#ccc";
}

class CanvasResizeObserver {

    static CANVAS_HEIGHT = 700;
    /**
     * 
     * @param {import("litegraph.js").LGraphCanvas} canvas
     */
    constructor(canvas) {
        /**@type {import("litegraph.js").LGraphCanvas} */
        this.canvas = canvas;
    }

    observe() {
        const canvasEl = this.canvas.canvas;
        // 親要素のサイズ変化に追従してcanvasを動的リサイズ
        canvasEl.height = CanvasResizeObserver.CANVAS_HEIGHT;
        const container = canvasEl.parentElement;
        if (container) {
            const syncSize = () => {
                const w = container.clientWidth;
                if (w > 0 && canvasEl.width !== w) {
                    canvasEl.width = w;
                    this.canvas.resize(w, CanvasResizeObserver.CANVAS_HEIGHT);
                }
            };
            syncSize();
            new ResizeObserver(syncSize).observe(container);
        }
    }
}

/**
 * @typedef NodeDefinition
 * @property {string} title
 * @property {string} group
 * @property {string[]} tags
 */

class PromptNodeEditor {

    /**
     * @argument {string} canvasId
     */
    constructor(canvasId) {
        /**@type {import("litegraph.js").LGraph} */
        this.graph = new LGraph();
        /**@type {import("litegraph.js").LGraphCanvas} */
        this.canvas = new LGraphCanvas(canvasId, this.graph);
        
        // @ts-ignore config に型がない
        this.graph.config.align_to_grid = true;
        this.canvas.render_connections_border = false;

        new CanvasResizeObserver(this.canvas).observe();
    }

    getOutputPrompt() {
        return this.#findOutputNode()._prompt;
    }

    /**@returns {OutputNode}*/
    #findOutputNode() {
        // @ts-ignore
        return this.graph.findNodesByType("prompt/OutputNode")[0]
    }

    async load() {
        this.graph.clear();

        const param = { fileStem: this.#getSelectedFileStem() };
        const definitions = await getNodeDefinitions(param);

        /** @type {Map<string, NodeDefinition[]>} */
        const categoryMap = definitions.reduce((m, def) => {
            if (!m.has(def.group)) m.set(def.group, []);
            m.get(def.group).push(def);
            return m;
        }, new Map());

        const categories = [...categoryMap.keys()];
        const maxChainLength = Math.max(...[...categoryMap.values()].map(d => d.length), 0);

        /**@type {OutputNode} */
        const outputNode = LiteGraph.createNode("prompt/OutputNode");
        for (const cat of categories) {
            outputNode.addInput(cat, "string");
        }
        outputNode.pos = [50 + maxChainLength * 280, 100];
        this.graph.add(outputNode);

        let categoryIndex = 0;
        for (const [, defs] of categoryMap) {
            const nodes = [];
            for (let i = 0; i < defs.length; i++) {
                /**@type {PromptNode} */
                const node = LiteGraph.createNode("prompt/PromptNode");
                node.title = defs[i].title;
                node.addTags(defs[i].tags);
                node.pos = [50 + i * 280, 100 + categoryIndex * 200];
                this.graph.add(node);
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

        this.graph.start();
    }

    #getSelectedFileStem() {
        const input = this.#findFileSelectorInput();
        const stem = input.value.split(".").slice(0, -1).join("."); // remove file extension
        return stem;
    }

    /**@returns {HTMLInputElement} */
    #findFileSelectorInput() {
        const selector = gradioApp().querySelector("#pne-file-selector input");
        if (!selector) {
            console.error("[PNE] File selector input not found.");
            throw new Error("File selector input not found");
        }
        // @ts-ignore
        return selector;
    }
}

/**
 * @param {{fileStem?: string}} params
 * @returns {Promise<NodeDefinition[]>}
 */
const getNodeDefinitions = (params) => {
    return new Promise((resolve, reject) => {
        let url = "/sd-webui-prompt-node-editor/node-definitions";
        if (params.fileStem) {
            url += `?file=${encodeURIComponent(params.fileStem)}`;
        }
        fetch(url)
            .then(r => r.json())
            .then(defs => resolve(defs))
            .catch(err => {
                console.error("[PNE] Failed to load node definitions:", err);
                reject(err);
            });
    });
};

onUiLoaded(() => {
    /**@type {HTMLCanvasElement | null} */
    // @ts-ignore 実際に canvas なので
    const canvasEl = document.getElementById("prompt-node-editor-canvas");
    if (!canvasEl) {
        console.error("[PNE] Canvas element #prompt-node-editor-canvas not found.");
        return;
    }

    const editor = new PromptNodeEditor("#prompt-node-editor-canvas");

    initLiteGraph();

    setupButtons(editor);

    void editor.load();
});

/**@param {PromptNodeEditor} editor */
const CopyButton = (editor) => {
    const copyBtn = document.getElementById("pne-copy-btn");
    if (!copyBtn) {
        console.warn("[PNE] Button #pne-copy-btn not found.");
        return;
    }

    copyBtn.addEventListener("click", () => {
        const prompt = editor.getOutputPrompt();
        navigator.clipboard.writeText(prompt).then(() => {
            const original = copyBtn.textContent;
            copyBtn.textContent = "✅ Copied!";
            setTimeout(() => { copyBtn.textContent = original; }, 1500);
        });
    });
}

/**@param {PromptNodeEditor} editor */
const FileLoadButton = (editor) => {
    const fileApplyBtn = document.getElementById("pne-file-load-btn");
    if (!fileApplyBtn) {
        console.warn("[PNE] Button #pne-file-load-btn not found.");
        return;
    }

    fileApplyBtn.setAttribute("title", "load file");
    
    fileApplyBtn.addEventListener("click", () => {
        editor.load();
    });
}

/**
 * 
 * @param {PromptNodeEditor} editor 
 */
function setupButtons(editor) {
    CopyButton(editor);
    FileLoadButton(editor);
    const txt2imgBtn = document.getElementById("pne-send-txt2img-btn");
    const img2imgBtn = document.getElementById("pne-send-img2img-btn");
    
    /** @param {"#txt2img_prompt textarea" | "#img2img_prompt textarea"} selector */
    function sendPromptTo(selector) {
        const prompt = editor.getOutputPrompt();
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
