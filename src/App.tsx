/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SlingshotGame } from './components/SlingshotGame';
import { KnowledgePage } from './components/KnowledgePage';
import { PronounQuiz } from './components/PronounQuiz';
import { LeaderboardModal } from './components/LeaderboardModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { INITIAL_LEADERBOARD } from './data/pronounKnowledge';
import { ScoreRecord, UserProfile } from './types';
import { sound } from './utils/soundEffects';
import { 
  testFirebaseConnection, 
  saveScoreToFirestore, 
  subscribeToGlobalLeaderboard, 
  clearFirestoreScores 
} from './lib/firebase';
import { 
  Gamepad2, 
  BookOpen, 
  FileQuestion, 
  Trophy, 
  User, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Music, 
  Sparkles,
  Timer,
  Smartphone,
  RotateCcw
} from 'lucide-react';

type TabView = 'game' | 'knowledge' | 'quiz';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>('game');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // User Profile: starts empty so the player is prompted to type their name first
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('pronoun_player_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) {
          return {
            name: parsed.name.trim(),
            avatar: '',
            soundEnabled: true,
            bgmEnabled: true,
          };
        }
      }
    } catch {}
    return {
      name: '',
      avatar: '',
      soundEnabled: true,
      bgmEnabled: true,
    };
  });

  // Track whether player has entered/confirmed their name in this session
  // Initialized to false so on page load / app entry it ALWAYS pops up to enter player name first!
  const [hasConfirmedNameInSession, setHasConfirmedNameInSession] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(true);

  // Mobile Device & Orientation Detection
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissedOrientationPrompt, setDismissedOrientationPrompt] = useState(false);

  useEffect(() => {
    const handleOrientation = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 850;
      const isMobile = isTouch || isSmallScreen;
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobileDevice(isMobile);
      setIsPortrait(portrait);
    };

    handleOrientation();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Sound toggles
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);

  // Scores - starts empty or cleaned of any mock avatar scores
  const [scores, setScores] = useState<ScoreRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pronoun_player_scores');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Thoroughly wipe out any mock avatar/seed records
          const cleaned = parsed.filter(
            (s: any) =>
              !s.id?.startsWith?.('seed-') &&
              s.playerName !== 'น้องพลอย เก่งไทย' &&
              s.playerName !== 'ต้นกล้า นักแม่นปืน' &&
              s.playerName !== 'ด.ญ. มานี มีปัญญา' &&
              s.playerName !== 'ด.ช. ปิติ รักเรียน'
          );
          // Persist the cleaned version back immediately
          localStorage.setItem('pronoun_player_scores', JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch {}
    return [];
  });

  // Save profile changes (name only, no avatar)
  const handleSaveProfile = (name: string, targetTab?: TabView) => {
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim() || 'ผู้เล่นคนเก่ง',
      avatar: '',
    };
    setUserProfile(updated);
    setHasConfirmedNameInSession(true);
    setIsProfileOpen(false);
    try {
      localStorage.setItem('pronoun_player_profile', JSON.stringify(updated));
    } catch {}

    if (targetTab) {
      setActiveTab(targetTab);
    }

    // Auto-start energetic BGM upon entering name
    if (bgmEnabled) {
      sound.startBgm();
    }
  };

  // Real-time Cloud Sync with Firebase Firestore
  useEffect(() => {
    // 1. Verify Firestore connectivity on boot
    testFirebaseConnection().catch(() => {});

    // 2. Real-time subscription to global leaderboard scores
    const unsubscribe = subscribeToGlobalLeaderboard((cloudScores) => {
      if (cloudScores && cloudScores.length > 0) {
        setScores(prev => {
          // Merge unique scores by id, prioritizing latest data
          const map = new Map<string, ScoreRecord>();
          // Put previous scores
          prev.forEach(s => map.set(s.id, s));
          // Overwrite/insert cloud scores
          cloudScores.forEach(s => map.set(s.id, s));
          const merged = Array.from(map.values());
          try {
            localStorage.setItem('pronoun_player_scores', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Record score (Persisted both locally and to global Firebase Firestore)
  const handleRecordScore = (record: ScoreRecord) => {
    setScores(prev => {
      const updated = [record, ...prev.filter(s => s.id !== record.id)];
      try {
        localStorage.setItem('pronoun_player_scores', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Upload to Firebase for worldwide players
    saveScoreToFirestore(record).catch(err => {
      console.warn('Firebase sync deferred:', err);
    });
  };

  // Clear scores (Clears both local storage and cloud database with passcode 237280)
  const handleClearScores = () => {
    setScores([]);
    try {
      localStorage.removeItem('pronoun_player_scores');
      localStorage.setItem('pronoun_player_scores', JSON.stringify([]));
    } catch {}

    // Clear cloud records
    clearFirestoreScores().catch(err => {
      console.warn('Firebase cloud clear deferred:', err);
    });
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {});
      }
    }
  };

  // Track fullscreen change event
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Background music management
  useEffect(() => {
    const startAudioOnGesture = () => {
      if (bgmEnabled && userProfile.name) {
        sound.startBgm();
      }
      window.removeEventListener('pointerdown', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
    };
    window.addEventListener('pointerdown', startAudioOnGesture, { once: true });
    window.addEventListener('keydown', startAudioOnGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
    };
  }, [bgmEnabled, userProfile.name]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setMuted(!next);
  };

  const toggleBgm = () => {
    const next = !bgmEnabled;
    setBgmEnabled(next);
    sound.setBgmMuted(!next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-xl md:text-2xl shadow-lg shadow-amber-500/20">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base md:text-xl text-white tracking-tight flex items-center gap-1.5">
                  เกมยิงหนังสติ๊ก <span className="text-amber-400">คำสรรพนาม ๕ ชนิด</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>บรรทัดฐานภาษาไทย เล่ม ๓</span>
                <span>•</span>
                <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Powered by Kruwaybiig
                </span>
              </div>
            </div>
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2">
            {/* Player Name Badge (No Avatar, click to rename) */}
            <button
              onClick={() => {
                sound.playClick();
                setIsProfileOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              title="คลิกเพื่อแก้ไขชื่อผู้เล่น"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[120px]">
                {userProfile.name || 'พิมพ์ชื่อผู้เล่น'}
              </span>
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsLeaderboardOpen(true);
              }}
              className="p-2 md:px-3 md:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ตารางจัดอันดับคะแนน"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden md:inline">จัดอันดับ</span>
            </button>

            {/* Orientation Tip for Mobile in Portrait mode */}
            {isMobileDevice && isPortrait && activeTab === 'game' && (
              <button
                onClick={() => setDismissedOrientationPrompt(false)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-sm hover:bg-amber-500/30 transition-all cursor-pointer"
                title="คลิกดูคำแนะนำการหมุนแนวนอน"
              >
                <Smartphone className="w-3.5 h-3.5 rotate-90 text-amber-400" />
                <span className="hidden xs:inline">หมุนแนวนอน</span>
              </button>
            )}

            {/* BGM Audio Toggle */}
            <button
              onClick={toggleBgm}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                bgmEnabled
                  ? 'bg-slate-800 text-amber-400 border-amber-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={bgmEnabled ? 'ปิดเพลงประกอบ (BGM)' : 'เปิดเพลงประกอบ (BGM)'}
            >
              <Music className="w-4 h-4" />
            </button>

            {/* SFX Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์ (SFX)' : 'เปิดเสียงเอฟเฟกต์ (SFX)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'ออกจากเต็มหน้าจอ' : 'แสดงเต็มหน้าจอ'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-2">
          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 max-w-xl mx-auto">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('game');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'game'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>เกมยิงหนังสติ๊ก (๓ นาที)</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('knowledge');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'knowledge'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>อ่านตำรา / คลังความรู้</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('quiz');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <FileQuestion className="w-4 h-4" />
              <span>แบบทดสอบ (๓๐ ข้อ หลากหลาย)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className={`flex-1 max-w-6xl w-full mx-auto ${activeTab === 'game' ? 'px-1 sm:px-4 py-1 sm:py-3' : 'px-4 py-6'}`}>
        {activeTab === 'game' && (
          <SlingshotGame
            playerName={userProfile.name}
            avatar=""
            onOpenKnowledge={() => setActiveTab('knowledge')}
            onOpenQuiz={() => setActiveTab('quiz')}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onRecordScore={handleRecordScore}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgePage
            onStartGame={() => setActiveTab('game')}
            onStartQuiz={() => setActiveTab('quiz')}
          />
        )}

        {activeTab === 'quiz' && (
          <PronounQuiz
            playerName={userProfile.name}
            avatar=""
            onOpenKnowledge={() => setActiveTab('knowledge')}
            onOpenGame={() => setActiveTab('game')}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onRecordScore={handleRecordScore}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-5 text-center text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center justify-center gap-2 font-bold text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>สื่อการเรียนรู้ภาษาไทย • Powered by Kruwaybiig</span>
        </div>
        <p className="text-slate-400 max-w-md mx-auto px-4">
          ชนิดของคำ : บรรทัดฐานภาษาไทย เล่ม ๓ (๑. บุรุษสรรพนาม ๒. คำสรรพนามถาม ๓. คำสรรพนามชี้เฉพาะ ๔. คำสรรพนามไม่ชี้เฉพาะ ๕. คำสรรพนามแยกฝ่าย)
        </p>
      </footer>

      {/* Mobile Landscape Orientation Recommendation Modal */}
      {isMobileDevice && isPortrait && !dismissedOrientationPrompt && activeTab === 'game' && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-400/90 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-amber-400 animate-pulse rotate-90" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black mb-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>คำแนะนำสำหรับโทรศัพท์</span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-white">
                หมุนหน้าจอเป็นแนวนอน 🔄
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                แนะนำให้เปิด <span className="text-amber-300 font-bold">หมุนหน้าจออัตโนมัติ (Auto-Rotate)</span> แล้วหมุนโทรศัพท์เป็น <span className="text-amber-400 font-extrabold">แนวนอน (Landscape)</span> เพื่อให้สนามกว้างเต็มจอ เห็นห่วงคำสรรพนามทั้ง ๕ ครบถ้วน และเล็งยิงได้แม่นยำไม่โดนบังครับ
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  sound.playClick();
                  setDismissedOrientationPrompt(true);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>หมุนแนวนอนแล้ว / เริ่มเล่น</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setDismissedOrientationPrompt(true);
                }}
                className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                เล่นต่อในแนวตั้ง (ย่อส่วน)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        scores={scores}
        onClearScores={handleClearScores}
      />

      {/* Player Name Entry / Edit Modal */}
      <PlayerProfileModal
        isOpen={!hasConfirmedNameInSession || isProfileOpen}
        onClose={hasConfirmedNameInSession ? () => setIsProfileOpen(false) : undefined}
        currentName={userProfile.name}
        onSave={handleSaveProfile}
        isInitialPrompt={!hasConfirmedNameInSession}
      />
    </div>
  );
}
