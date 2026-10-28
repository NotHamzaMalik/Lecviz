import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NarrationPlayer } from '../src/speech/narration.ts';
import type { AudioPort, NarrationState } from '../src/speech/narration.ts';

class FakeAudio implements AudioPort {
  currentTime = 0; duration = 10; playbackRate = 1; muted = false; plays = 0; pauses = 0;
  onplaying: AudioPort['onplaying'] = null; onpause: AudioPort['onpause'] = null;
  onwaiting: AudioPort['onwaiting'] = null; ontimeupdate: AudioPort['ontimeupdate'] = null;
  onended: AudioPort['onended'] = null; onerror: AudioPort['onerror'] = null;
  async play() { this.plays += 1; this.onplaying?.(new Event('playing')); }
  pause() { this.pauses += 1; this.onpause?.(new Event('pause')); }
  progress(time: number) { this.currentTime = time; this.ontimeupdate?.(new Event('timeupdate')); }
  finish() { this.onended?.(new Event('ended')); }
}
function setup() {
  const audio: FakeAudio[] = [], states: NarrationState[] = [], revealed: number[] = [], errors: string[] = [];
  const player = new NarrationPlayer(() => { const clip = new FakeAudio(); audio.push(clip); return clip; }, {
    state: state => states.push(state), progress: () => {}, reveal: index => revealed.push(index), error: error => errors.push(error),
  });
  const clips = [{ url: '/one.wav', text: 'First' }, { url: '/two.wav', text: 'Second' }];
  return { player, audio, states, revealed, errors, clips };
}
test('scene updates follow real audio progress exactly once per clip', () => {
  const { player, audio, revealed, states, clips } = setup();
  player.start(clips);
  audio[0].progress(3); assert.deepEqual(revealed, []);
  audio[0].progress(7); audio[0].progress(9); assert.deepEqual(revealed, [0]);
  audio[0].finish(); assert.equal(audio.length, 2);
  audio[1].finish(); assert.deepEqual(revealed, [0, 1]); assert.equal(states.at(-1), 'ended');
});
test('pause holds scene and resumes the same audio position', () => {
  const { player, audio, revealed, states, clips } = setup();
  player.start(clips); audio[0].progress(4); player.pause();
  audio[0].progress(8); audio[0].finish();
  assert.deepEqual(revealed, []); assert.equal(audio.length, 1); assert.equal(states.at(-1), 'paused');
  player.resume(); assert.equal(audio[0].plays, 2);
  audio[0].progress(8); assert.deepEqual(revealed, [0]);
});
test('switching examples invalidates callbacks from old audio', () => {
  const { player, audio, revealed, clips } = setup();
  player.start(clips);
  const staleProgress = audio[0].ontimeupdate, staleEnd = audio[0].onended;
  player.start(clips); audio[0].currentTime = 10;
  staleProgress?.(new Event('timeupdate')); staleEnd?.(new Event('ended'));
  assert.deepEqual(revealed, []); assert.equal(audio.length, 2);
  audio[1].progress(8); assert.deepEqual(revealed, [0]);
});
test('audio failures do not apply or skip an instruction', () => {
  const { player, audio, revealed, errors, states, clips } = setup();
  player.start(clips); audio[0].onerror?.(new Event('error'));
  assert.deepEqual(revealed, []); assert.equal(audio.length, 1);
  assert.equal(errors.length, 1); assert.equal(states.at(-1), 'idle');
});
test('playback speed and mute apply to current and subsequent clips', () => {
  const { player, audio, clips } = setup();
  player.start(clips); player.setRate(1.25); player.setMuted(true);
  assert.equal(audio[0].playbackRate, 1.25); assert.equal(audio[0].muted, true);
  audio[0].finish(); assert.equal(audio[1].playbackRate, 1.25); assert.equal(audio[1].muted, true);
});
test('starting at a later step and stopping cannot advance the old scene', () => {
  const { player, audio, revealed, clips } = setup();
  player.start(clips, 1); audio[0].progress(8); assert.deepEqual(revealed, [1]);
  const staleEnd = audio[0].onended;
  player.stop(); staleEnd?.(new Event('ended'));
  assert.equal(audio.length, 1); assert.deepEqual(revealed, [1]);
});
