// Original CAP-style items. The answer is the zero-based option index.
const q = (id, topic, prompt, options, answer, explanation) => ({ id, topic, prompt, options, answer, explanation });

export const grammarItems = [
  q('g01', '時態與敘事', 'A: Did you hear the school bell?\nB: No. I ___ a video with my headphones on when it rang.', ['watch', 'have watched', 'was watching', 'will watch'], 2, '鐘聲響起是簡短的過去事件；用 was watching 表示當時正在做的背景動作。'),
  q('g02', '時態與敘事', 'Mina ___ near the station for two years before she moved to Tainan. She lives near school now.', ['lived', 'has lived', 'is living', 'will live'], 0, 'for two years 只表一段時間；搬走已使那段居住結束，用簡單過去式。'),
  q('g03', '時態與敘事', 'The science room ___ closed since a pipe broke on Monday. We still can’t use it.', ['is being', 'was', 'will be', 'has been'], 3, 'since 引出過去起點，still 表狀態持續到現在；用現在完成式 has been。'),
  q('g04', '時態與敘事', 'Everything is set for Friday: our class ___ the new library right after lunch, and the librarian has already booked our time.', ['visited', 'is visiting', 'has visited', 'was visiting'], 1, '現在進行式可表示已安排的未來行程；已訂時段和 Friday 的線索排除過去。'),
  q('g05', '時態與敘事', 'At 8:00, I got to the bus stop. The last bus had left at 7:55, so I ___ it.', ['have missed', 'will miss', 'missed', 'am missing'], 2, '敘事以過去事件為主；錯過公車是過去已發生的結果。'),
  q('g06', '關係子句與主句', 'Please bring back the book ___ last week. I need it for my report.', ['that I lent you', 'who lent you', 'I lent you it', 'was lent you'], 0, 'the book 是 lent 的直接受詞；that I lent you 修飾 book，不能在子句再放 it。'),
  q('g07', '關係子句與主句', 'Students who want to use the gym after school ___ their names on this list first.', ['writes', 'writing', 'who write', 'must write'], 3, 'who want… 是修飾 Students 的子句；主句仍需要限定動詞 must write。'),
  q('g08', '關係子句與主句', 'The girl ___ by the door is my cousin. She is waiting for her mother.', ['she stands', 'who is standing', 'is standing', 'who standing'], 1, 'who 是子句主詞，is standing 是子句動詞；主句動詞則是 is my cousin。'),
  q('g09', '關係子句與主句', 'The music we listened ___ on the bus came from a movie.', ['it', 'that', 'to', 'with'], 2, 'we listened to 是省略受格關係代名詞的子句，listen to 的 to 仍保留。'),
  q('g10', '關係子句與主句', 'The lunches that Ken and Mia packed this morning ___ enough for all five of us.', ['are', 'is', 'be', 'being'], 0, '主句主詞是複數 lunches；Ken and Mia packed… 只是修飾，不能取代主句的 are。'),
  q('g11', '連接詞與條件', 'Our class will stay here ___ the rain stops. We won’t go out before then.', ['because', 'although', 'after', 'until'], 3, '持續留在原地到雨停，表終點用 until；未來時間子句用現在式 stops。'),
  q('g12', '連接詞與條件', '___ Amy was nervous, she still asked the new student to join her team.', ['So', 'Although', 'Unless', 'Or'], 1, '緊張本會使人退縮，但她仍邀請同學，although 表「雖然」。'),
  q('g13', '連接詞與條件', 'Hold the box with both hands, ___ it may fall. It’s too heavy to hold safely with just one.', ['so', 'when', 'or', 'than'], 2, '祈使句後的 or 表「否則」；不照指示可能發生負面結果。'),
  q('g14', '連接詞與條件', 'If the classroom is still locked, ___ to the teachers’ office for the key.', ['go', 'going', 'went', 'to go'], 0, 'if 子句提出條件；主句是直接指示，祈使句用原形動詞 go。'),
  q('g15', '連接詞與條件', 'I don’t know if the park ___ open tomorrow. If it ___, we can have our picnic there.', ['is; will be', 'will be; will be', 'be; is', 'will be; is'], 3, '第一個 if 是「是否」，可用 will be；第二個 if 是「如果」，未來條件子句用現在式 is。'),
  q('g16', '代用與量詞', 'A: I bought a new bike helmet last week.\nB: I need ___, too. Where did you buy yours?', ['it', 'one', 'them', 'hers'], 1, 'B 要的是同類的一頂，不是 A 已買的那一頂，用 one。'),
  q('g17', '代用與量詞', 'Nina puts her lunch box away as soon as she gets home. Her brother never ___. He often leaves his on the bus.', ['did', 'is', 'does', 'will have'], 2, 'does 代替前面的一般現在式動作 puts his lunch box away；主詞是第三人稱單數。'),
  q('g18', '代用與量詞', 'A: There aren’t any rulers in this box. Do you have ___ I can use?\nB: Sure. Here’s mine.', ['any', 'them', 'every', 'both'], 0, '一般疑問句用 any；此處 any 可代前文提到的 rulers，不必重複名詞。'),
  q('g19', '代用與量詞', 'We tried two ways to open the window. ___ of them worked, so the window stayed closed.', ['Both', 'Either', 'Each', 'Neither'], 3, '兩個方法都沒有成功，所以窗戶仍關著；兩者皆不為 neither of them。'),
  q('g20', '代用與量詞', 'All of the students ___ Ben turned in the form. Ben is the only one who still has it.', ['during', 'except', 'toward', 'without'], 1, 'except 表從全體排除例外；第二句說 Ben 是唯一還未繳交的人。'),
  q('g21', '代用與量詞', 'A: Can I paint the sign while holding it in one hand?\nB: Put it on the table first, so you’ll have ___ free: one to hold the brush and the other to hold the paint.', ['all', 'none', 'both hands', 'either one only'], 2, '先把牌子放到桌上，便能騰出雙手；both 指兩個都能用。'),
  q('g22', '主詞與複合句型', 'Taking photos of insects ___ my sister notice details that most people miss.', ['helps', 'help', 'helping', 'are helping'], 0, '整個動名詞片語 Taking photos of insects 是主詞，視為單數；不能被 photos 和 insects 誤導。'),
  q('g23', '主詞與複合句型', 'Keeping food in an open bag can make it go bad, ___?', ['doesn’t it', 'can it', 'isn’t that', 'can’t it'], 3, '整個動名詞片語以 it 代稱；肯定的 can 配否定附加問句 can’t it。'),
  q('g24', '主詞與複合句型', 'Our trip to the store had two goals: to pick up the cake and ___ a card for Grandma.', ['bought', 'buy', 'buying', 'have bought'], 1, 'pick up 和 buy 並列，共用表示目的的不定詞 to；第二個 to 可以省略。'),
  q('g25', '主詞與複合句型', 'The books were moved to a higher shelf and ___ dry during the flood.', ['were stayed', 'staying', 'stayed', 'stay'], 2, '同一主詞可以連接一個被動謂語 were moved 和一個主動謂語 stayed，不能把前面的 were 延用。'),
  q('g26', '主詞與複合句型', 'I watched Dad take the card out of the bag and ___ it on the table; I did not touch it.', ['put', 'to put', 'puts', 'was putting'], 0, 'watch + 受詞 + 原形，此處 take 和 put 同為 Dad 的動作，並列用原形。'),
  q('g27', '被動與非限定動詞', 'The cat likes ___ gently, but it runs away when people pull its tail.', ['to hold', 'holds', 'held', 'to be held'], 3, '主詞 cat 是被抱的對象；likes 後接不定詞被動 to be held。'),
  q('g28', '被動與非限定動詞', 'The new students made the model themselves. They were proud of ___ to speak about it at the school fair.', ['inviting', 'being invited', 'to be invited', 'invite'], 1, '介系詞 of 後用 V-ing；學生是被邀請方，所以用 being invited。'),
  q('g29', '進階歷屆延伸', 'When Eva reached her classroom, she found that the class ___ by then. No one was there.', ['leaves', 'has left', 'had left', 'will leave'], 2, '找到教室是過去基準點，班上同學離開更早；had left 是最清楚表達兩個過去時間先後的選項。'),
  q('g30', '進階歷屆延伸', 'Leo couldn’t sleep last Sunday night because he knew his team ___ its first game the following morning.', ['will play', 'has played', 'is playing', 'would play'], 3, 'knew 是過去；球賽在那個過去時間點的隔天才舉行，用過去觀點的未來 would play。'),
  q('g31', '進階歷屆延伸', 'Green Beach was ___ crowded of the three beaches on the island. It was the only one where we could find a quiet place.', ['the least', 'more', 'less', 'the most'], 0, '三個海灘中最不擁擠的是 Green Beach；the least + 形容詞表程度最低的最高級。'),
  q('g32', '連接詞與條件', 'If the old computer room becomes a reading room, ___ more places for students to study after school.', ['we will have them', 'there were', 'there will be', 'it will be'], 2, 'there will be + 複數名詞表示「將會有」；if 副詞子句內用現在式，主句表未來。'),
  q('g33', '代用與量詞', 'The library has twenty computers, but very ___ are working today. Only two can connect to the Internet.', ['a few', 'few', 'much', 'most'], 1, 'computers 是可數複數；very few 表示少得不夠，後文的 only two 提供線索。a few 表示有一些，不接在 very 後面。'),
  q('g34', '關係子句與主句', 'The lost bag is the blue one ___ two white stars on the front. The bag beside it has a name tag, not stars.', ['with', 'between', 'through', 'during'], 0, 'with＋名詞片語放在 one 後面，說明包包具有的特徵；不是動作的工具。'),
  q('g35', '代用與量詞', 'Three students volunteered. Ann will read the questions and Ben will take notes. ___ will watch the time.', ['Others', 'Another two', 'Both of them', 'The other student'], 3, '三人中已有兩位被指定，剩下一位且可辨認，用 the other student。'),
  q('g36', '進階歷屆延伸', 'The coach arrived at nine. By then the race ___ by another teacher; some runners were already halfway around the track.', ['has started', 'starts', 'had been started', 'is being started'], 2, '比到場早已發生，且比賽是被另一位老師開始的；須同時判斷過去完成和被動。'),
];

const p = (id, topic, paragraphs, items) => ({ id, topic, paragraphs, items });
const gap = (id, topic, options, answer, explanation) => ({ id, topic, options, answer, explanation });

export const grammarPassages = [
  p('gp01', '時態與敘事', [
    'Last Tuesday, our club tried to fix a broken bike. I [1] the front wheel when a small part dropped to the floor. At first, nobody could find it.',
    'Then Jun saw something under the table. It was the part we needed. We put it back, checked the bike, and [2] it home that afternoon.',
    'Since that day, Jun and I [3] a box for small parts next to the work table. Now it is easier to keep everything together.',
  ], [
    gap('gp01-1', '時態與敘事', ['check', 'was checking', 'have checked', 'will check'], 1, '零件掉下去時正在檢查前輪；用過去進行作背景。'),
    gap('gp01-2', '時態與敘事', ['ride', 'will ride', 'have ridden', 'rode'], 3, 'and 串起同一天完成的過去動作；和 put、checked 並列，用 rode。'),
    gap('gp01-3', '時態與敘事', ['have kept', 'kept', 'will keep', 'are keeping'], 0, 'since that day 連接過去與現在，現在仍採用該做法，用現在完成式。'),
  ]),
  p('gp02', '連接詞與條件', [
    'The school garden looked dry on Monday. [1] it had rained on Sunday, the leaves under the roof had not received much water.',
    'Our teacher told us to water the plants before class. She also left a note: “Use a small cup, [2] you may give the little plants too much water.”',
    'Now we have a plan for dry weeks. If the soil feels dry, [3] some water slowly. Don’t pour the whole cup at once.',
  ], [
    gap('gp02-1', '連接詞與條件', ['So', 'Before', 'Although', 'Unless'], 2, '下過雨卻仍乾，表讓步用 Although。'),
    gap('gp02-2', '連接詞與條件', ['after', 'or', 'so', 'until'], 1, '後半是沒用小杯可能出現的結果，or = 否則。'),
    gap('gp02-3', '連接詞與條件', ['adding', 'to add', 'added', 'add'], 3, 'if 子句給條件；後半是給讀者的指示，動詞原形起首。'),
  ]),
  p('gp03', '代用與量詞', [
    'Our art club needed a box to carry some paintings. There were two boxes in the room, but [1] was large enough. One was too short, and the other was too narrow.',
    'Tina said we could get a larger [2] from the store next door. We bought a box there and carried [3] back to school.',
    'We put all the paintings in the box [4] the largest one. It did not fit, so the teacher carried it by hand.',
  ], [
    gap('gp03-1', '代用與量詞', ['neither', 'both', 'every', 'each'], 0, '後文說一個太短、另一個太窄，所以兩個都不夠大，用 neither。'),
    gap('gp03-2', '代用與量詞', ['it', 'them', 'one', 'theirs'], 2, '要找的是同類的另一個較大箱子，代替單數名詞 box 用 one。'),
    gap('gp03-3', '代用與量詞', ['another', 'it', 'those', 'one each'], 1, '搬回的是剛買的同一個箱子，用 it 回指。'),
    gap('gp03-4', '代用與量詞', ['during', 'between', 'through', 'except'], 3, '最大的畫沒有放進箱子，except 把這一張從全體排除。'),
  ]),
  p('gp04', '進階歷屆延伸', [
    'Lucy’s grandfather promised to teach her how to make bread. She woke up early that Saturday because she thought they [1] the bread before lunch.',
    'When she got to his house, her grandfather pointed to a bowl on the table. He [2] the flour and water an hour earlier. He smiled and said, “Now you can help me shape the bread.”',
    'Lucy made three little animals from the dough. Her grandfather put them in the oven. Twenty minutes later, they [3], so Lucy took them out.',
  ], [
    gap('gp04-1', '進階歷屆延伸', ['will finish', 'would finish', 'have finished', 'are finishing'], 1, 'thought 為過去；在當時的想法中，午餐前做完麵包是尚未發生的事，用 would finish。'),
    gap('gp04-2', '進階歷屆延伸', ['had mixed', 'mixes', 'will mix', 'has mixed'], 0, '以抵達爺爺家為過去基準，混合材料在更早的一小時前，用 had mixed。'),
    gap('gp04-3', '進階歷屆延伸', ['have cooked', 'are cooking', 'will be ready', 'were ready'], 3, '是在回述當天已完成的過往，用 were ready 表二十分鐘後實際完成。'),
  ]),
  p('gp05', '篇章連接', [
    'The class planned a picnic. Everyone wanted to eat outside. [1], a strong wind picked up, and the school asked us to stay indoors.',
    'We found other ways to make the day fun. [2], one group set out paper plates and made a pretend garden on the classroom floor.',
    'When we finished eating, we thought the day was over. [3], it was only getting started: our teacher brought in a box of games for us to play.',
  ], [
    gap('gp05-1', '篇章連接', ['For example', 'Similarly', 'However', 'In other words'], 2, '前文想在戶外用餐，後文卻因強風留在室內，用 However 表轉折。'),
    gap('gp05-2', '篇章連接', ['For example', 'Instead of that', 'In the end', 'Even so'], 0, '先說找到其他做法，再舉其中一組學生的做法，用 For example。'),
    gap('gp05-3', '篇章連接', ['For this reason', 'Meanwhile', 'Otherwise', 'In fact'], 3, '以 In fact 說明實際情況，修正上句以為活動已結束的想法。'),
  ]),
];
