/**
 * Issue #5 / PR #20
 *
 * SKILL.md の P5「規模判定」の契約テスト。
 * requirements.md 第9節 P5・第9.1節・第9.2節に対応する。
 */
const skill = require('../support/skill');

const HEADING = '## P5 規模判定';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('P5 の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });
});

describe('規模の上限', () => {
  test('シーン数の上限が8である', () => {
    expect(section()).toMatch(/シーン数/);
    expect(section()).toMatch(/8/);
  });

  test('総尺の上限が120秒である', () => {
    expect(section()).toMatch(/総尺/);
    expect(section()).toMatch(/120\s*秒/);
  });

  test('上限を表として示している', () => {
    expect(section()).toMatch(/\|\s*上限\s*\|/);
  });
});

describe('上限を超えた場合の扱い', () => {
  test('先頭からの部分生成を行わないことが書かれている', () => {
    expect(section()).toMatch(/部分生成を行わ(ない|ず)/);
  });

  test('処理を停止することが書かれている', () => {
    expect(section()).toMatch(/停止/);
  });

  test('対象範囲の明示的な指定を求めることが書かれている', () => {
    expect(section()).toMatch(/対象範囲/);
    expect(section()).toMatch(/指定/);
  });
});

describe('完了条件', () => {
  test('P5 の完了条件が明記されている', () => {
    expect(section()).toMatch(/完了条件/);
    expect(section()).toMatch(/範囲内/);
  });
});
