// app.js — 主应用：数据加载、路由、页面渲染
import { playClick, startBgm } from './audio.js';
import { recordAnswer, markCompleted, getTaskProgress, clearTask } from './progress.js';
import { render as renderChoice } from './templates/choice_gate.js';
import { render as renderJudge } from './templates/judge_run.js';
import { render as renderFill } from './templates/fill_treasure.js';
import { render as renderMatch } from './templates/match_link.js';
import { render as renderMulti } from './templates/multi_choice_orbs.js';
import { render as renderWord } from './templates/word_builder.js';

// 注册Service Worker（离线支持）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker 已注册:', reg.scope))
      .catch(err => console.log('❌ Service Worker 注册失败:', err));
  });
}

// ===== 数据 =====
let questionsData = null;   // unit4_questions_v2.json
let taskpacksData = null;   // unit4_taskpacks_v1.json
let questionMap = new Map(); // questionId → question

async function loadData() {
  const [q, t] = await Promise.all([
    fetch('tiku/unit4_questions_v2.json').then(r => r.json()),
    fetch('tiku/unit4_taskpacks_v1.json').then(r => r.json()),
  ]);
  questionsData = q;
  taskpacksData = t;
  q.questions.forEach(q => questionMap.set(q.id, q));
}

// ===== 路由 =====
const app = document.getElementById('app');

function navigate(hash) {
  location.hash = hash;
}

window.addEventListener('hashchange', route);
window.addEventListener('load', async () => {
  try {
    await loadData();
  } catch (e) {
    app.innerHTML = `<div class="loading-screen"><div class="loading-text">⚠ 题库加载失败，请检查文件路径</div></div>`;
    return;
  }
  route();

  // BGM 需要用户交互后才能播放，监听首次点击启动
  document.addEventListener('click', () => startBgm(), { once: true });
});

function route() {
  const hash = location.hash || '#home';
  if (hash === '#home' || hash === '') return renderHome();
  if (hash.startsWith('#task/')) return renderTaskPage(hash.slice(6));
  if (hash.startsWith('#result/')) return renderResultPage(hash.slice(8));
  renderHome();
}

// ===== 知识点颜色 =====
const kpColors = {
  kp_u4_01: '#ff7f50', kp_u4_02: '#ff9f43', kp_u4_03: '#ffd32a',
  kp_u4_04: '#0be881', kp_u4_05: '#17c0eb', kp_u4_06: '#7d5fff',
  kp_u4_07: '#ef5777', kp_u4_08: '#575fcf', kp_u4_09: '#3c40c4',
  kp_u4_10: '#05c46b',
};

// ===== 任务类型配置 =====
const TASK_TABS = [
  { type: 'daily',    label: '日常练习', icon: '📅' },
  { type: 'topic',    label: '专项训练', icon: '🎯' },
  { type: 'challenge',label: '闯关挑战', icon: '🏆' },
  { type: 'checkin',  label: '每日打卡', icon: '✅' },
  { type: 'review',   label: '总复习',   icon: '📖' },
];

const TASK_ICONS = {
  daily: '📅', topic: '🎯', challenge: '🏆', checkin: '✅', review: '📖',
};

const TASK_COLORS = {
  daily: '#4a90e2', topic: '#7d5fff', challenge: '#ff7f50', checkin: '#05c46b', review: '#3c40c4',
};

// ===== 首页 =====
let activeTab = 'daily';

function renderHome() {
  const packs = taskpacksData.taskPacks;

  app.innerHTML = `
    <div class="home-page">
      <div class="home-header">
        <span class="home-avatar">🦄</span>
        <h1>二年级下册语文</h1>
        <p>第四单元 · 想象的翅膀</p>
      </div>
      <div class="tab-bar" id="tabBar">
        ${TASK_TABS.map(t => `
          <div class="tab-item${t.type === activeTab ? ' active' : ''}" data-type="${t.type}">
            ${t.icon} ${t.label}
          </div>
        `).join('')}
      </div>
      <div class="task-list" id="taskList"></div>
    </div>
  `;

  document.getElementById('tabBar').addEventListener('click', e => {
    const item = e.target.closest('.tab-item');
    if (!item) return;
    playClick();
    activeTab = item.dataset.type;
    document.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.dataset.type === activeTab));
    renderTaskList(packs);
  });

  renderTaskList(packs);
}

function renderTaskList(packs) {
  const list = document.getElementById('taskList');
  const filtered = packs.filter(p => p.taskType === activeTab);
  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;color:#aaa;padding:40px;font-size:16px">暂无内容</div>`;
    return;
  }

  list.innerHTML = filtered.map(pack => {
    const progress = getTaskProgress(pack.id);
    const total = pack.questionIds.length;
    const done = progress.answered.length;
    const pct = total > 0 ? Math.round(done / total * 100) : 0;
    const isCompleted = progress.completed;
    const color = TASK_COLORS[pack.taskType] || '#4a90e2';

    return `
      <div class="task-card fade-in" data-id="${pack.id}">
        <div class="task-icon" style="background:${color}22">${TASK_ICONS[pack.taskType] || '📝'}</div>
        <div class="task-info">
          <div class="task-title">${pack.title}</div>
          <div class="task-desc">${pack.description}</div>
          <div class="task-meta">
            <span class="task-time">⏱ 约 ${pack.estimatedMinutes} 分钟</span>
            <span class="task-time">📝 ${total} 道题</span>
          </div>
        </div>
        <div class="task-progress-wrap">
          ${isCompleted
            ? `<div class="task-done-badge">✓ 完成</div>`
            : `<div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div>
               <div class="task-progress-text">${done}/${total}</div>`
          }
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', () => {
      playClick();
      const id = card.dataset.id;
      const progress = getTaskProgress(id);
      if (progress.completed) {
        // 已完成则询问是否重做（直接重置）
        if (confirm('已完成！是否重新练习？')) {
          clearTask(id);
          navigate('#task/' + id);
        }
      } else {
        navigate('#task/' + id);
      }
    });
  });
}

// ===== 任务练习页 =====
// 当前任务状态
let taskState = null;

function renderTaskPage(taskId) {
  const pack = taskpacksData.taskPacks.find(p => p.id === taskId);
  if (!pack) { navigate('#home'); return; }

  const allQids = pack.questionIds;
  const progress = getTaskProgress(taskId);
  // 过滤已答的题，从未答的开始（支持断点续答）
  const remaining = allQids.filter(qid => !progress.answered.includes(qid));
  const queue = remaining.length > 0 ? remaining : allQids; // 全答完则重放

  taskState = {
    taskId,
    pack,
    queue: [...queue],
    current: 0,
    sessionCorrect: 0,
    sessionTotal: 0,
    wrongItems: [],
  };

  renderQuestion();
}

function renderQuestion() {
  const { taskId, pack, queue, current } = taskState;
  if (current >= queue.length) {
    // 全部答完
    markCompleted(taskId);
    navigate('#result/' + taskId);
    return;
  }

  const qid = queue[current];
  const question = questionMap.get(qid);
  if (!question) { taskState.current++; renderQuestion(); return; }

  const total = queue.length;
  const pct = Math.round(current / total * 100);
  const color = kpColors[question.knowledgeId] || '#4a90e2';

  app.innerHTML = `
    <div class="task-page">
      <div class="topbar">
        <button class="topbar-back" id="backBtn">←</button>
        <span class="topbar-title">${pack.title}</span>
        <span class="topbar-sub">${current + 1}/${total}</span>
      </div>
      <div class="task-progress-top">
        <div class="progress-track">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="progress-label">${current + 1} / ${total}</div>
      </div>
      <div class="question-area fade-in" id="questionArea">
        <div class="question-header" style="border-top-color:${color}">
          <div class="question-kp-tag" style="background:${color}">${question.knowledgeName}</div>
          <div class="question-stem">${question.stem}</div>
        </div>
        <div class="question-body" id="questionBody"></div>
      </div>
      <div class="task-footer">
        <div class="score-label">本次正确：<strong>${taskState.sessionCorrect}</strong> / ${taskState.sessionTotal}</div>
        <button class="next-btn" id="nextBtn">下一题 →</button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').addEventListener('click', () => {
    playClick();
    navigate('#home');
  });

  const nextBtn = document.getElementById('nextBtn');
  nextBtn.addEventListener('click', () => {
    if (!nextBtn.classList.contains('active')) return;
    playClick();
    taskState.current++;
    renderQuestion();
  });

  // 渲染题目交互
  const body = document.getElementById('questionBody');
  const template = question.gameTemplate;

  const onAnswered = (isCorrect) => {
    taskState.sessionTotal++;
    if (isCorrect) taskState.sessionCorrect++;
    else taskState.wrongItems.push(question);
    recordAnswer(taskId, question.id, isCorrect);
    nextBtn.classList.add('active');
    nextBtn.classList.add('pop');

    // 最后一题改按钮文字
    if (taskState.current + 1 >= queue.length) {
      nextBtn.textContent = '查看结果 →';
    }
  };

  if (template === 'choice_gate') renderChoice(body, question, onAnswered);
  else if (template === 'judge_run') renderJudge(body, question, onAnswered);
  else if (template === 'fill_treasure') renderFill(body, question, onAnswered);
  else if (template === 'match_link') renderMatch(body, question, onAnswered);
  else if (template === 'multi_choice_orbs') renderMulti(body, question, onAnswered);
  else renderWord(body, question, onAnswered); // word_builder / guided_sentence / checkin_*
}

// ===== 结算页 =====
function renderResultPage(taskId) {
  const pack = taskpacksData.taskPacks.find(p => p.id === taskId);
  const rewardKey = pack ? pack.rewardKey : 'dailyComplete';
  const reward = taskpacksData.rewardConfig[rewardKey] || { coins: 10, stars: 1, petExp: 5 };

  const correct = taskState ? taskState.sessionCorrect : 0;
  const total = taskState ? taskState.sessionTotal : 0;
  const pct = total > 0 ? Math.round(correct / total * 100) : 0;

  let trophy = '🎉';
  if (pct >= 90) trophy = '🏆';
  else if (pct >= 60) trophy = '⭐';
  else trophy = '💪';

  const wrongItems = taskState ? taskState.wrongItems : [];

  app.innerHTML = `
    <div class="result-page fade-in">
      <div class="result-trophy">${trophy}</div>
      <div class="result-title">${pack ? pack.title : ''} 完成！</div>
      <div class="result-score-card">
        <div class="result-score">${correct}<span style="font-size:28px;font-weight:600;opacity:0.45"> / ${total}</span></div>
        <div class="result-score-label">正确率 ${pct}%</div>
      </div>
      <div class="result-rewards">
        <div class="reward-item">
          <div class="reward-icon">⭐</div>
          <div class="reward-val">+${reward.stars}</div>
          <div class="reward-name">星星</div>
        </div>
        <div class="reward-item">
          <div class="reward-icon">🪙</div>
          <div class="reward-val">+${reward.coins}</div>
          <div class="reward-name">金币</div>
        </div>
        <div class="reward-item">
          <div class="reward-icon">✨</div>
          <div class="reward-val">+${reward.petExp}</div>
          <div class="reward-name">经验</div>
        </div>
      </div>
      ${wrongItems.length > 0 ? `
        <div class="result-analysis">
          <h3>📌 错误题目（共 ${wrongItems.length} 道）</h3>
          ${wrongItems.map(q => `<div class="wrong-item">· ${q.stem}</div>`).join('')}
        </div>
      ` : '<div class="result-all-correct">🎊 全部答对，太棒了！</div>'}
      <div class="result-btns">
        <button class="result-btn result-btn-secondary" id="retryBtn">再来一次</button>
        <button class="result-btn result-btn-primary" id="homeBtn">返回首页</button>
      </div>
    </div>
  `;

  document.getElementById('homeBtn').addEventListener('click', () => {
    playClick();
    taskState = null;
    navigate('#home');
  });

  document.getElementById('retryBtn').addEventListener('click', () => {
    playClick();
    if (pack) {
      clearTask(pack.id);
      taskState = null;
      navigate('#task/' + pack.id);
    }
  });
}

// ... existing code ...

  document.getElementById('retryBtn').addEventListener('click', () => {
    playClick();
    if (pack) {
      clearTask(pack.id);
      taskState = null;
      navigate('#task/' + pack.id);
    }
  });
}

// PWA安装提示
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  setTimeout(() => {
    showInstallPrompt();
  }, 3000);
});

function showInstallPrompt() {
  const prompt = document.createElement('div');
  prompt.className = 'install-prompt';
  prompt.innerHTML = `
    <span class="install-prompt-text">📱 添加到主屏幕，使用更方便！</span>
    <button class="install-prompt-btn" id="installBtn">安装</button>
    <button class="install-prompt-close" id="closeInstall">✕</button>
  `;
  
  document.body.appendChild(prompt);
  
  document.getElementById('installBtn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('用户选择:', outcome);
      deferredPrompt = null;
    }
    prompt.remove();
  });
  
  document.getElementById('closeInstall').addEventListener('click', () => {
    prompt.remove();
  });
  
  setTimeout(() => {
    if (prompt.parentNode) prompt.remove();
  }, 8000);
}
