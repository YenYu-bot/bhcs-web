# Science Lab 2.0 Pilot #4 — First-time-user usability gate

Status: **protocol only — study not yet run**

Target station: `tools/science/acid-base-guided.html`  
Engineering baseline: `a219b9b4969d9e6614383387f4c22a64e1769bb4`

This gate is separate from the B1–B5 engineering gate. Passing CI does **not** count as passing this study. Do not remove `noindex`, add public navigation, or start rollout until the study and rollout decision are both complete.

## 1. Goal

Verify that a first-time student can use the Guided station without being taught the answer, can finish the full sequence, and can explain the science that the station is intended to teach.

The station's essential learning outcomes for this gate are:

1. One litmus result may be insufficient to distinguish all three representative samples.
2. Comparing blue- and red-litmus responses lets the learner distinguish the three response patterns used in this station.
3. Acidic / neutral / basic naming comes **after** observation and comparison, not before.
4. Indicator colour is range evidence, not a precision pH meter reading.
5. Colourless phenolphthalein does **not** rule out every basic liquid.

## 2. Participants

Use **5 first-time users** from the intended student population.

Eligibility:

- Has not previously used `acid-base-guided.html`.
- Has not watched another participant use it.
- Has not been shown the answer pattern immediately before the session.
- Ordinary prior school knowledge of acids/bases is allowed; this is a usability study, not a pre-test of curriculum mastery.

Identify participants only as `P01`–`P05`. Do not put student names into the study record.

## 3. Device coverage

Across the five participants, cover all of the following with real devices:

- at least 1 iPhone/iPad using Safari;
- at least 1 Android device using Chrome;
- at least 1 desktop/laptop browser session.

Record device model, OS, browser and viewport/orientation when known.

Separate accessibility spot-checks are also required before rollout:

- one real screen-reader pass on a supported platform (VoiceOver, TalkBack, NVDA or equivalent);
- one keyboard-only desktop pass.

These accessibility spot-checks do not have to be part of the five-student count.

## 4. Moderator script

Read only this before the task:

> 這是一個科學實驗網頁。請你從頭到尾自己操作，照你看到的內容完成任務。  
> 遇到不確定的地方，可以先說你在想什麼。除非真的卡住，我不會告訴你答案。  
> 這不是考試，我們是在測試網頁是否讓人看得懂。

Do not explain the science, point to the correct control, name the expected classification, or tell the learner which option is correct.

## 5. Intervention rules

Log every moderator intervention.

### I0 — neutral prompt, not counted as help

Allowed examples:

- 「請繼續照畫面上的提示操作。」
- 「你可以說說你現在在找什麼。」
- 「先看看畫面上有哪些可以操作的地方。」

I0 must not identify a control or science answer.

### I1 — navigation / UI assistance, counts as one intervention

Examples:

- telling the learner where the next actionable control is;
- explaining that a control can be tapped / clicked / dragged;
- telling the learner to scroll because they did not discover more content.

### I2 — content-leading help, participant fails independent-completion criterion

Examples:

- telling which sample is acidic / neutral / basic;
- telling which litmus to use next;
- telling that one indicator is insufficient;
- telling the phenolphthalein answer;
- interpreting a recorded result for the learner.

If an I2 intervention is required, continue the session for diagnostic value, but mark that participant as **not independently completed**.

## 6. Stop / patch rule

Pause the study and fix the product before recruiting more participants if either occurs:

- the first two participants hit the same blocking defect; or
- any participant encounters a data-loss, broken-control, inaccessible-completion, or science-correctness defect.

After a product change, start a new cohort label (for example `U1-r2`) and record the new tested commit/deployment. Do not combine pre-patch and post-patch participants into one 5-person pass count.

## 7. Observation checkpoints

For every participant, record whether they can do the following without I2 help:

| Checkpoint | Observation |
|---|---|
| Welcome / Mission | Understands that the task is to test three unknown liquids rather than guess them |
| Trial 1 | Tests all three samples and notices that one strip produces only two response patterns |
| Compare 1 | Recognizes that the first indicator alone does not fully distinguish all three |
| Trial 2 | Understands why a second indicator is being used |
| Compare 2 | Correctly compares the two-result pattern for each sample |
| Concept | Understands that formal class names are introduced after the observations |
| pH reveal | Does not interpret litmus as switching at one exact pH value |
| Notebook | Can organize the evidence into a conclusion |
| Challenge 2 | Recognizes that one blue-litmus result can be insufficient evidence |
| Challenge 3 | Rejects “phenolphthalein colourless ⇒ definitely not basic” |
| Complete | Reaches the end without an unrecoverable UI problem |

Also record:

- start time and finish time;
- number of I1 and I2 interventions;
- any >60-second stall and the screen where it occurred;
- accidental taps / hidden controls / scroll-discovery problems;
- any wording the learner reads differently from the intended meaning.

## 8. Post-task questions

Ask these **after** the learner reaches Complete. Do not show answer choices.

1. 「為什麼第一種試紙測完後，還不能把三杯完全分開？」
2. 「你最後是怎麼利用兩種試紙的結果，把三杯分成不同類型的？」
3. 「如果酚酞加進一杯未知液體後還是無色，可以直接說它一定不是鹼性嗎？為什麼？」
4. 「指示劑的顏色能不能直接當成精密的 pH 數值？為什麼？」

Score each question:

- **2 = correct, self-generated explanation**
- **1 = partly correct / vague but scientifically compatible**
- **0 = incorrect, no answer, or only correct after leading help**

Essential questions are Q1, Q2 and Q3.

## 9. Participant record template

Copy one block per participant.

~~~text
Participant: P__
Cohort/version:
Date:
Tested URL:
Tested commit/deployment:
Device:
OS:
Browser:
Orientation / viewport:

Start:
Finish:
Total time:

I1 interventions:
I2 interventions:
Longest stall:
Stall screen:

Independent completion: YES / NO
Reached Complete: YES / NO

Checkpoint notes:
- Welcome/Mission:
- Trial 1:
- Compare 1:
- Trial 2:
- Compare 2:
- Concept:
- pH:
- Notebook:
- Challenge 2:
- Challenge 3:
- Complete:

Post-task:
Q1 score 0/1/2:
Q1 notes:

Q2 score 0/1/2:
Q2 notes:

Q3 score 0/1/2:
Q3 notes:

Q4 score 0/1/2:
Q4 notes:

Observed wording/UI problems:
Observed science misunderstanding:
Other notes:
~~~

## 10. Hard pass criteria

The station passes the first-time-user usability gate only if **all** are true in one unchanged 5-person cohort:

1. **Independent completion:** at least 4/5 reach Complete with no I2 intervention.
2. **Intervention ceiling:** every participant requires at most 1 I1 intervention.
3. **Core understanding:** at least 4/5 score at least 1 on **each** of Q1, Q2 and Q3.
4. **Strong explanation:** at least 4/5 obtain a combined Q1+Q2+Q3 score of at least 4/6.
5. **No common blocker:** no single UI/wording problem blocks 2 or more participants.
6. **No science defect:** no observed page wording, feedback or interaction teaches a false scientific rule.
7. **Real-device check:** iOS Safari and Android Chrome each complete the full station without blocker.
8. **Accessibility spot-check:** keyboard-only and one real screen-reader path can reach Complete without an accessibility blocker.
9. **Privacy / persistence:** reload, local progress messaging and restart behave as described; no student-identifying information is required.

A single participant may have normal hesitation or make wrong challenge attempts. The gate is about whether the interface supports recovery and understanding without answer-giving.

## 11. Diagnostic metrics — not automatic fail thresholds

Record these to guide refinement:

- median completion time;
- screen with the most stalls;
- total wrong Compare / Challenge attempts;
- number of learners who miss content below the fold;
- number of learners who try to interact with non-interactive graphics;
- number of learners who misread “range evidence” as an exact pH measurement;
- number of learners who treat colourless phenolphthalein as proof of acid/neutral only.

Use these to decide whether a patch is worthwhile even when the hard gate passes.

## 12. Rollout decision

After five valid sessions, produce one result:

- **PASS** — all hard criteria pass. The station is eligible for a separate rollout PR.
- **PASS WITH MINOR FOLLOW-UP** — hard criteria pass, but non-blocking wording/layout fixes are recommended before rollout.
- **FAIL / ITERATE** — one or more hard criteria fail. Patch the station, rerun engineering gates, and start a fresh usability cohort for affected criteria.

A PASS does **not** itself change production visibility. Removing `noindex`, adding sitemap/resource/index entries, or linking Guided ↔ legacy requires an explicit rollout decision and a separate PR.

## 13. Result summary template

~~~text
Pilot #4 First-time-user gate
Cohort:
Station commit/deployment:
Participants: 5

Independent completion: __/5
Participants with >1 I1 intervention: __/5
Participants receiving any I2: __/5

Q1 >=1: __/5
Q2 >=1: __/5
Q3 >=1: __/5
Q1+Q2+Q3 >=4/6: __/5

iOS Safari full pass: YES / NO
Android Chrome full pass: YES / NO
Keyboard-only full pass: YES / NO
Screen-reader full pass: YES / NO

Common blocker affecting >=2: YES / NO
Science defect observed: YES / NO

Median completion time:
Main friction points:
Recommended fixes:

Decision:
PASS / PASS WITH MINOR FOLLOW-UP / FAIL-ITERATE
~~~
