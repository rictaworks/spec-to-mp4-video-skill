/**
 * Issue #1 / PR #16
 *
 * テスト基盤の契約テスト。
 * test/support/skill.js が、SKILL.md の読み込みとフロントマターの分解を
 * 例外送出つきで提供することを検証する。
 *
 * 外部サーバへは接続しない。検証対象はリポジトリ内のファイルのみとする。
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const skill = require('../support/skill');

/** テスト用の SKILL.md を一時ディレクトリへ書き出し、そのパスを返す */
function writeFixture(contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-fixture-'));
  const file = path.join(dir, 'SKILL.md');
  fs.writeFileSync(file, contents, 'utf8');
  return file;
}

const VALID_FIXTURE = [
  '---',
  'name: sample-skill',
  'description: 見本の説明文です。',
  '---',
  '',
  '# 見本',
  '',
  '本文の1行目。',
  '',
].join('\n');

describe('skillPath', () => {
  test('リポジトリルートの SKILL.md を絶対パスで返す', () => {
    const resolved = skill.skillPath();

    expect(path.isAbsolute(resolved)).toBe(true);
    expect(path.basename(resolved)).toBe('SKILL.md');
    expect(path.dirname(resolved)).toBe(path.resolve(__dirname, '..', '..'));
  });
});

describe('readSkill', () => {
  test('指定したファイルの内容をそのまま返す', () => {
    const file = writeFixture(VALID_FIXTURE);

    expect(skill.readSkill(file)).toBe(VALID_FIXTURE);
  });

  test('ファイルが存在しない場合、パスを含む例外を送出する', () => {
    const missing = path.join(os.tmpdir(), 'not-exist-skill-file', 'SKILL.md');

    expect(() => skill.readSkill(missing)).toThrow(missing);
  });
});

describe('parseSkill', () => {
  test('フロントマターと本文を分解する', () => {
    const parsed = skill.parseSkill(VALID_FIXTURE);

    expect(parsed.frontmatter.name).toBe('sample-skill');
    expect(parsed.frontmatter.description).toBe('見本の説明文です。');
    expect(parsed.body).toContain('# 見本');
    expect(parsed.body).not.toContain('name: sample-skill');
  });

  test('本文の行配列を返す', () => {
    const parsed = skill.parseSkill(VALID_FIXTURE);

    expect(Array.isArray(parsed.bodyLines)).toBe(true);
    expect(parsed.bodyLines).toContain('# 見本');
  });

  test('フロントマターが無い場合、例外を送出する', () => {
    expect(() => skill.parseSkill('# 見出しだけの文書\n')).toThrow(
      /フロントマター/,
    );
  });

  test('フロントマターが閉じられていない場合、例外を送出する', () => {
    expect(() => skill.parseSkill('---\nname: x\n\n# 本文\n')).toThrow(
      /フロントマター/,
    );
  });

  test('既定値による補完を行わず、欠けたキーは undefined のままとする', () => {
    const parsed = skill.parseSkill('---\nname: only-name\n---\n\n本文\n');

    expect(parsed.frontmatter.description).toBeUndefined();
  });
});

describe('loadSkill', () => {
  test('読み込みと分解をまとめて行う', () => {
    const file = writeFixture(VALID_FIXTURE);
    const loaded = skill.loadSkill(file);

    expect(loaded.frontmatter.name).toBe('sample-skill');
    expect(loaded.raw).toBe(VALID_FIXTURE);
    expect(loaded.lineCount).toBe(VALID_FIXTURE.split('\n').length);
  });
});
