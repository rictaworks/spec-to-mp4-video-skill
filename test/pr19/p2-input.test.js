/**
 * Issue #4 / PR #19
 *
 * SKILL.md の P2「読み取りと充足判定」の契約テスト。
 * requirements.md 第7節（入力仕様）・第9節 P2・第9.1節に対応する。
 */
const skill = require('../support/skill');

const HEADING = '## P2 読み取りと充足判定';

const section = () => skill.extractSection(skill.loadSkill().body, HEADING);

describe('P2 の節', () => {
  test('節が存在する', () => {
    expect(() => section()).not.toThrow();
  });
});

describe('必須項目', () => {
  const REQUIRED = ['タイトル', '目的', '想定視聴者', 'シーン列', '出力先パス'];

  test.each(REQUIRED)('必須項目に %s が列挙されている', (item) => {
    expect(section()).toContain(item);
  });

  test('必須項目が5件であることを明示している', () => {
    expect(section()).toMatch(/必須項目/);
  });
});

describe('シーン定義の項目', () => {
  const SCENE_FIELDS = ['見出し', '種別', '主張', '想定尺'];
  const SCENE_TYPES = [
    'タイトル',
    '箇条書き',
    '端末',
    'コード',
    '図解',
    'まとめ',
  ];

  test.each(SCENE_FIELDS)('シーン定義に %s が列挙されている', (field) => {
    expect(section()).toContain(field);
  });

  test.each(SCENE_TYPES)('種別の選択肢に %s が列挙されている', (type) => {
    expect(section()).toContain(type);
  });
});

describe('任意項目', () => {
  const OPTIONAL = ['配色トーン', 'フォント指定', '遷移', 'コマンド出力'];

  test.each(OPTIONAL)('任意項目に %s が列挙されている', (item) => {
    expect(section()).toContain(item);
  });

  test('採用した既定値を完了報告に列挙することが書かれている', () => {
    expect(section()).toMatch(/既定値/);
    expect(section()).toMatch(/完了報告/);
  });
});

describe('不足時の扱い', () => {
  test('既定値による補完を行わないことが書かれている', () => {
    expect(section()).toMatch(/既定値による補完を行わ(ない|ず)/);
  });

  test('処理を停止し、欠落項目を列挙して提示することが書かれている', () => {
    expect(section()).toMatch(/停止/);
    expect(section()).toMatch(/欠落/);
    expect(section()).toMatch(/列挙/);
  });

  test('事実・尺・シーン構成を創作しないことが書かれている', () => {
    expect(section()).toMatch(/事実[^。]*創作しない/);
  });
});

describe('完了条件', () => {
  test('P2 の完了条件が明記されている', () => {
    expect(section()).toMatch(/完了条件.*必須項目/);
  });
});

describe('画面表示テキストの扱い', () => {
  test('シーン定義の必須項目に画面表示テキストを列挙しない', () => {
    expect(section()).not.toMatch(/\|\s*画面表示テキスト\s*\|/);
  });

  test('画面表示テキストを台本生成で確定することが書かれている', () => {
    expect(section()).toMatch(/画面表示テキスト/);
    expect(section()).toMatch(/台本生成/);
  });
});
