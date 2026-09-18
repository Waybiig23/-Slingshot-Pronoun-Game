import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, MessageCircle, Mic, RefreshCw } from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { thaiSpeech } from '../utils/speechSynthesis';

interface TeacherCharacterProps {
  categoryName?: string;
  categoryTip?: string;
  customDialogue?: string;
  mood?: 'welcome' | 'teaching' | 'tip' | 'praise';
  onCharacterClick?: () => void;
}

export const TeacherCharacter: React.FC<TeacherCharacterProps> = ({
  categoryName = 'คำบุรุษสรรพนาม',
  categoryTip = 'สรรพนามใช้แทนนามในการสื่อสาร มี ๕ ชนิดด้วยกันนะจ๊ะ',
  customDialogue,
  mood = 'teaching',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Dynamic dialogue lines for Kru Way
  const defaultDialogue = customDialogue || (
    mood === 'welcome'
      ? 'สวัสดีจ้ะ! ครูเวย์ยินดีต้อนรับทุกคนสู่ตำราคำสรรพนาม ๕ ชนิด มาเรียนรู้ไปด้วยกันอย่างสนุกสนานนะ!'
      : mood === 'tip'
      ? `เคล็ดลับจำง่ายจากครูเวย์: ${categoryTip}`
      : mood === 'praise'
      ? 'เก่งมากจ้า! จำหลักการและนำไปฝึกในเกมยิงหนังสติ๊กหรือแบบทดสอบต่อได้เลยนะ!'
      : `ตอนนี้เรากำลังดู ${categoryName} จ้ะ: ${categoryTip}`
  );

  const [dialogueText, setDialogueText] = useState(defaultDialogue);

  useEffect(() => {
    setDialogueText(defaultDialogue);
    // Stop any existing speech when dialogue changes
    thaiSpeech.stop();
    setIsSpeaking(false);
  }, [defaultDialogue, categoryName, categoryTip, mood]);

  // Trigger speech voice effect
  const handleSpeak = (textToSpeak?: string) => {
    const text = textToSpeak || dialogueText;
    if (isVoiceMuted) {
      setIsVoiceMuted(false);
    }
    
    sound.playSpeechChime();
    setIsSpeaking(true);

    const spoken = thaiSpeech.speak(text, {
      rate: 0.95,
      pitch: 1.05,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });

    if (!spoken) {
      // If Web Speech is not available or blocked in browser, reset speaking after 2s
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  const handleToggleVoice = () => {
    sound.playClick();
    if (isSpeaking) {
      thaiSpeech.stop();
      setIsSpeaking(false);
    }
    setIsVoiceMuted(prev => !prev);
  };

  return (
    <div className="relative bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-indigo-950/80 border-2 border-amber-400/40 rounded-3xl p-4 md:p-6 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 relative z-10">
        
        {/* Kru Way Animated Character Avatar & Badge */}
        <div className="relative shrink-0 flex flex-col items-center">
          {/* Character SVG Container with interactive float */}
          <div 
            onClick={() => handleSpeak()}
            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-b from-amber-400/20 via-orange-500/20 to-slate-900 border-2 border-amber-400/60 p-1 flex items-center justify-center shadow-xl shadow-amber-500/10 cursor-pointer hover:scale-105 active:scale-95 transition-all group relative"
            title="คลิกที่ครูเวย์เพื่อให้พูดออกเสียง"
          >
            {/* Pulsing speaking glow */}
            {isSpeaking && (
              <div className="absolute inset-0 rounded-3xl border-2 border-amber-400 animate-ping opacity-40 pointer-events-none" />
            )}

            {/* Custom SVG Illustration of Teacher Kru Way (ครูเวย์) */}
            <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
              <defs>
                {/* Skin tone gradient */}
                <linearGradient id="teacherSkin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                {/* Hair gradient */}
                <linearGradient id="teacherHair" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                {/* Suit gradient */}
                <linearGradient id="teacherSuit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                {/* Gold glasses gradient */}
                <linearGradient id="goldGlasses" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Aura Halo Sparkle */}
              <circle cx="80" cy="75" r="65" fill="#f59e0b" opacity="0.12" />

              {/* Teacher's Shoulders & Coat */}
              <path
                d="M 25 155 Q 80 120 135 155 L 140 160 L 20 160 Z"
                fill="url(#teacherSuit)"
                stroke="#1e3a8a"
                strokeWidth="2"
              />

              {/* Crisp White Shirt Collar & Gold Tie */}
              <polygon points="70,128 80,140 90,128 80,124" fill="#ffffff" />
              <polygon points="78,138 82,138 84,158 76,158" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />

              {/* Neck */}
              <rect x="70" y="112" width="20" height="20" rx="4" fill="#fcd34d" />

              {/* Friendly Face */}
              <ellipse cx="80" cy="85" rx="36" ry="40" fill="#fed7aa" stroke="#f97316" strokeWidth="1.5" />

              {/* Rosy Cheeks */}
              <ellipse cx="58" cy="98" rx="7" ry="4" fill="#fb7185" opacity="0.45" />
              <ellipse cx="102" cy="98" rx="7" ry="4" fill="#fb7185" opacity="0.45" />

              {/* Expressive Hair with Stylish Pompadour */}
              <path
                d="M 44 80 C 40 45 60 30 80 30 C 105 30 120 45 116 80 C 114 62 108 48 85 48 C 65 48 50 62 44 80 Z"
                fill="url(#teacherHair)"
              />
              {/* Front hair fringe */}
              <path
                d="M 52 58 Q 72 45 88 56 Q 74 50 60 62 Z"
                fill="#334155"
              />

              {/* Ears */}
              <ellipse cx="44" cy="88" rx="6" ry="10" fill="#fcd34d" />
              <ellipse cx="116" cy="88" rx="6" ry="10" fill="#fcd34d" />

              {/* Eyebrows */}
              <path d="M 56 68 Q 66 63 74 68" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
              <path d="M 86 68 Q 94 63 104 68" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />

              {/* Big Sparkling Eyes */}
              <circle cx="65" cy="82" r="6" fill="#0f172a" />
              <circle cx="63" cy="80" r="2.2" fill="#ffffff" />
              <circle cx="95" cy="82" r="6" fill="#0f172a" />
              <circle cx="93" cy="80" r="2.2" fill="#ffffff" />

              {/* Teacher's Classic Smart Glasses (Gold Frame) */}
              <rect x="52" y="72" width="24" height="20" rx="6" fill="none" stroke="url(#goldGlasses)" strokeWidth="3" />
              <rect x="84" y="72" width="24" height="20" rx="6" fill="none" stroke="url(#goldGlasses)" strokeWidth="3" />
              <line x1="76" y1="80" x2="84" y2="80" stroke="url(#goldGlasses)" strokeWidth="3" />
              <line x1="44" y1="78" x2="52" y2="78" stroke="url(#goldGlasses)" strokeWidth="2.5" />
              <line x1="108" y1="78" x2="116" y2="78" stroke="url(#goldGlasses)" strokeWidth="2.5" />
              {/* Glasses Glint / Reflection */}
              <line x1="56" y1="76" x2="62" y2="74" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
              <line x1="88" y1="76" x2="94" y2="74" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />

              {/* Smile Mouth (animated open/close when speaking) */}
              {isSpeaking ? (
                <ellipse cx="80" cy="107" rx="9" ry="6" fill="#be123c" stroke="#881337" strokeWidth="1.5" className="animate-pulse" />
              ) : (
                <path d="M 69 104 Q 80 114 91 104" fill="none" stroke="#991b1b" strokeWidth="3" strokeLinecap="round" />
              )}

              {/* Teacher's Pointer / Pen in Hand */}
              <g transform="translate(118, 110) rotate(-20)">
                <line x1="0" y1="0" x2="28" y2="-20" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                <polygon points="26,-22 34,-26 30,-18" fill="#ef4444" />
              </g>
            </svg>

            {/* Click to speak hint overlay on hover */}
            <div className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[10px] text-amber-300 font-bold p-1 text-center">
              <Mic className="w-4 h-4 text-amber-400 mb-0.5 animate-bounce" />
              ฟังเสียง
            </div>
          </div>

          {/* Teacher Tag Name Badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>ครูเวย์ (Kruwaybiig)</span>
          </div>
        </div>

        {/* Speech Bubble & Voice Narration Controls */}
        <div className="flex-1 w-full space-y-3">
          {/* Top Bar of Bubble: Title & Voice Controls */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                เสียงพูดคำอธิบายจากครูเวย์
              </span>
              {isSpeaking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  กำลังพูด...
                </span>
              )}
            </div>

            {/* Audio Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSpeak()}
                disabled={isSpeaking}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                title="กดเพื่อฟังเสียงอ่านภาษาไทย"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSpeaking ? 'กำลังเล่นเสียง...' : 'กดฟังเสียงพูด'}</span>
              </button>

              {isSpeaking && (
                <button
                  onClick={() => {
                    thaiSpeech.stop();
                    setIsSpeaking(false);
                  }}
                  className="p-1 rounded-xl bg-slate-800 hover:bg-rose-900/60 border border-slate-700 text-rose-300 text-xs transition-colors cursor-pointer"
                  title="หยุดเสียงพูด"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Dialogue Text Content with Tail bubble styling */}
          <div className="bg-slate-950/70 border border-slate-700/70 rounded-2xl p-3.5 md:p-4 relative">
            <p className="text-sm md:text-base text-slate-100 font-medium leading-relaxed">
              "{dialogueText}"
            </p>

            {/* Visual audio equalizer waves when speaking */}
            {isSpeaking && (
              <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-800 text-amber-400 text-xs font-bold">
                <span className="text-[11px] text-slate-400 mr-1">กำลังบรรยายเสียง:</span>
                <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                <span className="w-1 h-2.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
