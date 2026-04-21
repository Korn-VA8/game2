/**
 * ScoreSystem — Score & Coin economy for Spin Merge
 * Agent 2: Economist
 */

/** Coin reward per creature level (index = level, 0 is unused) */
const COIN_REWARDS: readonly number[] = [0, 2, 5, 10, 20, 40, 80, 160, 320, 640, 1280, 3000];

export interface MergeResult {
  earnedCoins: number;
  newTotalCoins: number;
  newScore: number;
}

export class ScoreSystem {
  private _score = 0;
  private _coins = 0;
  private _coinMultiplier = 1.0;

  // ─── Getters ──────────────────────────────────────

  get score(): number {
    return this._score;
  }

  get coins(): number {
    return this._coins;
  }

  get coinMultiplier(): number {
    return this._coinMultiplier;
  }

  // ─── Setters ──────────────────────────────────────

  set coinMultiplier(value: number) {
    this._coinMultiplier = value;
  }

  /** Restore state (for SaveManager) */
  setCoins(value: number): void {
    this._coins = value;
  }

  setScore(value: number): void {
    this._score = value;
  }

  // ─── Core Methods ─────────────────────────────────

  /**
   * Called when two creatures merge.
   * @param creatureLevel — level of the creatures that merged (1-11)
   * @returns merge result with earned coins (after multiplier), new totals
   */
  onMerge(creatureLevel: number): MergeResult {
    const baseCoins = COIN_REWARDS[creatureLevel] ?? 0;
    const earnedCoins = Math.floor(baseCoins * this._coinMultiplier);

    this._score += baseCoins; // Score uses base coins (no multiplier)
    this._coins += earnedCoins;

    return {
      earnedCoins,
      newTotalCoins: this._coins,
      newScore: this._score,
    };
  }

  /** Add coins (e.g. from ad rewards) */
  addCoins(amount: number): void {
    this._coins += amount;
  }

  /**
   * Spend coins (e.g. for upgrades, gacha).
   * @returns true if purchase succeeded, false if insufficient funds
   */
  spendCoins(amount: number): boolean {
    if (this._coins < amount) return false;
    this._coins -= amount;
    return true;
  }

  // ─── Serialization ────────────────────────────────

  getState(): { score: number; coins: number } {
    return { score: this._score, coins: this._coins };
  }

  loadState(state: { score?: number; coins?: number }): void {
    if (state.score !== undefined) this._score = state.score;
    if (state.coins !== undefined) this._coins = state.coins;
  }
}
