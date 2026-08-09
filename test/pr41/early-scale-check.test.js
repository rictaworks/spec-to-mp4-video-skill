/**
 * Issue #35 / PR #41
 *
 * 規模判定を2回に分けることの契約テスト。
 *
 * 全シーンに想定尺が揃っている場合は、台本を書く前に想定尺の合計で判定できる。
 * 想定尺が欠けている場合は尺の下限式が要るため、従来どおり P4 の後に判定する。
 * 前倒し判定を通過しても、下限式で尺が伸びるため確定判定を省略しない。
 *
 * requirements.md 第9節・第9.1節・第9.2節・第14節に対応する。
 */
const fs = require('node:fs');
const path = require('node:path');

const skill = require('../support/skill');

const SPEC_PATH = path.join(skill.REPO_ROOT, 'SPEC', 'skill-structure.md');
const REQUIREMENTS_PATH = path.join(skill.REPO_ROOT, 'requirements.md');

const body = () => skill.loadSkill().body;
const p2 = () => skill.extractSection(body(), '## P2 読み取りと充足判定');
const p5 = () => skill.extractSection(body(), '## P5 規模判定');

/** 指定したファイルを読む。存在しない場合はパスを含む例外を送出する */
function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

/** requirements.md の指定した節の範囲を切り出す */
function requirementsSection(startHeading, endHeading) {
  const text = readFile(REQUIREMENTS_PATH);
  const start = text.indexOf(startHeading);

  if (start === -1) {
    throw new Error(`節が見つかりません: ${startHeading}`);
  }

  const end = text.indexOf(endHeading, start);

  if (end === -1) {
    throw new Error(`節が見つかりません: ${endHeading}`);
  }

  return text.slice(start, end);
}

describe('P2 の前倒し判定', () => {
  const section = () => skill.extractSection(p2(), '### 前倒しの規模判定');

  test('前倒しの規模判定の節がある', () => {
    expect(() => section()).not.toThrow();
  });

  test('全シーンに想定尺が揃っている場合に想定尺の合計で判定することが書かれている', () => {
    expect(section()).toMatch(/想定尺が(すべて|全シーンに)?揃/);
    expect(section()).toMatch(/合計/);
  });

  test('上限がシーン数8・総尺120秒であることを参照している', () => {
    expect(section()).toMatch(/8/);
    expect(section()).toMatch(/120/);
  });

  test('上限を超える場合はこの時点で停止することが書かれている', () => {
    expect(section()).toMatch(/停止/);
  });

  test('対象シーンを絞った場合に P3 と P4 が対象シーンのみを扱うことが書かれている', () => {
    expect(section()).toMatch(/P3/);
    expect(section()).toMatch(/P4/);
    expect(section()).toMatch(/対象シーンのみ/);
  });

  test('想定尺が欠けている場合は前倒し判定を行わないことが書かれている', () => {
    expect(section()).toMatch(/想定尺が欠けて/);
    expect(section()).toMatch(/前倒し(の規模判定|判定)?を行わない/);
  });

  test('優先度・スキップ可否の記述を根拠にできることが書かれている', () => {
    expect(section()).toMatch(/優先度/);
    expect(section()).toMatch(/スキップ/);
    expect(section()).toMatch(/根拠/);
  });

  test('前倒し判定を通過しても P5 の確定判定を省略しないことが書かれている', () => {
    expect(section()).toMatch(/P5/);
    expect(section()).toMatch(/省略しない/);
  });

  test('P2 の完了条件が前倒し判定に触れている', () => {
    expect(p2()).toMatch(/完了条件[^\n]*前倒し/);
  });
});

describe('P5 の確定判定', () => {
  test('確定の判定であることが書かれている', () => {
    expect(p5()).toMatch(/確定/);
  });

  test('前倒し判定を通過していても省略しないことが書かれている', () => {
    expect(p5()).toMatch(/前倒し/);
    expect(p5()).toMatch(/省略しない/);
  });

  test('下限式によって尺が伸びる場合があることが書かれている', () => {
    expect(p5()).toMatch(/下限/);
  });

  test('上限を超える場合に停止することが残っている', () => {
    expect(p5()).toMatch(/停止/);
  });
});

describe('requirements.md との整合', () => {
  test('第9節 P2 の処理に前倒しの規模判定が含まれている', () => {
    const scope = requirementsSection(
      '## 9. 手順の論理構造と分岐条件',
      '### 9.1',
    );

    expect(scope).toMatch(/\|\s*P2\s*\|[^\n]*前倒し/);
  });

  test('第9.1節に前倒し判定の分岐がある', () => {
    const scope = requirementsSection('### 9.1 分岐条件', '### 9.2');

    expect(scope).toMatch(/\|\s*P2\s*\|[^\n]*想定尺[^\n]*\|/);
  });

  test('第9.2節に判定を2回行うことが書かれている', () => {
    const scope = requirementsSection('### 9.2', '### 9.3');

    expect(scope).toMatch(/前倒し/);
    expect(scope).toMatch(/確定/);
    expect(scope).toMatch(/2回/);
  });

  test('第14節の手順フロー図に前倒し判定が現れる', () => {
    const scope = requirementsSection('## 14. 手順フロー図', '## 15.');

    expect(scope).toMatch(/前倒し/);
  });
});

describe('SPEC/skill-structure.md との整合', () => {
  test('状態遷移図に前倒しの規模判定が現れる', () => {
    expect(readFile(SPEC_PATH)).toMatch(/前倒し/);
  });
});
