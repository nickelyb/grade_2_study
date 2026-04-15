// templates/multi_choice_orbs.js — 多选题
import { playClick, playSuccess, playFail } from '../audio.js';

export function render(container, question, onAnswered) {
  const opts = question.options || [];
  const correctSet = new Set(Array.isArray(question.answer) ? question.answer : [question.answer]);

  container.innerHTML = `
    <div class="multi-tip">（可多选，选完后点"确认"）</div>
    <div class="multi-options">
      ${opts.map(o => `
        <button class="multi-btn" data-key="${o.key}">
          <span class="choice-key">${o.key}．</span>${o.text}
          <span class="multi-check-mark" style="display:none">✓</span>
        </button>
      `).join('')}
    </div>
    <button class="multi-submit-btn">确认答案</button>
    <div class="analysis-box" style="display:none"></div>
  `;

  const btns = container.querySelectorAll('.multi-btn');
  const submitBtn = container.querySelector('.multi-submit-btn');
  const analysisBox = container.querySelector('.analysis-box');
  const selected = new Set();

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;
      playClick();
      const key = btn.dataset.key;
      if (selected.has(key)) {
        selected.delete(key);
        btn.classList.remove('selected');
        btn.querySelector('.multi-check-mark').style.display = 'none';
      } else {
        selected.add(key);
        btn.classList.add('selected');
        btn.querySelector('.multi-check-mark').style.display = '';
      }
    });
  });

  submitBtn.addEventListener('click', () => {
    playClick();
    const isCorrect = selected.size === correctSet.size && [...selected].every(k => correctSet.has(k));

    btns.forEach(b => {
      b.classList.add('disabled');
      const k = b.dataset.key;
      if (correctSet.has(k) && selected.has(k)) b.classList.add('correct');
      else if (!correctSet.has(k) && selected.has(k)) b.classList.add('wrong');
      else if (correctSet.has(k) && !selected.has(k)) b.classList.add('missed');
    });
    submitBtn.disabled = true;

    analysisBox.style.display = 'block';
    analysisBox.innerHTML = `<strong>${isCorrect ? '✓ 全选正确！' : '✗ 选择有误'}</strong>　正确答案：${[...correctSet].join('、')}　${question.analysis || ''}`;

    if (isCorrect) playSuccess(); else playFail();
    onAnswered(isCorrect);
  });
}
