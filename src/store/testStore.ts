import { create } from 'zustand';
import type { Question, TestSet, UserAnswer } from '../lib/supabase';

type TestStore = {
  currentTest: TestSet | null;
  questions: Question[];
  currentIndex: number;
  answers: UserAnswer[];
  startedAt: Date | null;
  isFinished: boolean;
  showExplanation: boolean;
  lastAnswerCorrect: boolean | null;

  startTest: (testSet: TestSet, questions: Question[]) => void;
  answerQuestion: (questionId: string, selectedIds: string[], isCorrect: boolean, textAnswer?: string, orderAnswer?: string[], matchAnswer?: { left: string; right: string }[]) => void;
  nextQuestion: () => void;
  finishTest: () => void;
  resetTest: () => void;
};

export const useTestStore = create<TestStore>((set, get) => ({
  currentTest: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  startedAt: null,
  isFinished: false,
  showExplanation: false,
  lastAnswerCorrect: null,

  startTest: (testSet, questions) => {
    let shuffled = [...questions];
    if (testSet.settings.shuffle_questions) {
      shuffled = shuffled.sort(() => Math.random() - 0.5);
    }
    set({
      currentTest: testSet,
      questions: shuffled,
      currentIndex: 0,
      answers: [],
      startedAt: new Date(),
      isFinished: false,
      showExplanation: false,
      lastAnswerCorrect: null,
    });
  },

  answerQuestion: (questionId: string, selectedIds: string[], isCorrect: boolean, textAnswer?: string, orderAnswer?: string[], matchAnswer?: { left: string; right: string }[]) => {
    const { answers, startedAt } = get();
    const timeTaken = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;
    const answer: UserAnswer = {
      question_id: questionId,
      selected_option_ids: selectedIds,
      text_answer: textAnswer,
      order_answer: orderAnswer,
      match_answer: matchAnswer,
      is_correct: isCorrect,
      time_taken_sec: timeTaken,
    };
    set({
      answers: [...answers, answer],
      showExplanation: true,
      lastAnswerCorrect: isCorrect,
    });
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex + 1 >= questions.length) {
      set({ isFinished: true, showExplanation: false });
    } else {
      set({ currentIndex: currentIndex + 1, showExplanation: false, lastAnswerCorrect: null });
    }
  },

  finishTest: () => set({ isFinished: true }),

  resetTest: () => set({
    currentTest: null,
    questions: [],
    currentIndex: 0,
    answers: [],
    startedAt: null,
    isFinished: false,
    showExplanation: false,
    lastAnswerCorrect: null,
  }),
}));
