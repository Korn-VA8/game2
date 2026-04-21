/**
 * AdManager — Telegram version (no ads)
 *
 * In Telegram Mini Apps there is no native ad SDK.
 * All "rewarded" actions instantly grant the reward.
 * Interstitial ads are skipped entirely.
 * Cooldowns and game-count tracking are preserved for balance.
 */

import { YandexSDK } from './YandexSDK';

// ─── Types ──────────────────────────────────────────

export interface InterstitialCallbacks {
  onOpen?: () => void;
  onClose?: () => void;
}

// ─── Constants ──────────────────────────────────────

/** Cooldown between free reward claims (ms) — prevents spam */
const REWARD_COOLDOWN = 5_000; // 5 seconds

/** Show interstitial every N games (kept for future monetization) */
const INTERSTITIAL_GAME_INTERVAL = 2;

// ─── AdManager Class ────────────────────────────────

export class AdManager {
  private sdk: YandexSDK;

  /** Timestamp of last interstitial shown */
  private lastInterstitialTime = 0;

  /** Timestamp of last rewarded action */
  private lastRewardedTime = 0;

  /** Number of games played (for interstitial frequency) */
  private _gamesPlayed = 0;

  constructor() {
    this.sdk = YandexSDK.getInstance();
  }

  // ─── Games Played Tracking ───────────────────────

  /** Increment game counter. Call after each game ends. */
  incrementGamesPlayed(): void {
    this._gamesPlayed++;
  }

  get gamesPlayed(): number {
    return this._gamesPlayed;
  }

  /** Check if it's time to show an interstitial based on game count */
  shouldShowInterstitial(): boolean {
    return this._gamesPlayed > 0 && this._gamesPlayed % INTERSTITIAL_GAME_INTERVAL === 0;
  }

  // ─── Interstitial Ad ─────────────────────────────

  /**
   * In Telegram: no interstitial ads.
   * Simply calls onOpen → short pause → onClose to preserve game flow.
   */
  showInterstitial(callbacks: InterstitialCallbacks = {}): void {
    const now = Date.now();

    // Respect cooldown to prevent rapid-fire calls
    if (now - this.lastInterstitialTime < REWARD_COOLDOWN) {
      console.log('[AdManager/TG] Interstitial cooldown active, skipping');
      callbacks.onClose?.();
      return;
    }

    console.log('[AdManager/TG] Interstitial (skipped — no ads in Telegram)');
    this.lastInterstitialTime = Date.now();
    callbacks.onOpen?.();
    // Brief pause to match expected flow timing
    setTimeout(() => {
      callbacks.onClose?.();
    }, 200);
  }

  // ─── Rewarded Video ──────────────────────────────

  /**
   * In Telegram: no rewarded video ads.
   * Instantly grants the reward after a brief visual pause.
   *
   * @param onReward - Called when user earns the reward
   * @param onClose  - Called when flow is complete (for resuming game)
   */
  showRewarded(onReward: () => void, onClose: () => void): void {
    const now = Date.now();

    // Small cooldown to prevent accidental double-taps
    if (now - this.lastRewardedTime < REWARD_COOLDOWN) {
      console.log('[AdManager/TG] Reward cooldown active, skipping');
      onClose();
      return;
    }

    this.lastRewardedTime = Date.now();
    console.log('[AdManager/TG] Rewarded (free) — granting reward');
    onReward();
    setTimeout(() => {
      onClose();
    }, 200);
  }

  // ─── Sticky Banner ───────────────────────────────

  /** No banners in Telegram */
  showStickyBanner(): void {
    console.log('[AdManager/TG] Sticky banner — not available in Telegram');
  }

  /** No banners in Telegram */
  hideStickyBanner(): void {
    // no-op
  }
}
