# spec-to-mp4-video-skill

動画仕様書から mp4 を生成する Agent Skill を開発するリポジトリです。

仕様は `requirements.md` を Single Source of Truth とします。開発規約は `CLAUDE.md` を参照してください。

## リポジトリ構成

| パス | 内容 |
|---|---|
| `requirements.md` | 仕様書（SSOT） |
| `CLAUDE.md` | Claude Code 向けの開発規約 |
| `DOCS/` | 開発原則・テストメソッド・デザイン原則 |
| `SPEC/` | 仕様書とリバースエンジニアリングの図 |
| `app-ui/` | デザインモック（参照専用） |
| `.github/workflows/ci.yml` | CI |
| `.github/scripts/` | CI が実行する検査スクリプト |

agent 定義・チェックリスト・タスク・作業記録・環境情報はローカルで運用しており、リポジトリには含めていません（`.gitignore` を参照してください）。

## スキルの設置

このリポジトリを Single Source of Truth とし、Claude Code のスキルディレクトリへ symlink で設置します。設置先へファイルを複製しません。

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)" ~/.claude/skills/spec-to-mp4-video
```

設置できたことは次で確認します。

```bash
ls -l ~/.claude/skills/spec-to-mp4-video
head -n 2 ~/.claude/skills/spec-to-mp4-video/SKILL.md
```

`spec-to-mp4-video -> <このリポジトリのパス>` と表示され、`name: spec-to-mp4-video` が読めれば設置は完了です。

設置先に同名のパスがすでにある場合、`ln` は失敗します。既存のものを手動で退避してから実行してください。このリポジトリは削除を伴う操作を行いません。

設置状態をテストで確認する場合は、スキルディレクトリを環境変数で渡します。

```bash
CLAUDE_SKILLS_DIR="$HOME/.claude/skills" npm test
```

## テストの実行環境の前提

```bash
npm ci
npm test
```

`test/pr29` は、ディレクトリの symlink を実際に作成して設置を検証します。Windows でこのテストを実行する場合は、次のいずれかを満たしてください。

- 開発者モードを有効にする（設定 → プライバシーとセキュリティ → 開発者向け）
- 管理者権限のシェルで実行する

どちらも満たさない場合、Windows はディレクトリの symlink を作成できません。その環境では該当する6件のテストが自動でスキップされ、実行結果に次のように理由が表示されます。

```text
[test/pr29] symlink の作成を要するテストをスキップします: ディレクトリの symlink を作成できない環境です（EPERM）。...
Tests:       6 skipped, ... total
```

**スキップは不合格ではありません。** `failed` の表示が無ければ合格です。

Linux・macOS では前提を満たす必要はありません。symlink の検証はそのまま実行されます。

動作を確認した環境は次のとおりです。

| 項目 | 値 |
|---|---|
| 対象ツール | Claude Code 2.1.226 |
| 確認日時 | 2026-08-08 23:52 JST |

## 開発の進め方

- TDD を厳守します（`plan` → `red test` → `coding` → `green test`）
- main ブランチで作業しません
- `src/*` 以外の変更は main への push を許可します
- `src/*` の変更は必ず Pull Request を作成します
- commit 前に `/security-review` を実行します

詳細は `CLAUDE.md` を参照してください。

## CI

`.github/workflows/ci.yml` が push（main）と Pull Request で実行されます。

| ジョブ | 検査内容 |
|---|---|
| シークレット検査 | 禁止パスの追跡・資格情報の混入 |
| エンコーディング検査 | UTF-8 / BOM なし / LF |
| 表記規約検査 | 絵文字の不在、`alert()` / `confirm()` / `prompt()` の不使用 |
| 仕様検査 | `requirements.md` の必須節の存在 |
| ドキュメント検査 | Markdown の構文、mermaid ブロックの構造、README と SPEC の記載範囲 |
| ブランチ運用検査 | main への直接 push に `src/` の変更がないこと |

各スクリプトはローカルでも実行できます。

```bash
bash .github/scripts/check-secrets.sh
bash .github/scripts/check-encoding.sh
bash .github/scripts/check-no-emoji.sh
bash .github/scripts/check-forbidden-api.sh
bash .github/scripts/check-spec.sh
bash .github/scripts/check-mermaid.sh
bash .github/scripts/check-unimplemented-docs.sh
npx -y markdownlint-cli2
```

## 環境

環境変数は `.env` で管理し、値はコミットしません。
