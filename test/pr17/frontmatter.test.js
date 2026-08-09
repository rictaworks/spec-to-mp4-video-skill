/**
 * Issue #2 / PR #17
 *
 * SKILL.md のフロントマターの契約テスト。
 * requirements.md 第3節（識別子）・第5節（ホスト固有フィールドを使わない）・
 * 第6節（発火判定を description に集約する）に対応する。
 */
const skill = require('../support/skill');

const ALLOWED_FRONTMATTER_KEYS = ['name', 'description'];

describe('SKILL.md の存在', () => {
  test('リポジトリルートに SKILL.md がある', () => {
    expect(() => skill.readSkill()).not.toThrow();
  });
});

describe('フロントマター', () => {
  const loaded = () => skill.loadSkill();

  test('name が spec-to-mp4-video である', () => {
    expect(loaded().frontmatter.name).toBe('spec-to-mp4-video');
  });

  test('ホスト固有のフィールドを持たない', () => {
    const keys = Object.keys(loaded().frontmatter);

    expect(keys.sort()).toEqual([...ALLOWED_FRONTMATTER_KEYS].sort());
    expect(keys).not.toContain('allowed-tools');
  });
});

describe('description', () => {
  const description = () => skill.loadSkill().frontmatter.description;

  test('文字列であり、1行で書かれている', () => {
    expect(typeof description()).toBe('string');
    expect(description()).not.toContain('\n');
  });

  test('何をするかを含む（動画仕様書を入力とし mp4 を生成する）', () => {
    expect(description()).toContain('動画仕様書');
    expect(description()).toContain('mp4');
    expect(description()).toMatch(/生成する|作成する/);
  });

  test('入力の目印となる要素を含む', () => {
    expect(description()).toMatch(/シーン/);
    expect(description()).toMatch(/文言|テキスト/);
    expect(description()).toMatch(/尺|秒/);
  });

  test('どの文脈で使うかを含む', () => {
    expect(description()).toMatch(/場面|とき|場合/);
    expect(description()).toMatch(/求められ|依頼/);
  });

  test('既存動画の編集・変換・要約では使わないこと（C3）を含む', () => {
    expect(description()).toMatch(/既存/);
    expect(description()).toMatch(/編集/);
    expect(description()).toMatch(/変換/);
    expect(description()).toMatch(/要約/);
    expect(description()).toMatch(/使用しない|用いない/);
  });
});

describe('本文', () => {
  const body = () => skill.loadSkill().body;

  test('本文が存在する', () => {
    expect(body().trim().length).toBeGreaterThan(0);
  });

  test('見出しから始まる', () => {
    expect(body().trim()).toMatch(/^# /);
  });

  test('発火判定を本文へ重複して持たない（description に集約する）', () => {
    expect(body()).not.toContain('発火');
  });

  test('9段の手順で構成することを宣言している', () => {
    expect(body()).toMatch(/P1/);
    expect(body()).toMatch(/P9/);
    expect(body()).toMatch(/完了条件/);
  });
});
