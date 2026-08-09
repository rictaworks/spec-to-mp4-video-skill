/**
 * Issue #7 / PR #22
 *
 * SKILL.md の尺の下限式の契約テスト。
 * requirements.md 第7.3節・第9.1節・第9.3節に対応する。
 */
const skill = require('../support/skill');

const HEADING = '### 尺の下限';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('尺の下限の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });

  test('P6 の内側に置かれている', () => {
    const p6 = skill.extractSection(skill.loadSkill().body, '## P6 構成データ生成');

    expect(p6).toContain(HEADING);
  });
});

describe('下限式', () => {
  test('画面表示テキストの総文字数を用いる', () => {
    expect(section()).toMatch(/総文字数/);
  });

  test('毎秒6文字で除する', () => {
    expect(section()).toMatch(/(毎秒\s*6\s*文字|6\s*文字\s*\/\s*秒)/);
  });

  test('表示前後の余白2秒を加える', () => {
    expect(section()).toMatch(/2\s*秒/);
    expect(section()).toMatch(/余白/);
  });

  test('式として示している', () => {
    expect(section()).toMatch(/下限/);
    expect(section()).toMatch(/[÷/]|除/);
  });
});

describe('指定尺が下限を下回る場合', () => {
  test('下限値を採用することが書かれている', () => {
    expect(section()).toMatch(/下限値を採用/);
  });

  test('差分を報告することが書かれている', () => {
    expect(section()).toMatch(/差分/);
    expect(section()).toMatch(/報告/);
  });
});

describe('想定尺が欠けている場合', () => {
  test('算出値を提示することが書かれている', () => {
    expect(section()).toMatch(/提示/);
  });

  test('承認を得たうえで再開することが書かれている', () => {
    expect(section()).toMatch(/承認/);
    expect(section()).toMatch(/再開/);
  });
});

describe('総尺との接続', () => {
  test('採用後の尺の合計が P5 の上限に収まることを確認する手順がある', () => {
    expect(section()).toMatch(/P5/);
    expect(section()).toMatch(/総尺/);
  });
});
