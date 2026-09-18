// Thai Speech Synthesis & Voice Sound Effect Engine
// Uses Web Speech API (speechSynthesis) with fallback audio cues

export class ThaiSpeechEngine {
  private isSupported: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private thaiVoice: SpeechSynthesisVoice | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isSupported = true;
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.isSupported) return;
    const voices = window.speechSynthesis.getVoices();
    // Prioritize high-quality Thai voices (Google ภาษาไทย, Kanya, Narisa, etc.)
    const found = voices.find(v => v.lang.toLowerCase().includes('th') || v.lang.toLowerCase().replace('_', '-').startsWith('th'));
    if (found) {
      this.thaiVoice = found;
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public stop() {
    if (this.isSupported && typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    if (!this.isSupported) return false;
    return window.speechSynthesis.speaking;
  }

  /**
   * Speaks Thai text with natural teacher tone
   */
  public speak(
    text: string, 
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      rate?: number;
      pitch?: number;
    }
  ): boolean {
    if (!this.isEnabled || !this.isSupported || typeof window === 'undefined') {
      return false;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean text of markdown asterisks, quotes or extra symbols for clearer phonetics
      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();

      if (!cleanText) return false;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'th-TH';
      utterance.rate = callbacks?.rate ?? 0.96; // slightly deliberate for crystal-clear learning
      utterance.pitch = callbacks?.pitch ?? 1.05; // friendly, pleasant educator tone

      if (this.thaiVoice) {
        utterance.voice = this.thaiVoice;
      } else {
        this.loadVoices();
        if (this.thaiVoice) {
          utterance.voice = this.thaiVoice;
        }
      }

      utterance.onstart = () => {
        if (callbacks?.onStart) callbacks.onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (callbacks?.onEnd) callbacks.onEnd();
      };

      utterance.onerror = (err) => {
        this.currentUtterance = null;
        if (callbacks?.onEnd) callbacks.onEnd();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      return false;
    }
  }
}

export const thaiSpeech = new ThaiSpeechEngine();
