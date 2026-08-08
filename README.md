# spec-to-mp4-video-skill

動画仕様書から mp4 を生成する Agent Skill を開発するリポジトリです。

仕様は `requirements.md` を Single Source of Truth とします。開発規約は `CLAUDE.md` を参照してください。

## リポジトリ構成

| パス | 内容 |
|---|---|
| `requirements.md` | 仕様書（SSOT） |
| `CLAUDE.md` | Claude Code 向けの開発規約 |
| `.claude/agents/` | agent 定義（10種） |
| `.claude/QC10.md` / `.claude/OWASP10.md` / `.claude/CC.md` | 品質・セキュリティ・コンプライアンスのチェックリスト |
| `.claude/Manager.md` | GitHub Issue ベース並列開発の運用 |
| `DOCS/` | 開発原則・テストメソッド・デザイン原則 |
| `SPEC/` | 仕様書とリバースエンジニアリングの図 |
| `TASKS/` | タスク |
| `DEBUG/` | バグ報告 |
| `CLIENT/` | クライアント要望 |
| `WORK/` | 作業報告 |
| `ENV/` | 開発環境・本番環境 |
| `app-ui/` | デザインモック（参照専用） |
| `DELETE/` | ゴミ箱 |
| `.github/workflows/ci.yml` | CI |
| `.github/scripts/` | CI が実行する検査スクリプト |

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

実測値は `ENV/DEVELOPMENT.md` を参照してください。環境変数は `.env` で管理し、値はコミットしません。
