// audio.js — 音效模块，统一管理四个音效
const AUDIO_FILES = {
  bgm:     'assets/bgm.mp3',
  click:   'assets/click.mp3',
  success: 'assets/success.mp3',
  fail:    'assets/fail.mp3',
};

const _instances = {};
let _bgmPlaying = false;
let _enabled = true;

function _get(name) {
  if (!_instances[name]) {
    const audio = new Audio(AUDIO_FILES[name]);
    if (name === 'bgm') { audio.loop = true; audio.volume = 0.25; }
    else { audio.volume = 0.9; }
    _instances[name] = audio;
  }
  return _instances[name];
}

export function playClick() {
  if (!_enabled) return;
  const a = _get('click');
  a.currentTime = 0;
  a.play().catch(() => {});
}

export function playSuccess() {
  if (!_enabled) return;
  const a = _get('success');
  a.currentTime = 0;
  a.play().catch(() => {});
}

export function playFail() {
  if (!_enabled) return;
  const a = _get('fail');
  a.currentTime = 0;
  a.play().catch(() => {});
}

export function startBgm() {
  if (!_enabled || _bgmPlaying) return;
  _get('bgm').play().then(() => { _bgmPlaying = true; }).catch(() => {});
}

export function stopBgm() {
  if (!_bgmPlaying) return;
  _get('bgm').pause();
  _bgmPlaying = false;
}

export function setEnabled(val) { _enabled = val; }
