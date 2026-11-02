"""Build assets/english-vocab/w2000.js from scripts/english-grammar/wordlist-2000.json (英文單字 2000, grouped by first letter).
The textbook lists (assets/english-vocab/<term>.js) are made from the publishers' PDFs each semester and are not rebuilt here."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parents[1]
words = json.loads((root / 'scripts/english-grammar/wordlist-2000.json').read_text(encoding='utf8'))
GROUPS = [('A–B', 'ab'), ('C–D', 'cd'), ('E–G', 'efg'), ('H–K', 'hijk'), ('L–N', 'lmn'), ('O–P', 'op'), ('Q–S', 'qrs'), ('T–V', 'tuv'), ('W–Z', 'wxyz')]
unit = lambda w: next(f'G{i + 1}' for i, (_, s) in enumerate(GROUPS) if w[0].lower() in s)
book = dict(id='W2000', pub='百宏', book='2000', grade='國中小', term='常用',
            source='百宏「英文單字 2000」（與文法練習卷共用的字表 scripts/english-grammar/wordlist-2000.json）', updated='2026-10-17',
            units=[[f'G{i + 1}', n] for i, (n, _) in enumerate(GROUPS)], exams=None,
            words=[[unit(x['w']), x['w'], x['pos'], x['zh'], ''] for x in words])
out = ('// 英文單字 2000（百宏），依字首分組；由 scripts/english-grammar/wordlist-2000.json 產生，改字表後重跑 scripts/build_english_vocab.py。\n'
       '// words: [組別, 英文, 詞性, 中文, 動詞變化]\nexport default ' + json.dumps(book, ensure_ascii=False, separators=(',', ':')) + ';\n')
(root / 'assets/english-vocab/w2000.js').write_text(out, encoding='utf8')
