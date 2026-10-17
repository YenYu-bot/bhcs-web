// Countable nouns with their plurals, for the plural, demonstrative and pronoun topics.
//   pl    plural form          rule  's' | 'es' | 'ies' | 'ves' | 'irr' (which spelling rule the plural follows)
//   zh    Chinese              m     measure word for the Chinese line (本、隻、個…)
//   kind  'thing' | 'animal' | 'person' | 'food'      own  can belong to someone ("my bag")
const N = (sg, pl, rule, zh, m, kind = 'thing', own = false) => ({ sg, pl, rule, zh, m, kind, own });
export const NOUNS = [
  // + s
  N('book', 'books', 's', '書', '本', 'thing', true), N('pen', 'pens', 's', '筆', '枝', 'thing', true), N('pencil', 'pencils', 's', '鉛筆', '枝', 'thing', true),
  N('bag', 'bags', 's', '袋子', '個', 'thing', true), N('cup', 'cups', 's', '杯子', '個', 'thing', true), N('desk', 'desks', 's', '書桌', '張'),
  N('chair', 'chairs', 's', '椅子', '張'), N('key', 'keys', 's', '鑰匙', '把', 'thing', true), N('toy', 'toys', 's', '玩具', '個', 'thing', true),
  N('hat', 'hats', 's', '帽子', '頂', 'thing', true), N('umbrella', 'umbrellas', 's', '雨傘', '把', 'thing', true), N('jacket', 'jackets', 's', '夾克', '件', 'thing', true),
  N('apple', 'apples', 's', '蘋果', '個', 'food'), N('egg', 'eggs', 's', '蛋', '顆', 'food'), N('cake', 'cakes', 's', '蛋糕', '個', 'food'),
  N('cat', 'cats', 's', '貓', '隻', 'animal', true), N('dog', 'dogs', 's', '狗', '隻', 'animal', true), N('bird', 'birds', 's', '鳥', '隻', 'animal'),
  N('girl', 'girls', 's', '女孩', '個', 'person'), N('boy', 'boys', 's', '男孩', '個', 'person'), N('student', 'students', 's', '學生', '個', 'person'),
  N('flower', 'flowers', 's', '花', '朵'), N('tree', 'trees', 's', '樹', '棵'), N('day', 'days', 's', '天', '個'),
  N('photo', 'photos', 's', '照片', '張', 'thing', true), N('piano', 'pianos', 's', '鋼琴', '台'), N('zoo', 'zoos', 's', '動物園', '個'),
  // + es
  N('box', 'boxes', 'es', '盒子', '個', 'thing', true), N('bus', 'buses', 'es', '公車', '輛'), N('dish', 'dishes', 'es', '盤子', '個'),
  N('watch', 'watches', 'es', '手錶', '支', 'thing', true), N('glass', 'glasses', 'es', '玻璃杯', '個'), N('class', 'classes', 'es', '班級', '個'),
  N('brush', 'brushes', 'es', '刷子', '把', 'thing', true), N('sandwich', 'sandwiches', 'es', '三明治', '個', 'food'), N('peach', 'peaches', 'es', '桃子', '個', 'food'),
  N('dress', 'dresses', 'es', '洋裝', '件', 'thing', true), N('potato', 'potatoes', 'es', '馬鈴薯', '個', 'food'), N('tomato', 'tomatoes', 'es', '番茄', '個', 'food'),
  // y → ies
  N('baby', 'babies', 'ies', '嬰兒', '個', 'person'), N('city', 'cities', 'ies', '城市', '個'), N('family', 'families', 'ies', '家庭', '個', 'person'),
  N('story', 'stories', 'ies', '故事', '個'), N('party', 'parties', 'ies', '派對', '個'), N('lady', 'ladies', 'ies', '女士', '位', 'person'),
  N('library', 'libraries', 'ies', '圖書館', '間'), N('country', 'countries', 'ies', '國家', '個'), N('dictionary', 'dictionaries', 'ies', '字典', '本', 'thing', true),
  N('butterfly', 'butterflies', 'ies', '蝴蝶', '隻', 'animal'), N('strawberry', 'strawberries', 'ies', '草莓', '顆', 'food'),
  // f / fe → ves
  N('knife', 'knives', 'ves', '刀子', '把'), N('leaf', 'leaves', 'ves', '葉子', '片'), N('wolf', 'wolves', 'ves', '狼', '隻', 'animal'),
  N('shelf', 'shelves', 'ves', '架子', '個'), N('wife', 'wives', 'ves', '太太', '位', 'person'),
  // irregular
  N('child', 'children', 'irr', '小孩', '個', 'person'), N('man', 'men', 'irr', '男人', '個', 'person'), N('woman', 'women', 'irr', '女人', '個', 'person'),
  N('foot', 'feet', 'irr', '腳', '隻'), N('tooth', 'teeth', 'irr', '牙齒', '顆'), N('mouse', 'mice', 'irr', '老鼠', '隻', 'animal'),
  N('sheep', 'sheep', 'irr', '綿羊', '隻', 'animal'), N('fish', 'fish', 'irr', '魚', '條', 'animal'),
];

export const article = (word) => (/^[aeiou]/.test(word) ? 'an' : 'a');

export const NUMBERS = [
  ['two', '兩'], ['three', '三'], ['four', '四'], ['five', '五'], ['six', '六'], ['seven', '七'], ['eight', '八'], ['nine', '九'], ['ten', '十'],
];
