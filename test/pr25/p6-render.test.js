/**
 * Issue #10 / PR #25
 *
 * SKILL.md の P6 のうち、レンダリングと出力仕様の契約テスト。
 * requirements.md 第8.1節（主成果物）・第9節 P6・第10.5節（範囲外）に対応する。
 */
const skill = require('../support/skill');

const PARENT_HEADING = '## P6 シーン実装とレンダリング';
const HEADING = '### レンダリング';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);
const parent = () => skill.extractSection(skill.loadSkill().body, PARENT_HEADING);

describe('レンダリングの節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });

  test('P6 の内側に置かれている', () => {
    expect(parent()).toContain(HEADING);
  });

  test('CLI でレンダリングすることが書かれている', () => {
    expect(section()).toMatch(/CLI/);
  });
});

describe('出力仕様', () => {
  const EXPECTED = [
    ['形式が mp4 である', /mp4/],
    ['コーデックが H.264 である', /H\.264/],
    ['解像度が 1920x1080 である', /1920\s*x\s*1080/],
    ['フレームレートが 30fps である', /30\s*fps/],
    ['音声を持たない', /音声/],
  ];

  test.each(EXPECTED)('%s', (_label, pattern) => {
    expect(section()).toMatch(pattern);
  });

  test('音声を持たないことが明示されている', () => {
    expect(section()).toMatch(/音声.*(なし|持たない)/);
  });

  test('出力先が仕様書の指定する出力先パスであることが書かれている', () => {
    expect(section()).toMatch(/出力先パス/);
  });
});

describe('同名ファイルが存在する場合', () => {
  test('上書きしないことが書かれている', () => {
    expect(section()).toMatch(/上書き(せず|しない)/);
  });

  test('連番を付与した別名で出力することが書かれている', () => {
    expect(section()).toMatch(/連番/);
    expect(section()).toMatch(/別名/);
  });

  test('既存ファイルの所在を完了報告に含めることが書かれている', () => {
    expect(section()).toMatch(/既存ファイル/);
    expect(section()).toMatch(/完了報告/);
  });
});

describe('範囲外', () => {
  const OUT_OF_SCOPE = [
    'ナレーション',
    '字幕',
    '3D',
    '外部レンダラ',
    'BGM',
    '効果音',
    'サムネイル',
    'アップロード',
  ];

  test.each(OUT_OF_SCOPE)('範囲外に %s が列挙されている', (item) => {
    expect(parent()).toContain(item);
  });
});

describe('完了条件', () => {
  test('P6 の完了条件が明記されている', () => {
    expect(parent()).toMatch(/完了条件/);
    expect(parent()).toMatch(/出力仕様/);
  });
});
