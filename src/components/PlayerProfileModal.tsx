import React, { useState, useEffect } from 'react';
import { sound } from '../utils/soundEffects';
import { User, Check, X, Sparkles, Timer, Gamepad2, BookOpen, FileQuestion } from 'lucide-react';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentName: string;
  onSave: (name: string, targetTab?: 'game' | 'knowledge' | 'quiz') => void;
  isInitialPrompt?: boolean;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  currentName,
  onSave,
  isInitialPrompt = false,
}) => {
  const [name, setName] = useState(currentName || '');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setName(currentName || '');
    setErrorMsg('');
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSelectDestination = (targetTab: 'game' | 'knowledge' | 'quiz') => {
    if (!name.trim()) {
      sound.playWrong();
      setErrorMsg('กรุณาพิมพ์ชื่อของคุณ หรือคลิกเลือกชื่อตัวอย่างด้านล่างก่อนเข้าใช้งานจ้า');
      return;
    }
    sound.playClick();
    onSave(name.trim(), targetTab);
    if (onClose) onClose();
  };

  const handleSimpleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      sound.playWrong();
      setErrorMsg('กรุณาพิมพ์ชื่อผู้เล่นก่อนบันทึกจ้า');
      return;
    }
    sound.playClick();
    onSave(name.trim());
    if (onClose) onClose();
  };

  const sampleNames = ['สมชาย', 'มานี', 'ปิติ', 'ชูใจ', 'Kruwaybiig'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-400/50 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white">
                {isInitialPrompt ? 'พิมพ์ชื่อผู้เล่นเพื่อเริ่มต้น' : 'แก้ไขชื่อผู้เล่น'}
              </h2>
              <p className="text-xs text-slate-400">
                {isInitialPrompt 
                  ? 'ใส่ชื่อแล้วเลือกได้เลยว่าจะเข้าเล่นเกม ศึกษาความรู้ หรือทำข้อสอบ' 
                  : 'แก้ไขชื่อที่จะแสดงในตารางจัดอันดับ'}
              </p>
            </div>
          </div>

          {!isInitialPrompt && onClose && (
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4 relative z-10">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              ชื่อผู้เข้าเล่น / ชื่อนักเรียน <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="พิมพ์ชื่อของคุณที่นี่... (เช่น สมชาย, มานี, Kruwaybiig)"
                maxLength={24}
                className={`w-full px-4 py-3.5 rounded-2xl bg-slate-800/90 border-2 text-white font-bold text-base focus:outline-none transition-colors placeholder:text-slate-500 placeholder:font-normal ${
                  errorMsg
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-slate-700 focus:border-amber-400'
                }`}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isInitialPrompt) {
                      handleSelectDestination('game');
                    } else {
                      handleSimpleSave(e);
                    }
                  }
                }}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                {name.length}/24
              </span>
            </div>
            {errorMsg && (
              <p className="text-xs font-bold text-rose-400 mt-2 flex items-center gap-1 animate-fadeIn">
                <span>⚠️ {errorMsg}</span>
              </p>
            )}
          </div>

          {/* Quick Name Suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              หรือแตะเลือกชื่อตัวอย่างด่วน:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleNames.map(sn => (
                <button
                  type="button"
                  key={sn}
                  onClick={() => {
                    sound.playClick();
                    setName(sn);
                    setErrorMsg('');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    name === sn
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-800/70 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  {sn}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Choice Buttons (Initial Entry) */}
          {isInitialPrompt ? (
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-slate-300 block">
                เลือกหน้าที่ต้องการเข้าใช้งานหลังจากใส่ชื่อ:
              </span>

              {/* Option 1: Slingshot Game */}
              <button
                type="button"
                onClick={() => handleSelectDestination('game')}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm md:text-base shadow-lg shadow-amber-500/25 flex items-center justify-between active:scale-98 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950/20 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <div className="font-black text-slate-950 text-sm md:text-base">๑. เล่นเกมยิงหนังสติ๊ก (จับเวลา ๓ นาที • ไม่จำกัดข้อ)</div>
                    <div className="text-[11px] text-slate-900/90 font-medium">ยิงวิถีแนวนอนจำแนกคำเข้าห่วง ๕ ชนิด จับเวลา ๓ นาที ยิงได้ต่อเนื่อง</div>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-slate-950/20 px-2.5 py-1.5 rounded-xl shrink-0">เข้าเล่นเกม ➔</span>
              </button>

              {/* Option 2: Knowledge / Read Textbook */}
              <button
                type="button"
                onClick={() => handleSelectDestination('knowledge')}
                className="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border-2 border-teal-500/50 hover:border-teal-400 text-slate-100 flex items-center justify-between active:scale-98 transition-all cursor-pointer group text-left shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-teal-300 text-sm md:text-base">๒. อ่านตำรา / คลังความรู้ ๕ ชนิด</div>
                    <div className="text-[11px] text-slate-400 font-medium">ศึกษาเนื้อหาและตัวอย่างประโยคบรรทัดฐานภาษาไทย เล่ม ๓</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-1.5 rounded-xl shrink-0">เข้าอ่านตำรา ➔</span>
              </button>

              {/* Option 3: Untimed Quiz */}
              <button
                type="button"
                onClick={() => handleSelectDestination('quiz')}
                className="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border-2 border-indigo-500/50 hover:border-indigo-400 text-slate-100 flex items-center justify-between active:scale-98 transition-all cursor-pointer group text-left shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-indigo-300 text-sm md:text-base">๓. ทำแบบทดสอบ ๓๐ ข้อ (หลากหลาย • ไม่จับเวลา)</div>
                    <div className="text-[11px] text-slate-400 font-medium">ข้อสอบ ๓๐ ข้อ ครบ ๕ ชนิดข้อละ ๖ ข้อ คิดวิเคราะห์สบาย ๆ พร้อมเฉลยและเกียรติบัตร</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1.5 rounded-xl shrink-0">ทำข้อสอบ ➔</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSimpleSave}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-5 h-5" />
              บันทึกชื่อผู้เล่น
            </button>
          )}

          {/* Kruwaybiig watermark credit */}
          <div className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1 pt-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            ระบบจำแนกคำสรรพนาม ๕ ชนิด • Powered by Kruwaybiig
          </div>
        </div>
      </div>
    </div>
  );
};
