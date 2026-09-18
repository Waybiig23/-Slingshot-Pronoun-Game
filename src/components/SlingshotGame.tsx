import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PRONOUN_CATEGORIES, SLINGSHOT_WORD_POOL } from '../data/pronounKnowledge';
import { sound } from '../utils/soundEffects';
import { thaiSpeech } from '../utils/speechSynthesis';
import { PronounTypeId, ScoreRecord, SlingshotWord } from '../types';
import { 
  Heart, 
  RotateCcw, 
  Sparkles, 
  Trophy, 
  Flame, 
  Crosshair,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  ArrowRight,
  Target,
  Timer,
  User,
  Play,
  BookOpen,
  FileQuestion,
  HelpCircle,
  Maximize,
  Minimize,
  Zap,
  Star
} from 'lucide-react';

interface SlingshotGameProps {
  playerName: string;
  avatar: string;
  onOpenKnowledge: () => void;
  onOpenQuiz: () => void;
  onOpenLeaderboard: () => void;
  onRecordScore: (record: ScoreRecord) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export const SlingshotGame: React.FC<SlingshotGameProps> = ({
  playerName,
  avatar,
  onOpenKnowledge,
  onOpenQuiz,
  onOpenLeaderboard,
  onRecordScore,
}) => {
  // Game session states
  const [wordsQueue, setWordsQueue] = useState<SlingshotWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes per round
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
    explanation: string;
    categoryName: string;
  } | null>(null);

  // Arena measurement and responsive layout
  const arenaRef = useRef<HTMLDivElement>(null);
  const [arenaDimensions, setArenaDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      const isLand = window.innerWidth > window.innerHeight && window.innerHeight <= 520;
      return {
        width: Math.min(window.innerWidth || 800, 960),
        height: isLand ? Math.max(200, window.innerHeight - 70) : Math.min(window.innerHeight || 500, 520),
      };
    }
    return { width: 800, height: 500 };
  });

  // Slingshot interactive drag states
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // offset in px from anchor
  const [isFlying, setIsFlying] = useState(false);
  const [projectilePos, setProjectilePos] = useState({ x: 0, y: 0 });
  const [projectileAngle, setProjectileAngle] = useState(0);
  const [targetHoopId, setTargetHoopId] = useState<PronounTypeId | null>(null);
  const [hoveredAimedHoopId, setHoveredAimedHoopId] = useState<PronounTypeId | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [trailDots, setTrailDots] = useState<{ x: number; y: number; id: number }[]>([]);
  const [animatingHoop, setAnimatingHoop] = useState<{ id: PronounTypeId; isCorrect: boolean } | null>(null);
  const [soundMuted, setSoundMuted] = useState(sound.getIsMuted());

  // Floating score popups over target hoops
  const [floatingScores, setFloatingScores] = useState<{
    id: number;
    x: number;
    y: number;
    points: number;
    multiplier: number;
    isCombo: boolean;
  }[]>([]);
  const [lastGainedPoints, setLastGainedPoints] = useState<{ points: number; id: number } | null>(null);

  // Fullscreen state and handler (supports both CSS-overlay fullscreen and browser fullscreen API)
  // Auto-activates on mobile landscape to give the maximum visible playground without scrollbar clipping
  const [isGameFullscreen, setIsGameFullscreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight && window.innerHeight <= 520;
    }
    return false;
  });

  const toggleGameFullscreen = () => {
    sound.playClick();
    setIsGameFullscreen(prev => {
      const next = !prev;
      if (next) {
        if (!document.fullscreenElement && document.documentElement?.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  // Mobile landscape detection
  const isLandscapeMobile =
    (arenaDimensions.height > 0 && arenaDimensions.height < 460 && arenaDimensions.width > arenaDimensions.height * 1.25) ||
    (typeof window !== 'undefined' && window.innerHeight <= 500 && window.innerWidth > window.innerHeight);

  const isCompactHeight = isLandscapeMobile || arenaDimensions.height < 540 || arenaDimensions.width < 680;

  // Auto-enter dedicated full-screen play view when user starts playing or enters landscape mobile
  useEffect(() => {
    if (isPlaying && !isGameFullscreen) {
      setIsGameFullscreen(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    const checkLandscape = () => {
      if (window.innerWidth > window.innerHeight && window.innerHeight <= 520) {
        setIsGameFullscreen(true);
      }
    };
    checkLandscape();
    window.addEventListener('orientationchange', checkLandscape);
    return () => window.removeEventListener('orientationchange', checkLandscape);
  }, []);

  // Slingshot Anchor coordinates (bottom-center of arena)
  // Ensure the slingshot is NEVER offscreen or clipped, regardless of orientation or container changes
  const slingshotBottomOffset = isLandscapeMobile ? 48 : isCompactHeight ? 64 : 96;
  const minSlingshotY = isLandscapeMobile ? 95 : 120;
  const maxSlingshotY = Math.max(minSlingshotY, arenaDimensions.height - (isLandscapeMobile ? 38 : 48));

  const slingshotAnchor = {
    x: arenaDimensions.width * 0.5,
    y: Math.min(
      Math.max(arenaDimensions.height - slingshotBottomOffset, minSlingshotY),
      maxSlingshotY
    ),
  };

  // Robust native ResizeObserver to track container size accurately across layout, orientation, and fullscreen toggles
  useEffect(() => {
    const arenaEl = arenaRef.current;
    if (!arenaEl) return;

    let rafId: number | null = null;
    const updateSize = () => {
      if (!arenaRef.current) return;
      const rect = arenaRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setArenaDimensions(prev => {
          if (Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1) {
            return prev;
          }
          return { width: rect.width, height: rect.height };
        });
      }
    };

    updateSize();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateSize);
      });
      observer.observe(arenaEl);
    }

    const handleWindowChange = () => {
      updateSize();
      // Handle mobile browser orientation reflow delays
      setTimeout(updateSize, 60);
      setTimeout(updateSize, 200);
      setTimeout(updateSize, 400);
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('orientationchange', handleWindowChange);

    return () => {
      if (observer) observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('orientationchange', handleWindowChange);
    };
  }, [isGameFullscreen]);

  // Initialize randomized game queue
  const initGame = useCallback((autoStart = false) => {
    const shuffled = [...SLINGSHOT_WORD_POOL].sort(() => 0.5 - Math.random());
    setWordsQueue(shuffled); // Full continuous queue (unlimited words during 3-minute session)
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setHighestStreak(0);
    setLives(3);
    setTimeRemaining(180); // 3 minutes = 180 seconds
    setIsGameOver(false);
    setIsGameWon(false);
    setFeedback(null);
    setIsFlying(false);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setParticles([]);
    setTrailDots([]);
    setIsPlaying(autoStart);
  }, []);

  useEffect(() => {
    initGame(false);
  }, [initGame]);

  // Game timer countdown (3 minutes = 180 seconds) - Only runs when isPlaying is true
  useEffect(() => {
    if (!isPlaying || isGameOver || isGameWon) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndSession(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, isGameWon]);

  // Current active word
  const currentWord = wordsQueue[currentIndex];

  // End session handler
  const handleEndSession = useCallback((won: boolean) => {
    setIsGameOver(!won);
    setIsGameWon(won);
    setIsPlaying(false);

    const calculatedStars = won && score >= 1600 ? 3 : score >= 900 ? 2 : 1;

    onRecordScore({
      id: 'score-' + Date.now(),
      playerName: playerName || 'ผู้เล่นนิรนาม',
      avatar: '',
      score,
      maxScore: 2500,
      timeSpentSec: Math.max(1, 180 - timeRemaining),
      streak: highestStreak,
      mode: 'game',
      date: 'วันนี้',
      stars: calculatedStars,
    });

    if (won || score >= 800) {
      sound.playFanfare();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } else {
      sound.playWrong();
    }
  }, [score, highestStreak, timeRemaining, playerName, avatar, onRecordScore]);

  // Particle explosion update
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.05,
          }))
          .filter(p => p.alpha > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [particles.length]);

  const spawnParticles = (x: number, y: number, color: string) => {
    const count = 22;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 3 + Math.random() * 6;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 5 + Math.random() * 6,
        alpha: 1,
      });
    }
    setParticles(newParticles);
  };

  // Target Hoops positions (arranged horizontally across the top of the arena)
  const getHoopPosition = useCallback((catIndex: number) => {
    const totalHoops = PRONOUN_CATEGORIES.length; // 5
    const width = arenaDimensions.width || 800;
    const height = arenaDimensions.height || 600;
    const isCompact = height < 540 || width < 680;
    const isUltraNarrow = width < 440;

    // Distribute 5 hoops horizontally across the top with responsive margins
    const marginX = isUltraNarrow ? 22 : isCompact ? 30 : Math.max(48, width * 0.08);
    const availableWidth = width - marginX * 2;
    const stepX = availableWidth / (totalHoops - 1);
    const hoopX = marginX + catIndex * stepX;

    // Gentle upward arch: center hoops are slightly higher
    const arch = Math.sin((catIndex / (totalHoops - 1)) * Math.PI) * (isCompact ? 4 : 10);
    const baseHoopY = isCompact ? 22 : 44;
    const hoopY = baseHoopY - arch;

    return { x: hoopX, y: hoopY };
  }, [arenaDimensions]);

  // Determine closest target hoop based on drag angle & offset (bottom-to-top shooting)
  const getAimTargetHoop = useCallback((dx: number, dy: number): PronounTypeId => {
    // When dragged backward/down (dy > 0), launch vector is (-dx, -dy) pointing UP into upper half-plane
    const launchAngle = Math.atan2(-dy, -dx);

    let closestCatId = PRONOUN_CATEGORIES[2].id; // default center (index 2: นิยมสรรพนาม)
    let minDiff = 999;

    PRONOUN_CATEGORIES.forEach((cat, idx) => {
      const pos = getHoopPosition(idx);
      const targetAngle = Math.atan2(pos.y - slingshotAnchor.y, pos.x - slingshotAnchor.x);
      const diff = Math.abs(launchAngle - targetAngle);
      if (diff < minDiff) {
        minDiff = diff;
        closestCatId = cat.id;
      }
    });

    return closestCatId;
  }, [getHoopPosition, slingshotAnchor]);

  // Launch projectile toward target hoop in an upward vertical parabolic arc
  const launchAtHoop = (targetId: PronounTypeId) => {
    if (!isPlaying || isFlying || isGameOver || isGameWon || !currentWord) return;

    sound.playSwoosh();
    setIsFlying(true);
    setTargetHoopId(targetId);

    const catIndex = PRONOUN_CATEGORIES.findIndex(c => c.id === targetId);
    const hoopTarget = getHoopPosition(catIndex >= 0 ? catIndex : 2);

    const startX = slingshotAnchor.x + dragOffset.x;
    const startY = slingshotAnchor.y + dragOffset.y;
    const targetX = hoopTarget.x;
    const targetY = hoopTarget.y;

    // Flight animation parameters
    const startTime = performance.now();
    const duration = 520; // ms travel time
    const arcHeight = Math.min(45, Math.abs(targetY - startY) * 0.1); // Upward parabolic loft

    const animateFlight = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Horizontal linear interpolation
      const currentX = startX + (targetX - startX) * progress;
      // Vertical trajectory: startY -> targetY with lofted arc
      const arc = arcHeight * 4 * progress * (1 - progress);
      const currentY = startY + (targetY - startY) * progress - arc;

      // Calculate tangent angle for bullet rotation
      const nextProgress = Math.min(1, progress + 0.02);
      const nextX = startX + (targetX - startX) * nextProgress;
      const nextY = startY + (targetY - startY) * nextProgress - (arcHeight * 4 * nextProgress * (1 - nextProgress));
      const angleDeg = Math.atan2(nextY - currentY, nextX - currentX) * (180 / Math.PI);

      setProjectilePos({ x: currentX, y: currentY });
      setProjectileAngle(angleDeg);

      // Add smoke/spark trail dots
      if (Math.random() > 0.4) {
        setTrailDots(prev => [
          ...prev.slice(-12),
          { x: currentX, y: currentY, id: Math.random() },
        ]);
      }

      if (progress < 1) {
        requestAnimationFrame(animateFlight);
      } else {
        // Impact at target hoop!
        handleHitHoop(targetId, targetX, targetY);
      }
    };

    requestAnimationFrame(animateFlight);
  };

  // Process hit detection
  const handleHitHoop = (targetId: PronounTypeId, hoopX: number, hoopY: number) => {
    setIsFlying(false);
    setDragOffset({ x: 0, y: 0 });
    setProjectilePos({ x: 0, y: 0 });
    setTrailDots([]);

    const isCorrect = targetId === currentWord.targetTypeId;
    const targetCat = PRONOUN_CATEGORIES.find(c => c.id === targetId);
    const correctCat = PRONOUN_CATEGORIES.find(c => c.id === currentWord.targetTypeId);

    setAnimatingHoop({ id: targetId, isCorrect });
    setTimeout(() => setAnimatingHoop(null), 650);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > highestStreak) setHighestStreak(newStreak);

      // คะแนนเพิ่มทีละ 5 คะแนนเป็นฐาน พร้อมตัวคูณคอมโบ
      const basePoints = 5;
      const streakMultiplier = newStreak >= 5 ? 3 : newStreak >= 4 ? 2.4 : newStreak >= 3 ? 2 : newStreak >= 2 ? 1.4 : 1;
      const points = Math.round(basePoints * streakMultiplier);
      setScore(prev => prev + points);

      // สร้าง Floating Score ป๊อปอัปแสดงคะแนนและคอมโบที่ตัวห่วงทันที
      const fId = Date.now();
      setFloatingScores(prev => [
        ...prev,
        {
          id: fId,
          x: hoopX,
          y: hoopY,
          points,
          multiplier: streakMultiplier,
          isCombo: newStreak >= 2,
        },
      ]);
      setLastGainedPoints({ points, id: fId });
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(f => f.id !== fId));
      }, 1400);

      sound.playCorrect();
      sound.playYay();

      // Thai voice cheering sound effect ("เย้! ถูกต้องแล้วจ้า!")
      if (!sound.getIsMuted()) {
        const correctVoiceLines = newStreak >= 3
          ? [
              `สุดยอดมาก! คอมโบ ${newStreak} นัดติด ได้ ${points} คะแนน!`,
              `คอมโบไฟลุกแล้ว! บวก ${points} คะแนน!`,
              `เย้! เก่งสุดๆ เลย คอมโบ x${streakMultiplier}!`
            ]
          : [
              `เย้! ถูกต้องแล้วจ้า! ได้ ๕ คะแนน`,
              `เย้! ถูกต้อง เก่งมาก ได้ ${points} คะแนน!`,
              `ถูกต้องจ้า! ยอดเยี่ยมมาก บวก ๕ คะแนน!`,
              `เย้! ตอบถูก ได้คะแนนแล้ว!`
            ];
        const randomLine = correctVoiceLines[Math.floor(Math.random() * correctVoiceLines.length)];
        thaiSpeech.speak(randomLine, { rate: 1.1, pitch: 1.2 });
      }

      if (newStreak > 1) {
        sound.playCombo(newStreak);
      }

      spawnParticles(hoopX, hoopY, '#10b981');

      setFeedback({
        isCorrect: true,
        message: `ถูกต้อง! +${points} คะแนน ${newStreak >= 2 ? `(คอมโบ ${newStreak} นัด x${streakMultiplier} 🔥)` : ''}`,
        explanation: currentWord.explanation,
        categoryName: correctCat?.name || '',
      });
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      sound.playWrong();
      sound.playOops();

      // Thai encouraging voice sound effect ("ผิดเอาใหม่นะ!", "ยังไม่ถูก ลองใหม่นะ!")
      if (!sound.getIsMuted()) {
        const wrongVoiceLines = [
          'ยังไม่ถูกจ้า เอาใหม่นะ!',
          'ผิดแล้วจ้า ไม่เป็นไร ลองใหม่อีกทีนะ!',
          'ยังไม่ใช่จ้า สู้ๆ ลองใหม่นะ!',
          'เอาใหม่นะ ตั้งใจดูดีๆ จ้า!'
        ];
        const randomLine = wrongVoiceLines[Math.floor(Math.random() * wrongVoiceLines.length)];
        thaiSpeech.speak(randomLine, { rate: 1.05, pitch: 1.05 });
      }

      spawnParticles(hoopX, hoopY, '#ef4444');

      setFeedback({
        isCorrect: false,
        message: `ยังไม่ถูกจ้า! ตอบ "${targetCat?.shortName}"`,
        explanation: `คำตอบที่ถูกต้องคือ: ${correctCat?.name} (${currentWord.explanation})`,
        categoryName: correctCat?.name || '',
      });

      if (newLives <= 0) {
        setTimeout(() => handleEndSession(false), 1200);
        return;
      }
    }

    // Advance to next word
    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 >= wordsQueue.length) {
        // Words are unlimited during the 3 minutes! Replenish next batch
        const moreWords = [...SLINGSHOT_WORD_POOL].sort(() => 0.5 - Math.random());
        setWordsQueue(prev => [...prev, ...moreWords]);
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1800);
  };

  // Pointer drag event handlers for horizontal slingshot
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPlaying || isFlying || isGameOver || isGameWon) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isFlying) return;
    if (!arenaRef.current) return;

    const arenaRect = arenaRef.current.getBoundingClientRect();
    const currentMouseX = e.clientX - arenaRect.left;
    const currentMouseY = e.clientY - arenaRect.top;

    // Vector displacement from slingshot anchor at bottom
    let dx = currentMouseX - slingshotAnchor.x;
    let dy = currentMouseY - slingshotAnchor.y;

    // In bottom-up shooting, the player pulls BACKWARD/DOWN (dy should be positive)
    if (dy < -6) dy = -6;

    // Limit maximum stretch distance: smaller on compact so thumb never runs off screen
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = isLandscapeMobile ? 36 : isCompactHeight ? 50 : 95;
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    setDragOffset({ x: dx, y: dy });
    sound.playStretch(dist / maxDist);

    // Update the aimed hoop prediction (when pulled down sufficiently)
    if (dist > (isLandscapeMobile ? 8 : 10) && dy > 3) {
      const predictedHoop = getAimTargetHoop(dx, dy);
      setHoveredAimedHoopId(predictedHoop);
    } else {
      setHoveredAimedHoopId(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);

    const pullDist = Math.sqrt(dragOffset.x * dragOffset.x + dragOffset.y * dragOffset.y);

    // If pulled down sufficiently, launch upwards towards aimed hoop!
    if (pullDist > (isLandscapeMobile ? 10 : 14) && dragOffset.y > (isLandscapeMobile ? 4 : 5)) {
      const targetHoop = getAimTargetHoop(dragOffset.x, dragOffset.y);
      launchAtHoop(targetHoop);
    } else {
      // Release without enough pull => snap back
      setDragOffset({ x: 0, y: 0 });
      setHoveredAimedHoopId(null);
    }
  };

  // Trajectory points calculation for visible vertical parabolic curve
  const renderTrajectoryLine = () => {
    if (!isDragging || dragOffset.y < 8) return null;

    const activeAimedId = hoveredAimedHoopId || PRONOUN_CATEGORIES[2].id;
    const catIndex = PRONOUN_CATEGORIES.findIndex(c => c.id === activeAimedId);
    const hoopTarget = getHoopPosition(catIndex >= 0 ? catIndex : 2);

    const startX = slingshotAnchor.x + dragOffset.x;
    const startY = slingshotAnchor.y + dragOffset.y;
    const targetX = hoopTarget.x;
    const targetY = hoopTarget.y;
    const arcHeight = Math.min(45, Math.abs(targetY - startY) * 0.1);

    // Generate points along the trajectory curve
    const steps = 20;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const px = startX + (targetX - startX) * p;
      const py = startY + (targetY - startY) * p - arcHeight * 4 * p * (1 - p);
      points.push({ x: px, y: py });
    }

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    return (
      <g className="trajectory-group pointer-events-none">
        {/* Glowing Wide Glow Path */}
        <path
          d={pathD}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="6"
          strokeOpacity="0.25"
          strokeLinecap="round"
        />
        {/* Core Dashed Animated Arc */}
        <path
          d={pathD}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3"
          strokeDasharray="8 6"
          strokeLinecap="round"
          className="animate-pulse"
        />

        {/* Trajectory Guide Dots along the curve */}
        {points.filter((_, i) => i % 2 === 0).map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={2.5 + (i * 0.3)}
            fill="#38bdf8"
            className="animate-ping"
            style={{ animationDuration: `${1.2 + i * 0.1}s` }}
          />
        ))}

        {/* Target Reticle Indicator at target hoop */}
        <g transform={`translate(${targetX}, ${targetY})`}>
          <circle r="24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" className="animate-spin" />
          <circle r="6" fill="#ef4444" />
          <text
            x="-42"
            y="-32"
            fill="#fef08a"
            fontSize="12"
            fontWeight="bold"
            className="bg-slate-900/80 px-2 py-0.5 rounded shadow"
          >
            🎯 ล็อคเป้า
          </text>
        </g>
      </g>
    );
  };

  // Wooden slingshot fork coordinates (bottom-center facing upward)
  const forkBaseX = slingshotAnchor.x;
  const forkBaseY = arenaDimensions.height - (isLandscapeMobile ? 4 : isCompactHeight ? 6 : 14);
  const prongSpread = isLandscapeMobile ? 15 : isCompactHeight ? 18 : 28;
  const prongElevation = isLandscapeMobile ? 11 : isCompactHeight ? 15 : 24;
  const forkProngLeft = { x: slingshotAnchor.x - prongSpread, y: slingshotAnchor.y - prongElevation };
  const forkProngRight = { x: slingshotAnchor.x + prongSpread, y: slingshotAnchor.y - prongElevation };
  const pouchPos = {
    x: isFlying ? projectilePos.x : slingshotAnchor.x + dragOffset.x,
    y: isFlying ? projectilePos.y : slingshotAnchor.y + dragOffset.y,
  };

  return (
    <div className={isGameFullscreen ? 'fixed inset-0 z-50 p-1 sm:p-2 bg-slate-950 flex flex-col h-[100dvh] w-screen overflow-hidden select-none' : 'w-full max-w-5xl mx-auto space-y-2'}>
      {/* HUD Header Bar: Ultra-slim, responsive single-line layout */}
      <div className={`bg-slate-900/95 border border-slate-700/80 rounded-xl sm:rounded-2xl ${isCompactHeight ? 'px-2 py-1' : 'px-3 py-1.5 md:p-3'} backdrop-blur-md flex items-center justify-between gap-1.5 sm:gap-2 shadow-lg shrink-0`}>
        {/* Left: Player Mini Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-sm shrink-0">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div className="hidden xs:block max-w-[65px] sm:max-w-[120px] truncate font-extrabold text-[11px] sm:text-xs md:text-sm text-white">
            {playerName || 'ผู้เล่น'}
          </div>
        </div>

        {/* Center: Game Stats (Timer, Score (+5), Combo, Lives) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 bg-slate-950/80 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-slate-800 shadow-inner">
          {/* Timer */}
          <div className="flex items-center gap-1 text-[11px] sm:text-sm md:text-base font-black font-mono">
            <Timer className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${timeRemaining <= 30 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className={timeRemaining <= 30 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}>
              {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="w-px h-3.5 sm:h-4 bg-slate-800" />

          {/* Score */}
          <div className="flex items-center gap-1 text-[11px] sm:text-sm md:text-base font-black text-amber-400 font-mono">
            <span className="text-[9px] text-amber-300 font-bold hidden sm:inline">คะแนน:</span>
            <span>{score}</span>
            {lastGainedPoints && (
              <span key={lastGainedPoints.id} className="animate-bounce text-[8px] sm:text-[9px] font-black px-1 rounded bg-amber-400 text-slate-950">
                +{lastGainedPoints.points}
              </span>
            )}
          </div>

          <div className="w-px h-3.5 sm:h-4 bg-slate-800" />

          {/* Streak Combo */}
          <div className="flex items-center gap-0.5 text-[10px] sm:text-xs font-black text-orange-400">
            <Flame className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${streak > 1 ? 'animate-bounce text-red-500' : 'text-orange-400'}`} />
            <span>x{streak > 1 ? (streak >= 5 ? 3 : streak >= 4 ? 2.4 : streak >= 3 ? 2 : 1.4).toFixed(1) : '1.0'}</span>
          </div>

          <div className="w-px h-3.5 sm:h-4 bg-slate-800" />

          {/* Lives */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map(heartIdx => (
              <Heart
                key={heartIdx}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all ${
                  heartIdx <= lives
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-slate-600 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={toggleGameFullscreen}
            title={isGameFullscreen ? "ย่อขนาด" : "ขยายเต็มจอ"}
            className="p-1 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            {isGameFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isGameFullscreen ? 'ย่อ' : 'เต็มจอ'}</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setShowInstructionsModal(true);
            }}
            title="กติกา"
            className="p-1 sm:px-2 sm:py-1 rounded-lg sm:rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">กติกา</span>
          </button>
          <button
            onClick={() => {
              const newMuted = !soundMuted;
              sound.setMuted(newMuted);
              sound.setBgmMuted(newMuted);
              setSoundMuted(newMuted);
            }}
            title={soundMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              initGame(true);
            }}
            title="เริ่มเล่นใหม่"
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Slingshot Shooting Arena */}
      <div
        ref={arenaRef}
        id="slingshot-arena"
        className={`relative w-full overflow-hidden select-none transition-all duration-300 ${
          isGameFullscreen
            ? 'flex-1 min-h-0 rounded-2xl border-2 border-amber-400/60 shadow-2xl'
            : isLandscapeMobile
            ? 'h-[240px] max-h-[72vh] rounded-xl border-2 border-slate-700/80 shadow-2xl'
            : 'h-[340px] xs:h-[380px] sm:h-[460px] md:h-[540px] lg:h-[600px] rounded-2xl sm:rounded-3xl border-2 border-slate-700/80 shadow-2xl'
        } bg-gradient-to-b from-sky-400 via-sky-200 to-emerald-50`}
      >
        {/* Ready to Start Overlay (Allows player to prepare, or go read knowledge / do quiz first) */}
        {!isPlaying && !isGameOver && !isGameWon && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-slate-900/95 border-2 border-amber-400/60 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 md:p-8 max-w-lg w-full text-center space-y-2 sm:space-y-4 shadow-2xl relative overflow-hidden max-h-[96vh] overflow-y-auto">
              <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-xl sm:text-2xl shadow-xl shadow-amber-500/20">
                🎯
              </div>

              <div>
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-white">
                  เกมยิงหนังสติ๊กคำสรรพนาม ๕ ชนิด
                </h2>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-300 mt-0.5 sm:mt-1">
                  ยินดีต้อนรับคุณ <span className="text-amber-400 font-bold">{playerName || 'ผู้เล่นคนเก่ง'}</span>! ดึงหนังสติ๊กเล็งคำเข้าห่วงเป้าหมายให้ถูกต้อง
                </p>
              </div>

              {/* Game Rules summary */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-slate-800/90 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-700 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold block">เวลาต่อรอบ</span>
                  <span className="font-black text-amber-400 text-xs sm:text-sm">⏱️ ๓ นาที</span>
                </div>
                <div className="space-y-0.5 border-x border-slate-700">
                  <span className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold block">กระสุนคำศัพท์</span>
                  <span className="font-black text-sky-400 text-xs sm:text-sm">🎯 ไม่จำกัดข้อ</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-bold block">พลังชีวิต</span>
                  <span className="font-black text-rose-400 text-xs sm:text-sm">❤️ ๓ ชีวิต</span>
                </div>
              </div>

              {/* Start Buttons */}
              <div className="space-y-2 sm:space-y-2.5">
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsGameFullscreen(true);
                    initGame(true);
                  }}
                  className="w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base md:text-lg shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
                  <span>เข้าสู่หน้าเล่นทันที (เต็มจอ ๓ นาที)</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowInstructionsModal(true);
                  }}
                  className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span>อ่านกติกาและวิธีเล่นโดยละเอียด</span>
                </button>
              </div>

              {/* Alternative Links: If they want to read knowledge or do quiz first */}
              <div className="pt-1.5 sm:pt-2 border-t border-slate-800 flex items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenKnowledge();
                  }}
                  className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800"
                >
                  <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>อ่านตำรา</span>
                </button>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenQuiz();
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800"
                >
                  <FileQuestion className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>ทำแบบทดสอบ ๓๐ ข้อ</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: คำอธิบายวิธีเล่นและกติกาการเล่นเกม (ก่อนเริ่มเล่น ต้องกดรับทราบจึงเริ่ม) */}
        {showInstructionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
            <div className="max-w-xl w-full bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 md:p-7 shadow-2xl shadow-amber-500/20 space-y-4 max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                  <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  คำอธิบายและกติกาการเล่นเกม
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white">
                  วิธีเล่นเกมยิงหนังสติ๊กคำสรรพนาม ๕ ชนิด
                </h2>
                <p className="text-xs text-slate-300">
                  กรุณาอ่านทำความเข้าใจขั้นตอนการเล่น เมื่อพร้อมแล้วกดปุ่ม <span className="text-amber-400 font-bold">"รับทราบ และเริ่มเล่นเกม"</span> ด้านล่าง
                </p>
              </div>

              {/* 3 Instruction Steps */}
              <div className="space-y-3 text-xs md:text-sm">
                {/* Step 1 */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs">๑</span>
                    <span>วิธียิงหนังสติ๊ก (ดึงถอยหลังแล้วปล่อย)</span>
                  </div>
                  <ul className="text-slate-300 space-y-1 text-xs list-disc list-inside leading-relaxed pl-1">
                    <li><strong>คลิกหรือแตะค้าง</strong> ที่กระสุนคำศัพท์บนหนังสติ๊กทางซ้าย</li>
                    <li><strong>ดึงถอยหลังไปทางซ้าย</strong> และขยับขึ้น-ลงเพื่อเล็งวิถีโค้งแนวนอนไปยังห่วงเป้าหมาย</li>
                    <li><strong>ปล่อยนิ้วหรือเมาส์</strong> เพื่อยิงกระสุนพุ่งเข้าห่วงเป้าหมายทางขวา</li>
                    <li>💡 <em>เคล็ดลับ:</em> สามารถแตะที่ชื่อห่วงเป้าหมายด้านขวาเพื่อเล็งด่วนได้เช่นกัน</li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-400 font-black text-sm">
                    <span className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center text-xs">๒</span>
                    <span>ห่วงเป้าหมายคำสรรพนาม ๕ ชนิด</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                      <strong className="text-sky-300 block">๑. บุรุษสรรพนาม</strong>
                      แทนผู้พูด (ฉัน, เรา), ผู้ฟัง (เธอ, ท่าน), ผู้ถูกกล่าวถึง (เขา, มัน)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                      <strong className="text-purple-300 block">๒. คำสรรพนามถาม</strong>
                      ใช้ถามหาคำตอบ (ใคร, อะไร, ไหน, ผู้ใด - ต้องเป็นคำถาม)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                      <strong className="text-amber-300 block">๓. คำสรรพนามชี้เฉพาะ</strong>
                      ชี้ระยะใกล้-ไกล (นี่, นี้, นั่น, นั้น, โน่น, โน้น)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60">
                      <strong className="text-rose-300 block">๔. คำสรรพนามไม่ชี้เฉพาะ</strong>
                      บอกเล่า/ปฏิเสธ ไม่เจาะจง ไม่ต้องการคำตอบ (ใครๆ, อะไรก็ได้)
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/60 sm:col-span-2">
                      <strong className="text-emerald-300 block">๕. คำสรรพนามแยกฝ่าย</strong>
                      แสดงการแยกพวกหรือทำกริยาร่วมกัน/ต่อกัน (ต่าง, บ้าง, กัน)
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-xs">๓</span>
                    <span>ข้อจำกัดและกติกาของเกม</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700">
                      <div className="text-slate-400 text-[10px]">ข้อจำกัดเวลา</div>
                      <div className="text-amber-400 font-black text-sm mt-0.5">⏱️ ๓ นาที</div>
                      <div className="text-[9px] text-slate-400">นับถอยหลัง ๑๘๐ วิ</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700">
                      <div className="text-slate-400 text-[10px]">ข้อจำกัดชีวิต</div>
                      <div className="text-rose-400 font-black text-sm mt-0.5">❤️ ๓ ชีวิต</div>
                      <div className="text-[9px] text-slate-400">ยิงผิดลด ๑ ดวง</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-700">
                      <div className="text-slate-400 text-[10px]">จำนวนข้อคำศัพท์</div>
                      <div className="text-sky-400 font-black text-sm mt-0.5">🎯 ไม่จำกัดข้อ</div>
                      <div className="text-[9px] text-slate-400">ยิงต่อเนื่องใน ๓ นาที</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800 text-center">
                    💡 <span className="text-amber-300 font-bold">เทคนิคการทำคะแนน:</span> ตอบถูกได้นัดละ <span className="text-amber-300 font-bold">๕ คะแนน</span> และยิงถูกติดต่อกันจะได้คอมโบคูณคะแนนสูงสุด <span className="text-orange-400 font-bold">3.0x (๑๕ คะแนน/นัด)</span>
                  </p>
                </div>
              </div>

              {/* Big Confirmation Button: รับทราบ และเริ่มเล่นเกม */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setShowInstructionsModal(false);
                    setIsGameFullscreen(true);
                    setIsPlaying(true);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base md:text-lg shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  รับทราบ และเริ่มเล่นเกม (เข้าสู่หน้าเล่นเต็มจอ ๓ นาที)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Colorful Sunny Daylight Atmosphere & Rolling Grassy Hills */}
        {/* Sun in top-left */}
        <div className="absolute top-2 left-6 w-24 h-24 rounded-full bg-amber-200/50 blur-2xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br from-amber-300/40 via-yellow-200/20 to-transparent pointer-events-none" />

        {/* Floating Cartoon Clouds */}
        <div className="absolute top-6 left-1/4 w-32 h-9 bg-white/75 rounded-full blur-[0.5px] pointer-events-none shadow-sm animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-14 right-1/3 w-40 h-10 bg-white/65 rounded-full blur-[0.5px] pointer-events-none shadow-sm animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-8 right-24 w-28 h-8 bg-white/55 rounded-full blur-[0.5px] pointer-events-none shadow-sm" />

        {/* Rolling Grassy Hills at bottom */}
        <div className={`absolute bottom-0 left-0 right-0 ${isCompactHeight ? 'h-16' : 'h-28'} pointer-events-none overflow-hidden`}>
          {/* Distant soft hill */}
          <div className="absolute -bottom-8 left-0 right-0 h-24 bg-emerald-600/40 rounded-[50%_50%_0_0] scale-x-125" />
          {/* Main front grassy hill */}
          <div className="absolute -bottom-4 left-0 right-0 h-20 bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 rounded-[40%_60%_0_0] shadow-inner" />
          {!isCompactHeight && (
            <>
              <div className="absolute bottom-3 left-12 text-base select-none drop-shadow">🌸</div>
              <div className="absolute bottom-4 left-36 text-sm select-none drop-shadow">🌼</div>
              <div className="absolute bottom-2 left-72 text-sm select-none drop-shadow">🌷</div>
              <div className="absolute bottom-3 right-64 text-base select-none drop-shadow">🌼</div>
              <div className="absolute bottom-2 right-24 text-sm select-none drop-shadow">🌸</div>
            </>
          )}
        </div>

        {/* Ground Range Line / Yard Markings (Only shown when not in compact height) */}
        {!isCompactHeight && (
          <div className="absolute bottom-2 left-6 right-6 border-b-2 border-dashed border-emerald-300/80 pointer-events-none flex justify-between text-[11px] font-bold text-emerald-950 px-4 z-10 drop-shadow-sm">
            <span>🚩 ฐานยิงหนังสติ๊ก (ลากลงด้านล่างแล้วปล่อย)</span>
            <span>⚡ วิถีโค้งสู่เป้าหมาย (Vertical Trajectory)</span>
            <span>🎯 ห่วงเป้าหมายด้านบน ๑ - ๕ (Upper Targets)</span>
          </div>
        )}

        {/* Cheerful Mini Kru Way Cheerleader on Lower-Left Grass */}
        <div className={`absolute ${isCompactHeight ? 'bottom-1.5 left-2' : 'bottom-4 left-3 sm:left-6'} z-25 flex items-end gap-1.5 pointer-events-none`}>
          <div className="relative">
            {/* Animated Speech Bubble */}
            {(!isCompactHeight || streak >= 2) && (
              <div className={`absolute ${isCompactHeight ? '-top-8 left-3 text-[10px] px-2 py-0.5' : '-top-11 left-6 text-[11px] px-2.5 py-1'} bg-white text-slate-900 border-2 border-amber-400 rounded-2xl font-extrabold shadow-xl whitespace-nowrap animate-bounce flex items-center gap-1`}>
                <span className="text-amber-500">✨</span>
                <span>
                  {streak >= 3 
                    ? `คอมโบ ${streak} นัด! 🔥` 
                    : streak >= 1 
                    ? `สุดยอด! ยิงต่อเลยจ้า` 
                    : `ดึงลงแล้วปล่อยนะจ๊ะ`}
                </span>
                <div className="absolute -bottom-1.5 left-4 w-2.5 h-2.5 bg-white border-b-2 border-r-2 border-amber-400 rotate-45" />
              </div>
            )}

            {/* Teacher avatar circle */}
            <div className={`${isCompactHeight ? 'w-8 h-8' : 'w-11 h-11 sm:w-12 sm:h-12'} rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-xl border-2 border-white flex items-center justify-center`}>
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-sm sm:text-xl">
                👩‍🏫
              </div>
            </div>
          </div>
        </div>

        {/* Floating Animated Scores Popup Over Target Hoops */}
        {floatingScores.map(fs => (
          <div
            key={fs.id}
            className="absolute pointer-events-none z-40 animate-bounce"
            style={{
              left: `${fs.x}px`,
              top: `${fs.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={`px-3 py-1.5 rounded-2xl font-black text-sm sm:text-base shadow-2xl flex items-center gap-1.5 border-2 ${
              fs.isCombo
                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 border-yellow-300 text-white shadow-orange-500/60 scale-110'
                : 'bg-emerald-500 border-white text-white shadow-emerald-500/50'
            }`}>
              <span>+{fs.points}</span>
              {fs.isCombo && (
                <span className="text-[11px] text-yellow-200 flex items-center gap-0.5">
                  <Flame className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  x{fs.multiplier.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Aim Target Tag (placed non-intrusively at top-right) */}
        {hoveredAimedHoopId && (
          <div className="absolute top-2 right-3 sm:right-6 z-25 pointer-events-none inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 border border-amber-400 text-xs font-extrabold text-amber-300 animate-pulse shadow-xl">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>เล็ง: {PRONOUN_CATEGORIES.find(c => c.id === hoveredAimedHoopId)?.name}</span>
          </div>
        )}

        {/* Top Hint Banner (shown only when not compact and not actively dragging) */}
        {!isCompactHeight && !isDragging && (
          <div className="absolute top-2 left-6 z-25 pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/85 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-md">
              <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>ดึงหนังสติ๊กด้านล่างลงมา เล็งแล้วปล่อย เพื่อยิงขึ้นห่วงด้านบน 🎯</span>
            </div>
          </div>
        )}

        {/* Current Word Card (Positioned neatly under hoops with ultra-low profile so it NEVER obstructs the playing area) */}
        {currentWord && (
          <div className={`absolute ${isLandscapeMobile ? 'top-8' : isCompactHeight ? 'top-10 sm:top-12' : 'top-16 sm:top-20'} left-1/2 -translate-x-1/2 z-18 w-auto max-w-[95%] pointer-events-none animate-fadeIn`}>
            <div className="bg-slate-950/90 border border-amber-400/60 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-0.5 sm:py-1 backdrop-blur-md shadow-xl text-center flex items-center justify-center gap-1.5 sm:gap-2.5">
              <span className="text-amber-300 font-bold text-[8px] sm:text-[10px] uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                คำ:
              </span>
              <span className="text-sm sm:text-lg md:text-xl font-black text-white drop-shadow">
                "{currentWord.word}"
              </span>
              <span className="text-[9px] sm:text-xs text-amber-100/90 font-medium truncate max-w-[120px] sm:max-w-[220px] border-l border-slate-700 pl-1.5 sm:pl-2">
                {currentWord.contextSentence}
              </span>
            </div>
          </div>
        )}

        {/* Instant Answer Feedback Toast Card */}
        {feedback && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md animate-scaleUp">
            <div
              className={`p-4 rounded-2xl border-2 shadow-2xl backdrop-blur-md flex items-start gap-3 ${
                feedback.isCorrect
                  ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-emerald-950/60'
                  : 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-950/60'
              }`}
            >
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-extrabold text-base md:text-lg">
                  {feedback.message}
                </div>
                <div className="text-xs md:text-sm text-slate-200 mt-1 leading-relaxed">
                  {feedback.explanation}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL ARENA SVG: Renders Trajectory Curve, Slingshot Wooden Stand, and Rubber Bands */}
        <svg className="absolute inset-0 w-full h-full overflow-visible z-15 pointer-events-none">
          <defs>
            <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <radialGradient id="bulletGlow">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="70%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </radialGradient>
          </defs>

          {/* 1. VISIBLE HORIZONTAL PARABOLIC TRAJECTORY LINE */}
          {renderTrajectoryLine()}

          {/* 2. SLINGSHOT WOODEN FORK STAND (Centered at bottom, facing UPWARDS) */}
          <g>
            {/* Wooden Base Platform on the ground */}
            <rect
              x={forkBaseX - (isLandscapeMobile ? 21 : isCompactHeight ? 24 : 35)}
              y={forkBaseY}
              width={isLandscapeMobile ? 42 : isCompactHeight ? 48 : 70}
              height={isLandscapeMobile ? 8 : isCompactHeight ? 12 : 16}
              rx="3"
              fill="url(#woodGradient)"
              stroke="#451a03"
              strokeWidth="1.5"
            />
            {/* Wooden Vertical Post */}
            <path
              d={`M ${forkBaseX - (isLandscapeMobile ? 4 : isCompactHeight ? 6 : 10)} ${forkBaseY} L ${forkBaseX + (isLandscapeMobile ? 4 : isCompactHeight ? 6 : 10)} ${forkBaseY} L ${slingshotAnchor.x + (isLandscapeMobile ? 4 : isCompactHeight ? 5 : 8)} ${slingshotAnchor.y + (isLandscapeMobile ? 6 : isCompactHeight ? 8 : 12)} L ${slingshotAnchor.x - (isLandscapeMobile ? 4 : isCompactHeight ? 5 : 8)} ${slingshotAnchor.y + (isLandscapeMobile ? 6 : isCompactHeight ? 8 : 12)} Z`}
              fill="url(#woodGradient)"
              stroke="#451a03"
              strokeWidth="1.5"
            />
            {/* Left Wooden Fork Arm (reaching up and left) */}
            <path
              d={`M ${slingshotAnchor.x - (isLandscapeMobile ? 4 : isCompactHeight ? 5 : 8)} ${slingshotAnchor.y + (isLandscapeMobile ? 6 : isCompactHeight ? 8 : 12)} L ${forkProngLeft.x} ${forkProngLeft.y} L ${forkProngLeft.x - (isLandscapeMobile ? 4 : isCompactHeight ? 5 : 8)} ${forkProngLeft.y + 2} L ${slingshotAnchor.x - (isLandscapeMobile ? 7 : isCompactHeight ? 9 : 14)} ${slingshotAnchor.y + (isLandscapeMobile ? 9 : isCompactHeight ? 12 : 18)} Z`}
              fill="url(#woodGradient)"
              stroke="#451a03"
              strokeWidth="1.5"
            />
            {/* Right Wooden Fork Arm (reaching up and right) */}
            <path
              d={`M ${slingshotAnchor.x + (isLandscapeMobile ? 4 : isCompactHeight ? 5 : 8)} ${slingshotAnchor.y + (isLandscapeMobile ? 6 : isCompactHeight ? 8 : 12)} L ${forkProngRight.x} ${forkProngRight.y} L ${forkProngRight.x + (isLandscapeMobile ? 4 : isCompactHeight ? 5 : 8)} ${forkProngRight.y + 2} L ${slingshotAnchor.x + (isLandscapeMobile ? 7 : isCompactHeight ? 9 : 14)} ${slingshotAnchor.y + (isLandscapeMobile ? 9 : isCompactHeight ? 12 : 18)} Z`}
              fill="url(#woodGradient)"
              stroke="#451a03"
              strokeWidth="1.5"
            />
            {/* Left Band Pin */}
            <circle cx={forkProngLeft.x} cy={forkProngLeft.y} r={isLandscapeMobile ? 2.5 : isCompactHeight ? 3.5 : 5} fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            {/* Right Band Pin */}
            <circle cx={forkProngRight.x} cy={forkProngRight.y} r={isLandscapeMobile ? 2.5 : isCompactHeight ? 3.5 : 5} fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          </g>

          {/* 3. ELASTIC RUBBER BANDS (Connect from fork tips down to projectile pouch) */}
          <line
            x1={forkProngLeft.x}
            y1={forkProngLeft.y}
            x2={pouchPos.x - (isLandscapeMobile ? 5 : 6)}
            y2={pouchPos.y}
            stroke="#ef4444"
            strokeWidth={isCompactHeight ? Math.max(2, 4 - Math.abs(dragOffset.y) / 25) : Math.max(2.5, 5.5 - Math.abs(dragOffset.y) / 28)}
            strokeLinecap="round"
          />
          <line
            x1={forkProngRight.x}
            y1={forkProngRight.y}
            x2={pouchPos.x + (isLandscapeMobile ? 5 : 6)}
            y2={pouchPos.y}
            stroke="#b91c1c"
            strokeWidth={isCompactHeight ? Math.max(2, 4 - Math.abs(dragOffset.y) / 25) : Math.max(2.5, 5.5 - Math.abs(dragOffset.y) / 28)}
            strokeLinecap="round"
          />

          {/* 4. Particle Trail Dots */}
          {trailDots.map(dot => (
            <circle
              key={dot.id}
              cx={dot.x}
              cy={dot.y}
              r="3"
              fill="#fbbf24"
              opacity="0.6"
              className="animate-ping"
            />
          ))}
        </svg>

        {/* 5. THE 5 TARGET HOOPS (Arranged horizontally across the top of the arena) */}
        {PRONOUN_CATEGORIES.map((cat, idx) => {
          const pos = getHoopPosition(idx);
          const isTargeted = targetHoopId === cat.id;
          const isAimedBySlingshot = hoveredAimedHoopId === cat.id;
          const isAnimating = animatingHoop?.id === cat.id;
          const isCorrectAnim = animatingHoop?.isCorrect;

          return (
            <div
              key={cat.id}
              id={`hoop-${cat.id}`}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-20"
            >
              <button
                onClick={() => {
                  if (!isFlying && !isGameOver && !isGameWon) {
                    launchAtHoop(cat.id);
                  }
                }}
                className={`group relative flex flex-col items-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border-2 transition-all cursor-pointer shadow-md ${
                  isAnimating
                    ? isCorrectAnim
                      ? 'border-emerald-400 bg-emerald-600 text-white scale-110 shadow-emerald-500/60 ring-2 sm:ring-4 ring-emerald-300'
                      : 'border-rose-500 bg-rose-600 text-white scale-95 shake'
                    : isAimedBySlingshot || isTargeted
                    ? `${cat.borderColor} bg-slate-900 scale-105 shadow-xl ring-2 sm:ring-4 ring-amber-400/90`
                    : `${cat.borderColor} bg-slate-950/90 hover:bg-slate-900 hover:scale-105 hover:${cat.borderColor}`
                }`}
                title={`แตะเพื่อยิงขึ้น: ${cat.name}`}
              >
                {/* Glowing Magical Hoop Ring */}
                <div
                  className={`${isCompactHeight ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-8 h-8 sm:w-11 sm:h-11'} rounded-full border-2 sm:border-3 ${cat.borderColor} flex items-center justify-center relative shadow-sm group-hover:scale-110 transition-transform bg-slate-900 shrink-0`}
                >
                  <div className="absolute inset-0 rounded-full border border-white/30 animate-ping pointer-events-none opacity-25" />
                  <span className={`text-white font-black ${isCompactHeight ? 'text-[9px] sm:text-[10px]' : 'text-xs sm:text-sm'} drop-shadow`}>
                    {cat.number}
                  </span>
                </div>

                {/* Hoop Label Information */}
                <div className="text-center mt-0.5 max-w-[50px] sm:max-w-[80px] md:max-w-[100px] overflow-hidden">
                  <div className={`font-black ${isCompactHeight ? 'text-[8px] sm:text-[9px]' : 'text-[9px] sm:text-xs'} text-white leading-tight truncate drop-shadow-sm`}>
                    {cat.shortName}
                  </div>
                  {!isCompactHeight && (
                    <div className="hidden sm:block text-[8px] text-amber-300 font-bold truncate mt-0.5">
                      {cat.keywords.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>

                {/* Crosshair tag when aimed */}
                {(isAimedBySlingshot || isTargeted) && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg animate-bounce border border-slate-950">
                    <Crosshair className="w-3 h-3" />
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* 6. Dynamic Particles Burst on Hoop Hit */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none z-35"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* 7. SLINGSHOT LEATHER POUCH WITH WORD PROJECTILE (Bottom Center) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            left: `${pouchPos.x}px`,
            top: `${pouchPos.y}px`,
            transform: `translate(-50%, -50%) rotate(${isFlying ? projectileAngle : 0}deg)`,
          }}
          className={`absolute z-30 cursor-grab active:cursor-grabbing touch-none select-none ${
            isFlying ? 'pointer-events-none' : ''
          }`}
        >
          <div className="relative group">
            {/* Glowing Word Ball Projectile */}
            <div className={`${isLandscapeMobile ? 'w-9 h-9' : isCompactHeight ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-14 h-14 sm:w-18 sm:h-18'} rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 shadow-lg shadow-orange-500/40 flex flex-col items-center justify-center p-0.5 sm:p-1 border sm:border-2 border-white/75 text-white font-extrabold text-center transition-transform hover:scale-105 active:scale-95`}>
              <span className={`${isLandscapeMobile ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'} text-amber-200 font-bold uppercase tracking-wider leading-none`}>
                กระสุน
              </span>
              <span className={`${isLandscapeMobile ? 'text-[10px]' : 'text-[9px] sm:text-[11px] md:text-xs'} font-black truncate max-w-full leading-tight`}>
                {currentWord?.word || 'คำ'}
              </span>
            </div>

            {/* Drag Hint Tooltip when idle */}
            {!isDragging && !isFlying && (
              <div className={`absolute ${isLandscapeMobile ? '-bottom-4' : isCompactHeight ? '-bottom-5' : '-bottom-7'} left-1/2 -translate-x-1/2 bg-slate-900/95 text-[7px] sm:text-[10px] font-bold text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-500/40 whitespace-nowrap shadow-md flex items-center gap-0.5 pointer-events-none`}>
                <span>▼ ลากลงแล้วปล่อย</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Category Buttons for Easy Access on Mobile Touchscreens */}
      <div className={`bg-slate-900/90 ${isLandscapeMobile ? 'p-1' : 'p-1.5 sm:p-2.5'} rounded-xl sm:rounded-2xl border border-slate-700/70 shadow-lg shrink-0`}>
        {!isLandscapeMobile && (
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 mb-1 flex items-center justify-between px-1">
            <span className="flex items-center gap-1 text-slate-300">
              <span>🎯</span>
              <span className="hidden xs:inline">หรือแตะปุ่มเพื่อยิงเข้าห่วงทันที:</span>
              <span className="xs:hidden">แตะยิงเข้าห่วง:</span>
            </span>
            <span className="text-amber-400 text-[9px] sm:text-[11px] font-semibold">ห่วง ๑ - ๕</span>
          </div>
        )}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {PRONOUN_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              disabled={!isPlaying || isFlying || isGameOver || isGameWon}
              onClick={() => {
                sound.playClick();
                launchAtHoop(cat.id);
              }}
              className={`${isLandscapeMobile ? 'py-0.5 px-0.5 text-[9px]' : 'py-1 sm:py-1.5 px-0.5 sm:px-2 text-[9px] sm:text-xs'} rounded-lg sm:rounded-xl font-black border flex items-center justify-center gap-0.5 sm:gap-1 transition-all cursor-pointer ${cat.badgeBg} hover:opacity-100 opacity-85 active:scale-95 disabled:opacity-35`}
            >
              <span>{cat.number}.</span>
              <span className="truncate">{cat.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Game Over / Victory Modal */}
      {(isGameOver || isGameWon) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative animate-scaleUp">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20">
              {isGameWon ? '🏆' : '💪'}
            </div>

            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white">
                {isGameWon ? 'ยอดเยี่ยมมาก! ชนะเกมแล้ว' : 'จบเกมแล้ว มาฝึกซ้อมกันใหม่!'}
              </h3>
              <p className="text-slate-300 text-sm mt-1">
                {isGameWon
                  ? 'คุณแม่นยำและจำแนกคำสรรพนามได้ถูกต้องยอดเยี่ยม'
                  : 'อย่าเพิ่งท้อแท้ ทบทวนความรู้แล้วลองใหม่อีกครั้งนะ'}
              </p>
            </div>

            {/* Score & Combo Summary */}
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-xs text-slate-400 font-medium">คะแนนรวม</div>
                <div className="text-2xl font-black text-amber-400">{score}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">คอมโบสูงสุด</div>
                <div className="text-2xl font-black text-orange-400 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  {highestStreak}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  sound.playClick();
                  initGame(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                เล่นใหม่อีกครั้ง
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenLeaderboard();
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                ดูตารางจัดอันดับคะแนน
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenKnowledge();
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                ทบทวนคลังความรู้ ๕ ชนิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
