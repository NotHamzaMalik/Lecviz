import { exampleFrames, examples } from '../scene/engine.ts';
import type { Scene, Template } from '../scene/engine.ts';

export type ArchitectureNode = 'teacher' | 'stt' | 'llm' | 'validation' | 'error' | 'controls' | 'manager' | 'renderer' | 'output';
export type ArchitectureRoute = 'audio' | 'transcript' | 'event' | 'valid' | 'rejected' | 'fix' | 'corrected' | 'render' | 'display';
export type ArchitectureFrame = {
  node: ArchitectureNode; route?: ArchitectureRoute;
  payloadLabel: string; payload: string; values: number[];
  verdict?: 'valid' | 'rejected' | 'corrected';
};
export type LessonStep = { text: string; note: string; scene?: Scene; architecture?: ArchitectureFrame; waterStage?: number };
export type LessonId = Template | 'architecture-valid' | 'architecture-error' | 'water';
export type Lesson = { id: LessonId; title: string; kind: 'classroom' | 'architecture' | 'science'; steps: LessonStep[] };

export const architectureNodes: { id: ArchitectureNode; category: string; title: string; detail: string; x: number; y: number; width: number; height: number }[] = [
  { id: 'teacher', category: 'TEACHER', title: 'Microphone', detail: 'Audio stream', x: 20, y: 68, width: 178, height: 98 },
  { id: 'stt', category: '1  SPEECH-TO-TEXT', title: 'Whisper streaming ASR', detail: 'Audio to recognized text', x: 267, y: 68, width: 340, height: 98 },
  { id: 'llm', category: '2  LANGUAGE UNDERSTANDING', title: 'LLM intent parser', detail: 'Text to structured JSON event', x: 267, y: 195, width: 340, height: 98 },
  { id: 'validation', category: '3  VALIDATION', title: 'Schema + confidence + scene state', detail: 'Accept / reject event', x: 267, y: 322, width: 340, height: 98 },
  { id: 'error', category: 'ERROR HANDLING', title: 'Uncertain events are withheld', detail: 'Sent to teacher for correction', x: 267, y: 449, width: 340, height: 98 },
  { id: 'output', category: 'OUTPUT', title: 'Animated 2D diagram', detail: 'Synchronized with speech', x: 715, y: 68, width: 340, height: 98 },
  { id: 'renderer', category: '5  2D RENDERER', title: 'Reusable SVG / Canvas templates', detail: 'Draws and animates the scene', x: 715, y: 195, width: 340, height: 98 },
  { id: 'manager', category: '4  SCENE MANAGER', title: 'Order and apply valid events', detail: 'Updated scene state', x: 715, y: 322, width: 340, height: 98 },
  { id: 'controls', category: 'TEACHER CONTROLS', title: 'Pause · Undo · Correct', detail: 'Teacher stays in control', x: 715, y: 449, width: 340, height: 98 },
];
export const architectureRoutes: Record<ArchitectureRoute, { points: [number, number][]; label?: string; dashed?: boolean }> = {
  audio: { points: [[198, 117], [267, 117]], label: 'audio' },
  transcript: { points: [[437, 166], [437, 195]] },
  event: { points: [[437, 293], [437, 322]] },
  valid: { points: [[607, 371], [715, 371]], label: 'valid' },
  rejected: { points: [[437, 420], [437, 449]], label: 'rejected' },
  fix: { points: [[607, 498], [715, 498]], label: 'fix', dashed: true },
  corrected: { points: [[885, 449], [885, 420]] },
  render: { points: [[885, 322], [885, 293]] },
  display: { points: [[885, 195], [885, 166]] },
};

export const architectureLessons: Lesson[] = [
  { id: 'architecture-valid', title: 'System architecture', kind: 'architecture', steps: [
    { note: 'Teacher speaks', text: 'Let’s follow one instruction through the system. The teacher says, swap the first two numbers.', architecture: { node: 'teacher', payloadLabel: 'Teacher instruction', payload: '“Swap the first two numbers.”', values: [8, 3, 5] } },
    { note: 'Speech becomes text', text: 'The microphone sends audio to the Python backend. Whisper turns the speech into recognized text.', architecture: { node: 'stt', route: 'audio', payloadLabel: 'Recognized transcript', payload: 'Swap the first two numbers.', values: [8, 3, 5] } },
    { note: 'Intent becomes an event', text: 'The language model identifies the intent. It produces a structured swap event for positions zero and one.', architecture: { node: 'llm', route: 'transcript', payloadLabel: 'Structured event', payload: '{ "type": "swap", "indices": [0, 1] }', values: [8, 3, 5] } },
    { note: 'Validate before applying', text: 'Validation checks the schema, confidence, and current scene. Both positions exist, so this event can continue.', architecture: { node: 'validation', route: 'event', payloadLabel: 'Validation result', payload: 'Schema valid · references exist · event accepted', values: [8, 3, 5], verdict: 'valid' } },
    { note: 'Apply in order', text: 'The accepted event crosses to the frontend scene manager. It applies the swap in order, preserving the rest of the scene.', architecture: { node: 'manager', route: 'valid', payloadLabel: 'Scene transition', payload: '[8, 3, 5] → [3, 8, 5]', values: [3, 8, 5], verdict: 'valid' } },
    { note: 'Render the transition', text: 'The renderer selects a reusable SVG or Canvas template. The two elements move smoothly to their new positions.', architecture: { node: 'renderer', route: 'render', payloadLabel: 'Renderer', payload: 'Array template → animate swap', values: [3, 8, 5] } },
    { note: 'Show the result', text: 'The animated diagram reaches the classroom display. The teacher’s explanation and the visible change stay connected.', architecture: { node: 'output', route: 'display', payloadLabel: 'Classroom output', payload: 'The first two values have exchanged places.', values: [3, 8, 5] } },
    { note: 'Teacher stays in control', text: 'The teacher can pause, undo, or correct an operation. Undo restores the earlier scene through the scene manager.', architecture: { node: 'controls', route: 'corrected', payloadLabel: 'Undo', payload: '[3, 8, 5] → [8, 3, 5]', values: [8, 3, 5] } },
  ] },
  { id: 'architecture-error', title: 'System architecture', kind: 'architecture', steps: [
    { note: 'An invalid reference', text: 'Now follow the uncertain-event path. The teacher says, delete the fifth node, but only three nodes exist.', architecture: { node: 'teacher', payloadLabel: 'Teacher instruction', payload: '“Delete the fifth node.”', values: [10, 20, 30] } },
    { note: 'Recognize the instruction', text: 'Whisper transcribes the sentence. Recognizing the words does not yet mean the instruction is safe to apply.', architecture: { node: 'stt', route: 'audio', payloadLabel: 'Recognized transcript', payload: 'Delete the fifth node.', values: [10, 20, 30] } },
    { note: 'Parse the intent', text: 'The intent parser proposes deleting index four. The proposed event still needs to be checked against the scene.', architecture: { node: 'llm', route: 'transcript', payloadLabel: 'Proposed event', payload: '{ "type": "delete", "index": 4 }', values: [10, 20, 30] } },
    { note: 'Reject the invalid event', text: 'Validation finds that index four does not exist. The event is rejected before anything on the whiteboard changes.', architecture: { node: 'validation', route: 'event', payloadLabel: 'Validation result', payload: 'Rejected: index 4 is outside a three-node list.', values: [10, 20, 30], verdict: 'rejected' } },
    { note: 'Withhold the update', text: 'Error handling withholds the uncertain event and sends it to the teacher for correction. The original scene stays intact.', architecture: { node: 'error', route: 'rejected', payloadLabel: 'Withheld event', payload: 'No scene mutation. Awaiting teacher correction.', values: [10, 20, 30], verdict: 'rejected' } },
    { note: 'Teacher corrects the reference', text: 'The teacher corrects the instruction to delete the third node. The correction is checked again before it is accepted.', architecture: { node: 'controls', route: 'fix', payloadLabel: 'Revalidated correction', payload: '{ "type": "delete", "index": 2 } → valid', values: [10, 20, 30], verdict: 'corrected' } },
    { note: 'Apply the checked correction', text: 'The scene manager applies the corrected, valid event. The list now contains ten and twenty.', architecture: { node: 'manager', route: 'corrected', payloadLabel: 'Scene transition', payload: '[10, 20, 30] → [10, 20]', values: [10, 20], verdict: 'corrected' } },
    { note: 'Render safely', text: 'The template renderer removes the third node and reconnects the remaining diagram.', architecture: { node: 'renderer', route: 'render', payloadLabel: 'Renderer', payload: 'Linked-list template → remove node → update pointers', values: [10, 20] } },
    { note: 'Display the corrected result', text: 'The corrected diagram is displayed. A mistaken instruction was caught, corrected, and applied without corrupting the scene.', architecture: { node: 'output', route: 'display', payloadLabel: 'Classroom output', payload: 'Only the corrected instruction changed the diagram.', values: [10, 20] } },
  ] },
];

export const rainfall = [10, 30, 20];
export const waterLesson: Lesson = { id: 'water', title: 'The water cycle', kind: 'science', steps: [
  { waterStage: 1, note: 'Solar energy', text: 'Let’s follow a drop of water. The sun warms the lake and provides energy for the water cycle.' },
  { waterStage: 2, note: 'Evaporation', text: 'Some liquid water changes into water vapor and moves into the air. This process is evaporation.' },
  { waterStage: 3, note: 'Condensation', text: 'As moist air cools, water vapor condenses into tiny droplets. These droplets form a cloud.' },
  { waterStage: 4, note: 'Precipitation', text: 'When droplets grow large enough, water falls back to Earth as rain. This is precipitation.' },
  { waterStage: 5, note: 'Runoff', text: 'Water flows downhill over the land, into streams, and back toward the lake. This movement is surface runoff.' },
  { waterStage: 6, note: 'Infiltration', text: 'Some water also soaks into the soil. It can replenish groundwater, which moves slowly beneath the surface.' },
  { waterStage: 7, note: 'Read the graph', text: 'Now let’s use an illustrative rainfall graph. On our first example day, ten millimeters of rain fell.' },
  { waterStage: 8, note: 'Compare rainfall', text: 'On day two, thirty millimeters fell. That is three times the rainfall on day one.' },
  { waterStage: 9, note: 'Complete the graph', text: 'Day three brought twenty millimeters. These made-up values total sixty millimeters over three days, showing how a spoken explanation can build a graph.' },
] };

export const classroomLessons: Lesson[] = examples.map(example => ({
  id: example.id, title: example.label, kind: 'classroom',
  steps: exampleFrames(example).slice(1).map(frame => ({ text: frame.text, note: frame.note, scene: frame.scene })),
}));
export const lessons: Lesson[] = [...classroomLessons, ...architectureLessons, waterLesson];
export const voices = [
  { id: 'aria', name: 'Aria', providerVoice: 'en-US-AriaNeural', gender: 'female' },
  { id: 'guy', name: 'Guy', providerVoice: 'en-US-GuyNeural', gender: 'male' },
] as const;

export function pointOnRoute(points: [number, number][], fraction: number): [number, number] {
  const distances = points.slice(1).map((point, i) => Math.hypot(point[0] - points[i][0], point[1] - points[i][1]));
  let distance = distances.reduce((sum, value) => sum + value, 0) * Math.min(1, Math.max(0, fraction));
  for (let i = 0; i < distances.length; i++) {
    if (distance <= distances[i]) {
      const progress = distances[i] ? distance / distances[i] : 0;
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * progress, points[i][1] + (points[i + 1][1] - points[i][1]) * progress];
    }
    distance -= distances[i];
  }
  return points[points.length - 1];
}
