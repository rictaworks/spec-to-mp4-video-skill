/**
 * Issue #34 / PR #40
 *
 * P3 情報収集の逐語対象を、照合型と起案型に分けることの契約テスト。
 *
 * 照合型は外部に正解が実在するため出所の特定を要し、特定できない場合は停止する。
 * 起案型は外部に正解が無いため出所の特定を求めず、起案であることを明示して
 * P4 の承認に含める。表示の逐語性と外部との一致は別の要求である。
 *
 * requirements.md 第9節 P3・第9.1節に対応する。
 */
const fs = require('node:fs');
const path = require('node:path');

const skill = require('../support/skill');

const SPEC_PATH = path.join(skill.REPO_ROOT, 'SPEC', 'skill-structure.md');
const REQUIREMENTS_PATH = path.join(skill.REPO_ROOT, 'requirements.md');

const body = () => skill.loadSkill().body;
const p3 = () => skill.extractSection(body(), '## P3 情報収集');
const p4 = () => skill.extractSection(body(), '## P4 台本生成');

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

describe('2種の区別', () => {
  test('照合型の節がある', () => {
    expect(() => skill.extractSection(p3(), '### 照合型')).not.toThrow();
  });

  test('起案型の節がある', () => {
    expect(() => skill.extractSection(p3(), '### 起案型')).not.toThrow();
  });

  test('性質によって2種に分かれることが書かれている', () => {
    expect(p3()).toMatch(/照合型と起案型/);
  });
});

describe('照合型', () => {
  const section = () => skill.extractSection(p3(), '### 照合型');

  const TARGETS = ['コマンド', 'バージョン番号', '出力する文言の要点'];

  test.each(TARGETS)('照合型の対象に %s が列挙されている', (target) => {
    expect(section()).toMatch(new RegExp(`\\|\\s*${target}\\s*\\|`));
  });

  test('照合型が3件であることを明示している', () => {
    expect(section()).toMatch(/次の3件/);
  });

  test('依頼文を照合型に含めない', () => {
    expect(section()).not.toMatch(/\|\s*依頼文\s*\|/);
  });

  test('外部に正解が実在することが書かれている', () => {
    expect(section()).toMatch(/外部/);
  });

  test('出所を特定できる情報源から集めることが書かれている', () => {
    expect(section()).toMatch(/出所/);
    expect(section()).toMatch(/情報源/);
  });

  test('出所を特定できない場合に停止することが書かれている', () => {
    expect(section()).toMatch(/出所を特定できない/);
    expect(section()).toMatch(/停止/);
  });
});

describe('起案型', () => {
  const section = () => skill.extractSection(p3(), '### 起案型');

  test('対象が依頼文に限られている', () => {
    expect(section()).toMatch(/\|\s*依頼文\s*\|/);
    expect(section()).toMatch(/(限る|限定)/);
  });

  test('外部に照合すべき正解が無いことが書かれている', () => {
    expect(section()).toMatch(/正解/);
  });

  test('出所の特定を求めないことが書かれている', () => {
    expect(section()).toMatch(/出所の特定を求めない/);
  });

  test('表示は逐語で正確である必要があることが書かれている', () => {
    expect(section()).toMatch(/逐語/);
  });

  test('起案であることを明示して P4 の承認に含めることが書かれている', () => {
    expect(section()).toMatch(/起案であることを明示/);
    expect(section()).toMatch(/P4/);
    expect(section()).toMatch(/承認/);
  });

  test('確定後は書き換えないことが書かれている', () => {
    expect(section()).toMatch(/書き換えない/);
  });

  test('起案型を増やさないことが書かれている', () => {
    expect(section()).toMatch(/起案型を増やす/);
  });

  test('起案型を口実に照合型の出所確認を省略しないことが書かれている', () => {
    expect(section()).toMatch(/照合型[^。]*省略しない/);
  });
});

describe('完了条件', () => {
  test('完了条件が照合型を対象とする記述になっている', () => {
    expect(p3()).toMatch(/完了条件[^\n]*照合型[^\n]*出所/);
  });
});

describe('P4 との接続', () => {
  test('起案型の文字列を起案として承認に含めることが P4 に書かれている', () => {
    expect(p4()).toMatch(/起案/);
  });
});

describe('停止時の提示文', () => {
  const notice = () => skill.extractSection(body(), '## 停止時の提示文');

  test('台本の承認を求める文面に起案した文言の断りがある', () => {
    const blocks = [...notice().matchAll(/```text\n([\s\S]*?)```/g)].map(
      (matched) => matched[1],
    );

    expect(blocks.some((block) => block.includes('起案'))).toBe(true);
  });
});

describe('requirements.md との整合', () => {
  test('第9節 P3 の処理と完了条件が照合型を対象としている', () => {
    const scope = requirementsSection(
      '## 9. 手順の論理構造と分岐条件',
      '### 9.2',
    );

    expect(scope).toMatch(/\|\s*P3\s*\|[^\n]*照合型/);
  });

  test('第9.1節の P3 の分岐が照合型を対象としている', () => {
    const scope = requirementsSection('### 9.1 分岐条件', '### 9.2');

    expect(scope).toMatch(/\|\s*P3\s*\|[^\n]*照合型[^\n]*\|/);
  });

  test('起案型が依頼文に限られることが書かれている', () => {
    const scope = requirementsSection(
      '## 9. 手順の論理構造と分岐条件',
      '### 9.2',
    );

    expect(scope).toMatch(/起案型/);
    expect(scope).toMatch(/依頼文/);
  });
});

describe('SPEC/skill-structure.md との整合', () => {
  test('状態遷移図の停止条件が照合型を対象としている', () => {
    expect(readFile(SPEC_PATH)).toMatch(/照合型/);
  });
});
