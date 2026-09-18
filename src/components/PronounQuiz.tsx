import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PRONOUN_CATEGORIES } from '../data/pronounKnowledge';
import { get30DiverseQuizQuestions } from '../data/quizQuestionGenerator';
import { sound } from '../utils/soundEffects';
import { thaiSpeech } from '../utils/speechSynthesis';
import { QuizQuestion, ScoreRecord } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  Trophy, 
  BookOpen, 
  Award, 
  ChevronRight, 
  Sparkles,
  Layers,
  User
} from 'lucide-react';

interface PronounQuizProps {
  playerName: string;
  avatar: string;
  onOpenKnowledge: () => void;
  onOpenGame: () => void;
  onOpenLeaderboard: () => void;
  onRecordScore: (record: ScoreRecord) => void;
}

export const PronounQuiz: React.FC<PronounQuizProps> = ({
  playerName,
  avatar,
  onOpenKnowledge,
  onOpenGame,
  onOpenLeaderboard,
  onRecordScore,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => get30DiverseQuizQuestions(true));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const totalQuestions = 30;
  const currentQ: QuizQuestion = questions[currentIdx] || questions[0];

  const handleSelectOption = (optIdx: number) => {
    if (selectedOption !== null) return; // already answered current question
    setSelectedOption(optIdx);
    setUserAnswers(prev => ({ ...prev, [currentIdx]: optIdx }));
    setShowExplanation(true);

    const isCorrect = optIdx === currentQ.correctIndex;
    if (isCorrect) {
      sound.playCorrect();
      sound.playYay();
      const cheerQuotes = ['เย้! ถูกต้องนะจ๊ะ!', 'ถูกต้อง เก่งมาก!', 'ยอดเยี่ยม! ตอบถูกแล้ว!'];
      thaiSpeech.speak(cheerQuotes[Math.floor(Math.random() * cheerQuotes.length)], { rate: 1.1, pitch: 1.2 });
    } else {
      sound.playWrong();
      sound.playOops();
      const oopsQuotes = ['ยังไม่ถูกนะจ๊ะ ไม่เป็นไร ลองอ่านคำอธิบายดูนะ!', 'ผิดจ้า ลองจำวิธีสังเกตดูนะ!'];
      thaiSpeech.speak(oopsQuotes[Math.floor(Math.random() * oopsQuotes.length)], { rate: 1.05, pitch: 1.05 });
    }
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIdx + 1 < totalQuestions) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setSelectedOption(userAnswers[nextIdx] ?? null);
      setShowExplanation(userAnswers[nextIdx] !== undefined);
    } else {
      // Calculate final score across 30 questions
      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correctIndex) {
          correctCount++;
        }
      });

      setIsFinished(true);

      const calculatedStars = correctCount >= 25 ? 3 : correctCount >= 18 ? 2 : 1;

      // Record to leaderboard
      onRecordScore({
        id: 'quiz-' + Date.now(),
        playerName: playerName || 'นักเรียนคนเก่ง',
        avatar: '',
        score: correctCount,
        maxScore: totalQuestions,
        timeSpentSec: 0,
        mode: 'quiz',
        date: 'วันนี้',
        stars: calculatedStars,
      });

      if (correctCount >= 22) {
        sound.playFanfare();
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 },
          });
        } catch {}
      }
    }
  };

  const handleRestart = () => {
    sound.playClick();
    setQuestions(get30DiverseQuizQuestions(true));
    setCurrentIdx(0);
    setUserAnswers({});
    setSelectedOption(null);
    setShowExplanation(false);
    setIsFinished(false);
  };

  // Live Score summary
  const score = Object.entries(userAnswers).reduce((acc, [qIdx, ansIdx]) => {
    const q = questions[Number(qIdx)];
    return acc + (q && q.correctIndex === ansIdx ? 1 : 0);
  }, 0);

  const answeredCount = Object.keys(userAnswers).length;

  if (isFinished) {
    const percentage = Math.round((score / totalQuestions) * 100);
    const starCount = score >= 25 ? 3 : score >= 18 ? 2 : 1;

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
        {/* Result Certificate Card */}
        <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Certificate Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-sm">
            <Award className="w-4 h-4" />
            เกียรติบัตรการทำแบบทดสอบวิชาภาษาไทย (ชุด ๓๐ ข้อ)
          </div>

          <div className="space-y-2">
            <div className="text-3xl md:text-5xl font-black text-white">
              {score >= 25 ? 'ยอดเยี่ยมระดับดีเยี่ยม! 🎉' : score >= 18 ? 'ผ่านเกณฑ์ระดับดีมาก! 👏' : 'พยายามได้ดี ฝึกฝนอีกนิดนะ! 📚'}
            </div>
            <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
              ขอแสดงความยินดีกับคุณ <span className="text-amber-400 font-bold">{playerName || 'ผู้เข้าสอบ'}</span> ที่ทำแบบทดสอบเรื่อง <span className="text-amber-300 font-bold">คำสรรพนาม ๕ ชนิด</span> ครบทั้ง ๓๐ ข้อ
            </p>
          </div>

          {/* Player Badge */}
          <div className="inline-flex items-center gap-3 bg-slate-800/80 px-6 py-2.5 rounded-2xl border border-slate-700 mx-auto">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-400 font-bold">ชื่อผู้เข้าสอบ</div>
              <div className="text-lg font-black text-white">{playerName || 'ผู้สอบนิรนาม'}</div>
            </div>
          </div>

          {/* Score Display Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80">
              <div className="text-xs text-slate-400 font-bold uppercase">คะแนนที่ได้</div>
              <div className="text-3xl font-black text-emerald-400 mt-1">
                {score} <span className="text-sm font-medium text-slate-400">/ ๓๐</span>
              </div>
            </div>
            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80">
              <div className="text-xs text-slate-400 font-bold uppercase">คิดเป็นร้อยละ</div>
              <div className="text-3xl font-black text-amber-400 mt-1">{percentage}%</div>
            </div>
            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80">
              <div className="text-xs text-slate-400 font-bold uppercase">ความหลากหลาย</div>
              <div className="text-xs md:text-sm font-extrabold text-sky-400 mt-2">ครบ ๕ ชนิด (หมวดละ ๖ ข้อ)</div>
            </div>
            <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80">
              <div className="text-xs text-slate-400 font-bold uppercase">ระดับดาว</div>
              <div className="text-2xl text-amber-400 mt-1.5">
                {'⭐'.repeat(starCount)}
              </div>
            </div>
          </div>

          {/* Kruwaybiig Credit Stamp */}
          <div className="pt-2 text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            รับรองผลการทดสอบ • อิงตามบรรทัดฐานภาษาไทย เล่ม ๓ • Powered by Kruwaybiig
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              ทำแบบทดสอบใหม่อีกครั้ง
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onOpenGame();
              }}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              ไปเล่นเกมยิงหนังสติ๊ก (จับเวลา ๓ นาที)
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onOpenLeaderboard();
              }}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              ดูตารางอันดับ
            </button>
          </div>
        </div>

        {/* Detailed Question Review Breakdown */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            เฉลยละเอียดและทบทวนความรู้ครบทั้ง ๓๐ ข้อ
          </h3>
          <p className="text-xs text-slate-400">
            ตรวจดูผลลัพธ์คำตอบของคุณ พร้อมคำอธิบายอิงจากหลักเกณฑ์บรรทัดฐานภาษาไทย เล่ม ๓
          </p>

          <div className="space-y-4 pt-2">
            {questions.map((q, idx) => {
              const userAns = userAnswers[idx];
              const isCorrect = userAns === q.correctIndex;
              const cat = PRONOUN_CATEGORIES.find(c => c.id === q.pronounTypeId);

              return (
                <div
                  key={q.id || idx}
                  className={`p-4 md:p-5 rounded-2xl border-2 transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-rose-950/20 border-rose-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 text-xs font-bold text-white flex items-center justify-center border border-slate-700">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        ประเภท: <span className="text-amber-300">{cat?.name}</span>
                      </span>
                    </div>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ถูกต้อง
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" /> ตอบผิด
                      </span>
                    )}
                  </div>

                  <div className="font-semibold text-white text-sm md:text-base mb-2">
                    {q.question}
                  </div>

                  {q.sentence && (
                    <div className="text-xs md:text-sm text-slate-300 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 mb-2 font-mono">
                      {q.sentence}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    {q.options.map((opt, optI) => {
                      const isChosen = userAns === optI;
                      const isAnswer = q.correctIndex === optI;

                      return (
                        <div
                          key={optI}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${
                            isAnswer
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold'
                              : isChosen
                              ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold'
                              : 'bg-slate-800/40 border-slate-700 text-slate-400'
                          }`}
                        >
                          <span>{opt}</span>
                          {isAnswer && <span className="text-[10px] text-emerald-400 font-bold">(คำตอบที่ถูกต้อง)</span>}
                          {isChosen && !isAnswer && <span className="text-[10px] text-rose-400 font-bold">(คำตอบของคุณ)</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    💡 <strong className="text-amber-300">อธิบายเพิ่มเติม:</strong> {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active Question View
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-fadeIn">
      {/* Quiz Top Header */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">
              แบบทดสอบวัดความรู้ ๓๐ ข้อ (หลากหลายครบ ๕ ชนิด)
            </div>
            <div className="text-sm md:text-base font-extrabold text-white flex items-center gap-2">
              <span>ข้อที่ {currentIdx + 1}</span>
              <span className="text-slate-400 text-xs font-normal">จาก ๓๐ ข้อ</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Untimed Mode Badge */}
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs md:text-sm font-bold">
            <span>✨ ไม่จับเวลา</span>
          </div>

          {/* Current Score Counter */}
          <div className="bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700 text-amber-400 font-mono text-sm font-bold flex items-center gap-1.5">
            <span>ตอบถูก:</span>
            <span className="text-emerald-400 font-black">{score}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">{answeredCount}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
        <div
          className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-slate-800/90 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-xl space-y-5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/70 text-xs font-bold text-amber-400 border border-amber-500/30">
            <HelpCircle className="w-3.5 h-3.5" />
            คำถามข้อที่ {currentIdx + 1} / ๓๐
          </span>
          <span className="text-xs text-slate-400 font-medium">
            บรรทัดฐานภาษาไทย เล่ม ๓
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Optional Sentence Highlight */}
        {currentQ.sentence && (
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 text-amber-300 font-medium text-sm md:text-base">
            {currentQ.sentence}
          </div>
        )}

        {/* 4 Choices */}
        <div className="space-y-2.5 pt-2">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correctIndex;
            let btnStyle = 'bg-slate-900/60 border-slate-700 hover:bg-slate-700/60 hover:border-slate-600 text-slate-200';

            if (selectedOption !== null) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold shadow-lg shadow-emerald-500/10';
              } else if (isSelected) {
                btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold shadow-lg shadow-rose-500/10';
              } else {
                btnStyle = 'bg-slate-900/30 border-slate-800 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={selectedOption !== null}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700 text-white shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm md:text-base font-medium">{opt}</span>
                </div>

                {selectedOption !== null && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {selectedOption !== null && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Explanation when answered */}
        {showExplanation && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <BookOpen className="w-4 h-4" />
              คำอธิบายเฉลย (ตามบรรทัดฐานภาษาไทย เล่ม ๓):
            </div>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Bottom Navigation: Next Button */}
        {selectedOption !== null && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>
                {currentIdx + 1 === totalQuestions ? 'ดูผลการทดสอบ (สรุปคะแนน)' : 'ข้อถัดไป'}
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
