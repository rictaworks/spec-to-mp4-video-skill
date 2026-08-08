# SKILL.md の構造

リポジトリのルートにある `SKILL.md` を読み取り、その構造を図に起こしたものである。図の内容は `SKILL.md` の記載と対応する。

対象: `SKILL.md`（`name: spec-to-mp4-video`）

## ユースケース図

利用者・エージェント・スキルの関係を示す。

```mermaid
flowchart LR
    USER(["利用者"])

    subgraph AGENT["エージェント（Claude Code）"]
        UC1["動画仕様書を受け取る"]
        UC2["受理できるかを判定する"]
        UC3["mp4 を生成する"]
        UC4["不足を提示して応答を待つ"]
        UC5["完了報告を返す"]
    end

    SKILL["SKILL.md<br/>spec-to-mp4-video"]

    USER --> UC1
    UC1 --> UC2
    UC2 -->|受理する| UC3
    UC2 -->|受理しない| UC4
    UC3 --> UC5
    UC4 --> USER
    UC5 --> USER
    SKILL -.->|手順を与える| UC2
    SKILL -.->|手順を与える| UC3
```

## 状態遷移図

`SKILL.md` の7段と、停止・差し戻しの遷移を示す。段の名称は `SKILL.md` の節見出しと一致する。

```mermaid
stateDiagram-v2
    [*] --> P1
    state "P1 受理判定" as P1
    state "P2 読み取りと充足判定" as P2
    state "P3 規模判定" as P3
    state "P4 構成データ生成" as P4
    state "P5 環境準備" as P5
    state "P6 シーン実装とレンダリング" as P6
    state "P7 表示検証" as P7
    state "停止：欠落項目を列挙" as S1
    state "停止：対象範囲の指定を求める" as S2
    state "停止：フォントの導入を求める" as S3
    state "完了報告" as DONE

    P1 --> P2 : C1・C2・C3 が成立
    P1 --> [*] : 適用しない
    P2 --> S1 : 必須項目が欠落
    P2 --> P3 : 充足
    P3 --> S2 : 上限を超過
    P3 --> P4 : 範囲内
    P4 --> P5 : 尺が下限を満たす
    P5 --> S3 : 日本語グリフが欠落
    P5 --> P6 : 可用
    P6 --> P7
    P7 --> P6 : 差し戻し（判読性・余白・配色）
    P7 --> P4 : 差し戻し（尺の不足）
    P7 --> DONE : R1 から R5 を満たす
    DONE --> [*]
```

## リソース構成図

配布物・設置先・実行時の生成物の関係を示す。

```mermaid
flowchart LR
    subgraph REPO["リポジトリ spec-to-mp4-video-skill"]
        SK["SKILL.md"]
        TEST["test/（検証テスト）"]
    end

    subgraph HOST["設置先"]
        LINK["~/.claude/skills/spec-to-mp4-video<br/>（symlink）"]
    end

    subgraph WORK["実行時の作業ディレクトリ"]
        IN["動画仕様書（入力）"]
        DATA["構成データファイル"]
        PROJ["動画生成プロジェクト"]
        FRAMES["検証用静止画"]
        OUT["mp4（納品対象）"]
    end

    SK --> LINK
    TEST -.->|内容を検証する| SK
    LINK --> IN
    IN --> DATA
    DATA --> PROJ
    PROJ --> OUT
    OUT --> FRAMES
    FRAMES -.->|差し戻し（判読性・余白・配色）| PROJ
    FRAMES -.->|差し戻し（尺の不足）| DATA
```

リポジトリは `scripts` `references` `assets` を持たない。段階的な読み込みでは `name` と `description` が常時読み込まれ、本文は読み込みが必要になった時点で読まれる。参照ファイルを持たないため、3段目の読み込みは発生しない。
