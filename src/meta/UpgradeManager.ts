/**
 * UpgradeManager — 5-branch upgrade tree for Spin Merge
 * Agent 2: Economist
 *
 * Each branch has 10 levels (1 = base, 2-10 = purchasable).
 * All prices and effects copied verbatim from the GDD.
 */

import { ScoreSystem } from '../game/ScoreSystem';

// ─── Type Definitions ───────────────────────────────

export type UpgradeId = 'barrelSize' | 'spinEnergy' | 'dropMutation' | 'magnetism' | 'coinMultiplier';

interface UpgradeBranch {
  prices: readonly number[];           // index 0 = level 1 cost (always 0)
  effects: readonly any[];             // index 0 = level 1 effect
}

interface SpinEnergyEffect {
  maxCharges: number;
  regenInterval: number; // seconds, 0 = no auto-regen
}

/** Drop probability table: level → { creatureLevel: chancePercent } */
type DropTable = Record<number, number>;

// ─── Upgrade Data (from GDD) ─────────────────────────

const BARREL_SIZE: UpgradeBranch = {
  prices:  [0, 500, 900, 1600, 3000, 5500, 10000, 18000, 32000, 60000],
  effects: [1.0, 1.05, 1.10, 1.15, 1.20, 1.25, 1.28, 1.32, 1.36, 1.40],
};

const SPIN_ENERGY: UpgradeBranch = {
  prices:  [0, 400, 700, 1300, 2500, 4500, 8000, 15000, 27000, 50000],
  effects: [
    { maxCharges: 3, regenInterval: 0 },
    { maxCharges: 4, regenInterval: 0 },
    { maxCharges: 5, regenInterval: 0 },
    { maxCharges: 5, regenInterval: 60 },
    { maxCharges: 6, regenInterval: 60 },
    { maxCharges: 6, regenInterval: 45 },
    { maxCharges: 7, regenInterval: 45 },
    { maxCharges: 7, regenInterval: 30 },
    { maxCharges: 8, regenInterval: 30 },
    { maxCharges: 8, regenInterval: 20 },
  ] as SpinEnergyEffect[],
};

const DROP_MUTATION: UpgradeBranch = {
  prices:  [0, 600, 1100, 2000, 3500, 6500, 12000, 22000, 40000, 75000],
  effects: [
    { 1: 50, 2: 50 },                              // level 1
    { 1: 45, 2: 45, 3: 10 },                       // level 2
    { 1: 40, 2: 40, 3: 20 },                       // level 3
    { 1: 32, 2: 33, 3: 30, 4: 5 },                 // level 4
    { 1: 25, 2: 25, 3: 40, 4: 10 },                // level 5
    { 1: 17, 2: 18, 3: 50, 4: 15 },                // level 6
    { 1: 12, 2: 13, 3: 50, 4: 20, 5: 5 },          // level 7
    { 1: 7,  2: 8,  3: 50, 4: 25, 5: 10 },         // level 8
    { 1: 2,  2: 3,  3: 50, 4: 30, 5: 15 },         // level 9
    { 1: 0,  2: 0,  3: 45, 4: 35, 5: 20 },         // level 10
  ] as DropTable[],
};

const MAGNETISM: UpgradeBranch = {
  prices:  [0, 800, 1500, 2700, 5000, 9000, 16000, 29000, 52000, 95000],
  effects: [0, 5, 10, 16, 22, 30, 38, 48, 58, 70],  // attraction radius in px
};

const COIN_MULTIPLIER: UpgradeBranch = {
  prices:  [0, 300, 550, 1000, 1800, 3200, 5800, 10500, 19000, 35000],
  effects: [1.0, 1.15, 1.3, 1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.8],
};

const BRANCHES: Record<UpgradeId, UpgradeBranch> = {
  barrelSize:     BARREL_SIZE,
  spinEnergy:     SPIN_ENERGY,
  dropMutation:   DROP_MUTATION,
  magnetism:      MAGNETISM,
  coinMultiplier: COIN_MULTIPLIER,
};

const MAX_LEVEL = 10;

// ─── Upgrade State (serializable) ────────────────────

export interface UpgradeState {
  barrelSize: number;
  spinEnergy: number;
  dropMutation: number;
  magnetism: number;
  coinMultiplier: number;
}

// ─── UpgradeManager Class ────────────────────────────

export class UpgradeManager {
  /** Current levels (1-10), one per branch */
  private levels: Record<UpgradeId, number> = {
    barrelSize: 1,
    spinEnergy: 1,
    dropMutation: 1,
    magnetism: 1,
    coinMultiplier: 1,
  };

  // ─── Read Methods ─────────────────────────────────

  /** Get the current level of an upgrade branch (1-10) */
  getLevel(upgradeId: UpgradeId): number {
    return this.levels[upgradeId];
  }

  /** Get the cost to upgrade to the next level. Returns -1 if already max. */
  getCost(upgradeId: UpgradeId): number {
    const currentLevel = this.levels[upgradeId];
    if (currentLevel >= MAX_LEVEL) return -1;
    return BRANCHES[upgradeId].prices[currentLevel]; // prices[currentLevel] = cost of level currentLevel+1
  }

  /**
   * Get the current effect value of an upgrade branch.
   * Return type depends on upgrade:
   *  - barrelSize: number (radius multiplier)
   *  - spinEnergy: SpinEnergyEffect
   *  - dropMutation: DropTable
   *  - magnetism: number (px)
   *  - coinMultiplier: number
   */
  getEffect(upgradeId: UpgradeId): any {
    const lvl = this.levels[upgradeId];
    return BRANCHES[upgradeId].effects[lvl - 1];
  }

  /** Check if an upgrade is at max level */
  isMaxLevel(upgradeId: UpgradeId): boolean {
    return this.levels[upgradeId] >= MAX_LEVEL;
  }

  // ─── Write Methods ────────────────────────────────

  /**
   * Try to purchase the next level of an upgrade.
   * @returns true if purchase succeeded, false if already max or insufficient coins.
   */
  tryUpgrade(upgradeId: UpgradeId, scoreSystem: ScoreSystem): boolean {
    const cost = this.getCost(upgradeId);
    if (cost < 0) return false; // already max

    if (!scoreSystem.spendCoins(cost)) return false; // not enough coins

    this.levels[upgradeId]++;

    // If coinMultiplier branch was upgraded, sync the multiplier to ScoreSystem
    if (upgradeId === 'coinMultiplier') {
      scoreSystem.coinMultiplier = this.getEffect('coinMultiplier') as number;
    }

    return true;
  }

  /**
   * Apply a free upgrade (e.g. from rewarded video).
   * @returns true if upgrade was applied, false if already max.
   */
  freeUpgrade(upgradeId: UpgradeId, scoreSystem: ScoreSystem): boolean {
    if (this.isMaxLevel(upgradeId)) return false;
    this.levels[upgradeId]++;

    if (upgradeId === 'coinMultiplier') {
      scoreSystem.coinMultiplier = this.getEffect('coinMultiplier') as number;
    }

    return true;
  }

  // ─── Drop Mutation ────────────────────────────────

  /**
   * Roll the next creature level based on dropMutation upgrade.
   * Gives a uniform random chance across all unlocked levels (up to the max level indicated by the drop mutation table).
   */
  rollNextCreatureLevel(): number {
    const dropTable = this.getEffect('dropMutation') as DropTable;
    // Weighted random using the probability table
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const [levelStr, chance] of Object.entries(dropTable)) {
      cumulative += chance as number;
      if (roll < cumulative) {
        return Number(levelStr);
      }
    }
    // Fallback: return the last level in the table
    const levels = Object.keys(dropTable).map(Number);
    return levels[levels.length - 1];
  }

  // ─── Serialization ────────────────────────────────

  /** Get levels of all 5 branches (for SaveManager) */
  getUpgradeState(): UpgradeState {
    return { ...this.levels };
  }

  /** Restore upgrade levels from saved state */
  loadUpgradeState(state: Partial<UpgradeState>): void {
    for (const key of Object.keys(this.levels) as UpgradeId[]) {
      if (state[key] !== undefined) {
        const val = state[key]!;
        this.levels[key] = Math.max(1, Math.min(val, MAX_LEVEL));
      }
    }
  }

  /**
   * Apply all current upgrade effects to game systems.
   * Call this after loading state to sync everything.
   */
  applyAllEffects(scoreSystem: ScoreSystem): void {
    scoreSystem.coinMultiplier = this.getEffect('coinMultiplier') as number;
  }

  // ─── Helper: Get all upgrade info for UI ──────────

  /** Get displayable info for all upgrades (for ShopScreen) */
  getAllUpgradeInfo(): Array<{
    id: UpgradeId;
    level: number;
    maxLevel: number;
    cost: number;
    effect: any;
    isMax: boolean;
  }> {
    const ids: UpgradeId[] = ['barrelSize', 'dropMutation', 'magnetism', 'coinMultiplier'];
    return ids.map(id => ({
      id,
      level: this.getLevel(id),
      maxLevel: MAX_LEVEL,
      cost: this.getCost(id),
      effect: this.getEffect(id),
      isMax: this.isMaxLevel(id),
    }));
  }
}
