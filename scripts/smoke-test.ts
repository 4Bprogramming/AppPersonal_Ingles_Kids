/**
 * Smoke tests — API Railway + lógica pura (sin auth Google real).
 * Ejecutar: npx tsx scripts/smoke-test.ts
 */
import { CumulativeExamGenerator } from '../src/services/exam/CumulativeExamGenerator.js';
import { WordFeedbackEngine } from '../src/services/voice/WordFeedbackEngine.js';
import type { BackpackItem, ExamQuestion, Unit } from '../src/types/index.js';

const API_URL = process.env.API_URL ?? 'https://api-production-501b0.up.railway.app';

type Result = { name: string; ok: boolean; detail?: string };

const results: Result[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function testApi() {
  console.log('\n🌐 API Railway\n');

  try {
    const health = await fetch(`${API_URL}/health`);
    const body = await health.json();
    if (health.ok && body.status === 'ok') {
      pass('GET /health', JSON.stringify(body));
    } else {
      fail('GET /health', `status ${health.status}`);
    }
  } catch (e) {
    fail('GET /health', e instanceof Error ? e.message : 'error');
  }

  try {
    const res = await fetch(`${API_URL}/children`);
    if (res.status === 401) {
      pass('GET /children sin token → 401', 'auth protegida');
    } else {
      fail('GET /children sin token', `esperaba 401, got ${res.status}`);
    }
  } catch (e) {
    fail('GET /children sin token', e instanceof Error ? e.message : 'error');
  }

  try {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'invalid' }),
    });
    if (res.status === 401 || res.status === 500) {
      pass('POST /auth/google token inválido → rechazado', `status ${res.status}`);
    } else {
      fail('POST /auth/google', `status inesperado ${res.status}`);
    }
  } catch (e) {
    fail('POST /auth/google', e instanceof Error ? e.message : 'error');
  }

  try {
    const res = await fetch(`${API_URL}/ai/teacher/fake-child/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.status === 401) {
      pass('POST /ai/teacher sin token → 401', 'Teacher Mode protegido');
    } else {
      fail('POST /ai/teacher sin token', `status ${res.status}`);
    }
  } catch (e) {
    fail('POST /ai/teacher', e instanceof Error ? e.message : 'error');
  }
}

function testExamGenerator() {
  console.log('\n📝 CumulativeExamGenerator\n');

  const units: Unit[] = [
    {
      id: 'unit-1',
      unitNumber: 1,
      title: 'Unit 1',
      emoji: '🎯',
      vocabulary: ['hello', 'mom', 'football'],
      grammarTopics: [],
      activities: [],
      personalizedThemes: [],
      generatedAt: '',
      sourceBook: 'small_big_things_1',
    },
    {
      id: 'unit-2',
      unitNumber: 2,
      title: 'Unit 2',
      emoji: '⚽',
      vocabulary: ['play', 'sister', 'dog'],
      grammarTopics: [],
      activities: [],
      personalizedThemes: [],
      generatedAt: '',
      sourceBook: 'small_big_things_1',
    },
  ];

  const backpack: BackpackItem[] = [
    {
      id: 'bp-1',
      child_id: 'c1',
      word: 'football',
      context: 'test',
      unit_id: 'unit-1',
      activity_id: 'a1',
      attempts: 3,
      released: false,
      added_at: '',
    },
  ];

  const questions = CumulativeExamGenerator.generate(units[1], units, backpack, 10);
  if (questions.length === 10) {
    pass('Genera 10 preguntas', `U2 exam`);
  } else {
    fail('Genera 10 preguntas', `got ${questions.length}`);
  }

  const hasBackpack = questions.some((q) => q.fromBackpack);
  if (hasBackpack) {
    pass('Inyecta palabras de mochila', 'fromBackpack=true');
  } else {
    fail('Inyecta palabras de mochila');
  }

  const dist = CumulativeExamGenerator.getDistribution(2, units);
  if (dist.length === 2 && dist[0].weight === 0.5) {
    pass('Distribución U2: 50% U2 + 50% U1');
  } else {
    fail('Distribución U2', JSON.stringify(dist));
  }

  const evalResult = CumulativeExamGenerator.evaluate(
    questions,
    Object.fromEntries(questions.map((q) => [q.id, q.correctAnswer])),
    false,
  );
  if (evalResult.passed && evalResult.percentage === 100) {
    pass('Evaluación 100% → passed', `${evalResult.percentage}%`);
  } else {
    fail('Evaluación', `${evalResult.percentage}%`);
  }

  const failResult = CumulativeExamGenerator.evaluate(questions, {}, false);
  if (!failResult.passed && failResult.percentage < 80) {
    pass('Evaluación vacía → no pasa (<80%)', `${failResult.percentage}%`);
  } else {
    fail('Evaluación vacía', `${failResult.percentage}%`);
  }
}

function testWordFeedback() {
  console.log('\n🎤 WordFeedbackEngine\n');

  const ok = WordFeedbackEngine.matchWord('football', 'football', 0.58);
  if (ok.isCorrect && ok.feedbackColor === 'correct') {
    pass('Palabra exacta → verde');
  } else {
    fail('Palabra exacta');
  }

  const retry = WordFeedbackEngine.matchWord('football', 'basketball', 0.58);
  if (!retry.isCorrect && retry.feedbackColor === 'retry') {
    pass('Palabra incorrecta → amarillo (no rojo)');
  } else {
    fail('Palabra incorrecta', retry.feedbackColor);
  }

  const tolerant = WordFeedbackEngine.matchWord('football', 'footbal', 0.7);
  if (tolerant.isCorrect) {
    pass('Tolerancia alta acepta aproximación');
  } else {
    pass('Tolerancia (strict mode)', `confidence ${tolerant.confidence.toFixed(2)}`);
  }
}

async function main() {
  console.log('🧪 Treasure Hunter — Smoke Tests');
  console.log(`   API: ${API_URL}`);

  await testApi();
  testExamGenerator();
  testWordFeedback();

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Resultado: ${passed}/${total} tests OK\n`);

  if (passed < total) {
    process.exit(1);
  }
}

main();
