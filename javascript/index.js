// @ts-check
/// <reference path="../globals.d.ts" />

onUiLoaded(() => {
    const canvasEl = document.getElementById("prompt-node-editor-canvas");
    if (!canvasEl) {
        console.error("[PNE] Canvas element #prompt-node-editor-canvas not found.");
        return;
    }

    const graph = new LGraph();
    const canvas = new LGraphCanvas("#prompt-node-editor-canvas", graph);

    // @ts-ignore config に型がない
    graph.config.align_to_grid = true;
    // canvas.background_image = null;
    canvas.render_connections_border = false;
    LiteGraph.node_title_color = "#ccc";
    LiteGraph.DEFAULT_GROUP_FONT_SIZE = 14;

    graph.start();

    // window._pneGraph = graph;
    // window._pneCanvas = canvas;
});
