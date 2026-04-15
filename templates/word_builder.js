// templates/word_builder.js — 组词/仿写/打卡（charWrite, wordBuild, sentenceImitate, reciteCheckin）
import { playClick, playSuccess } from '../audio.js';

export function render(container, question, onAnswered) {
  const template = question.gameTemplate;

  // 打卡类：直接显示提示，点完成
  if (template === 'checkin_photo' || template === 'checkin_audio') {
    const icon = template === 'checkin_photo' ? '📷' : '🎤';
    const tip = template === 'checkin_photo'
      ? '请拿出纸和笔，按要求规范书写，完成后请家长或老师检查。'
      : '请大声朗读或背诵，完成后点击"完成打卡"。';
    container.innerHTML = `
      <div class="checkin-card">
        <div class="checkin-icon">${icon}</div>
        <div class="checkin-tip">${tip}</div>
        <button class="checkin-done-btn">✓ 完成打卡</button>
      </div>
    `;
    container.querySelector('.checkin-done-btn').addEventListener('click', () => {
      playSuccess();
      onAnswered(true);
    });
    return;
  }

  // guided_sentence / sentenceImitate / wordBuild — 输入框仿写
  const answers = Array.isArray(question.answer) ? question.answer : (question.answer ? [question.answer] : []);
  const isOpen = answers.length === 0 || !question.isObjective;

  // 组词：多个输入框（answer 里有几个词）
  const count = (question.type === 'wordBuild' && answers.length > 0) ? answers.length : 1;
  const inputsHtml = Array.from({ length: count }, (_, i) => `
    <div class="word-input-row">
      ${count > 1 ? `<span class="word-label">词${i + 1}</span>` : ''}
      <input class="word-input" type="text" placeholder="${isOpen ? '写下你的答案…' : '填写答案'}" data-idx="${i}">
    </div>
  `).join('');

  container.innerHTML = `
    <div class="word-builder-area">
      ${inputsHtml}
      <button class="word-submit-btn">${isOpen ? '完成' : '确认答案'}</button>
    </div>
    <div class="analysis-box" style="display:none"></div>
  `;

  const inputs = container.querySelectorAll('.word-input');
  const submitBtn = container.querySelector('.word-submit-btn');
  const analysisBox = container.querySelector('.analysis-box');

  submitBtn.addEventListener('click', () => {
    playClick();
    let isCorrect = true;

    if (isOpen) {
      // 开放题：只要填了就算正确
      const allFilled = [...inputs].every(inp => inp.value.trim() !== '');
      isCorrect = allFilled;
    } else {
      inputs.forEach((inp, i) => {
        const userVal = inp.value.trim();
        const expected = (answers[i] || '').trim();
        const ok = userVal === expected;
        inp.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) isCorrect = false;
      });
    }

    inputs.forEach(inp => { inp.disabled = true; });
    submitBtn.disabled = true;

    analysisBox.style.display = 'block';
    if (isOpen) {
      analysisBox.innerHTML = `<strong>✓ 已记录！</strong>　参考答案：${answers.join('、') || '言之有理即可'}　${question.analysis || ''}`;
    } else {
      analysisBox.innerHTML = `<strong>${isCorrect ? '✓ 回答正确！' : '✗ 参考答案：' + answers.join('、')}</strong>　${question.analysis || ''}`;
    }

    if (isCorrect) playSuccess();
    onAnswered(isCorrect);
  });

  // 回车跳下一个或提交
  inputs.forEach((inp, i) => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (i < inputs.length - 1) inputs[i + 1].focus();
        else submitBtn.click();
      }
    });
  });
}
