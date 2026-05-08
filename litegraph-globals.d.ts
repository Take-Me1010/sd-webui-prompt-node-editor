import type {
    LGraph as _LGraph,
    LGraphCanvas as _LGraphCanvas,
    LGraphNode as _LGraphNode,
    LGraphGroup as _LGraphGroup,
    LLink as _LLink,
    LiteGraph as _LiteGraph,
} from "litegraph.js";

declare global {
    var LGraph: typeof _LGraph;
    var LGraphCanvas: typeof _LGraphCanvas;
    var LGraphNode: typeof _LGraphNode;
    var LGraphGroup: typeof _LGraphGroup;
    var LLink: typeof _LLink;
    var LiteGraph: _LiteGraph;
}
