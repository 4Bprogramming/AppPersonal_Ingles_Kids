import { EXAM_PASS_PERCENTAGE, EXAM_QUESTION_COUNT } from '../../config/constants.js';
import type { BackpackItem, ExamQuestion, Unit } from '../../types/index.js';

export class CumulativeExamGenerator {
  static getDistribution(targetUnitNumber: number, allUnits: Unit[]) {
    const relevant = allUnits
      .filter((u) => u.unitNumber <= targetUnitNumber)
      .sort((a, b) => b.unitNumber - a.unitNumber);

    if (relevant.length <= 1) {
      return relevant.length ? [{ unitId: relevant[0].id, weight: 1 }] : [];
    }

    const [current, previous, ...older] = relevant;
    const distribution = [
      { unitId: current.id, weight: 0.5 },
      { unitId: previous.id, weight: targetUnitNumber === 2 ? 0.5 : 0.25 },
    ];

    if (targetUnitNumber > 2 && older.length) {
      const perOlder = 0.25 / older.length;
      older.forEach((u) => distribution.push({ unitId: u.id, weight: perOlder }));
    }

    return distribution;
  }

  static generate(
    targetUnit: Unit,
    allUnits: Unit[],
    backpack: BackpackItem[],
    count = EXAM_QUESTION_COUNT,
  ): ExamQuestion[] {
    const distribution = this.getDistribution(targetUnit.unitNumber, allUnits);
    const pool: ExamQuestion[] = [];

    for (const { unitId, weight } of distribution) {
      const unit = allUnits.find((u) => u.id === unitId);
      if (!unit) continue;
      const n = Math.max(1, Math.round(weight * 20));
      for (let i = 0; i < n; i++) {
        const word = unit.vocabulary[i % Math.max(unit.vocabulary.length, 1)] ?? 'practice';
        pool.push({
          id: `pool-${unitId}-${i}`,
          type: 'multiple_choice',
          unitId,
          prompt: `${unit.title}: choose the correct word`,
          options: this.shuffle([word, 'hello', 'goodbye', 'thanks']).slice(0, 4),
          correctAnswer: word,
          fromBackpack: false,
        });
      }
    }

    const activeBackpack = backpack.filter((b) => !b.released);
    const backpackQs: ExamQuestion[] = activeBackpack.map((item, i) => ({
      id: `bp-${i}`,
      type: 'voice',
      unitId: item.unit_id ?? targetUnit.id,
      prompt: `Say: "${item.word}"`,
      correctAnswer: item.word,
      fromBackpack: true,
    }));

    const slots = Math.max(0, count - backpackQs.length);
    const random = this.shuffle(pool).slice(0, slots);
    return [...backpackQs, ...random].slice(0, count).map((q, i) => ({ ...q, id: `exam-q-${i + 1}` }));
  }

  static evaluate(questions: ExamQuestion[], answers: Record<string, string>, isPractice: boolean) {
    let correct = 0;
    for (const q of questions) {
      if ((answers[q.id] ?? '').toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        correct++;
      }
    }
    const total = questions.length;
    const percentage = total ? Math.round((correct / total) * 100) : 0;
    return {
      score: correct,
      totalQuestions: total,
      percentage,
      passed: percentage >= EXAM_PASS_PERCENTAGE,
      isPractice,
    };
  }

  private static shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
