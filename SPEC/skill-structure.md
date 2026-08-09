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
        UC3["台本を起こして承認を求める"]
        UC4["mp4 を生成する"]
        UC5["不足を提示して応答を待つ"]
        UC6["完了報告を返す"]
    end

    SKILL["SKILL.md<br/>spec-to-mp4-video"]

    USER --> UC1
    UC1 --> UC2
    UC2 -->|受理する| UC3
    UC2 -->|受理しない| UC5
    UC3 -->|承認を得た| UC4
    UC3 -->|承認を待つ| USER
    UC4 --> UC6
    UC5 --> USER
    UC6 --> USER
    SKILL -.->|手順を与える| UC2
    SKILL -.->|手順を与える| UC3
    SKILL -.->|手順を与える| UC4
```

## 状態遷移図

`SKILL.md` の9段と、停止・差し戻しの遷移を示す。段の名称は `SKILL.md` の節見出しと一致する。

```mermaid
stateDiagram-v2
    [*] --> P1
    state "P1 受理判定" as P1
    state "P2 読み取りと充足判定" as P2
    state "P3 情報収集" as P3
    state "P4 台本生成" as P4
    state "P5 規模判定" as P5
    state "P6 構成データ生成" as P6
    state "P7 環境準備" as P7
    state "P8 シーン実装とレンダリング" as P8
    state "P9 表示検証" as P9
    state "停止：欠落項目を列挙" as S1
    state "停止：対象範囲の指定を求める" as S2
    state "停止：フォントの導入を求める" as S3
    state "停止：出所の確認を求める" as S4
    state "停止：台本の承認を待つ" as S5
    state "完了報告" as DONE

    P1 --> P2 : C1・C2・C3 が成立
    P1 --> [*] : 適用しない
    P2 --> S1 : 必須項目が欠落
    P2 --> P3 : 充足
    P3 --> S4 : 出所を特定できない
    P3 --> P4 : 出所が揃う
    P4 --> S5 : 承認が得られない
    P4 --> P5 : 台本の承認を得た
    P5 --> S2 : 上限を超過
    P5 --> P6 : 範囲内
    P6 --> P7 : 尺が下限を満たす
    P7 --> S3 : 日本語グリフが欠落
    P7 --> P8 : 可用
    P8 --> P9
    P9 --> P8 : 差し戻し（判読性・余白・配色）
    P9 --> P6 : 差し戻し（尺の不足）
    P9 --> DONE : R1 から R5 を満たす
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
        SCRIPT["台本（承認を得た画面文言）"]
        DATA["構成データファイル"]
        PROJ["動画生成プロジェクト"]
        FRAMES["検証用静止画"]
        OUT["mp4（納品対象）"]
    end

    SK --> LINK
    TEST -.->|内容を検証する| SK
    LINK --> IN
    IN --> SCRIPT
    SCRIPT --> DATA
    DATA --> PROJ
    PROJ --> OUT
    OUT --> FRAMES
    FRAMES -.->|差し戻し（判読性・余白・配色）| PROJ
    FRAMES -.->|差し戻し（尺の不足）| DATA
```

リポジトリは `scripts` `references` `assets` を持たない。段階的な読み込みでは `name` と `description` が常時読み込まれ、本文は読み込みが必要になった時点で読まれる。参照ファイルを持たないため、3段目の読み込みは発生しない。
