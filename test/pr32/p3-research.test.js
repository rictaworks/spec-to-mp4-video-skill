/**
 * Issue #31 / PR #32
 *
 * SKILL.md の P3「情報収集」の契約テスト。
 * 逐語一致を要する文字列を、出所を特定できる情報源から集める段である。
 * requirements.md 第7.3節・第9節 P3・第9.1節に対応する。
 */
const skill = require('../support/skill');

const HEADING = '## P3 情報収集';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('P3 の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });

  test('P2 と P4 の間に置かれている', () => {
    const lines = skill.loadSkill().bodyLines;
    const indexOf = (heading) => lines.findIndex((line) => line === heading);

    expect(indexOf('## P2 読み取りと充足判定')).toBeLessThan(indexOf(HEADING));
    expect(indexOf(HEADING)).toBeLessThan(indexOf('## P4 台本生成'));
  });
});

describe('収集の対象', () => {
  const TARGETS = [
    ['視聴者が入力するコマンド', /コマンド/],
    ['依頼文', /依頼文/],
    ['バージョン番号', /バージョン/],
    ['対象が出力する文言の要点', /出力する文言の要点/],
  ];

  test.each(TARGETS)('逐語一致を要する対象に %s が列挙されている', (_label, pattern) => {
    expect(section()).toMatch(pattern);
  });

  test('逐語一致という基準を示している', () => {
    expect(section()).toMatch(/逐語/);
  });
});

describe('出所の扱い', () => {
  test('出所を特定できる情報源から集めることが書かれている', () => {
    expect(section()).toMatch(/出所/);
    expect(section()).toMatch(/情報源/);
  });

  test('収集した文字列と出所を対応づけて記録することが書かれている', () => {
    expect(section()).toMatch(/記録/);
  });

  test('出所を特定できない事実は停止条件であることが書かれている', () => {
    expect(section()).toMatch(/出所を特定できない/);
    expect(section()).toMatch(/停止/);
  });

  test('推測で埋めないことが書かれている', () => {
    expect(section()).toMatch(/推測で(埋めない|補わない|補完しない)/);
  });
});

describe('通過する場合', () => {
  test('逐語一致を要する文字列が無い場合の扱いが書かれている', () => {
    expect(section()).toMatch(/該当(が|する文字列が)?(無い|ない)/);
  });
});

describe('停止時の提示文', () => {
  const notice = () =>
    skill.extractSection(skill.loadSkill().body, '## 停止時の提示文');

  test('出所を特定できない場合の文面がある', () => {
    expect(notice()).toMatch(/出所/);
  });
});

describe('完了条件', () => {
  test('逐語指定した文字列すべてに出所が紐づいていることが完了条件である', () => {
    expect(section()).toMatch(/完了条件/);
    expect(section()).toMatch(/完了条件[^\n]*出所/);
  });
});
