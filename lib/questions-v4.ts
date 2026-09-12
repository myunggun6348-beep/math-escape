import { questions as previous, type RichQuestion } from './questions-v3';
import { courses as subjectCourses } from './catalog';
import { validateSettings, type Settings } from './game-settings';
import { numericAnswer } from './numeric-answer';

export const mixedCourse = '수학 종합';
export const mixedSubjects = ['공통수학1', '공통수학2', '대수', '미적분Ⅰ', '확률과 통계', '기하'];
export const courses = [mixedCourse, ...subjectCourses];
export type Choice = { id: string; label: string };
export type GameQuestion = Omit<RichQuestion, 'unit' | 'difficulty'> & {
  unit?: string; difficulty?: string; course?: string;
  format?: 'choice' | 'short'; choices?: Choice[]; correctChoice?: string;
};

function fraction(value: number): [number, number] {
  for (let denominator = 1; denominator <= 10000; denominator++) {
    const numerator = Math.round(value * denominator);
    if (Math.abs(numerator / denominator - value) < 1e-12) return [numerator, denominator];
  }
  throw new Error('선택지로 표현할 수 없는 값입니다.');
}
function label(numerator: number, denominator: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(Math.abs(numerator), denominator);
  return denominator / divisor === 1 ? String(numerator / divisor) : String(numerator / divisor) + '/' + String(denominator / divisor);
}

export function questions(course: string, version = 4, settings?: Settings, seed = 0): GameQuestion[] {
  if (version !== 4) return previous(course, version, settings, seed);
  const chosen = validateSettings(course, settings?.unit ?? 'all', settings?.difficulty ?? 'standard');
  const offset = Math.abs(Math.trunc(seed));
  return Array.from({ length: 6 }, (_, id) => {
    const subject = course === mixedCourse ? mixedSubjects[(id + offset) % mixedSubjects.length] : course;
    const sourceSettings = { ...chosen, unit: course === mixedCourse ? 'all' : chosen.unit };
    const q = previous(subject, 3, sourceSettings, seed)[id] as RichQuestion;
    const base = { ...q, course: subject, answerText: label(...fraction(q.answer)) };
    // Required and bonus clues both include both formats: three choices and three short answers.
    if ([0, 3, 4].includes(id)) return { ...base, format: 'short' };
    const [numerator, denominator] = fraction(q.answer);
    const correctIndex = (offset * 3 + id) % 5;
    const choices = Array.from({ length: 5 }, (_, index) => ({
      id: 'option-' + (index + 1),
      label: label(numerator + index - correctIndex, denominator),
    }));
    return { ...base, format: 'choice', choices, correctChoice: choices[correctIndex].id,
      answerText: ['①', '②', '③', '④', '⑤'][correctIndex] + ' ' + base.answerText };
  });
}

export function isCorrectAnswer(q: GameQuestion, input: unknown): boolean {
  if (q.format === 'choice') {
    if (!q.choices?.some(choice => choice.id === input)) throw new Error('다섯 보기 중 하나를 선택하세요.');
    return input === q.correctChoice;
  }
  const value = numericAnswer(input);
  if (value === null) throw new Error('정수, 소수 또는 분수로 입력하세요. 예: -3, 0.5, 1/2');
  return Math.abs(value - q.answer) <= 1e-9;
}
