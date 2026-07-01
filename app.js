const DATA_URL = "./data/questions.json";
const LONG_LISTENING_URL = "./data/long-listening.json";
const STORAGE_KEY = "kikoenai-english-drill-v1";
const REVIEW_STORAGE_KEY = "kikoenai-english-review-v1";
const SPEED_STORAGE_KEY = "kikoenai-english-speed-v1";
const AUDIO_CACHE_NAME = "mimilisten-audio-cache-v1";
const AUDIO_DB_NAME = "mimilisten-audio-db";
const AUDIO_STORE_NAME = "audioBlobs";
const SPEED_MIN = 0.65;
const SPEED_MAX = 1;
const SPEED_STEP = 0.05;

const SOUND_TYPES = [
  {
    name: "弱化",
    example: "have to, want to, going to",
    guardianImage: "./assets/guardians/dawnfang.png",
    description: "意味を支える語ではなく、文をつなぐ小さな語が短く弱くなる変化です。",
    why: "英語は内容語を強く、機能語を弱く読むため、to や for などが日本人の予想より小さく聞こえます。",
    listenFor: "一語ずつ追わず、強く聞こえる動詞や名詞の前後に短い音があるかを意識します。",
    commonMiss: "have to を have two のように文字どおり聞こうとすると、hafta が別物に聞こえます。",
  },
  {
    name: "連結",
    example: "pick it up, fill it out, check it again",
    guardianImage: "./assets/guardians/raptor.png",
    description: "前の語の終わりと次の語の始まりがくっつき、単語の境目が消える変化です。",
    why: "英語では語末の子音が次の母音へ流れやすく、it や out が独立して聞こえにくくなります。",
    listenFor: "it が聞こえるかより、動詞から次の母音へなめらかにつながる塊を探します。",
    commonMiss: "pick it up を pick up と聞き、短い it を落としやすいです。",
  },
  {
    name: "同化",
    example: "did you, would you, could you",
    guardianImage: "./assets/guardians/emberhorn.png",
    description: "隣り合う音が影響し合い、別の音に近く聞こえる変化です。",
    why: "d や t と you がつながると、did you が didja のように変わりやすくなります。",
    listenFor: "you をはっきり探すより、ジャ、チャ、ジュのようなつながりを手がかりにします。",
    commonMiss: "did you を do you や did he と聞き違えることがあります。",
  },
  {
    name: "脱落",
    example: "next time, last night, supposed to",
    guardianImage: "./assets/guardians/mossback.png",
    description: "言いやすくするために、t や d などがかなり弱くなる、または聞こえにくくなる変化です。",
    why: "子音が連続すると、すべてを強く発音せず、片方が弱く処理されやすくなります。",
    listenFor: "消えた音そのものではなく、前後の強い語から元の表現を復元します。",
    commonMiss: "next time を nice time のように聞いてしまうことがあります。",
  },
  {
    name: "フラッピング",
    example: "get it, put it, wait a minute",
    guardianImage: "./assets/guardians/tidefin.png",
    description: "米語で t や d が母音にはさまれ、軽いラ行のように弾かれて聞こえる変化です。",
    why: "母音にはさまれた t/d は、強く止めずに舌を軽く当てて流すことが多いです。",
    listenFor: "タ、トを待つより、短いラ行っぽい音が出た場所を確認します。",
    commonMiss: "get it が get it ではなく gerit のように聞こえて混乱します。",
  },
  {
    name: "強弱リズム",
    example: "information, important, appointment",
    guardianImage: "./assets/guardians/crystalclaw.png",
    description: "英語はすべての音を均等に読まず、強い山と弱い谷を作って進むリズムです。",
    why: "ストレスのある音節が目立ち、弱い音節は短くあいまいになります。",
    listenFor: "全部の音を拾うより、強く高く長く聞こえる山を先に押さえます。",
    commonMiss: "information を文字の並びどおり均等に聞こうとして、中心の MA を逃しやすいです。",
  },
];

const STATUS_LABELS = {
  approved: "採用",
  pending: "保留",
  rejected: "不採用",
};

const PRACTICE_ENTRY_LABELS = {
  heard: "聞こえた英語はどれ？",
  kana: "カナを予測する",
  restore: "元の英語に戻す",
  missing: "消えた音を探す",
  find: "文の中から探す",
};

const screens = {
  home: document.getElementById("homeScreen"),
  drill: document.getElementById("drillScreen"),
  answer: document.getElementById("answerScreen"),
  result: document.getElementById("resultScreen"),
  types: document.getElementById("typesScreen"),
  practice: document.getElementById("practiceScreen"),
  teacher: document.getElementById("teacherScreen"),
};

const els = {
  homeMeta: document.getElementById("homeMeta"),
  approvedCount: document.getElementById("approvedCount"),
  mistakeCount: document.getElementById("mistakeCount"),
  startButton: document.getElementById("startButton"),
  practiceButton: document.getElementById("practiceButton"),
  reviewButton: document.getElementById("reviewButton"),
  teacherReviewButton: document.getElementById("teacherReviewButton"),
  resultReviewButton: document.getElementById("resultReviewButton"),
  retryButton: document.getElementById("retryButton"),
  typesButton: document.getElementById("typesButton"),
  bundleButton: document.getElementById("bundleButton"),
  sentenceBundleCount: document.getElementById("sentenceBundleCount"),
  monologueBundleCount: document.getElementById("monologueBundleCount"),
  typesBackButton: document.getElementById("typesBackButton"),
  practiceBackButton: document.getElementById("practiceBackButton"),
  practiceStepBackButton: document.getElementById("practiceStepBackButton"),
  practiceTitle: document.getElementById("practiceTitle"),
  practiceTypeChooser: document.getElementById("practiceTypeChooser"),
  practiceWorkArea: document.getElementById("practiceWorkArea"),
  teacherBackButton: document.getElementById("teacherBackButton"),
  backHomeButton: document.getElementById("backHomeButton"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  soundBadge: document.getElementById("soundBadge"),
  weaknessLabel: document.getElementById("weaknessLabel"),
  playButton: document.getElementById("playButton"),
  answerHomeButton: document.getElementById("answerHomeButton"),
  answerProgressBar: document.getElementById("answerProgressBar"),
  answerProgressText: document.getElementById("answerProgressText"),
  replayButton: document.getElementById("replayButton"),
  sentenceButton: document.getElementById("sentenceButton"),
  nextButton: document.getElementById("nextButton"),
  choiceList: document.getElementById("choiceList"),
  feedbackPanel: document.getElementById("feedbackPanel"),
  feedbackTitle: document.getElementById("feedbackTitle"),
  diagnosisText: document.getElementById("diagnosisText"),
  answerText: document.getElementById("answerText"),
  visibleText: document.getElementById("visibleText"),
  kanaText: document.getElementById("kanaText"),
  pointText: document.getElementById("pointText"),
  scoreText: document.getElementById("scoreText"),
  scoreNote: document.getElementById("scoreNote"),
  weaknessList: document.getElementById("weaknessList"),
  typeList: document.getElementById("typeList"),
  speedLabel: document.getElementById("speedLabel"),
  speedValue: document.getElementById("speedValue"),
  speedRange: document.getElementById("speedRange"),
  speedHint: document.getElementById("speedHint"),
  speedDownButton: document.getElementById("speedDownButton"),
  speedUpButton: document.getElementById("speedUpButton"),
  practiceProgressText: document.getElementById("practiceProgressText"),
  practiceSoundBadge: document.getElementById("practiceSoundBadge"),
  practiceWeaknessLabel: document.getElementById("practiceWeaknessLabel"),
  practiceAnswerText: document.getElementById("practiceAnswerText"),
  practiceVisibleText: document.getElementById("practiceVisibleText"),
  practiceKanaText: document.getElementById("practiceKanaText"),
  practicePointText: document.getElementById("practicePointText"),
  practiceChunkButton: document.getElementById("practiceChunkButton"),
  practiceSentenceButton: document.getElementById("practiceSentenceButton"),
  practiceMonoButton: document.getElementById("practiceMonoButton"),
  practiceKanaButton: document.getElementById("practiceKanaButton"),
  practiceFocusPanel: document.getElementById("practiceFocusPanel"),
  practiceFocusLabel: document.getElementById("practiceFocusLabel"),
  practiceFocusContent: document.getElementById("practiceFocusContent"),
  practicePrevButton: document.getElementById("practicePrevButton"),
  practiceNextButton: document.getElementById("practiceNextButton"),
  kanaPromptText: document.getElementById("kanaPromptText"),
  kanaChoiceList: document.getElementById("kanaChoiceList"),
  kanaFeedbackPanel: document.getElementById("kanaFeedbackPanel"),
  kanaFeedbackTitle: document.getElementById("kanaFeedbackTitle"),
  kanaFeedbackText: document.getElementById("kanaFeedbackText"),
  kanaFeedbackPoint: document.getElementById("kanaFeedbackPoint"),
  kanaPlayButton: document.getElementById("kanaPlayButton"),
  longTitle: document.getElementById("longTitle"),
  longPlayButton: document.getElementById("longPlayButton"),
  longPointText: document.getElementById("longPointText"),
  longTranscriptButton: document.getElementById("longTranscriptButton"),
  longChunksButton: document.getElementById("longChunksButton"),
  longMeaningText: document.getElementById("longMeaningText"),
  longContent: document.getElementById("longContent"),
  teacherSummary: document.getElementById("teacherSummary"),
  teacherList: document.getElementById("teacherList"),
  exportReviewButton: document.getElementById("exportReviewButton"),
  audioPlayer: document.getElementById("audioPlayer"),
};

let allQuestions = [];
let approvedQuestions = [];
let longListeningItems = [];
let drillQuestions = [];
let currentIndex = 0;
let practiceQuestions = [];
let currentPracticeIndex = 0;
let currentLongIndex = 0;
let practiceEntryMode = "select";
let practiceDisplayMode = "chunk";
let practiceFinalMode = false;
let selectedSoundTypeIndex = 0;
let longDisplayMode = "transcript";
let kanaAnswerVisible = false;
let currentAnswer = null;
let sessionResults = [];
let playbackRate = 1;
const audioObjectUrlCache = new Map();

function openAudioDb() {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(AUDIO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredAudioBlob(absoluteUrl) {
  const db = await openAudioDb();
  if (!db) return null;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE_NAME, "readonly");
    const request = transaction.objectStore(AUDIO_STORE_NAME).get(absoluteUrl);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function writeStoredAudioBlob(absoluteUrl, blob) {
  const db = await openAudioDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE_NAME, "readwrite");
    transaction.objectStore(AUDIO_STORE_NAME).put(blob, absoluteUrl);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { missesByTag: {}, missedQuestionIds: [] };
  } catch {
    return { missesByTag: {}, missedQuestionIds: [] };
  }
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function loadReviewOverrides() {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveReviewOverrides(overrides) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(overrides));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function highlightText(text, chunks = []) {
  const targets = chunks.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!targets.length) return escapeHtml(text);
  const pattern = targets.map((chunk) => chunk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return escapeHtml(text).replace(new RegExp(pattern, "gi"), (match) => `<mark>${match}</mark>`);
}

function estimatedLongStart(item, chunk, offset = 0) {
  const cue = (item.cuePoints || []).find((point) => {
    const sameChunk = point.chunk && point.chunk.toLowerCase() === chunk.toLowerCase();
    return sameChunk && (point.startIndex === undefined || Number(point.startIndex) === Number(offset));
  });
  if (cue) return Math.max(0, Number(cue.startSeconds) || 0);
  const duration = Number(item.durationSeconds) || 0;
  const transcriptLength = Math.max(1, item.transcript.length);
  return Math.max(0, (offset / transcriptLength) * duration - 0.35);
}

function highlightLongTranscript(item) {
  const targets = (item.highlightChunks || []).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!targets.length) return escapeHtml(item.transcript);
  const pattern = targets.map((chunk) => chunk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  let lastIndex = 0;
  let html = "";
  item.transcript.replace(new RegExp(pattern, "gi"), (match, offset) => {
    const start = estimatedLongStart(item, match, offset);
    const meaning = chunkMeaningFor(item, match);
    html += escapeHtml(item.transcript.slice(lastIndex, offset));
    html += `<button class="tap-chunk" type="button" data-long-start="${start.toFixed(2)}" data-chunk="${escapeHtml(match)}" data-meaning-ja="${escapeHtml(meaning)}" aria-label="${escapeHtml(match)} から再生">${escapeHtml(match)}</button>`;
    lastIndex = offset + match.length;
    return match;
  });
  html += escapeHtml(item.transcript.slice(lastIndex));
  return html;
}

function chunkStartFromText(item, chunk) {
  const offset = item.transcript.toLowerCase().indexOf(chunk.toLowerCase());
  return estimatedLongStart(item, chunk, Math.max(0, offset));
}

function renderLongContentHtml(item) {
  if (longDisplayMode === "chunks") {
    return `
      <div class="tag-list">${item.highlightChunks.map((chunk) => {
        const start = chunkStartFromText(item, chunk);
        const meaning = chunkMeaningFor(item, chunk);
        return `<button class="chunk-pill tap-chunk" type="button" data-long-start="${start.toFixed(2)}" data-chunk="${escapeHtml(chunk)}" data-meaning-ja="${escapeHtml(meaning)}"><span>${escapeHtml(chunk)}</span>${meaning ? `<small>${escapeHtml(meaning)}</small>` : ""}</button>`;
      }).join("")}</div>
      <p class="point-text">${escapeHtml(item.visibleSummary || "")}</p>
      <p class="kana-line">${(item.kanaHints || []).map(escapeHtml).join(" / ")}</p>
    `;
  }
  return `<p>${highlightLongTranscript(item)}</p>`;
}

function chunkMeaningFor(source, chunk) {
  if (!source) return "";
  if (source.meaningJa) return source.meaningJa;
  const meanings = source.chunkMeanings || {};
  const target = String(chunk || "").toLowerCase();
  const key = Object.keys(meanings).find((candidate) => candidate.toLowerCase() === target);
  return key ? meanings[key] : "";
}

function renderMeaningBlock(label, meaning) {
  if (!meaning) return "";
  return `
    <div class="focus-meaning">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(meaning)}</strong>
    </div>
  `;
}

function monologueTextForPractice(question) {
  if (question.monologueText) return question.monologueText;
  return currentLongListening()?.transcript || "";
}

function renderEmbeddedLongListening(item) {
  if (!item) {
    return `
      <p class="practice-sentence">${escapeHtml(monologueTextForPractice(currentPracticeQuestion()) || "モノローグ音源を追加してください。")}</p>
    `;
  }
  return `
    <div class="embedded-long">
      <div class="embedded-long-header">
        <div>
          <p class="panel-label">長めモノローグ</p>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <button class="audio-button compact-audio" type="button" data-practice-long-play>聞く</button>
      </div>
      <div class="long-toggle embedded-toggle" role="group" aria-label="長めモノローグ表示">
        <button class="speed-button ${longDisplayMode === "transcript" ? "is-active" : ""}" type="button" data-practice-long-mode="transcript">全文を見る</button>
        <button class="speed-button ${longDisplayMode === "chunks" ? "is-active" : ""}" type="button" data-practice-long-mode="chunks">チャンクだけ</button>
      </div>
      <p class="chunk-meaning-line" data-practice-long-meaning aria-live="polite"></p>
      <div class="long-content" data-practice-long-content>${renderLongContentHtml(item)}</div>
    </div>
  `;
}

function renderKanaReveal(question) {
  const answerKana = question.answerKana || question.kana;
  if (!kanaAnswerVisible) {
    return `
      <div class="kana-reveal">
        <h3>自然な会話ではどう聞こえやすい？</h3>
        <p class="prediction-prompt">${escapeHtml(question.practiceText || question.answer)}</p>
        <button class="secondary-action compact" type="button" data-kana-reveal>答えを見る</button>
      </div>
    `;
  }
  return `
    <div class="kana-reveal">
      <h3>自然な会話ではどう聞こえやすい？</h3>
      <p class="prediction-prompt">${escapeHtml(question.practiceText || question.answer)}</p>
      <div class="reveal-answer">
        <span>答え</span>
        <strong>${escapeHtml(answerKana)}</strong>
      </div>
      <dl class="explain-list compact-explain">
        <div><dt>見える化</dt><dd>${escapeHtml(question.visibleForm)}</dd></div>
        <div><dt>ポイント</dt><dd>${escapeHtml(question.point)}</dd></div>
      </dl>
      <button class="secondary-action compact" type="button" data-kana-play>音声で確認</button>
    </div>
  `;
}

function uniqueNonEmpty(items) {
  return Array.from(new Set(items.filter((item) => String(item || "").trim()).map((item) => String(item).trim())));
}

function missingSoundAnswer(question) {
  const match = String(question.visibleForm || "").match(/\(([a-z])\)/i);
  return match ? match[1].toLowerCase() : "";
}

function questionsForPracticeEntry(entryMode) {
  const source = practiceReadyQuestions();
  if (entryMode === "missing") return source.filter((question) => missingSoundAnswer(question));
  if (entryMode === "find") return source.filter((question) => question.sentenceText && (question.targetChunk || question.answer));
  if (entryMode === "kana") return source.filter((question) => question.answerKana || question.kanaChoices?.length);
  if (entryMode === "restore") return source.filter((question) => question.answer && (question.answerKana || question.kana));
  return source.filter((question) => question.choices?.length);
}

function choicesFromQuestion(question) {
  return uniqueNonEmpty((question.choices || []).map((choice) => choice.text));
}

function answerChoicesForRestore(question) {
  return uniqueNonEmpty([
    question.answer,
    ...choicesFromQuestion(question),
    ...approvedQuestions.map((candidate) => candidate.answer),
  ]).slice(0, 4);
}

function answerChoicesForKana(question) {
  const answerKana = question.answerKana || question.kana;
  return uniqueNonEmpty([
    ...(question.kanaChoices || []),
    answerKana,
    question.kana,
    question.visibleForm,
  ]).slice(0, 4);
}

function answerChoicesForFind(question) {
  const answer = question.targetChunk || question.answer;
  return uniqueNonEmpty([
    answer,
    ...approvedQuestions.map((candidate) => candidate.targetChunk || candidate.answer),
  ]).slice(0, 4);
}

function answerChoicesForMissing(question) {
  const answer = missingSoundAnswer(question);
  return uniqueNonEmpty([answer, "t", "d", "y", "h", "n"]).slice(0, 4);
}

function renderPracticeAnswerDetail(question, answerLabel) {
  return `
    <dl class="explain-list compact-explain">
      <div><dt>正解</dt><dd>${escapeHtml(answerLabel)}</dd></div>
      <div><dt>見える化</dt><dd>${escapeHtml(question.visibleForm)}</dd></div>
      <div><dt>カナ補助</dt><dd>${escapeHtml(question.answerKana || question.kana)}</dd></div>
    </dl>
    <p class="point-text">${escapeHtml(question.point)}</p>
  `;
}

function renderPracticeQuiz({ title, promptHtml, choices, answer, question, playUrl }) {
  const choiceButtons = shuffle(uniqueNonEmpty(choices)).slice(0, 4).map((choice) => `
    <button
      class="mini-choice-button"
      type="button"
      data-practice-answer="${escapeHtml(choice)}"
      data-correct="${choice === answer ? "true" : "false"}"
    >${escapeHtml(choice)}</button>
  `).join("");

  return `
    <div class="practice-mini-quiz" data-practice-quiz>
      <div class="quiz-heading-row">
        <h3>${escapeHtml(title)}</h3>
        ${playUrl ? `<button class="audio-button compact-audio" type="button" data-practice-quiz-play>聞く</button>` : ""}
      </div>
      ${promptHtml}
      <div class="inline-choice-list">${choiceButtons}</div>
      <p class="practice-inline-feedback" data-practice-feedback hidden></p>
      <div class="mini-answer-detail" data-practice-detail hidden>
        ${renderPracticeAnswerDetail(question, answer)}
      </div>
    </div>
  `;
}

function renderPracticeFocus(question) {
  const targetChunk = question.targetChunk || question.answer;
  const highlightChunks = question.highlightChunks || [targetChunk];
  const meaning = chunkMeaningFor(question, targetChunk);
  const modeLabels = {
    chunk: "チャンク",
    sentence: "文",
    monologue: "モノローグ",
    kana: "カタカナ予測",
    heard: "聞き取り4択",
    kanaChoice: "カナ予測",
    restore: "元の英語",
    missing: "消えた音",
    find: "文の中",
  };
  els.practiceFocusLabel.textContent = modeLabels[practiceDisplayMode] || modeLabels.chunk;
  [els.practiceChunkButton, els.practiceSentenceButton, els.practiceMonoButton, els.practiceKanaButton].forEach((button) => {
    button.classList.add("subtle");
    button.classList.remove("is-active");
  });
  const activeButton = {
    chunk: els.practiceChunkButton,
    sentence: els.practiceSentenceButton,
    monologue: els.practiceMonoButton,
    kana: els.practiceKanaButton,
  }[practiceDisplayMode];
  if (activeButton) {
    activeButton.classList.remove("subtle");
    activeButton.classList.add("is-active");
  }

  if (practiceDisplayMode === "heard") {
    els.practiceFocusContent.innerHTML = renderPracticeQuiz({
      title: "聞こえた英語はどれ？",
      promptHtml: "",
      choices: choicesFromQuestion(question),
      answer: question.answer,
      question,
      playUrl: question.audioUrl,
    });
    return;
  }

  if (practiceDisplayMode === "kanaChoice") {
    els.practiceFocusContent.innerHTML = renderPracticeQuiz({
      title: "自然な会話ではどう聞こえやすい？",
      promptHtml: `<p class="prediction-prompt">${escapeHtml(question.practiceText || question.answer)}</p>`,
      choices: answerChoicesForKana(question),
      answer: question.answerKana || question.kana,
      question,
      playUrl: question.audioUrl,
    });
    return;
  }

  if (practiceDisplayMode === "restore") {
    const prompt = question.answerKana || question.kana || question.visibleForm;
    els.practiceFocusContent.innerHTML = renderPracticeQuiz({
      title: "この聞こえ方を元の英語に戻すと？",
      promptHtml: `<p class="prediction-prompt kana-prompt">${escapeHtml(prompt)}</p>`,
      choices: answerChoicesForRestore(question),
      answer: question.answer,
      question,
      playUrl: question.audioUrl,
    });
    return;
  }

  if (practiceDisplayMode === "missing") {
    const answer = missingSoundAnswer(question);
    els.practiceFocusContent.innerHTML = renderPracticeQuiz({
      title: "弱くなる、または消えやすい音はどれ？",
      promptHtml: `<p class="prediction-prompt">${escapeHtml(question.visibleForm)}</p>`,
      choices: answerChoicesForMissing(question),
      answer,
      question,
      playUrl: question.audioUrl,
    });
    return;
  }

  if (practiceDisplayMode === "find") {
    const answer = question.targetChunk || question.answer;
    els.practiceFocusContent.innerHTML = renderPracticeQuiz({
      title: "文の中に入っていた音変化チャンクは？",
      promptHtml: `<p class="practice-sentence">${escapeHtml(question.sentenceText || "")}</p>`,
      choices: answerChoicesForFind(question),
      answer,
      question,
      playUrl: question.sentenceAudioUrl || question.audioUrl,
    });
    return;
  }

  if (practiceDisplayMode === "sentence") {
    const sentence = question.sentenceText
      ? highlightText(question.sentenceText, highlightChunks)
      : "文の中で、このチャンクがどう聞こえるかを確認します。";
    els.practiceFocusContent.innerHTML = `
      <p class="practice-sentence">${sentence}</p>
      ${renderMeaningBlock("チャンクの意味", meaning)}
    `;
    return;
  }

  if (practiceDisplayMode === "monologue") {
    els.practiceFocusContent.innerHTML = renderEmbeddedLongListening(currentLongListening());
    return;
  }

  if (practiceDisplayMode === "kana") {
    els.practiceFocusContent.innerHTML = renderKanaReveal(question);
    return;
  }

  els.practiceFocusContent.innerHTML = `
    <p class="focus-main">${escapeHtml(question.practiceText || question.answer)}</p>
    ${renderMeaningBlock("意味", meaning)}
  `;
}

function setPracticeDisplayMode(mode, shouldPlay = false) {
  if (mode === "kana") kanaAnswerVisible = false;
  practiceDisplayMode = mode;
  const question = currentPracticeQuestion();
  renderPracticeFocus(question);
  if (!shouldPlay) return;
  const audioUrl = {
    chunk: question.audioUrl,
    sentence: question.sentenceAudioUrl,
    monologue: currentLongListening()?.audioUrl || question.monologueAudioUrl,
  }[mode];
  playAudio(audioUrl);
}

function normalizePlaybackRate(rate) {
  const numeric = Number(rate);
  const safeRate = Number.isFinite(numeric) ? numeric : 1;
  const clamped = Math.min(SPEED_MAX, Math.max(SPEED_MIN, safeRate));
  return Number((Math.round(clamped / SPEED_STEP) * SPEED_STEP).toFixed(2));
}

function playbackRateLabel(rate) {
  if (rate === 1) return "通常";
  if (rate >= 0.9) return "ほんの少しゆっくり";
  if (rate >= 0.8) return "少しゆっくり";
  return "かなりゆっくり";
}

function currentPlaybackRate() {
  return normalizePlaybackRate(els.speedRange?.value || playbackRate);
}

function setPlaybackRate(rate) {
  playbackRate = normalizePlaybackRate(rate);
  localStorage.setItem(SPEED_STORAGE_KEY, String(playbackRate));
  document.querySelectorAll(".speed-button[data-rate]").forEach((button) => {
    button.classList.toggle("is-active", normalizePlaybackRate(button.dataset.rate) === playbackRate);
  });
  const label = playbackRateLabel(playbackRate);
  els.speedLabel.textContent = label;
  els.speedValue.textContent = `${playbackRate.toFixed(2)}x`;
  els.speedRange.value = String(playbackRate);
  els.speedHint.textContent = `${playbackRate.toFixed(2)}xで再生します。`;
  els.audioPlayer.playbackRate = playbackRate;
}

function effectiveReviewStatus(question) {
  const overrides = loadReviewOverrides();
  return overrides[question.id] || question.reviewStatus || "pending";
}

function approvedOnly(questions) {
  return questions.filter((question) => effectiveReviewStatus(question) === "approved");
}

function refreshApprovedQuestions() {
  approvedQuestions = approvedOnly(allQuestions);
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function topWeaknessTags(limit = 2) {
  const stats = loadStats();
  return Object.entries(stats.missesByTag || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

function reviewCounts() {
  return allQuestions.reduce(
    (counts, question) => {
      counts[effectiveReviewStatus(question)] += 1;
      return counts;
    },
    { approved: 0, pending: 0, rejected: 0 }
  );
}

function updateHome() {
  refreshApprovedQuestions();
  const stats = loadStats();
  const missCount = Object.values(stats.missesByTag || {}).reduce((sum, value) => sum + value, 0);
  const counts = reviewCounts();
  const sentenceCount = approvedQuestions.filter((question) => question.sentenceText).length;
  els.approvedCount.textContent = String(approvedQuestions.length);
  els.mistakeCount.textContent = String(missCount);
  els.sentenceBundleCount.textContent = String(sentenceCount);
  els.monologueBundleCount.textContent = String(longListeningItems.length);
  els.homeMeta.textContent = `${Math.min(5, approvedQuestions.length)}問 / 採用中のみ`;
  if (els.teacherSummary) {
    els.teacherSummary.textContent = `採用 ${counts.approved} / 保留 ${counts.pending} / 不採用 ${counts.rejected}`;
  }
}

function objectUrlFromBlob(absoluteUrl, blob) {
  if (audioObjectUrlCache.has(absoluteUrl)) return audioObjectUrlCache.get(absoluteUrl);
  const objectUrl = URL.createObjectURL(blob);
  audioObjectUrlCache.set(absoluteUrl, objectUrl);
  return objectUrl;
}

async function cachedAudioUrl(url) {
  const absoluteUrl = new URL(url, window.location.href).href;
  if (!absoluteUrl.startsWith("http")) return absoluteUrl;
  if (audioObjectUrlCache.has(absoluteUrl)) return audioObjectUrlCache.get(absoluteUrl);

  try {
    const storedBlob = await readStoredAudioBlob(absoluteUrl);
    if (storedBlob) return objectUrlFromBlob(absoluteUrl, storedBlob);
  } catch (error) {
    console.warn("Audio storage read fallback:", error);
  }

  try {
    const response = await fetch(absoluteUrl, { mode: "cors", cache: "force-cache" });
    if (!response.ok) throw new Error(`Audio fetch failed: ${response.status}`);
    const blob = await response.blob();
    await writeStoredAudioBlob(absoluteUrl, blob).catch((error) => {
      console.warn("Audio storage write skipped:", error);
    });
    if ("caches" in window) {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      await cache.put(absoluteUrl, new Response(blob, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
        },
      })).catch(() => {});
    }
    return objectUrlFromBlob(absoluteUrl, blob);
  } catch (error) {
    console.warn("Audio cache fallback:", error);
    return absoluteUrl;
  }
}

async function playAudio(url, rate, startAt = 0) {
  if (!url) return;
  const effectiveRate = normalizePlaybackRate(rate ?? currentPlaybackRate());
  const absoluteUrl = new URL(url, window.location.href).href;
  const playableUrl = await cachedAudioUrl(absoluteUrl);
  const targetStart = Math.max(0, Number(startAt) || 0);
  els.audioPlayer.pause();
  if (els.audioPlayer.currentSrc !== playableUrl) {
    els.audioPlayer.src = playableUrl;
  }
  els.audioPlayer.defaultPlaybackRate = effectiveRate;
  els.audioPlayer.playbackRate = effectiveRate;
  const jumpToStart = () => {
    const duration = Number.isFinite(els.audioPlayer.duration) ? els.audioPlayer.duration : 0;
    const safeStart = duration ? Math.min(targetStart, Math.max(0, duration - 0.2)) : targetStart;
    els.audioPlayer.currentTime = Math.max(0, safeStart);
  };
  const startPlayback = () => {
    jumpToStart();
    els.audioPlayer.play().catch(() => {});
  };
  if (els.audioPlayer.readyState >= 1) {
    startPlayback();
  } else {
    els.audioPlayer.addEventListener("loadedmetadata", startPlayback, { once: true });
    els.audioPlayer.load();
  }
}

function currentQuestion() {
  return drillQuestions[currentIndex];
}

function startDrill(mode) {
  refreshApprovedQuestions();
  const source = mode === "review" ? reviewQuestions() : approvedQuestions;
  if (!source.length) {
    els.homeMeta.textContent = "採用中の問題がありません。講師レビューで採用してください。";
    showScreen("home");
    return;
  }
  drillQuestions = shuffle(source).slice(0, 5).map((question) => ({
    ...question,
    shuffledChoices: shuffle(question.choices),
  }));
  currentIndex = 0;
  currentAnswer = null;
  sessionResults = [];
  renderQuestion();
  showScreen("drill");
}

function reviewQuestions() {
  const tags = topWeaknessTags(3);
  if (!tags.length) return approvedQuestions;
  const tagged = approvedQuestions.filter((question) => tags.includes(question.weaknessTag));
  return tagged.length ? tagged : approvedQuestions;
}

function renderQuestion() {
  const question = currentQuestion();
  const progress = ((currentIndex + 1) / drillQuestions.length) * 100;
  currentAnswer = null;
  els.feedbackPanel.hidden = true;
  els.progressBar.style.width = `${progress}%`;
  els.progressText.textContent = `${currentIndex + 1}/${drillQuestions.length}`;
  els.soundBadge.textContent = question.soundType;
  els.soundBadge.className = `sound-badge sound-${question.soundType}`;
  els.weaknessLabel.textContent = question.weaknessTag;
  els.choiceList.innerHTML = "";
  question.shuffledChoices.forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = choice.text;
    button.addEventListener("click", () => answerQuestion(choice));
    els.choiceList.appendChild(button);
  });
}

function answerQuestion(choice) {
  if (currentAnswer) return;
  const question = currentQuestion();
  const progress = ((currentIndex + 1) / drillQuestions.length) * 100;
  currentAnswer = choice;
  const correct = Boolean(choice.correct);
  const result = {
    questionId: question.id,
    correct,
    weaknessTag: correct ? null : choice.weaknessTag || question.weaknessTag,
  };
  sessionResults.push(result);
  if (!correct) recordMiss(question, choice);

  Array.from(els.choiceList.children).forEach((button) => {
    const buttonChoice = question.shuffledChoices.find((item) => item.text === button.textContent);
    button.disabled = true;
    if (buttonChoice.correct) button.classList.add("is-correct");
    if (buttonChoice.text === choice.text && !correct) button.classList.add("is-wrong");
  });

  els.feedbackTitle.textContent = correct ? "正解" : "もう一歩";
  els.feedbackTitle.className = `feedback-title ${correct ? "correct" : "wrong"}`;
  els.diagnosisText.textContent = correct ? "音の塊を聞き取れています。" : choice.reason || "音変化の聞き取りを確認しましょう。";
  els.answerText.textContent = question.answer;
  els.visibleText.textContent = question.visibleForm;
  els.kanaText.textContent = question.kana;
  els.pointText.textContent = question.point;
  els.sentenceButton.hidden = !question.sentenceAudioUrl;
  els.nextButton.textContent = currentIndex + 1 >= drillQuestions.length ? "結果へ" : "次へ";
  els.answerProgressBar.style.width = `${progress}%`;
  els.answerProgressText.textContent = `${currentIndex + 1}/${drillQuestions.length}`;
  els.feedbackPanel.hidden = false;
  showScreen("answer");
}

function recordMiss(question, choice) {
  const stats = loadStats();
  const tag = choice.weaknessTag || question.weaknessTag;
  stats.missesByTag[tag] = (stats.missesByTag[tag] || 0) + 1;
  stats.missedQuestionIds = Array.from(new Set([question.id, ...(stats.missedQuestionIds || [])])).slice(0, 50);
  saveStats(stats);
}

function nextQuestion() {
  if (currentIndex + 1 >= drillQuestions.length) {
    renderResult();
    showScreen("result");
    return;
  }
  currentIndex += 1;
  renderQuestion();
  showScreen("drill");
}

function renderResult() {
  const correctCount = sessionResults.filter((result) => result.correct).length;
  els.scoreText.textContent = `${correctCount}/${sessionResults.length}`;
  els.scoreNote.textContent = correctCount === sessionResults.length ? "今日は聞き取り安定です。" : "苦手タグを復習に回しました。";

  const misses = sessionResults.filter((result) => !result.correct && result.weaknessTag);
  const counts = misses.reduce((acc, result) => {
    acc[result.weaknessTag] = (acc[result.weaknessTag] || 0) + 1;
    return acc;
  }, {});
  const topTags = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  els.weaknessList.innerHTML = "";
  if (!topTags.length) {
    const card = document.createElement("div");
    card.className = "tag-card";
    card.innerHTML = "<h3>苦手なし</h3><p>今回の5問では大きな崩れはありません。</p>";
    els.weaknessList.appendChild(card);
    return;
  }
  topTags.forEach(([tag, count]) => {
    const card = document.createElement("div");
    card.className = "tag-card";
    card.innerHTML = `<h3>${tag}</h3><p>${count}回ミス</p>`;
    els.weaknessList.appendChild(card);
  });
}

function renderTypes(selectedIndex = selectedSoundTypeIndex) {
  selectedSoundTypeIndex = Math.min(Math.max(selectedIndex, 0), SOUND_TYPES.length - 1);
  const selectedType = SOUND_TYPES[selectedSoundTypeIndex];
  const typeCards = SOUND_TYPES.map((type, index) => `
    <button
      class="type-pick-card ${index === selectedSoundTypeIndex ? "is-active" : ""}"
      type="button"
      data-type-index="${index}"
    >
      <span class="sound-badge sound-${type.name}">${type.name}</span>
      <strong>${type.name}</strong>
      <small>${type.example}</small>
      <img class="type-card-guardian" src="${type.guardianImage}" alt="" aria-hidden="true" />
    </button>
  `).join("");

  els.typeList.innerHTML = "";
  els.typeList.innerHTML = `
    <section class="type-bento-grid" aria-label="音変化タイプを選ぶ">
      ${typeCards}
    </section>
    <article class="type-card type-detail-card">
      <img class="type-detail-guardian" src="${selectedType.guardianImage}" alt="" aria-hidden="true" />
      <span class="sound-badge sound-${selectedType.name}">${selectedType.name}</span>
      <h3>${selectedType.name}</h3>
      <p class="type-description">${selectedType.description}</p>
      <dl class="type-detail-list">
        <div><dt>なぜ起きる？</dt><dd>${selectedType.why}</dd></div>
        <div><dt>聞くコツ</dt><dd>${selectedType.listenFor}</dd></div>
        <div><dt>よくある聞き違い</dt><dd>${selectedType.commonMiss}</dd></div>
      </dl>
      <p class="type-example">例: ${selectedType.example}</p>
    </article>
  `;
}

function practiceReadyQuestions() {
  refreshApprovedQuestions();
  return approvedQuestions.filter((question) => question.answer && question.audioUrl);
}

function currentPracticeQuestion() {
  return practiceQuestions[currentPracticeIndex];
}

function defaultPracticeDisplayMode() {
  return {
    heard: "heard",
    kana: "kanaChoice",
    restore: "restore",
    missing: "missing",
    find: "find",
  }[practiceEntryMode] || "chunk";
}

function showPracticeChooser() {
  practiceEntryMode = "select";
  practiceDisplayMode = "chunk";
  practiceFinalMode = false;
  kanaAnswerVisible = false;
  screens.practice.classList.remove("is-practicing");
  els.practiceTitle.textContent = "練習タイプを選ぶ";
  els.practiceProgressText.textContent = "選択";
  els.practiceBackButton.textContent = "ホーム";
  els.practiceStepBackButton.hidden = true;
  els.practiceTypeChooser.hidden = false;
  els.practiceWorkArea.hidden = true;
  els.practiceWorkArea.classList.remove("exercise-mode");
  delete els.practiceWorkArea.dataset.entryMode;
}

function startPracticeMode() {
  practiceQuestions = practiceReadyQuestions();
  currentPracticeIndex = 0;
  practiceFinalMode = false;
  if (!practiceQuestions.length) {
    els.homeMeta.textContent = "練習に使える採用中の問題がありません。";
    showScreen("home");
    return;
  }
  showPracticeChooser();
  showScreen("practice");
}

function startBundlePractice() {
  practiceQuestions = practiceReadyQuestions();
  currentPracticeIndex = 0;
  practiceFinalMode = false;
  if (!practiceQuestions.length) {
    els.homeMeta.textContent = "練習に使える採用中の問題がありません。";
    showScreen("home");
    return;
  }
  showScreen("practice");
  startPracticeEntry("find");
}

function startPracticeEntry(entryMode) {
  const questions = questionsForPracticeEntry(entryMode);
  if (!questions.length) {
    els.homeMeta.textContent = "この練習タイプに使える採用中の問題がありません。";
    updateHome();
    showScreen("home");
    return;
  }
  practiceEntryMode = entryMode;
  practiceQuestions = questions;
  currentPracticeIndex = 0;
  practiceDisplayMode = defaultPracticeDisplayMode();
  practiceFinalMode = false;
  kanaAnswerVisible = false;
  screens.practice.classList.add("is-practicing");
  els.practiceTitle.textContent = PRACTICE_ENTRY_LABELS[entryMode] || "練習モード";
  els.practiceBackButton.textContent = "ホーム";
  els.practiceStepBackButton.hidden = false;
  els.practiceTypeChooser.hidden = true;
  els.practiceWorkArea.hidden = false;
  els.practiceWorkArea.classList.add("exercise-mode");
  els.practiceWorkArea.dataset.entryMode = entryMode;
  renderPractice();
  renderLongListening();
}

function renderPractice() {
  if (practiceFinalMode) {
    renderPracticeFinalMonologue();
    return;
  }
  const question = currentPracticeQuestion();
  [els.practiceChunkButton, els.practiceSentenceButton, els.practiceMonoButton, els.practiceKanaButton].forEach((button) => {
    button.disabled = false;
  });
  els.practiceProgressText.textContent = `${currentPracticeIndex + 1}/${practiceQuestions.length}`;
  els.practiceSoundBadge.textContent = question.soundType;
  els.practiceSoundBadge.className = `sound-badge sound-${question.soundType}`;
  els.practiceWeaknessLabel.textContent = question.weaknessTag;
  els.practiceAnswerText.textContent = PRACTICE_ENTRY_LABELS[practiceEntryMode] || question.practiceText || question.answer;
  els.practiceVisibleText.textContent = question.visibleForm;
  els.practiceKanaText.textContent = question.kana;
  els.practicePointText.textContent = question.point;
  renderPracticeFocus(question);
  els.practicePrevButton.disabled = currentPracticeIndex === 0;
  els.practiceNextButton.disabled = false;
  els.practiceNextButton.textContent = currentPracticeIndex === practiceQuestions.length - 1 ? "モノローグへ" : "次へ";
  renderKanaPrediction(question);
}

function renderPracticeFinalMonologue() {
  const item = currentLongListening();
  els.practiceProgressText.textContent = `${practiceQuestions.length + 1}/${practiceQuestions.length + 1}`;
  els.practiceSoundBadge.textContent = "モノローグ";
  els.practiceSoundBadge.className = "sound-badge sound-連結";
  els.practiceWeaknessLabel.textContent = "総仕上げ";
  els.practiceAnswerText.textContent = "長めの話で聞く";
  els.practiceVisibleText.textContent = item?.title || "長めモノローグ";
  els.practiceKanaText.textContent = "チャンクをまとめて確認";
  els.practicePointText.textContent = "最後に、練習した音変化が長い文の中で続けて出る形を聞きます。";
  longDisplayMode = "transcript";
  els.practiceFocusContent.innerHTML = renderEmbeddedLongListening(item);
  [els.practiceChunkButton, els.practiceSentenceButton, els.practiceMonoButton, els.practiceKanaButton].forEach((button) => {
    button.disabled = true;
  });
  els.practicePrevButton.disabled = false;
  els.practiceNextButton.disabled = false;
  els.practiceNextButton.textContent = "完了";
  els.kanaFeedbackPanel.hidden = true;
}

function movePractice(delta) {
  if (practiceFinalMode) {
    if (delta < 0) {
      practiceFinalMode = false;
      currentPracticeIndex = Math.max(0, practiceQuestions.length - 1);
      practiceDisplayMode = defaultPracticeDisplayMode();
      kanaAnswerVisible = false;
      renderPractice();
      return;
    }
    updateHome();
    showScreen("home");
    return;
  }
  if (delta > 0 && currentPracticeIndex === practiceQuestions.length - 1) {
    practiceFinalMode = true;
    practiceDisplayMode = "monologue";
    kanaAnswerVisible = false;
    renderPracticeFinalMonologue();
    return;
  }
  currentPracticeIndex = Math.min(Math.max(currentPracticeIndex + delta, 0), practiceQuestions.length - 1);
  practiceDisplayMode = defaultPracticeDisplayMode();
  kanaAnswerVisible = false;
  renderPractice();
}

function renderKanaPrediction(question) {
  els.kanaPromptText.textContent = question.practiceText || question.answer;
  els.kanaChoiceList.innerHTML = "";
  els.kanaFeedbackPanel.hidden = true;
  const answerKana = question.answerKana || question.kana;
  const rawChoices = question.kanaChoices && question.kanaChoices.length === 4
    ? question.kanaChoices
    : [answerKana, question.kana, question.answer, question.visibleForm].filter(Boolean).slice(0, 4);
  shuffle(Array.from(new Set(rawChoices))).slice(0, 4).forEach((choiceText) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = choiceText;
    button.addEventListener("click", () => answerKanaPrediction(button, choiceText, answerKana, question));
    els.kanaChoiceList.appendChild(button);
  });
}

function answerKanaPrediction(button, choiceText, answerKana, question) {
  const correct = choiceText === answerKana;
  Array.from(els.kanaChoiceList.children).forEach((choiceButton) => {
    choiceButton.disabled = true;
    if (choiceButton.textContent === answerKana) choiceButton.classList.add("is-correct");
    if (choiceButton === button && !correct) choiceButton.classList.add("is-wrong");
  });
  els.kanaFeedbackTitle.textContent = correct ? "正解" : "もう一歩";
  els.kanaFeedbackTitle.className = `feedback-title ${correct ? "correct" : "wrong"}`;
  els.kanaFeedbackText.textContent = correct
    ? "文字から音の崩れを予測できています。"
    : `正解は「${answerKana}」です。文字どおりではなく、弱くなる語やつながる場所を見ます。`;
  els.kanaFeedbackPoint.textContent = `${question.visibleForm} / ${question.point}`;
  els.kanaFeedbackPanel.hidden = false;
}

function currentLongListening() {
  return longListeningItems[currentLongIndex];
}

function renderLongListening() {
  const item = currentLongListening();
  if (!item) {
    els.longTitle.textContent = "長めモノローグがありません";
    els.longPointText.textContent = "data/long-listening.json に長め音源を追加してください。";
    els.longMeaningText.textContent = "";
    els.longContent.textContent = "";
    return;
  }
  els.longTitle.textContent = item.title;
  els.longPointText.textContent = item.point;
  els.longMeaningText.textContent = "";
  els.longTranscriptButton.classList.toggle("is-active", longDisplayMode === "transcript");
  els.longChunksButton.classList.toggle("is-active", longDisplayMode === "chunks");
  els.longContent.innerHTML = renderLongContentHtml(item);
}

function setLongDisplayMode(mode) {
  longDisplayMode = mode;
  renderLongListening();
  if (practiceDisplayMode === "monologue" && currentPracticeQuestion()) {
    renderPracticeFocus(currentPracticeQuestion());
  }
}

function handleLongChunkTrigger(trigger, contentRoot, meaningTarget) {
  const startAt = Number.parseFloat(trigger.getAttribute("data-long-start") || "0");
  const chunk = trigger.getAttribute("data-chunk") || trigger.textContent.trim();
  const meaning = trigger.getAttribute("data-meaning-ja") || "";
  const longRoot = trigger.closest(".long-content") || contentRoot;
  longRoot.dataset.activeStart = startAt.toFixed(2);
  longRoot.querySelectorAll(".tap-chunk").forEach((button) => button.classList.remove("is-playing"));
  trigger.classList.add("is-playing");
  if (meaningTarget) meaningTarget.textContent = meaning ? `${chunk} = ${meaning}` : "";
  playAudio(currentLongListening()?.audioUrl, currentPlaybackRate(), startAt);
}

function handlePracticeFocusClick(event) {
  const quizPlayButton = event.target.closest("[data-practice-quiz-play]");
  if (quizPlayButton) {
    const question = currentPracticeQuestion();
    const audioUrl = practiceDisplayMode === "find" ? question.sentenceAudioUrl || question.audioUrl : question.audioUrl;
    playAudio(audioUrl);
    return;
  }
  const quizAnswerButton = event.target.closest("[data-practice-answer]");
  if (quizAnswerButton) {
    const quizRoot = quizAnswerButton.closest("[data-practice-quiz]");
    const isCorrect = quizAnswerButton.dataset.correct === "true";
    quizRoot.querySelectorAll("[data-practice-answer]").forEach((button) => {
      button.disabled = true;
      button.classList.toggle("is-correct", button.dataset.correct === "true");
    });
    if (!isCorrect) quizAnswerButton.classList.add("is-wrong");
    const feedback = quizRoot.querySelector("[data-practice-feedback]");
    feedback.hidden = false;
    feedback.textContent = isCorrect ? "正解" : "正解と聞こえ方を確認";
    const detail = quizRoot.querySelector("[data-practice-detail]");
    if (detail) detail.hidden = false;
    return;
  }
  const revealButton = event.target.closest("[data-kana-reveal]");
  if (revealButton) {
    kanaAnswerVisible = true;
    renderPracticeFocus(currentPracticeQuestion());
    return;
  }
  const kanaPlayButton = event.target.closest("[data-kana-play]");
  if (kanaPlayButton) {
    playAudio(currentPracticeQuestion()?.audioUrl);
    return;
  }
  const longPlayButton = event.target.closest("[data-practice-long-play]");
  if (longPlayButton) {
    playAudio(currentLongListening()?.audioUrl);
    return;
  }
  const longModeButton = event.target.closest("[data-practice-long-mode]");
  if (longModeButton) {
    setLongDisplayMode(longModeButton.dataset.practiceLongMode);
    return;
  }
  const longChunkButton = event.target.closest("[data-long-start]");
  if (longChunkButton) {
    event.preventDefault();
    handleLongChunkTrigger(
      longChunkButton,
      els.practiceFocusContent,
      els.practiceFocusContent.querySelector("[data-practice-long-meaning]"),
    );
  }
}

function renderTeacherReview() {
  refreshApprovedQuestions();
  updateHome();
  els.teacherList.innerHTML = "";
  allQuestions.forEach((question) => {
    const status = effectiveReviewStatus(question);
    const card = document.createElement("article");
    card.className = `review-card review-${status}`;
    const choices = question.choices
      .map((choice) => `<li class="${choice.correct ? "correct-choice" : ""}">${choice.text}${choice.reason ? ` <span>${choice.reason}</span>` : ""}</li>`)
      .join("");
    card.innerHTML = `
      <div class="review-card-header">
        <div>
          <span class="sound-badge sound-${question.soundType}">${question.soundType}</span>
          <span class="status-badge status-${status}">${STATUS_LABELS[status]}</span>
        </div>
        <strong>${question.answer}</strong>
      </div>
      <p class="review-meta">${question.id} / ${question.weaknessTag} / ${question.qualityStatus || "unchecked"}</p>
      <div class="review-audio-row">
        <button class="secondary-action compact" type="button" data-play="${question.audioUrl}">チャンクを聞く</button>
        <button class="secondary-action compact" type="button" data-play="${question.sentenceAudioUrl || ""}">文を聞く</button>
      </div>
      <dl class="review-explain">
        <div><dt>見える化</dt><dd>${question.visibleForm}</dd></div>
        <div><dt>カナ補助</dt><dd>${question.kana}</dd></div>
        <div><dt>ポイント</dt><dd>${question.point}</dd></div>
      </dl>
      <ol class="review-choice-list">${choices}</ol>
      <div class="review-actions">
        <button class="review-status-button approve" type="button" data-id="${question.id}" data-status="approved">採用</button>
        <button class="review-status-button hold" type="button" data-id="${question.id}" data-status="pending">保留</button>
        <button class="review-status-button reject" type="button" data-id="${question.id}" data-status="rejected">不採用</button>
      </div>
    `;
    els.teacherList.appendChild(card);
  });
}

function setQuestionStatus(id, status) {
  const overrides = loadReviewOverrides();
  overrides[id] = status;
  saveReviewOverrides(overrides);
  renderTeacherReview();
}

function exportReviewOverrides() {
  const payload = {
    exportedAt: new Date().toISOString(),
    note: "このJSONは講師レビュー画面の採用/保留/不採用の上書き結果です。",
    overrides: loadReviewOverrides(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "review-overrides.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function init() {
  try {
    const [questionResponse, longResponse] = await Promise.all([
      fetch(DATA_URL),
      fetch(LONG_LISTENING_URL),
    ]);
    allQuestions = await questionResponse.json();
    longListeningItems = longResponse.ok ? await longResponse.json() : [];
    refreshApprovedQuestions();
    setPlaybackRate(playbackRate);
    updateHome();
    renderTypes();
  } catch (error) {
    els.homeMeta.textContent = `問題データを読み込めません: ${error.message}`;
  }
}

els.startButton.addEventListener("click", () => startDrill("today"));
els.practiceButton.addEventListener("click", startPracticeMode);
els.reviewButton.addEventListener("click", () => startDrill("review"));
els.bundleButton.addEventListener("click", startBundlePractice);
els.teacherReviewButton.addEventListener("click", () => {
  document.getElementById("settingsMenu")?.removeAttribute("open");
  renderTeacherReview();
  showScreen("teacher");
});
els.resultReviewButton.addEventListener("click", () => startDrill("review"));
els.retryButton.addEventListener("click", () => startDrill("today"));
els.typesButton.addEventListener("click", () => showScreen("types"));
els.typeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-type-index]");
  if (!button) return;
  renderTypes(Number(button.dataset.typeIndex));
});
els.typesBackButton.addEventListener("click", () => {
  updateHome();
  showScreen("home");
});
els.teacherBackButton.addEventListener("click", () => {
  updateHome();
  showScreen("home");
});
els.backHomeButton.addEventListener("click", () => {
  updateHome();
  showScreen("home");
});
els.answerHomeButton.addEventListener("click", () => {
  updateHome();
  showScreen("home");
});
els.practiceBackButton.addEventListener("click", () => {
  updateHome();
  showScreen("home");
});
els.practiceStepBackButton.addEventListener("click", showPracticeChooser);
els.playButton.addEventListener("click", () => playAudio(currentQuestion().audioUrl));
els.replayButton.addEventListener("click", () => playAudio(currentQuestion().audioUrl));
els.sentenceButton.addEventListener("click", () => playAudio(currentQuestion().sentenceAudioUrl));
els.nextButton.addEventListener("click", nextQuestion);
els.practiceChunkButton.addEventListener("click", () => setPracticeDisplayMode("chunk", true));
els.practiceSentenceButton.addEventListener("click", () => setPracticeDisplayMode("sentence", true));
els.practiceMonoButton.addEventListener("click", () => setPracticeDisplayMode("monologue", true));
els.practiceKanaButton.addEventListener("click", () => setPracticeDisplayMode("kana"));
els.practiceTypeChooser.addEventListener("click", (event) => {
  const button = event.target.closest("[data-practice-entry]");
  if (!button) return;
  startPracticeEntry(button.dataset.practiceEntry);
});
els.practiceFocusContent.addEventListener("click", handlePracticeFocusClick);
els.practicePrevButton.addEventListener("click", () => movePractice(-1));
els.practiceNextButton.addEventListener("click", () => movePractice(1));
els.kanaPlayButton.addEventListener("click", () => playAudio(currentPracticeQuestion().audioUrl));
els.longPlayButton.addEventListener("click", () => playAudio(currentLongListening()?.audioUrl));
els.longTranscriptButton.addEventListener("click", () => setLongDisplayMode("transcript"));
els.longChunksButton.addEventListener("click", () => setLongDisplayMode("chunks"));
els.exportReviewButton.addEventListener("click", exportReviewOverrides);
document.querySelectorAll(".speed-button[data-rate]").forEach((button) => {
  button.addEventListener("click", () => setPlaybackRate(button.dataset.rate));
});
els.speedRange.addEventListener("input", (event) => setPlaybackRate(event.target.value));
els.speedDownButton.addEventListener("click", () => setPlaybackRate(playbackRate - SPEED_STEP));
els.speedUpButton.addEventListener("click", () => setPlaybackRate(playbackRate + SPEED_STEP));
els.longContent.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-long-start]");
  if (!trigger) return;
  event.preventDefault();
  handleLongChunkTrigger(trigger, els.longContent, els.longMeaningText);
});
els.teacherList.addEventListener("click", (event) => {
  const playUrl = event.target.dataset.play;
  if (playUrl) playAudio(playUrl);
  const id = event.target.dataset.id;
  const status = event.target.dataset.status;
  if (id && status) setQuestionStatus(id, status);
});

init();
