/**
 * Issue #3 / PR #18
 *
 * SKILL.md の P1「受理判定」の契約テスト。
 * requirements.md 第6節（適用しない文脈）・第9節 P1・第9.1節・第13節に対応する。
 */
const skill = require('../support/skill');

const HEADING = '## P1 受理判定';

describe('P1 受理判定の節', () => {
  test('節が存在する', () => {
    expect(() => skill.extractSection(skill.loadSkill().body, HEADING)).not.toThrow();
  });
});

describe('適用する条件', () => {
  const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

  test('C1・C2・C3 の3条件を列挙している', () => {
    expect(section()).toContain('C1');
    expect(section()).toContain('C2');
    expect(section()).toContain('C3');
  });

  test('C1 が入力の目印（シーンの並び・画面文言・想定尺）を示している', () => {
    expect(section()).toMatch(/シーン/);
    expect(section()).toMatch(/文言/);
    expect(section()).toMatch(/尺/);
  });
});

describe('適用しない文脈', () => {
  const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

  const CONTEXTS = [
    ['仕様書そのものの作成・添削', /仕様書そのもの.*(作成|添削)/],
    ['既存 mp4 の形式変換・切り出し・結合', /形式変換.*切り出し.*結合/],
    ['既存動画の要約・書き起こし', /要約.*書き起こし/],
    ['動画生成フレームワークの使い方・仕様の質問', /使い方.*質問/],
    ['実写素材・画面録画の編集依頼', /実写素材.*画面録画.*編集/],
    ['単一の操作のみで完了する要求', /単一の操作/],
  ];

  test.each(CONTEXTS)('%s が列挙されている', (_label, pattern) => {
    expect(section()).toMatch(pattern);
  });

  test('適用しない旨が明記されている', () => {
    expect(section()).toMatch(/適用しない/);
  });
});

describe('仕様書が提示されていない場合の扱い', () => {
  const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

  test('所在を1回だけ確認して待つことが書かれている', () => {
    expect(section()).toMatch(/1回/);
    expect(section()).toMatch(/所在/);
  });

  test('推測で補完しないことが書かれている', () => {
    expect(section()).toMatch(/推測で補完しない/);
  });

  test('提示された時点で P2 へ進むことが書かれている', () => {
    expect(section()).toMatch(/P2/);
  });
});

describe('完了条件', () => {
  test('P1 の完了条件が明記されている', () => {
    const section = skill.extractSection(skill.loadSkill().body, HEADING);

    expect(section).toMatch(/完了条件/);
  });
});

describe('extractSection', () => {
  test('存在しない見出しを指定した場合、見出しを含む例外を送出する', () => {
    expect(() =>
      skill.extractSection(skill.loadSkill().body, '## 存在しない節'),
    ).toThrow('## 存在しない節');
  });

  test('同じ階層の次の見出しの手前までを返す', () => {
    const body = ['## A', 'aaa', '### A-1', 'bbb', '## B', 'ccc'].join('\n');

    expect(skill.extractSection(body, '## A')).toBe('## A\naaa\n### A-1\nbbb');
  });
});
