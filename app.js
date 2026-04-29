let data = [];
let currentRound = null;
let queue = [];
let index = 0;
let history = {};

fetch('data.json?v=1')
  .then(res => res.json())
  .then(json => {
    data = json;
    init();
  })
  .catch(err => {
    alert('data.jsonの読み込みに失敗しました');
    console.error(err);
  });

function init() {
  const area = document.getElementById('seriesButtons');
  area.innerHTML = '';

  data.forEach(round => {
    const btn = document.createElement('button');
    btn.textContent = round.name;
    btn.onclick = () => selectRound(round);
    area.appendChild(btn);
  });
}

function selectRound(round) {
  currentRound = round;
  document.getElementById('roundTitle').textContent = round.name;
  loadHistory();
  show('menuScreen');
}

function start() {
  queue = shuffle(currentRound.questions.map(q => q.id));
  index = 0;
  loadHistory();
  save();
  next();
}

function continueGame() {
  load();

  if (!queue || queue.length === 0 || index >= queue.length) {
    alert('続きのデータがありません。最初から開始してください。');
    return;
  }

  next();
}

function next() {
  if (index >= queue.length) {
    save();
    alert('終了です。全問正解しました。');
    show('menuScreen');
    return;
  }

  const q = getQ();

  if (!q) {
    alert('問題データが見つかりません。data.jsonのidを確認してください。');
    show('menuScreen');
    return;
  }

  document.getElementById('progress').textContent = `${index + 1} / ${queue.length}`;
  document.getElementById('japanese').textContent = q.japanese;
  document.getElementById('englishSentence').textContent = q.sentence;
  document.getElementById('answer').textContent = '';
  document.getElementById('answerArea').classList.add('hidden');
  document.getElementById('showAnswerButton').classList.remove('hidden');

  show('quizScreen');
}

function showAnswer() {
  const q = getQ();
  document.getElementById('answer').textContent = q.answer;
  document.getElementById('answerArea').classList.remove('hidden');
  document.getElementById('showAnswerButton').classList.add('hidden');
}

function correct() {
  index++;
  save();
  next();
}

function wrong() {
  const q = getQ();
  history[q.id] = (history[q.id] || 0) + 1;

  // 間違えた問題は後ろに追加して再出題する
  queue.push(q.id);
  index++;

  save();
  next();
}

function getQ() {
  return currentRound.questions.find(q => q.id === queue[index]);
}

function save() {
  localStorage.setItem(progressKey(), JSON.stringify({ queue, index }));
  localStorage.setItem(historyKey(), JSON.stringify(history));
}

function load() {
  const progress = JSON.parse(localStorage.getItem(progressKey())) || null;
  loadHistory();

  if (progress) {
    queue = progress.queue || [];
    index = progress.index || 0;
  } else {
    queue = [];
    index = 0;
  }
}

function loadHistory() {
  history = JSON.parse(localStorage.getItem(historyKey())) || {};
}

function reset() {
  if (!confirm(`${currentRound.name}の進捗と履歴をリセットしますか？`)) {
    return;
  }

  localStorage.removeItem(progressKey());
  localStorage.removeItem(historyKey());
  history = {};
  queue = [];
  index = 0;
  alert('リセットしました');
}

function showHistory() {
  loadHistory();

  const ids = Object.keys(history);
  if (ids.length === 0) {
    alert('履歴なし');
    return;
  }

  let text = '';

  ids.forEach(id => {
    const q = currentRound.questions.find(item => item.id === id);
    if (q) {
      text += `${q.answer}：${history[id]}回\n${q.japanese}\n\n`;
    }
  });

  alert(text.trim());
}

function progressKey() {
  return `progress_english_fill_blank_${currentRound.id}_self`;
}

function historyKey() {
  return `history_english_fill_blank_${currentRound.id}`;
}

function shuffle(arr) {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function show(id) {
  ['seriesScreen', 'menuScreen', 'quizScreen'].forEach(screenId => {
    document.getElementById(screenId).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

function back() {
  currentRound = null;
  show('seriesScreen');
}

function toMenu() {
  save();
  show('menuScreen');
}
