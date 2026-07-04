# sd-webui-prompt-node-editor

## 概要

画像生成のプロンプトは、多くの場合次のように分類されるタグの結合で構成される：
- 品質
  - masterpiece, best quality
- 人数の指定
  - 1girl, 1boy, solo
- キャラの指定
  - LoRA のトリガーワードなど
- 髪の指定
  - 髪色
  - 髪型
- 服装
- 顔の指定
  - 表情・感情
    - smile / blush など
  - 口・目の色・状態
    - blue eyes / closed eyes など
  - 目線
    - looking at viewer など
  - 呼吸
- 場所・シーン・背景の指定
  - indoor, on bed など
  - night, festival, fireworks など
- 動作・姿勢の指定
  - 体全体
    - lying など
  - 手の動き
  - 脚の動き
    - spread legs など
- 可視部分・フェチの指定
  - collarbone など
- 状態の補足
  - sweat など
- アングル
  - upper body, from below / from behind / from above ... など
- モーション
  - motion lines など

この拡張機能では、上記のような分類別のノードを用意して、各ノードで選択したタグを結合したプロンプトを出力する仕組みを提供する。

## 仕様

各ノードでは、入力として文字列（前段ノードの出力プロンプト）を受け取る。ユーザーは設定されたタグを複数選択可能であり、それらをカンマ区切りで結合したプロンプトを、入力の後にくっつけて出力とする。
最終出力ノードが存在し、そのノードの入力につなげたプロンプトを、ユーザーはクリップボードにコピーできる。また、txt2txt / img2img に直接設定することもできる。

### 設定

tags/ ディレクトリに、yaml ファイルを置く。
ファイル名毎に設定を読み込むことができる。

```yaml
顔:
  "表情・感情":
    - smile
    - blush
  目線:
    - looking at viewer
    - looking up

アングル:
  - upper body
  - from below
```

上記のような設定の時は、"顔 / 表情・感情", "顔 / 目線", "アングル" というタイトルのノードが作成され、タグがそれぞれのノードで選択可能。
他の yaml ファイルを読み込む仕組みもサポートしました。`includes` がキーの時は、他のファイルの内容を展開します。

```yaml
includes:
  - "template.yaml"

舞台:
  - "school"
  - "indoor"
```

品質系プロンプトなどをまとめた yaml ファイルと、特定のキャラクター LoRA やシーンに特化したプロンプトを記載した yaml ファイルを分けて管理することができます。
