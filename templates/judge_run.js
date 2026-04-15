// templates/judge_run.js — 判断题
import { playClick, playSuccess, playFail } from '../audio.js';

export function render(container, question, onAnswered) {
  container.innerHTML = `
    <div class="judge-options">
      <button class="judge-btn true-btn" data-val="true">✓ 正确</button>
      <button class="judge-btn false-btn" data-val="false">✗ 错误</button>
    </div>
    <div class="analysis-box" style="display:none"></div>
  `;

  const btns = container.querySelectorAll('.judge-btn');
  const analysisBox = container.querySelector('.analysis-box');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      playClick();

      const chosen = btn.dataset.val === 'true';
      const correct = question.answer === true || question.answer === 'true';
      const isCorrect = chosen === correct;

      btns.forEach(b => b.classList.add('disabled'));
      btn.classList.add(isCorrect ? 'selected-correct' : 'selected-wrong');

      analysisBox.style.display = 'block';
      analysisBox.innerHTML = `<strong>${isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}</strong>　${question.analysis || ''}`;

      if (isCorrect) playSuccess(); else playFail();
      onAnswered(isCorrect);
    });
  });
}
