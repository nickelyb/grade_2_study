// templates/choice_gate.js — 单选题
import { playClick, playSuccess, playFail } from '../audio.js';

/**
 * 渲染单选题
 * @param {HTMLElement} container - .question-body 容器
 * @param {object} question - 题目数据
 * @param {function} onAnswered(isCorrect) - 答题回调
 */
export function render(container, question, onAnswered) {
  const opts = question.options || [];
  container.innerHTML = `
    <div class="choice-options">
      ${opts.map(o => `
        <button class="choice-btn" data-key="${o.key}">
          <span class="choice-key">${o.key}．</span>${o.text}
        </button>
      `).join('')}
    </div>
    <div class="analysis-box" style="display:none"></div>
  `;

  const btns = container.querySelectorAll('.choice-btn');
  const analysisBox = container.querySelector('.analysis-box');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      playClick();

      const chosen = btn.dataset.key;
      const correct = question.answer;
      const isCorrect = chosen === correct;

      btns.forEach(b => {
        b.classList.add('disabled');
        if (b.dataset.key === correct) b.classList.add('correct');
        else if (b === btn && !isCorrect) b.classList.add('wrong');
      });

      analysisBox.style.display = 'block';
      analysisBox.innerHTML = `<strong>${isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}</strong>　${question.analysis || ''}`;

      if (isCorrect) playSuccess(); else playFail();
      onAnswered(isCorrect);
    });
  });
}
