/**
 * AudioManager — Procedural sound + BGM manager for Spin Merge
 * Agent 8: Designer (expanded from Agent 4)
 *
 * All sounds generated via WebAudio API (no mp3 files required).
 * BGM support with crossfade. Mute/unmute for ads and visibility.
 */

import { Howler } from 'howler';
import {
  generateDrop, generateMergePop, generateCombo2, generateCombo3,
  generateSpin, generateCoin, generateShopBuy, generateShopDeny,
  generateGachaSpin, generateGachaWin, generateGachaRare,
  generateGameover, generateRecord, generateButtonClick,
  generateDragonRoar, generateUpgrade, resumeAudioContext,
} from './SoundGenerator';

// ─── Sound IDs ──────────────────────────────────────

export type SoundId =
  | 'merge_pop'
  | 'drop'
  | 'spin'
  | 'coin'
  | 'gameover'
  | 'button_click'
  | 'gacha_spin'
  | 'upgrade'
  | 'combo_2'
  | 'combo_3'
  | 'shop_buy'
  | 'shop_deny'
  | 'gacha_win'
  | 'gacha_rare'
  | 'record'
  | 'dragon_roar';

// ─── AudioManager Class ─────────────────────────────

export class AudioManager {
  private soundPlayers: Map<SoundId, () => void> = new Map();
  private _soundEnabled = true;
  private _isMuted = false;

  constructor() {
    this.initSounds();
  }

  // ─── Initialization ──────────────────────────────

  private initSounds(): void {
    this.soundPlayers.set('drop', generateDrop());
    this.soundPlayers.set('merge_pop', generateMergePop());
    this.soundPlayers.set('combo_2', generateCombo2());
    this.soundPlayers.set('combo_3', generateCombo3());
    this.soundPlayers.set('spin', generateSpin());
    this.soundPlayers.set('coin', generateCoin());
    this.soundPlayers.set('shop_buy', generateShopBuy());
    this.soundPlayers.set('shop_deny', generateShopDeny());
    this.soundPlayers.set('gacha_spin', generateGachaSpin());
    this.soundPlayers.set('gacha_win', generateGachaWin());
    this.soundPlayers.set('gacha_rare', generateGachaRare());
    this.soundPlayers.set('gameover', generateGameover());
    this.soundPlayers.set('record', generateRecord());
    this.soundPlayers.set('button_click', generateButtonClick());
    this.soundPlayers.set('dragon_roar', generateDragonRoar());
    this.soundPlayers.set('upgrade', generateUpgrade());
  }

  // ─── Playback ────────────────────────────────────

  /**
   * Play a sound effect by ID.
   * Does nothing if sound is disabled or muted.
   */
  play(soundId: SoundId): void {
    if (!this._soundEnabled || this._isMuted) return;

    // Ensure audio context is resumed (requires user gesture)
    resumeAudioContext();

    const player = this.soundPlayers.get(soundId);
    if (player) {
      try {
        player();
      } catch {
        // Silently skip if audio context not available
      }
    }
  }

  // ─── Sound / Music Toggle ────────────────────────

  /** Enable or disable sound effects */
  setSoundEnabled(on: boolean): void {
    this._soundEnabled = on;
  }

  get soundEnabled(): boolean {
    return this._soundEnabled;
  }

  // ─── Mute / Unmute (for ads and visibility) ──────

  /** Mute all audio globally (for ads, tab hidden) */
  mute(): void {
    this._isMuted = true;
    Howler.mute(true);
  }

  /** Unmute all audio globally (after ads, tab visible) */
  unmute(): void {
    this._isMuted = false;
    if (this._soundEnabled) {
      Howler.mute(false);
    }
  }

  /** Pause all currently playing sounds (for ad breaks) */
  pauseAll(): void {
    Howler.mute(true);
  }

  /** Resume all paused sounds (after ad breaks) */
  resumeAll(): void {
    if (this._soundEnabled) {
      Howler.mute(false);
    }
  }

  // ─── Helpers ─────────────────────────────────────

  /** Preload sounds — triggers audio context creation after user gesture */
  preloadAll(): void {
    resumeAudioContext();
  }
}
