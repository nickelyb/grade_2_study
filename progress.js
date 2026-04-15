// progress.js — localStorage 读写进度
const KEY = 'yw_progress';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

// 记录单道题的结果
export function recordAnswer(taskId, questionId, isCorrect) {
  const data = load();
  if (!data[taskId]) data[taskId] = { answered: [], correct: [], completed: false };
  const t = data[taskId];
  if (!t.answered.includes(questionId)) t.answered.push(questionId);
  if (isCorrect && !t.correct.includes(questionId)) t.correct.push(questionId);
  save(data);
}

// 标记任务完成
export function markCompleted(taskId) {
  const data = load();
  if (!data[taskId]) data[taskId] = { answered: [], correct: [], completed: false };
  data[taskId].completed = true;
  save(data);
}

// 获取任务进度
export function getTaskProgress(taskId) {
  const data = load();
  return data[taskId] || { answered: [], correct: [], completed: false };
}

// 获取所有进度
export function getAllProgress() { return load(); }

// 清除某任务进度（重做）
export function clearTask(taskId) {
  const data = load();
  delete data[taskId];
  save(data);
}
