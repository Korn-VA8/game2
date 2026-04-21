/**
 * SkinManager — Skin collection & Gacha system for Spin Merge
 * Agent 3: Collector
 *
 * 10 skin sets, each providing 11 colors (one per creature level).
 * Gacha with pity system, duplicate refunds, and legendary ad-unlock.
 */

import { ScoreSystem } from '../game/ScoreSystem';

// ─── Types ──────────────────────────────────────────

export type SkinRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ObtainMethod = 'default' | 'gacha' | 'ads_only';

export type SpriteTheme =
  | 'animal' | 'food' | 'planet' | 'spooky' | 'winter'
  | 'sport' | 'meme' | 'crystal' | 'golden' | 'neon';

export interface SpriteDescriptor {
  theme: SpriteTheme;
  level: number;       // 1-11
  accentColor?: string;
}

export interface SkinConfig {
  id: number;
  name: string;
  rarity: SkinRarity;
  obtainMethod: ObtainMethod;
  colors: readonly string[]; // 11 hex colors, index 0 = level 1
  sprites: readonly SpriteDescriptor[]; // 11 sprite descriptors
}

export interface GachaResult {
  skinId: number;
  isNew: boolean;
  refundCoins: number;
}

export interface SkinManagerState {
  unlockedSkins: number[];
  activeSkinId: number;
  gachaPityCounter: number;
  legendaryProgress: Record<number, number>; // skinId → adsWatched (0-5)
}

// ─── Constants ──────────────────────────────────────

const GACHA_COST = 1000;
const PITY_THRESHOLD = 15; // after 15 spins without rare → 16th is guaranteed rare
const LEGENDARY_ADS_REQUIRED = 5;

/** Duplicate refund by rarity */
const DUPLICATE_REFUND: Record<SkinRarity, number> = {
  common: 200,
  uncommon: 400,
  rare: 800,
  legendary: 0, // legendaries can't be obtained via gacha
};

/**
 * Real gacha weights (legendary excluded from gacha pool).
 * Normalized from: common=45%, uncommon=35%, rare=15%, legendary=5%
 * Without legendary: common≈47.37%, uncommon≈36.84%, rare≈15.79%
 * Using integer weights for precision.
 */
const GACHA_WEIGHTS: { rarity: SkinRarity; weight: number }[] = [
  { rarity: 'common',   weight: 47 },
  { rarity: 'uncommon', weight: 37 },
  { rarity: 'rare',     weight: 16 },
];
const GACHA_TOTAL_WEIGHT = GACHA_WEIGHTS.reduce((s, w) => s + w.weight, 0); // 100

// ─── Skin Data ──────────────────────────────────────

const SKIN_CONFIGS: readonly SkinConfig[] = [
  {
    id: 0, name: 'Желейные Зверята', rarity: 'common', obtainMethod: 'default',
    // Fruity pastels: strawberry, peach, lemon, sky, mint, apricot, lavender, seafoam, sunny, lilac, cream
    colors: ['#FF85A2','#FFB088','#FFD966','#7EC8E3','#88E8C0','#FFCF8B','#CDA4DE','#7FDBCA','#FFE87C','#D4A5FF','#FFF5BA'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'animal', level: i + 1 }))
  },
  {
    id: 1, name: 'Сладости', rarity: 'common', obtainMethod: 'gacha',
    // Macaroon pastels: bubblegum, rose, blush coral, tangerine, banana cream, pistachio, mint candy, cotton candy, baby pink, orchid, grape soda
    colors: ['#FFB3D9','#FF8EB5','#FF9B9B','#FFA96B','#FFE066','#B8F28B','#7EDFCF','#FFD1F0','#FF7EB3','#E088FF','#C9A0FF'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'food', level: i + 1 }))
  },
  {
    id: 2, name: 'Космос', rarity: 'common', obtainMethod: 'gacha',
    // Solid planetary base colors: Moon, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Sun, Black Hole
    colors: ['#D0D4DC','#9C8A79','#E6B35C','#2166E5','#CE4A21','#C79E6F','#EAD39C','#99E6FF','#3366CC','#FF8C00','#1A0530'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'planet', level: i + 1 }))
  },
  {
    id: 3, name: 'Хэллоуин', rarity: 'uncommon', obtainMethod: 'gacha',
    // Bright arcade halloween: pumpkin, tangerine, lemon, neon green, jade, bright purple, electric violet, hot coral, mango, glowing white, ghost lavender
    colors: ['#FF7744','#FFB347','#FFF06B','#5FE89A','#3DDBAB','#A66EFF','#C77DFF','#FF6F8A','#FFCD5C','#F0F0FF','#E4D2FF'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'spooky', level: i + 1 }))
  },
  {
    id: 4, name: 'Зимний', rarity: 'uncommon', obtainMethod: 'gacha',
    // Icy arctic: snowdrift, ice blue, frost, sky blue, bright azure, periwinkle, royal periwinkle, gold accent, amber, rose, mint
    colors: ['#E8F0FE','#B8D8F8','#9DC8F0','#7BBAFF','#5AA8FF','#8B8EFF','#7878FF','#FFE07A','#FFC05C','#FF8FAA','#8BFFCF'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'winter', level: i + 1 }))
  },
  {
    id: 5, name: 'Мячи', rarity: 'uncommon', obtainMethod: 'gacha',
    // Bright sporty: basketball orange, tennis lime, soccer white, grass green, emerald, sky blue, baby blue, soft violet, golden, coral, teal
    colors: ['#FF7B4F','#FFBA33','#FFE0B2','#7ED957','#44CF6C','#48ADFF','#8AD4FF','#B5A5FF','#FFE15D','#FF8566','#4DDBC9'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'sport', level: i + 1 }))
  },
  {
    id: 6, name: 'Мемы', rarity: 'rare', obtainMethod: 'gacha',
    // Internet RGB: neon pink, hot magenta, electric indigo, soft lavender, emerald, aqua, bright blue, azure light, soft yellow, peach, salmon
    colors: ['#FF80BF','#FF5CAD','#7C65EB','#B8A9FF','#3BD6A0','#3FEAD8','#4DA6FF','#8FCBFF','#FFF3A0','#FFB79F','#FF8F8F'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'meme', level: i + 1 }))
  },
  {
    id: 7, name: 'Кристаллы', rarity: 'rare', obtainMethod: 'gacha',
    // Gemstone lights: aquamarine, sapphire light, amethyst light, diamond, moonstone, rose quartz, crystal pink, teal gem, emerald light, topaz, ruby light
    colors: ['#8FFFEF','#8AC8FF','#C1A5FF','#E8F0FF','#D4E4FF','#FFB3D0','#FF9EC4','#60E8D8','#6AFFBE','#FFE88A','#FF8FAF'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'crystal', level: i + 1 }))
  },
  {
    id: 8, name: 'Золотые Звери', rarity: 'legendary', obtainMethod: 'ads_only',
    // Bright luxe gold: white gold, champagne, bright gold, amber gold, marigold, sunflower, warm gold, honey, light gold, lemon gold, buttercup
    colors: ['#FFF4CC','#FFE89A','#FFD95A','#FFC940','#FFB830','#FFA820','#FF9810','#FFE680','#FFFACD','#FFF06B','#FFE44D'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'golden', level: i + 1 }))
  },
  {
    id: 9, name: 'Неоновые', rarity: 'legendary', obtainMethod: 'ads_only',
    // Pure 100% saturated neons: electric green, crimson neon, cyan, magenta, yellow, hot pink, ice blue, orange neon, lime, ultraviolet, red-orange
    colors: ['#39FF14','#FF1053','#00FFFF','#FF00FF','#FFFF00','#FF6EC7','#7DF9FF','#FF6D1F','#CCFF00','#BF00FF','#FF4F00'],
    sprites: Array.from({length: 11}, (_, i) => ({ theme: 'neon', level: i + 1 }))
  },
];

// ─── SkinManager Class ──────────────────────────────

export class SkinManager {
  /** Set of unlocked skin IDs */
  private unlockedSkins: Set<number> = new Set([0]); // skin 0 is default (always unlocked)

  /** Currently active skin ID */
  private activeSkinId = 0;

  /** Consecutive gacha spins without getting a rare skin */
  private gachaPityCounter = 0;

  /** Legendary skin progress: skinId → number of ads watched (0-5) */
  private legendaryProgress: Record<number, number> = { 8: 0, 9: 0 };

  // ─── Skin Info ──────────────────────────────────

  /** Get config for a specific skin */
  getSkinConfig(skinId: number): SkinConfig {
    const cfg = SKIN_CONFIGS[skinId];
    if (!cfg) throw new Error(`Unknown skin ID: ${skinId}`);
    return cfg;
  }

  /** Get all skin configs */
  getAllSkinConfigs(): readonly SkinConfig[] {
    return SKIN_CONFIGS;
  }

  /** Get the color palette of the currently active skin */
  getActiveColors(): readonly string[] {
    return SKIN_CONFIGS[this.activeSkinId].colors;
  }

  /** Get the color for a specific creature level using the active skin */
  getCreatureColor(level: number): string {
    const colors = this.getActiveColors();
    // level is 1-11, colors index is 0-10
    return colors[Math.max(0, Math.min(level - 1, colors.length - 1))];
  }

  /** Get the face descriptor for a specific creature level using the active skin */
  getActiveFace(level: number): SpriteDescriptor {
    const sprites = SKIN_CONFIGS[this.activeSkinId].sprites;
    return sprites[Math.max(0, Math.min(level - 1, sprites.length - 1))];
  }

  // ─── Unlock & Active Skin ─────────────────────

  /** Get array of unlocked skin IDs */
  getUnlockedSkins(): number[] {
    return Array.from(this.unlockedSkins).sort((a, b) => a - b);
  }

  /** Check if a skin is unlocked */
  isSkinUnlocked(skinId: number): boolean {
    return this.unlockedSkins.has(skinId);
  }

  /** Set the active skin (must be unlocked) */
  setActiveSkin(skinId: number): void {
    if (!this.unlockedSkins.has(skinId)) {
      console.warn(`Skin ${skinId} not unlocked, cannot activate.`);
      return;
    }
    this.activeSkinId = skinId;
  }

  /** Get the currently active skin ID */
  getActiveSkin(): number {
    return this.activeSkinId;
  }

  // ─── Gacha System ─────────────────────────────

  /**
   * Spin the gacha machine.
   * Costs GACHA_COST coins. Legendary skins are excluded from the gacha.
   *
   * @returns GachaResult with skinId, whether it's new, and refund coins if duplicate
   */
  spinGacha(scoreSystem: ScoreSystem): GachaResult | null {
    if (!scoreSystem.spendCoins(GACHA_COST)) {
      return null; // not enough coins
    }

    const skinId = this.rollGacha();
    const isNew = !this.unlockedSkins.has(skinId);

    let refundCoins = 0;

    if (isNew) {
      this.unlockedSkins.add(skinId);
    } else {
      // Duplicate → refund
      const rarity = SKIN_CONFIGS[skinId].rarity;
      refundCoins = DUPLICATE_REFUND[rarity];
      scoreSystem.addCoins(refundCoins);
    }

    // Update pity counter
    const rolledRarity = SKIN_CONFIGS[skinId].rarity;
    if (rolledRarity === 'rare') {
      this.gachaPityCounter = 0; // reset pity
    } else {
      this.gachaPityCounter++;
    }

    return { skinId, isNew, refundCoins };
  }

  /**
   * Free gacha spin (e.g. from rewarded video). No coin cost.
   */
  spinGachaFree(): GachaResult {
    const skinId = this.rollGacha();
    const isNew = !this.unlockedSkins.has(skinId);

    let refundCoins = 0;

    if (isNew) {
      this.unlockedSkins.add(skinId);
    } else {
      // Duplicate refund is still tracked but coins are NOT added here
      // (caller can decide whether to grant coins)
      const rarity = SKIN_CONFIGS[skinId].rarity;
      refundCoins = DUPLICATE_REFUND[rarity];
    }

    // Update pity counter
    const rolledRarity = SKIN_CONFIGS[skinId].rarity;
    if (rolledRarity === 'rare') {
      this.gachaPityCounter = 0;
    } else {
      this.gachaPityCounter++;
    }

    return { skinId, isNew, refundCoins };
  }

  /** Get the current pity counter value */
  getPityCounter(): number {
    return this.gachaPityCounter;
  }

  /** Get the gacha cost */
  getGachaCost(): number {
    return GACHA_COST;
  }

  /**
   * Internal: roll a skin from the gacha pool.
   * Legendary skins are excluded. If pity threshold reached, force rare.
   */
  private rollGacha(): number {
    let targetRarity: SkinRarity;

    // Pity system: if pity counter >= PITY_THRESHOLD, guarantee rare
    if (this.gachaPityCounter >= PITY_THRESHOLD) {
      targetRarity = 'rare';
    } else {
      targetRarity = this.rollRarity();
    }

    // Get all gacha skins of the target rarity
    const candidates = SKIN_CONFIGS.filter(
      s => s.rarity === targetRarity && s.obtainMethod === 'gacha'
    );

    if (candidates.length === 0) {
      // Fallback: should not happen, but handle gracefully
      console.warn(`No gacha candidates for rarity: ${targetRarity}, falling back to common`);
      const fallback = SKIN_CONFIGS.filter(s => s.rarity === 'common' && s.obtainMethod === 'gacha');
      return fallback[Math.floor(Math.random() * fallback.length)].id;
    }

    // Pick a random skin from candidates
    return candidates[Math.floor(Math.random() * candidates.length)].id;
  }

  /** Roll a rarity from the gacha weights (no legendary) */
  private rollRarity(): SkinRarity {
    const roll = Math.random() * GACHA_TOTAL_WEIGHT;
    let cumulative = 0;

    for (const { rarity, weight } of GACHA_WEIGHTS) {
      cumulative += weight;
      if (roll < cumulative) {
        return rarity;
      }
    }

    return 'common'; // fallback
  }

  // ─── Legendary Skins (Ad-Only) ────────────────

  /**
   * Watch an ad toward unlocking a legendary skin.
   * @param skinId - must be a legendary skin (8 or 9)
   * @returns true if the skin was just unlocked (reached 5 ads)
   */
  watchAdForLegendary(skinId: number): boolean {
    const config = SKIN_CONFIGS[skinId];
    if (!config || config.rarity !== 'legendary') {
      console.warn(`Skin ${skinId} is not legendary.`);
      return false;
    }

    if (this.unlockedSkins.has(skinId)) {
      return false; // already unlocked
    }

    const current = this.legendaryProgress[skinId] ?? 0;
    const newProgress = current + 1;
    this.legendaryProgress[skinId] = newProgress;

    if (newProgress >= LEGENDARY_ADS_REQUIRED) {
      this.unlockedSkins.add(skinId);
      return true; // just unlocked!
    }

    return false;
  }

  /** Get progress toward a legendary skin (0-5) */
  getLegendaryProgress(skinId: number): number {
    return this.legendaryProgress[skinId] ?? 0;
  }

  /** Get the number of ads required to unlock a legendary skin */
  getLegendaryAdsRequired(): number {
    return LEGENDARY_ADS_REQUIRED;
  }

  // ─── Serialization ────────────────────────────

  /** Get serializable state (for SaveManager) */
  getState(): SkinManagerState {
    return {
      unlockedSkins: this.getUnlockedSkins(),
      activeSkinId: this.activeSkinId,
      gachaPityCounter: this.gachaPityCounter,
      legendaryProgress: { ...this.legendaryProgress },
    };
  }

  /** Load state from saved data */
  loadState(state: Partial<SkinManagerState>): void {
    if (state.unlockedSkins) {
      this.unlockedSkins = new Set(state.unlockedSkins);
      // Ensure skin 0 is always unlocked
      this.unlockedSkins.add(0);
    }

    if (state.activeSkinId !== undefined) {
      // Validate the skin is unlocked
      if (this.unlockedSkins.has(state.activeSkinId)) {
        this.activeSkinId = state.activeSkinId;
      } else {
        this.activeSkinId = 0; // fallback to default
      }
    }

    if (state.gachaPityCounter !== undefined) {
      this.gachaPityCounter = Math.max(0, state.gachaPityCounter);
    }

    if (state.legendaryProgress) {
      this.legendaryProgress = { ...state.legendaryProgress };
      // Ensure legendary skins exist in progress
      if (this.legendaryProgress[8] === undefined) this.legendaryProgress[8] = 0;
      if (this.legendaryProgress[9] === undefined) this.legendaryProgress[9] = 0;
    }
  }
}
