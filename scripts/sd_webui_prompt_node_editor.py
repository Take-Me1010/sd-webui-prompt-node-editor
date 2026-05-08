import gradio as gr

from modules import script_callbacks

def on_ui_tabs() -> list[tuple[gr.Blocks, str, str]]:
    with gr.Blocks(analytics_enabled=False) as block:
        # TODO: ノードエディタの埋め込み
        # TODO: Send to txt2img / img2img ボタンの実装
        pass
    
    return [(block, "Prompts Node Editor", "prompts-node-editor")]

script_callbacks.on_ui_tabs(on_ui_tabs)
