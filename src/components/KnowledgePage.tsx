import React, { useState } from 'react';
import { PRONOUN_CATEGORIES } from '../data/pronounKnowledge';
import { sound } from '../utils/soundEffects';
import { thaiSpeech } from '../utils/speechSynthesis';
import { TeacherCharacter } from './TeacherCharacter';
import { 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Play, 
  FileQuestion, 
  HelpCircle, 
  UserCheck, 
  Crosshair, 
  Users,
  Volume2,
  VolumeX,
  GraduationCap,
  Lightbulb,
  BookmarkCheck,
  Check
} from 'lucide-react';
import { PronounTypeId } from '../types';

interface KnowledgePageProps {
  onStartGame: () => void;
  onStartQuiz: () => void;
}

export const KnowledgePage: React.FC<KnowledgePageProps> = ({ onStartGame, onStartQuiz }) => {
  const [selectedCategory, setSelectedCategory] = useState<PronounTypeId>('purusa');
  const [playingSentenceIdx, setPlayingSentenceIdx] = useState<number | null>(null);
  const [isCategorySpeaking, setIsCategorySpeaking] = useState(false);
  const [activeKeywordPlaying, setActiveKeywordPlaying] = useState<string | null>(null);

  const activeCat = PRONOUN_CATEGORIES.find(c => c.id === selectedCategory) || PRONOUN_CATEGORIES[0];

  const getCategoryIcon = (id: PronounTypeId, className: string = "w-5 h-5") => {
    switch (id) {
      case 'purusa': return <UserCheck className={`${className} text-emerald-400`} />;
      case 'prichha': return <HelpCircle className={`${className} text-amber-400`} />;
      case 'niyama': return <Crosshair className={`${className} text-sky-400`} />;
      case 'aniyama': return <Sparkles className={`${className} text-violet-400`} />;
      case 'vibhaga': return <Users className={`${className} text-rose-400`} />;
    }
  };

  const getCategoryThemeColors = (id: PronounTypeId) => {
    switch (id) {
      case 'purusa': 
        return {
          glow: 'from-emerald-500/20 via-teal-500/20 to-slate-900',
          border: 'border-emerald-500/60',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          pill: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/30',
          accent: 'text-emerald-400',
          numBg: 'bg-emerald-500 text-slate-950',
        };
      case 'prichha':
        return {
          glow: 'from-amber-500/20 via-orange-500/20 to-slate-900',
          border: 'border-amber-500/60',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          pill: 'bg-amber-500/15 text-amber-200 border-amber-500/30 hover:bg-amber-500/30',
          accent: 'text-amber-400',
          numBg: 'bg-amber-500 text-slate-950',
        };
      case 'niyama':
        return {
          glow: 'from-sky-500/20 via-blue-500/20 to-slate-900',
          border: 'border-sky-500/60',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          pill: 'bg-sky-500/15 text-sky-200 border-sky-500/30 hover:bg-sky-500/30',
          accent: 'text-sky-400',
          numBg: 'bg-sky-500 text-slate-950',
        };
      case 'aniyama':
        return {
          glow: 'from-violet-500/20 via-purple-500/20 to-slate-900',
          border: 'border-violet-500/60',
          badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
          pill: 'bg-violet-500/15 text-violet-200 border-violet-500/30 hover:bg-violet-500/30',
          accent: 'text-violet-400',
          numBg: 'bg-violet-500 text-slate-950',
        };
      case 'vibhaga':
        return {
          glow: 'from-rose-500/20 via-pink-500/20 to-slate-900',
          border: 'border-rose-500/60',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          pill: 'bg-rose-500/15 text-rose-200 border-rose-500/30 hover:bg-rose-500/30',
          accent: 'text-rose-400',
          numBg: 'bg-rose-500 text-slate-950',
        };
    }
  };

  const theme = getCategoryThemeColors(selectedCategory);

  // Play spoken sentence with speech sound effect
  const handleSpeakSentence = (sentence: string, idx: number) => {
    sound.playSpeechChime();
    setPlayingSentenceIdx(idx);
    thaiSpeech.speak(sentence, {
      rate: 0.95,
      pitch: 1.0,
      onStart: () => setPlayingSentenceIdx(idx),
      onEnd: () => setPlayingSentenceIdx(null),
    });
  };

  // Play keyword pronunciation
  const handleSpeakKeyword = (keyword: string) => {
    sound.playSpeechChime();
    setActiveKeywordPlaying(keyword);
    thaiSpeech.speak(`คำว่า ${keyword}`, {
      rate: 0.9,
      pitch: 1.05,
      onStart: () => setActiveKeywordPlaying(keyword),
      onEnd: () => setActiveKeywordPlaying(null),
    });
  };

  // Speak category name & definition
  const handleSpeakCategory = () => {
    sound.playSpeechChime();
    setIsCategorySpeaking(true);
    const speechText = `${activeCat.name} คือ ${activeCat.definition}`;
    thaiSpeech.speak(speechText, {
      rate: 0.95,
      pitch: 1.05,
      onStart: () => setIsCategorySpeaking(true),
      onEnd: () => setIsCategorySpeaking(false),
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header Banner - Clean, Majestic & without number 2 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs md:text-sm font-bold shadow-sm">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>หลักไวยากรณ์ไทย : บรรทัดฐานภาษาไทย เล่ม ๓</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>เนื้อหาครบ ๕ ชนิดมาตรฐาน</span>
            </div>
          </div>

          {/* Majestic Title without number 2 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <GraduationCap className="w-7 h-7 md:w-9 md:h-9 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">
                ตำราคำสรรพนาม
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-amber-300 font-medium mt-1">
                คลังความรู้คำสรรพนาม ๕ ชนิด พร้อมตัวอย่างประโยคและเสียงพูดประกอบการเรียนรู้
              </p>
            </div>
          </div>

          {/* Definition Quote Card */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-700/80 text-sm md:text-base text-slate-200 leading-relaxed">
            <strong className="text-amber-300">คำสรรพนาม (Pronoun) คือ</strong>{' '}
            คำที่ใช้แทนนามหรือนามวลีที่กล่าวถึงมาแล้วหรือเป็นที่เข้าใจกันระหว่างผู้พูดกับผู้ฟัง เพื่อไม่ต้องกล่าวคำนามนั้นซ้ำซาก ทำหน้าที่เป็นส่วนหลักของนามวลีได้เช่นเดียวกับคำนาม แบ่งเป็น{' '}
            <span className="text-emerald-400 font-extrabold underline decoration-emerald-500/50 underline-offset-4">
              ๕ ชนิด
            </span>{' '}
            ตามหน้าที่และความหมาย
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                sound.playClick();
                onStartGame();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              เข้าเล่นเกมยิงหนังสติ๊ก (๓ นาที)
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onStartQuiz();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <FileQuestion className="w-4 h-4" />
              ทำแบบทดสอบ ๓๐ ข้อ
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Character: Teacher Kru Way (ครูเวย์) with Voice Audio */}
      <TeacherCharacter
        categoryName={activeCat.name}
        categoryTip={activeCat.tips}
        mood="teaching"
      />

      {/* 3. Category Selection Tabs (5 Types - High Visual Impact & Distinct Headings) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            เลือกศึกษาหัวข้อคำสรรพนาม (๕ ชนิด)
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            คลิกเลือกหมวดเพื่อดูตัวอย่างและฟังเสียงพูด
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
          {PRONOUN_CATEGORIES.map((cat, idx) => {
            const isSelected = selectedCategory === cat.id;
            const itemTheme = getCategoryThemeColors(cat.id);

            return (
              <button
                key={cat.id}
                id={`cat-tab-${cat.id}`}
                onClick={() => {
                  sound.playClick();
                  setSelectedCategory(cat.id);
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${itemTheme.border} bg-slate-900 shadow-xl shadow-amber-500/10 scale-[1.02] ring-2 ring-amber-400/40`
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Top: Thai numeral badge & Icon */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center shadow-sm ${
                    isSelected ? itemTheme.numBg : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {cat.number}
                  </span>
                  {getCategoryIcon(cat.id, 'w-5 h-5')}
                </div>

                {/* Center: Distinctive Category Title */}
                <div>
                  <div className={`font-black text-sm md:text-base leading-snug ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}>
                    {cat.shortName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {cat.keywords.slice(0, 3).join(', ')}
                  </div>
                </div>

                {/* Bottom Active Indicator Bar */}
                {isSelected && (
                  <div className={`h-1 w-full rounded-full mt-2.5 bg-gradient-to-r ${
                    cat.id === 'purusa' ? 'from-emerald-400 to-teal-400' :
                    cat.id === 'prichha' ? 'from-amber-400 to-orange-400' :
                    cat.id === 'niyama' ? 'from-sky-400 to-blue-400' :
                    cat.id === 'aniyama' ? 'from-violet-400 to-purple-400' :
                    'from-rose-400 to-pink-400'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Pronoun Category Content Section (Revamped, High Contrast & Speech Audio) */}
      <div className={`p-6 md:p-8 rounded-3xl border-2 ${theme.border} bg-gradient-to-b ${theme.glow} backdrop-blur-md shadow-2xl space-y-6 transition-all`}>
        
        {/* Prominent Category Header with Audio Narration Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/80 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${theme.badge}`}>
                ชนิดที่ {activeCat.number} ในไวยากรณ์ไทย
              </span>
              <span className="text-xs text-slate-400">• คำสรรพนาม</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-md">
                {getCategoryIcon(activeCat.id, "w-7 h-7 md:w-8 md:h-8")}
              </div>
              <span className="tracking-tight">{activeCat.name}</span>
            </h2>
          </div>

          {/* Voice Narration Button for Active Category */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleSpeakCategory}
              disabled={isCategorySpeaking}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-amber-400/50 text-amber-300 hover:text-amber-200 text-xs md:text-sm font-black flex items-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
              title="ฟังเสียงบรรยายหัวข้อนี้"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>{isCategorySpeaking ? 'กำลังเล่นเสียง...' : 'ฟังเสียงอ่านหัวข้อนี้'}</span>
            </button>
            {isCategorySpeaking && (
              <button
                onClick={() => {
                  thaiSpeech.stop();
                  setIsCategorySpeaking(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 border border-slate-700 text-rose-300 transition-colors cursor-pointer"
                title="หยุดเสียง"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Definition Card */}
        <div className="bg-slate-900/85 p-5 md:p-6 rounded-2xl border border-slate-700/80 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              คำจำกัดความตามหลักบรรทัดฐานภาษาไทย
            </h3>
          </div>
          <p className="text-slate-100 text-base md:text-lg leading-relaxed font-medium">
            {activeCat.definition}
          </p>
        </div>

        {/* Pronoun Keywords Chips (Interactive: Click to Hear Audio!) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              คำสรรพนามที่พบบ่อย (คลิกที่คำเพื่อฟังการออกเสียง)
            </span>
            <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              มีเสียงพูดทุกคำ
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeCat.keywords.map(kw => {
              const isKwPlaying = activeKeywordPlaying === kw;
              return (
                <button
                  key={kw}
                  onClick={() => handleSpeakKeyword(kw)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isKwPlaying
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105'
                      : `${theme.pill} active:scale-95`
                  }`}
                  title={`คลิกเพื่อฟังเสียงคำว่า "${kw}"`}
                >
                  <Volume2 className="w-3 h-3 opacity-70" />
                  <span>{kw}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subtypes Section (if any, e.g. บุรุษที่ ๑, ๒, ๓ or ต่าง, บ้าง, กัน) */}
        {activeCat.subTypes && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              การแบ่งประเภทย่อยตามหน้าที่และการใช้งาน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeCat.subTypes.map((sub, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-2.5 shadow-md hover:border-slate-600 transition-colors"
                >
                  <div className="font-extrabold text-amber-300 text-sm md:text-base flex items-center justify-between">
                    <span>{sub.name}</span>
                    <button
                      onClick={() => {
                        sound.playSpeechChime();
                        thaiSpeech.speak(`${sub.name}: ${sub.description}`);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title="ฟังเสียงหัวข้อย่อยนี้"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sub.description}
                  </p>
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">คำตัวอย่าง:</div>
                    <div className="flex flex-wrap gap-1">
                      {sub.examples.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => handleSpeakKeyword(ex)}
                          className="px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[11px] font-semibold text-teal-300 border border-slate-700/80 cursor-pointer"
                          title="คลิกเพื่อฟังเสียง"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example Sentences in Real Context with Audio Playback */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              ตัวอย่างประโยคในชีวิตจริงและการวิเคราะห์ (กดฟังเสียงได้)
            </h3>
            <span className="text-xs text-slate-400 hidden sm:inline">
              กดปุ่มลำโพงเพื่อฟังเสียงประโยค
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeCat.examples.map((ex, idx) => {
              const isPlayingThis = playingSentenceIdx === idx;
              return (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl bg-slate-900/70 border transition-all flex flex-col justify-between ${
                    isPlayingThis 
                      ? 'border-amber-400/80 bg-slate-900 ring-2 ring-amber-400/30 shadow-lg' 
                      : 'border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-400">
                        คำสรรพนาม: <span className="text-amber-300 font-extrabold">{ex.word}</span>
                      </div>
                      <button
                        onClick={() => handleSpeakSentence(ex.sentence, idx)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isPlayingThis
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-amber-300'
                        }`}
                        title="กดฟังเสียงอ่านประโยคนี้"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-sm font-medium text-white bg-slate-950/80 p-3 rounded-xl border border-slate-800 leading-snug">
                      "{ex.sentence}"
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      💡 {ex.explanation}
                    </p>
                  </div>

                  {isPlayingThis && (
                    <div className="mt-2 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      กำลังเล่นเสียงประโยค...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Crucial Tips and Memory Tricks */}
        <div className="bg-amber-500/10 border-2 border-amber-500/40 p-4 md:p-5 rounded-2xl flex items-start gap-3.5 text-amber-200 text-sm shadow-md">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="font-black text-amber-300 text-sm md:text-base flex items-center gap-2">
              <span>สูตรจำแม่นยำและข้อสังเกตจากครูเวย์:</span>
              <button
                onClick={() => {
                  sound.playSpeechChime();
                  thaiSpeech.speak(`สูตรจำแม่นยำจากครูเวย์: ${activeCat.tips}`);
                }}
                className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors cursor-pointer"
                title="ฟังเสียงอ่านเทคนิคนี้"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed">
              {activeCat.tips}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Special Comparison Box: สรรพนามถาม VS สรรพนามไม่ชี้เฉพาะ */}
      <div className="bg-slate-900/80 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            เปรียบเทียบข้อสอบยอดฮิต: "สรรพนามถาม" VS "สรรพนามไม่ชี้เฉพาะ"
          </h3>
          <button
            onClick={() => {
              sound.playSpeechChime();
              thaiSpeech.speak('เปรียบเทียบข้อสอบยอดฮิต สรรพนามถามใช้ในประโยคคำถามที่ต้องการคำตอบ ส่วนสรรพนามไม่ชี้เฉพาะใช้ในประโยคบอกเล่าหรือไม่เจาะจง ไม่ต้องการคำตอบครับ');
            }}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            ฟังเสียงสรุปเปรียบเทียบ
          </button>
        </div>

        <p className="text-xs md:text-sm text-slate-300">
          ทั้งสองชนิดใช้คำรูปเดียวกันคือ <strong className="text-amber-300">ใคร, อะไร, ไหน, ใด</strong> แต่มีข้อแตกต่างทางไวยากรณ์อย่างชัดเจน:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2">
            <div className="font-extrabold text-amber-300 text-base flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              คำสรรพนามถาม (ต้องการคำตอบ)
            </div>
            <ul className="text-xs md:text-sm text-slate-200 space-y-2">
              <li className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>อยู่ใน <strong>ประโยคคำถาม</strong> ที่มุ่งหวังคำตอบชัดเจน</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>ตัวอย่าง: <em>"ใครเขียนจดหมายฉบับนี้?"</em> (ตอบ: สมชาย)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>ตัวอย่าง: <em>"อะไรตกลงไปในน้ำ?"</em> (ตอบ: ลูกบอล)</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-violet-500/10 border-2 border-violet-500/30 space-y-2">
            <div className="font-extrabold text-violet-300 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              คำสรรพนามไม่ชี้เฉพาะ (ไม่ต้องการคำตอบ)
            </div>
            <ul className="text-xs md:text-sm text-slate-200 space-y-2">
              <li className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>อยู่ใน <strong>ประโยคบอกเล่า หรือ ปฏิเสธ</strong></span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span><strong>ไม่ต้องการคำตอบ</strong> และไม่ได้เจาะจงบุคคลหรือสิ่งใด</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>ตัวอย่าง: <em>"เขาจะพูดอะไร ก็เรื่องของเขา"</em></span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>ตัวอย่าง: <em>"เรื่องนี้เขาไม่ได้บอกใครเลย"</em></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 6. Footer Call-to-Action to Game or Quiz */}
      <div className="text-center p-6 md:p-8 bg-slate-900/80 rounded-3xl border-2 border-slate-800 shadow-xl space-y-4">
        <h4 className="text-xl font-extrabold text-white">พร้อมลงสนามประลองความรู้แล้วหรือยัง?</h4>
        <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          นำความรู้เรื่องคำสรรพนาม ๕ ชนิด ไปทดสอบความแม่นยำในเกมยิงหนังสติ๊ก (จับเวลา ๓ นาที) หรือแบบทดสอบจัดเต็ม ๓๐ ข้อกันเลย!
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 pt-1">
          <button
            onClick={() => {
              sound.playClick();
              onStartGame();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            เข้าเล่นเกมยิงหนังสติ๊ก (๓ นาที)
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onStartQuiz();
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <FileQuestion className="w-4 h-4" />
            ทำแบบทดสอบ ๓๐ ข้อ
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
