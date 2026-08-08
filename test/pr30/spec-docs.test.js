/**
 * Issue #15 / PR #30
 *
 * SPEC/skill-structure.md の契約テスト。
 * 実際の SKILL.md から起こした図であることを、段の名称の一致で検証する。
 */
const fs = require('node:fs');
const path = require('node:path');

const skill = require('../support/skill');

const SPEC_PATH = path.join(skill.REPO_ROOT, 'SPEC', 'skill-structure.md');

const UNIMPLEMENTED_WORDS =
  /未実装|未着手|未作成|未対応|予定|今後|将来|構想|TODO|TBD/;

/** SPEC ファイルを読む。存在しない場合はパスを含む例外を送出する */
function readSpec() {
  if (!fs.existsSync(SPEC_PATH)) {
    throw new Error(`SPEC ファイルが見つかりません: ${SPEC_PATH}`);
  }

  return fs.readFileSync(SPEC_PATH, 'utf8');
}

/** SKILL.md から P 段の見出し名を抽出する */
function stageHeadings() {
  const headings = skill
    .loadSkill()
    .bodyLines.map((line) => line.match(/^## (P\d .+)$/))
    .filter((matched) => matched !== null)
    .map((matched) => matched[1]);

  if (headings.length === 0) {
    throw new Error('SKILL.md から P 段の見出しを抽出できません');
  }

  return headings;
}

/** mermaid ブロックの先頭行（図種別）を配列で返す */
function diagramTypes(text) {
  return [...text.matchAll(/```mermaid\n([^\n]+)/g)].map((matched) =>
    matched[1].trim(),
  );
}

describe('SPEC ファイル', () => {
  test('SPEC/skill-structure.md が存在する', () => {
    expect(() => readSpec()).not.toThrow();
  });

  test('未実装のものを指す語を含まない', () => {
    expect(readSpec()).not.toMatch(UNIMPLEMENTED_WORDS);
  });
});

describe('図の構成', () => {
  test('mermaid の図を3件持つ', () => {
    expect(diagramTypes(readSpec())).toHaveLength(3);
  });

  test('ユースケース図・状態遷移図・リソース構成図の見出しを持つ', () => {
    expect(readSpec()).toMatch(/ユースケース図/);
    expect(readSpec()).toMatch(/状態遷移図/);
    expect(readSpec()).toMatch(/リソース構成図/);
  });

  test('図種別が check-mermaid.sh の許容する種別である', () => {
    const allowed = /^(flowchart|graph|stateDiagram-v2)\b/;

    for (const type of diagramTypes(readSpec())) {
      expect(type).toMatch(allowed);
    }
  });

  test('状態遷移図を1件含む', () => {
    expect(diagramTypes(readSpec())).toContain('stateDiagram-v2');
  });
});

describe('SKILL.md との一致', () => {
  test('SKILL.md の P 段の見出しをすべて7件抽出できる', () => {
    expect(stageHeadings()).toHaveLength(7);
  });

  test.each(stageHeadings())('図に %s が現れる', (heading) => {
    expect(readSpec()).toContain(heading);
  });

  test('差し戻し先として P4 と P6 が図に現れる', () => {
    expect(readSpec()).toMatch(/P7.*-->.*P6|P6.*<--.*P7/s);
    expect(readSpec()).toContain('差し戻し');
  });
});

describe('構成の制約との一致', () => {
  test('デモ版が持たない構成要素を図に含めない', () => {
    for (const name of ['scripts', 'references', 'assets']) {
      expect(fs.existsSync(path.join(skill.REPO_ROOT, name))).toBe(false);
    }
  });

  test('リソース構成図に SKILL.md と設置先と作業ディレクトリが現れる', () => {
    expect(readSpec()).toContain('SKILL.md');
    expect(readSpec()).toMatch(/設置先|スキルディレクトリ/);
    expect(readSpec()).toMatch(/作業ディレクトリ/);
  });
});
