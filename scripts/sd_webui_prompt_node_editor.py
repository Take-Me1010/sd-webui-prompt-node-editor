import glob
import os

import gradio as gr
import yaml
from fastapi import FastAPI
from fastapi.responses import JSONResponse

import modules.infotext_utils as parameters_copypaste
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
        with gr.Row():
            with gr.Column(scale=1, elem_id="pne-canvas-col"):
                gr.HTML("""
                    <link rel="stylesheet" href="/file=extensions/sd-webui-prompt-node-editor/javascript/litegraph.css">
                    <canvas id="prompt-node-editor-canvas"
                            style="border:1px solid #444; background:#1a1a1a; display:block; width:100%;"></canvas>
                """)
            with gr.Column(scale=1):
                prompt_output = gr.Textbox(
                    label="Generated Prompt",
                    elem_id="pne-prompt-output",
                    interactive=False,
                    max_lines=20,
                    lines=3,
                )
                with gr.Row():
                    gr.Button("📋 Copy Prompt", elem_id="pne-copy-btn")
                    buttons = parameters_copypaste.create_buttons(["txt2img", "img2img"])
                parameters_copypaste.bind_buttons(buttons, None, prompt_output)

    return [(block, "Prompts Node Editor", "prompts-node-editor")]


script_callbacks.on_app_started(on_app_started)
script_callbacks.on_ui_tabs(on_ui_tabs)
