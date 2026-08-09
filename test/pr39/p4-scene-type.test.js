/**
 * Issue #33 / PR #39
 *
 * 種別を P2 の必須項目から外し、P4 台本生成で決定することの契約テスト。
 * 種別は設計の産物ではなく制作の産物であり、仕様書の画面要素の記述から決まる。
 *
 * requirements.md 第7.1節・第9節 P4・第9.1節に対応する。
 */
const fs = require('node:fs');
const path = require('node:path');

const skill = require('../support/skill');

const SPEC_PATH = path.join(skill.REPO_ROOT, 'SPEC', 'skill-structure.md');
const REQUIREMENTS_PATH = path.join(skill.REPO_ROOT, 'requirements.md');

const SCENE_TYPES = ['タイトル', '箇条書き', '端末', 'コード', '図解', 'まとめ'];

const body = () => skill.loadSkill().body;
const p2 = () => skill.extractSection(body(), '## P2 読み取りと充足判定');
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

describe('P2 の必須項目から種別を外す', () => {
  test('シーン定義の表に種別の行が無い', () => {
    expect(p2()).not.toMatch(/\|\s*種別\s*\|/);
  });

  test('シーン定義の項目が見出し・主張・想定尺の3件である', () => {
    expect(p2()).toMatch(/\|\s*見出し\s*\|/);
    expect(p2()).toMatch(/\|\s*主張\s*\|/);
    expect(p2()).toMatch(/\|\s*想定尺\s*\|/);
    expect(p2()).toMatch(/次の3項目を持つ/);
  });

  test('種別を台本生成で確定することが書かれている', () => {
    expect(p2()).toMatch(/種別/);
    expect(p2()).toMatch(/台本生成/);
  });
});

describe('P4 での種別の決定', () => {
  test('種別を決定する手順が節として置かれている', () => {
    expect(() => skill.extractSection(p4(), '### 種別の決定')).not.toThrow();
  });

  test.each(SCENE_TYPES)('種別の選択肢に %s が列挙されている', (type) => {
    expect(p4()).toContain(type);
  });

  test('画面要素の記述を根拠として決定することが書かれている', () => {
    expect(p4()).toMatch(/画面要素の記述[^。]*根拠/);
  });

  test('見出しや主張の語感から推測しないことが書かれている', () => {
    expect(p4()).toMatch(/推測/);
  });

  test('一意に決められない場合は停止することが書かれている', () => {
    expect(p4()).toMatch(/一意に決め(られない|ることができない)/);
    expect(p4()).toMatch(/停止/);
  });

  test('仕様書に種別が明記されている場合はそのまま採用することが書かれている', () => {
    expect(p4()).toMatch(/種別が明記されている場合[^。]*採用/);
  });

  test('台本の項目に種別が含まれている', () => {
    expect(p4()).toMatch(/\|\s*種別\s*\|/);
  });

  test('完了条件に種別の確定が含まれている', () => {
    expect(p4()).toMatch(/完了条件[^\n]*種別/);
  });
});

describe('停止時の提示文', () => {
  const notice = () => skill.extractSection(body(), '## 停止時の提示文');

  test('種別を決められない場合の文面がある', () => {
    expect(notice()).toMatch(/種別/);
  });

  test('文面がコードブロックとして用意されている', () => {
    const blocks = [...notice().matchAll(/```text\n([\s\S]*?)```/g)].map(
      (matched) => matched[1],
    );

    expect(blocks.some((block) => block.includes('種別'))).toBe(true);
  });
});

describe('完了報告', () => {
  const report = () => skill.extractSection(body(), '## 完了報告');

  test('決定した種別を報告することが書かれている', () => {
    expect(report()).toMatch(/種別/);
  });
});

describe('requirements.md との整合', () => {
  test('第7.1節のシーン定義の表に種別が無い', () => {
    const scope = requirementsSection('### 7.1 必須項目', '### 7.2 任意項目');

    expect(scope).not.toMatch(/\|\s*種別\s*\|/);
    expect(scope).toMatch(/\|\s*主張\s*\|/);
  });

  test('第7.1節に種別を P4 で確定すると書かれている', () => {
    const scope = requirementsSection('### 7.1 必須項目', '### 7.2 任意項目');

    expect(scope).toMatch(/種別/);
    expect(scope).toMatch(/P4/);
  });

  test('第9節 P4 の完了条件に種別が含まれている', () => {
    const scope = requirementsSection(
      '## 9. 手順の論理構造と分岐条件',
      '### 9.2',
    );

    expect(scope).toMatch(/\|\s*P4\s*\|[^\n]*種別/);
  });

  test('第9.1節に種別を決められない場合の分岐がある', () => {
    const scope = requirementsSection('### 9.1 分岐条件', '### 9.2');

    expect(scope).toMatch(/\|\s*P4\s*\|[^\n]*種別[^\n]*\|/);
  });
});

describe('SPEC/skill-structure.md との整合', () => {
  test('状態遷移図に種別の停止が現れる', () => {
    expect(readFile(SPEC_PATH)).toMatch(/種別/);
  });
});
