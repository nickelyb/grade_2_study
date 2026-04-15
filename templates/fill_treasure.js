// templates/fill_treasure.js — 填空题（支持多空）
import { playClick, playSuccess, playFail } from '../audio.js';

export function render(container, question, onAnswered) {
  const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
  const blanks = question.blanks || answers.length || 1;

  const inputsHtml = Array.from({ length: blanks }, (_, i) => `
    <div class="fill-input-wrap">
      ${blanks > 1 ? `<span class="fill-label">第${i + 1}空</span>` : ''}
      <input class="fill-input" type="text" placeholder="填写答案" autocomplete="off" data-idx="${i}">
    </div>
  `).join('');

  container.innerHTML = `
    <div class="fill-container">
      ${inputsHtml}
      <button class="fill-submit-btn">确认答案</button>
    </div>
    <div class="analysis-box" style="display:none"></div>
  `;

  const inputs = container.querySelectorAll('.fill-input');
  const submitBtn = container.querySelector('.fill-submit-btn');
  const analysisBox = container.querySelector('.analysis-box');

  submitBtn.addEventListener('click', () => {
    playClick();
    let allCorrect = true;
    inputs.forEach((inp, i) => {
      const userVal = inp.value.trim();
      const expected = (answers[i] || '').trim();
      const ok = userVal === expected;
      inp.classList.add(ok ? 'correct' : 'wrong');
      inp.disabled = true;
      if (!ok) allCorrect = false;
    });
    submitBtn.disabled = true;

    analysisBox.style.display = 'block';
    analysisBox.innerHTML = `<strong>${allCorrect ? '✓ 全部正确！' : '✗ 有填错的空'}</strong>　正确答案：${answers.join('、')}　${question.analysis || ''}`;

    if (allCorrect) playSuccess(); else playFail();
    onAnswered(allCorrect);
  });

  // 回车跳下一个 input 或提交
  inputs.forEach((inp, i) => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (i < inputs.length - 1) inputs[i + 1].focus();
        else submitBtn.click();
      }
    });
  });
}
