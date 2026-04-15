// templates/match_link.js — 连线配对题（SVG 画线）
import { playClick, playSuccess, playFail } from '../audio.js';

export function render(container, question, onAnswered) {
  const lefts = question.leftItems || [];
  const rights = question.rightItems || [];
  const correctPairs = question.answer || []; // [{left, right}]

  container.innerHTML = `
    <div class="match-wrapper" style="position:relative">
      <div class="match-columns">
        <div class="match-col left-col">
          ${lefts.map(l => `<div class="match-item left-item" data-id="${l.id}">${l.text}</div>`).join('')}
        </div>
        <div class="match-col right-col">
          ${rights.map(r => `<div class="match-item right-item" data-id="${r.id}">${r.text}</div>`).join('')}
        </div>
      </div>
      <svg class="match-svg-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible"></svg>
    </div>
    <button class="match-submit-btn" disabled>确认连线</button>
    <div class="analysis-box" style="display:none"></div>
  `;

  // 布局用 flex，列之间画线
  const wrapper = container.querySelector('.match-wrapper');
  const columnsEl = container.querySelector('.match-columns');
  columnsEl.style.cssText = 'display:flex;gap:16px;align-items:flex-start';

  const leftCol = container.querySelector('.left-col');
  const rightCol = container.querySelector('.right-col');
  leftCol.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:10px';
  rightCol.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:10px';

  const svg = container.querySelector('.match-svg-overlay');
  const submitBtn = container.querySelector('.match-submit-btn');
  const analysisBox = container.querySelector('.analysis-box');

  // 连线状态：{ leftId: rightId }
  const connections = {};
  let selectedLeft = null;

  function getCenterOf(el) {
    const wRect = wrapper.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return {
      x: eRect.left + eRect.width / 2 - wRect.left,
      y: eRect.top + eRect.height / 2 - wRect.top,
    };
  }

  function redrawLines(colorMap = {}) {
    svg.innerHTML = '';
    Object.entries(connections).forEach(([lid, rid]) => {
      const leftEl = container.querySelector(`.left-item[data-id="${lid}"]`);
      const rightEl = container.querySelector(`.right-item[data-id="${rid}"]`);
      if (!leftEl || !rightEl) return;
      const a = getCenterOf(leftEl);
      const b = getCenterOf(rightEl);
      const color = colorMap[lid] || '#4a90e2';
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.setAttribute('stroke', color); line.setAttribute('stroke-width', '3');
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    });
  }

  // 点左侧
  container.querySelectorAll('.left-item').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('disabled')) return;
      playClick();
      container.querySelectorAll('.left-item').forEach(e => e.classList.remove('selected'));
      selectedLeft = el.dataset.id;
      el.classList.add('selected');
    });
  });

  // 点右侧：连线
  container.querySelectorAll('.right-item').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('disabled') || !selectedLeft) return;
      playClick();
      const rid = el.dataset.id;
      // 取消已有连同一右侧的连线
      Object.keys(connections).forEach(k => { if (connections[k] === rid) delete connections[k]; });
      connections[selectedLeft] = rid;

      // 更新左侧样式
      container.querySelectorAll('.left-item').forEach(e => {
        e.classList.remove('selected', 'connected');
        if (connections[e.dataset.id]) e.classList.add('connected');
      });
      container.querySelectorAll('.right-item').forEach(e => {
        e.classList.remove('connected');
        if (Object.values(connections).includes(e.dataset.id)) e.classList.add('connected');
      });

      selectedLeft = null;
      redrawLines();

      // 所有左侧都连了才开放确认
      submitBtn.disabled = Object.keys(connections).length < lefts.length;
    });
  });

  submitBtn.addEventListener('click', () => {
    playClick();
    // 判断正确性
    const colorMap = {};
    let correctCount = 0;
    correctPairs.forEach(pair => {
      const actual = connections[pair.left];
      if (actual === pair.right) { colorMap[pair.left] = '#52c41a'; correctCount++; }
      else { colorMap[pair.left] = '#ff4d4f'; }
    });
    const isCorrect = correctCount === correctPairs.length;

    redrawLines(colorMap);

    // 标记连接项
    container.querySelectorAll('.left-item,.right-item').forEach(e => {
      e.classList.add('disabled');
      e.classList.remove('selected', 'connected');
    });
    correctPairs.forEach(pair => {
      const leftEl = container.querySelector(`.left-item[data-id="${pair.left}"]`);
      const rightEl = container.querySelector(`.right-item[data-id="${pair.right}"]`);
      const actual = connections[pair.left];
      if (actual === pair.right) {
        leftEl && leftEl.classList.add('connected');
        rightEl && rightEl.classList.add('connected');
      } else {
        leftEl && leftEl.classList.add('wrong-connected');
        if (rightEl && actual === pair.right) rightEl.classList.add('connected');
      }
    });

    submitBtn.disabled = true;
    analysisBox.style.display = 'block';
    analysisBox.innerHTML = `<strong>${isCorrect ? '✓ 全部连对！' : '✗ 有连错的'}</strong>　${question.analysis || ''}`;

    if (isCorrect) playSuccess(); else playFail();
    onAnswered(isCorrect);
  });

  // 容器大小变化时重绘
  const ro = new ResizeObserver(() => redrawLines());
  ro.observe(wrapper);
}
