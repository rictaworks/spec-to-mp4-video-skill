/**
 * Issue #31 / PR #32
 *
 * SKILL.md の P4「台本生成」の契約テスト。
 * シーンの主張から画面に表示する文言そのものを起こし、承認を得る段である。
 * requirements.md 第7.1節・第9節 P4・第9.1節に対応する。
 */
const skill = require('../support/skill');

const HEADING = '## P4 台本生成';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('P4 の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });
});

describe('台本の生成', () => {
  test('シーンの主張から画面表示テキストを起こすことが書かれている', () => {
    expect(section()).toMatch(/主張/);
    expect(section()).toMatch(/画面表示テキスト/);
  });

  test('画面要素の記述を手がかりにすることが書かれている', () => {
    expect(section()).toMatch(/画面要素/);
  });

  test('仕様書に文言が確定している場合は原文をそのまま採用することが書かれている', () => {
    expect(section()).toMatch(/原文/);
  });
});

describe('逐語と要点の区分', () => {
  test('各文字列に区分を持たせることが書かれている', () => {
    expect(section()).toMatch(/区分/);
    expect(section()).toMatch(/逐語/);
    expect(section()).toMatch(/要点/);
  });

  test('逐語のものは P3 の収集結果を使うことが書かれている', () => {
    expect(section()).toMatch(/P3/);
  });

  test('要点のものはこの手順の側で書いてよいことが書かれている', () => {
    expect(section()).toMatch(/要点[^。]*(書く|書いて)/);
  });
});

describe('承認', () => {
  test('生成した台本を利用者へ提示することが書かれている', () => {
    expect(section()).toMatch(/提示/);
  });

  test('承認を得るまで次段へ進まないことが書かれている', () => {
    expect(section()).toMatch(/承認/);
    expect(section()).toMatch(/次段へ進まない/);
  });

  test('承認前に副作用を起こさないことが書かれている', () => {
    expect(section()).toMatch(/承認/);
    expect(section()).toMatch(/(プロジェクト|レンダリング)/);
  });
});

describe('停止時の提示文', () => {
  const notice = () =>
    skill.extractSection(skill.loadSkill().body, '## 停止時の提示文');

  test('台本の承認を求める文面がある', () => {
    expect(notice()).toMatch(/台本/);
  });

  test('文面がコードブロックとして用意されている', () => {
    const blocks = [...notice().matchAll(/```text\n([\s\S]*?)```/g)].map(
      (matched) => matched[1],
    );

    expect(blocks.length).toBeGreaterThanOrEqual(6);
    expect(blocks.some((block) => block.includes('台本'))).toBe(true);
  });
});

describe('完了条件', () => {
  test('全シーンの画面表示テキストが確定し承認を得ていることが完了条件である', () => {
    expect(section()).toMatch(/完了条件[^\n]*確定/);
    expect(section()).toMatch(/完了条件[^\n]*承認/);
  });
});
