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
        # TODO: ノードエディタの埋め込み
        # TODO: Send to txt2img / img2img ボタンの実装
        pass

    return [(block, "Prompts Node Editor", "prompts-node-editor")]


script_callbacks.on_app_started(on_app_started)
script_callbacks.on_ui_tabs(on_ui_tabs)
