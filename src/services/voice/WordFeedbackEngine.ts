export type WordFeedbackColor = 'neutral' | 'correct' | 'retry';

export class WordFeedbackEngine {
  static getColor(isCorrect: boolean): WordFeedbackColor {
    return isCorrect ? 'correct' : 'retry';
  }

  static normalize(text: string): string {
    return text.toLowerCase().trim().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ');
  }

  static matchWord(expected: string, spoken: string, tolerance: number) {
    const a = this.normalize(expected);
    const b = this.normalize(spoken);
    const similarity = this.similarity(a, b);
    const isCorrect = a === b || similarity >= tolerance;
    return { isCorrect, confidence: similarity, feedbackColor: this.getColor(isCorrect) };
  }

  private static similarity(a: string, b: string): number {
    if (a === b) return 1;
    if (!a.length || !b.length) return 0;
    const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return 1 - matrix[a.length][b.length] / Math.max(a.length, b.length);
  }
}
