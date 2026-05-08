import glob
import os

import gradio as gr
import yaml
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from modules import script_callbacks

TAGS_DIR = os.path.join(os.path.dirname(__file__), "..", "tags")


def load_node_definitions() -> list[dict]:
    results = []
    pattern = os.path.join(TAGS_DIR, "**", "*.y*ml")
    for path in glob.glob(pattern, recursive=True):
        if not (path.endswith(".yml") or path.endswith(".yaml")):
            continue
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        for top_key, value in data.items():
            if isinstance(value, list):
                results.append({"title": top_key, "tags": value})
            elif isinstance(value, dict):
                for child_key, tags in value.items():
                    results.append({"title": f"{top_key} / {child_key}", "tags": tags or []})
    return results


def on_app_started(_gr_app, app: FastAPI):
    @app.get("/sd-webui-prompt-node-editor/node-definitions")
    def node_definitions():
        return JSONResponse(content=load_node_definitions())


def on_ui_tabs() -> list[tuple[gr.Blocks, str, str]]:
    with gr.Blocks(analytics_enabled=False) as block:
        gr.HTML("""
            <link rel="stylesheet" href="/file=extensions/sd-webui-prompt-node-editor/javascript/litegraph.css">
            <canvas id="prompt-node-editor-canvas" width="1200" height="700"
                    style="border:1px solid #444; background:#1a1a1a; display:block;"></canvas>
            <div style="margin-top:8px; display:flex; gap:8px;">
                <button id="pne-copy-btn" class="gr-button">📋 Copy Prompt</button>
                <button id="pne-send-txt2img-btn" class="gr-button">→ Send to txt2img</button>
                <button id="pne-send-img2img-btn" class="gr-button">→ Send to img2img</button>
            </div>
        """)

    return [(block, "Prompts Node Editor", "prompts-node-editor")]


script_callbacks.on_app_started(on_app_started)
script_callbacks.on_ui_tabs(on_ui_tabs)
