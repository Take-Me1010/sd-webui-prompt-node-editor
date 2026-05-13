from pathlib import Path
import typing as tp

import gradio as gr
import yaml
from fastapi import FastAPI
from fastapi.responses import JSONResponse

import modules.infotext_utils as parameters_copypaste
from modules import script_callbacks
from modules.ui_common import ToolButton, create_refresh_button

class TagsGroup(tp.TypedDict):
    title: str
    group: str
    tags: list[str]

def tags_files():
    TAGS_DIR = Path(__file__).parent / ".." / "tags"

    for path in TAGS_DIR.rglob("*.yaml"):
        yield path
    
    for path in TAGS_DIR.rglob("*.yml"):
        yield path


def parse_tags_file(path: Path) -> list[TagsGroup]:
    with path.open(encoding="utf-8") as f:
        data: dict = yaml.safe_load(f) or {} #type: ignore

    result: list[TagsGroup] = []
    for top_key, value in data.items():
        if isinstance(value, list):
            result.append({"title": top_key, "group": top_key, "tags": value})
        elif isinstance(value, dict):
            for child_key, tags in value.items():
                result.append({"title": f"{top_key} / {child_key}", "group": top_key, "tags": tags or []})

    return result

def load_node_definitions(file_stem: str | None = None) -> list[TagsGroup]:
    """

    Args:
        file_stem (str | None, optional): 読み込むファイルの指定。None なら全てを返す. Defaults to None.

    Returns:
        list[TagsGroup]: 
    """
    if file_stem is None:
        results: list[TagsGroup] = []
        for path in tags_files():
            results.extend(parse_tags_file(path))

        return results
    
    else:
        for path in tags_files():
            if path.stem == file_stem:
                return parse_tags_file(path)

        return []


def on_app_started(_gr_app, app: FastAPI):
    @app.get("/sd-webui-prompt-node-editor/node-definitions")
    def node_definitions(file: str):
        return JSONResponse(content=load_node_definitions(file))

class PromptNodeEditor:
    def __init__(self):
        self.load_tag_files()
    
    def load_tag_files(self):
        self.files = [path.name for path in tags_files()]
    
    def ui(self):
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
                    
                    with gr.Row():
                        file_selector = gr.Dropdown(
                            choices=self.files,
                            label="Node Definition File",
                            elem_id="pne-file-selector",
                            value=self.files[0],
                        )
                        ToolButton(
                            value="📋",
                            elem_id="pne-file-load-btn"
                        )
                        create_refresh_button(
                            file_selector,
                            self.load_tag_files,
                            lambda: {"choices": self.files},
                            "pne-file-selector-refresh",
                        )

        return [(block, "Prompts Node Editor", "prompts-node-editor")]

def on_ui_tabs() -> list[tuple[gr.Blocks, str, str]]:
    editor = PromptNodeEditor()
    return editor.ui()

script_callbacks.on_app_started(on_app_started)
script_callbacks.on_ui_tabs(on_ui_tabs)
