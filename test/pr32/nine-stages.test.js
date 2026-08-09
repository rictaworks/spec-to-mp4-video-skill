/**
 * Issue #31 / PR #32
 *
 * 手順が9段で構成されることの契約テスト。
 * P2 と P3 の間へ「情報収集」「台本生成」を追加したことにより、
 * 既存の段が繰り下がる。段の名称・順序・参照先の整合を検証する。
 *
 * requirements.md 第7.1節・第7.3節・第9節・第9.1節・第14節に対応する。
 */
const fs = require('node:fs');
const path = require('node:path');

const skill = require('../support/skill');

const SPEC_PATH = path.join(skill.REPO_ROOT, 'SPEC', 'skill-structure.md');
const REQUIREMENTS_PATH = path.join(skill.REPO_ROOT, 'requirements.md');

const EXPECTED_STAGES = [
  'P1 受理判定',
  'P2 読み取りと充足判定',
  'P3 情報収集',
  'P4 台本生成',
  'P5 規模判定',
  'P6 構成データ生成',
  'P7 環境準備',
  'P8 シーン実装とレンダリング',
  'P9 表示検証',
];

const body = () => skill.loadSkill().body;

/** SKILL.md の本文から P 段の見出し名を順序どおりに返す */
function stageHeadings() {
  return skill
    .loadSkill()
    .bodyLines.map((line) => line.match(/^## (P\d .+)$/))
    .filter((matched) => matched !== null)
    .map((matched) => matched[1]);
}

/** 指定したファイルを読む。存在しない場合はパスを含む例外を送出する */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

describe('段の構成', () => {
  test('P1 から P9 までの9段で構成することを宣言している', () => {
    expect(body()).toMatch(/P1 から P9 までの9段/);
  });

  test('段の見出しが9件ある', () => {
    expect(stageHeadings()).toHaveLength(9);
  });

  test('段の見出しが期待する名称と順序で並んでいる', () => {
    expect(stageHeadings()).toEqual(EXPECTED_STAGES);
  });

  test.each(EXPECTED_STAGES)('冒頭の一覧に %s が現れる', (stage) => {
    const [number, name] = stage.split(' ');

    expect(body()).toMatch(
      new RegExp(`\\|\\s*${number}\\s*\\|\\s*${name}\\s*\\|`),
    );
  });
});

describe('全段に共通する原則', () => {
  const section = () =>
    skill.extractSection(body(), '## 全段に共通する原則');

  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });

  test('創作を禁じる対象が事実である', () => {
    expect(section()).toMatch(/事実[^。]*創作しない/);
  });

  test('文言そのものの創作を禁じていない', () => {
    expect(section()).not.toMatch(/文言[^。]*を創作しない/);
  });

  test('画面に表示する文言を台本生成で書くことが書かれている', () => {
    expect(section()).toMatch(/台本生成/);
  });
});

describe('本文全体の整合', () => {
  test('仕様書に書かれていない文言を創作しないという記述が残っていない', () => {
    expect(body()).not.toMatch(/書かれていない文言/);
  });

  test('要点で足りるという P8 の基準と矛盾しない', () => {
    const p8 = skill.extractSection(body(), '## P8 シーン実装とレンダリング');

    expect(p8).toMatch(/要点/);
  });
});

describe('P5 規模判定への追記', () => {
  const section = () => skill.extractSection(body(), '## P5 規模判定');

  test('入力文書が優先度・スキップ可否を明示している場合の扱いが書かれている', () => {
    expect(section()).toMatch(/優先度/);
    expect(section()).toMatch(/スキップ/);
    expect(section()).toMatch(/根拠/);
  });

  test('根拠のない間引きを行わないことが書かれている', () => {
    expect(section()).toMatch(/間引/);
  });

  test('尺の下限式の参照先が P6 になっている', () => {
    expect(section()).toMatch(/P6/);
    expect(section()).not.toMatch(/P4 の尺の下限/);
  });
});

describe('差し戻し先の更新', () => {
  test('P9 の差し戻し先が P8 と P6 である', () => {
    const p9 = skill.extractSection(body(), '## P9 表示検証');

    expect(p9).toMatch(/P8/);
    expect(p9).toMatch(/P6/);
    expect(p9).not.toMatch(/P7 をやり直す/);
  });

  test('尺の下限の節が P5 の上限を参照する', () => {
    const floor = skill.extractSection(body(), '### 尺の下限');

    expect(floor).toMatch(/P5/);
  });
});

describe('requirements.md との整合', () => {
  const requirements = () => readFile(REQUIREMENTS_PATH);

  test.each(EXPECTED_STAGES)('第9節の表に %s が現れる', (stage) => {
    const [number, name] = stage.split(' ');

    expect(requirements()).toMatch(
      new RegExp(`\\|\\s*${number}\\s*\\|\\s*${name}\\s*\\|`),
    );
  });

  test('手順を9段で構成すると書かれている', () => {
    expect(requirements()).toMatch(/手順を9段で構成する/);
  });

  test('必須のシーン定義に画面表示テキストを含めない', () => {
    const scope = requirements().slice(
      requirements().indexOf('### 7.1 必須項目'),
      requirements().indexOf('### 7.2 任意項目'),
    );

    expect(scope).not.toMatch(/\|\s*画面表示テキスト\s*\|/);
    expect(scope).toMatch(/\|\s*主張\s*\|/);
  });

  test('不足時の扱いが事実の創作を禁じている', () => {
    const scope = requirements().slice(
      requirements().indexOf('### 7.3 不足時の扱い'),
    );

    expect(scope.slice(0, 600)).toMatch(/事実[^。]*創作しない/);
  });

  test('手順フロー図が P9 まで持つ', () => {
    const scope = requirements().slice(requirements().indexOf('## 14. 手順'));

    expect(scope).toMatch(/P9\[P9 表示検証\]/);
    expect(scope).toMatch(/P3\[P3 情報収集\]/);
    expect(scope).toMatch(/P4\[P4 台本生成\]/);
  });
});

describe('SPEC/skill-structure.md との整合', () => {
  const spec = () => readFile(SPEC_PATH);

  test('9段であることが書かれている', () => {
    expect(spec()).toMatch(/9段/);
    expect(spec()).not.toMatch(/7段/);
  });

  test.each(EXPECTED_STAGES)('状態遷移図に %s が現れる', (stage) => {
    expect(spec()).toContain(stage);
  });

  test('台本の承認の停止が図に現れる', () => {
    expect(spec()).toMatch(/承認/);
  });

  test('出所を特定できない場合の停止が図に現れる', () => {
    expect(spec()).toMatch(/出所/);
  });
});
