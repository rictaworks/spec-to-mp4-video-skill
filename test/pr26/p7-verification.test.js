/**
 * Issue #11 / PR #26
 *
 * SKILL.md の P9「表示検証」の契約テスト。
 * requirements.md 第9節 P9・第9.1節・第10.3節（可読性）・第10.4節（検証）に対応する。
 */
const skill = require('../support/skill');

const HEADING = '## P9 表示検証';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('P9 の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });
});

describe('検証の方法', () => {
  test('各シーンの先頭・中間・末尾のフレームを抽出することが書かれている', () => {
    expect(section()).toMatch(/先頭/);
    expect(section()).toMatch(/中間/);
    expect(section()).toMatch(/末尾/);
  });

  test('静止画として抽出して判定することが書かれている', () => {
    expect(section()).toMatch(/静止画/);
    expect(section()).toMatch(/抽出/);
  });

  test('目視の主張のみで合格としないことが書かれている', () => {
    expect(section()).toMatch(/判定/);
  });
});

describe('可読性の要件', () => {
  test('文字サイズが縦解像度の3%以上・32px以上であることが書かれている', () => {
    expect(section()).toMatch(/3\s*%/);
    expect(section()).toMatch(/32\s*px/);
  });

  test('上下左右5%の安全余白の内側に収めることが書かれている', () => {
    expect(section()).toMatch(/5\s*%/);
    expect(section()).toMatch(/安全余白/);
  });

  test('2倍速再生でも判読できることが書かれている', () => {
    expect(section()).toMatch(/2\s*倍速/);
    expect(section()).toMatch(/判読/);
  });

  test('グレースケールでも意味が失われない配色であることが書かれている', () => {
    expect(section()).toMatch(/グレースケール/);
    expect(section()).toMatch(/色のみで区別/);
  });

  test('音声を再生できない環境でも画面のみで成立することが書かれている', () => {
    expect(section()).toMatch(/音声を再生できない/);
    expect(section()).toMatch(/画面のみ/);
  });
});

describe('差し戻し', () => {
  test('判読性・はみ出しの不適合は P8 へ差し戻すことが書かれている', () => {
    expect(section()).toMatch(/判読性|はみ出し/);
    expect(section()).toMatch(/P8/);
    expect(section()).toMatch(/差し戻/);
  });

  test('尺の不足は P6 へ差し戻すことが書かれている', () => {
    expect(section()).toMatch(/尺/);
    expect(section()).toMatch(/P6/);
  });
});

describe('完了条件', () => {
  test('P9 の完了条件が明記されている', () => {
    expect(section()).toMatch(/完了条件/);
    expect(section()).toMatch(/全(要件|項目)/);
  });
});
