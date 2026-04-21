/**
 * SaveManager — Dual-storage save system for Spin Merge
 * Agent 4: SDK Engineer
 *
 * Saves to localStorage always, and to Yandex cloud when SDK is available.
 * Loads from cloud first, then falls back to localStorage, then defaults.
 */

import { YandexSDK } from '../sdk/YandexSDK';
import type { UpgradeState } from './UpgradeManager';

// ─── Save Data Interface ────────────────────────────

export interface SaveData {
  /** Upgrade levels (1-10) for each branch */
  upgrades: UpgradeState;
  /** Current coin balance */
  coins: number;
  /** All-time high score */
  highScore: number;
  /** Array of unlocked skin IDs */
  unlockedSkins: number[];
  /** Currently active skin ID */
  activeSkinId: number;
  /** Consecutive gacha spins without rare */
  gachaPityCounter: number;
  /** Legendary skin ad progress: skinId → adsWatched (0-5) */
  legendaryProgress: Record<number, number>;
  /** Sound effects enabled */
  soundEnabled: boolean;
  /** Language override ('ru' or 'en' or null) */
  language: string | null;
}

// ─── Constants ──────────────────────────────────────

const LOCAL_STORAGE_KEY = 'spinmerge_save';

// ─── SaveManager Class ──────────────────────────────

export class SaveManager {
  private sdk: YandexSDK;

  constructor() {
    this.sdk = YandexSDK.getInstance();
  }

  // ─── Save ────────────────────────────────────────

  /**
   * Save game data to both localStorage and cloud (if available).
   * Called immediately after every significant action (Yandex requirement п.1.9).
   */
  async save(data: SaveData): Promise<void> {
    // Always save to localStorage
    this.saveToLocal(data);

    // Also try cloud save if SDK is available
    if (this.sdk.isAvailable()) {
      try {
        const player = await this.sdk.getPlayer();
        await player.setData(data as unknown as Record<string, unknown>, true);
        console.log('[SaveManager] Saved to cloud + local');
      } catch (err) {
        console.warn('[SaveManager] Cloud save failed, localStorage only:', (err as Error).message);
      }
    } else {
      console.log('[SaveManager] Saved to localStorage (mock mode)');
    }
  }

  // ─── Load ────────────────────────────────────────

  /**
   * Load game data from the best available source.
   * Priority: cloud → localStorage → default values.
   */
  async load(): Promise<SaveData> {
    // Try cloud first
    if (this.sdk.isAvailable()) {
      try {
        const player = await this.sdk.getPlayer();
        const cloudData = await player.getData() as unknown as Partial<SaveData>;

        // Validate that cloud data has meaningful content
        if (cloudData && cloudData.upgrades) {
          console.log('[SaveManager] Loaded from cloud');
          return this.mergeSaveData(cloudData);
        }
      } catch (err) {
        console.warn('[SaveManager] Cloud load failed:', (err as Error).message);
      }
    }

    // Fallback to localStorage
    const localData = this.loadFromLocal();
    if (localData) {
      console.log('[SaveManager] Loaded from localStorage');
      return this.mergeSaveData(localData);
    }

    // Fallback to defaults
    console.log('[SaveManager] No save found, using defaults');
    return this.getDefaultSaveData();
  }

  // ─── Reset ───────────────────────────────────────

  /** Wipe all progress back to defaults, then save. */
  async resetProgress(): Promise<void> {
    const defaultData = this.getDefaultSaveData();
    await this.save(defaultData);
    console.log('[SaveManager] Progress reset to defaults');
  }

  // ─── Default Data ────────────────────────────────

  /** Get default save data for new players */
  getDefaultSaveData(): SaveData {
    return {
      upgrades: {
        barrelSize: 1,
        spinEnergy: 1,
        dropMutation: 1,
        magnetism: 1,
        coinMultiplier: 1,
      },
      coins: 0,
      highScore: 0,
      unlockedSkins: [0],
      activeSkinId: 0,
      gachaPityCounter: 0,
      legendaryProgress: { 8: 0, 9: 0 },
      soundEnabled: true,
      language: null,
    };
  }

  // ─── Local Storage Helpers ───────────────────────

  private saveToLocal(data: SaveData): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[SaveManager] localStorage write failed:', (err as Error).message);
    }
  }

  private loadFromLocal(): Partial<SaveData> | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Partial<SaveData>;
    } catch (err) {
      console.warn('[SaveManager] localStorage read failed:', (err as Error).message);
      return null;
    }
  }

  // ─── Data Validation ─────────────────────────────

  /**
   * Merge partial/loaded data with defaults to ensure all fields exist.
   * Guards against corrupted or incomplete saves.
   */
  private mergeSaveData(partial: Partial<SaveData>): SaveData {
    const defaults = this.getDefaultSaveData();

    return {
      upgrades: {
        barrelSize:     partial.upgrades?.barrelSize     ?? defaults.upgrades.barrelSize,
        spinEnergy:     partial.upgrades?.spinEnergy     ?? defaults.upgrades.spinEnergy,
        dropMutation:   partial.upgrades?.dropMutation   ?? defaults.upgrades.dropMutation,
        magnetism:      partial.upgrades?.magnetism      ?? defaults.upgrades.magnetism,
        coinMultiplier: partial.upgrades?.coinMultiplier  ?? defaults.upgrades.coinMultiplier,
      },
      coins:              partial.coins              ?? defaults.coins,
      highScore:          partial.highScore          ?? defaults.highScore,
      unlockedSkins:      partial.unlockedSkins      ?? defaults.unlockedSkins,
      activeSkinId:       partial.activeSkinId       ?? defaults.activeSkinId,
      gachaPityCounter:   partial.gachaPityCounter   ?? defaults.gachaPityCounter,
      legendaryProgress:  partial.legendaryProgress  ?? defaults.legendaryProgress,
      soundEnabled:       partial.soundEnabled       ?? defaults.soundEnabled,
      language:           partial.language           ?? defaults.language,
    };
  }
}
