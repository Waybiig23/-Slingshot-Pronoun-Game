import React, { useState } from 'react';
import { ScoreRecord } from '../types';
import { sound } from '../utils/soundEffects';
import { 
  Trophy, 
  Flame, 
  Timer, 
  X, 
  Gamepad2, 
  FileQuestion, 
  Trash2, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: ScoreRecord[];
  onClearScores: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  scores,
  onClearScores,
}) => {
  const [activeTab, setActiveTab] = useState<'game' | 'quiz'>('game');
  
  // Passcode prompt states for secure score clearing
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const filteredScores = scores
    .filter(s => s.mode === activeTab)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timeSpentSec - b.timeSpentSec;
    });

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/30">
            🥇
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
            🥈
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-sm shadow-md">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs border border-slate-700">
            {rank}
          </div>
        );
    }
  };

  // Open the secure clear score dialog
  const handleOpenPrompt = () => {
    sound.playClick();
    setPasscode('');
    setShowPasscode(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsPromptOpen(true);
  };

  // Verify passcode and clear scores
  const handleConfirmClear = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === '237280') {
      sound.playCorrect();
      onClearScores();
      setSuccessMsg('ล้างประวัติคะแนนทั้งหมดเรียบร้อยแล้ว!');
      setErrorMsg('');
      setTimeout(() => {
        setIsPromptOpen(false);
        setSuccessMsg('');
        setPasscode('');
      }, 1100);
    } else {
      sound.playWrong();
      setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วระบุใหม่อีกครั้ง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-5 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
              <Trophy className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">ตารางจัดอันดับคะแนน</h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  คลาวด์ออนไลน์ (Firebase)
                </span>
              </div>
              <p className="text-xs text-slate-400">บันทึกคะแนนระดับโลก เชื่อมต่อฐานข้อมูลผู้เล่นทั่วโลก</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('game');
            }}
            className={`py-2 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'game'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            เกมยิงหนังสติ๊ก
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('quiz');
            }}
            className={`py-2 px-3 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-indigo-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            แบบทดสอบ ๓๐ ข้อ
          </button>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
          {filteredScores.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center text-slate-500">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-300">ยังไม่มีบันทึกคะแนนในหมวดนี้</p>
              <p className="text-xs text-slate-500 mt-1">มาร่วมประลองฝีมือเป็นคนแรกกันเถอะ!</p>
            </div>
          ) : (
            filteredScores.map((record, idx) => (
              <div
                key={record.id || idx}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : idx === 1
                    ? 'bg-slate-800/80 border-slate-600/60'
                    : idx === 2
                    ? 'bg-orange-950/20 border-orange-700/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankBadge(idx + 1)}
                  <div>
                    <div className="font-bold text-white text-sm">
                      {record.playerName}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{record.date}</span>
                      {record.streak !== undefined && record.streak > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-400 font-semibold">
                          <Flame className="w-3 h-3" /> คอมโบ {record.streak}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-amber-400 text-base md:text-lg">
                    {record.score}{' '}
                    <span className="text-xs text-slate-400 font-normal">
                      {activeTab === 'quiz' ? `/ ${record.maxScore || 30}` : 'แต้ม'}
                    </span>
                  </div>
                  {activeTab === 'game' ? (
                    <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                      <Timer className="w-3 h-3 text-sky-400" />
                      {record.timeSpentSec}s
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400 font-medium">
                      ไม่จำกัดเวลา
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info & reset button */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Powered by Kruwaybiig</span>
          <button
            onClick={handleOpenPrompt}
            className="text-rose-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg hover:bg-rose-950/30 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ล้างคะแนน
          </button>
        </div>
      </div>

      {/* Secure Passcode Prompt Dialog */}
      {isPromptOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 md:p-7 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">ยืนยันการล้างคะแนน</h3>
                  <p className="text-xs text-slate-400">ระบบรักษาความปลอดภัยของข้อมูล</p>
                </div>
              </div>
              <button
                onClick={() => setIsPromptOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              กรุณากรอกรหัสผ่านเพื่อยืนยันการล้างประวัติคะแนนทั้งหมดออกจากระบบอย่างถาวร
            </p>

            <form onSubmit={handleConfirmClear} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  รหัสผ่านยืนยัน
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={e => {
                      setPasscode(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="กรอกรหัสผ่านเพื่อล้างคะแนน"
                    autoFocus
                    autoComplete="off"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white pr-10 tracking-widest placeholder:tracking-normal placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                    title={showPasscode ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message (Without showing the code!) */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPromptOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!passcode.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ยืนยันการล้างคะแนน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
