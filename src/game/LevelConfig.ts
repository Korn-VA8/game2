/**
 * LevelConfig — Campaign level definitions for Spin Merge
 * 30 unique levels with escalating difficulty.
 *
 * All barrel dimensions are expressed as ratios of the logical screen
 * width/height so that every shape stays within iPhone 16 Pro safe area.
 *
 * barrelShape:
 *   'U'    — Standard barrel (straight walls, flat bottom)
 *   'V'    — Funnel (walls narrow toward bottom)
 *   'W'    — Split (triangular wedge on the floor divides the barrel in two)
 *   'cup'  — Wide top, narrow flat bottom
 *   'asym' — One wall straight, one slanted
 *
 * widthRatio / heightRatio:
 *   1.0 = full standard size.  0.6 = 60 % of standard, etc.
 *
 * obstacles:
 *   Array of static circles placed inside the barrel.
 *   Coordinates are fractions of the barrel's own width/height
 *   (0,0 = center, -0.5 = left/top edge, +0.5 = right/bottom edge).
 *
 * dropLevelCap:
 *   Maximum creature level that can be dropped.
 *   null = use default drop mutation table.
 *   1 = only level-1 creatures drop (hardcore).
 *
 * targetLevel:
 *   The creature level the player must create to win the level.
 */

export type BarrelShape = 'U' | 'V' | 'W' | 'cup' | 'asym';

export interface ObstacleDef {
  /** X position as fraction of barrel width (-0.5 to 0.5, 0 = center) */
  x: number;
  /** Y position as fraction of barrel height (-0.5 to 0.5, 0 = center) */
  y: number;
  /** Radius as fraction of barrel width */
  radiusFraction: number;
}

export interface LevelConfig {
  /** Level number (1-30) */
  id: number;
  /** Target creature level to collect for victory */
  targetLevel: number;
  /** Barrel shape */
  barrelShape: BarrelShape;
  /** Barrel width as ratio of standard (1.0 = default) */
  widthRatio: number;
  /** Barrel height as ratio of standard (1.0 = default) */
  heightRatio: number;
  /** Static obstacles inside the barrel */
  obstacles: ObstacleDef[];
  /** Max creature level that can drop. null = default table */
  dropLevelCap: number | null;
  /** Short description for UI */
  title_ru: string;
  title_en: string;
}

// ─── 30 Campaign Levels ──────────────────────────────

export const CAMPAIGN_LEVELS: LevelConfig[] = [

  // ═══════════════════════════════════════════════════
  // CHAPTER 1: LEARNING (Levels 1-5)
  // Standard U-barrel, gentle targets
  // ═══════════════════════════════════════════════════

  {
    id: 1,
    targetLevel: 4,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Первые шаги',
    title_en: 'First Steps',
  },
  {
    id: 2,
    targetLevel: 5,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Разогрев',
    title_en: 'Warm Up',
  },
  {
    id: 3,
    targetLevel: 5,
    barrelShape: 'U',
    widthRatio: 0.9,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Чуть теснее',
    title_en: 'A Bit Tighter',
  },
  {
    id: 4,
    targetLevel: 6,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Собери Лису',
    title_en: 'Build a Fox',
  },
  {
    id: 5,
    targetLevel: 6,
    barrelShape: 'U',
    widthRatio: 0.85,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Узкий путь',
    title_en: 'Narrow Path',
  },

  // ═══════════════════════════════════════════════════
  // CHAPTER 2: FUNNELS (Levels 6-10)
  // V-shaped barrels — creatures slide to center
  // ═══════════════════════════════════════════════════

  {
    id: 6,
    targetLevel: 6,
    barrelShape: 'V',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Воронка',
    title_en: 'The Funnel',
  },
  {
    id: 7,
    targetLevel: 7,
    barrelShape: 'V',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Глубокая воронка',
    title_en: 'Deep Funnel',
  },
  {
    id: 8,
    targetLevel: 7,
    barrelShape: 'V',
    widthRatio: 0.85,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Тесная воронка',
    title_en: 'Tight Funnel',
  },
  {
    id: 9,
    targetLevel: 7,
    barrelShape: 'cup',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Чаша',
    title_en: 'The Cup',
  },
  {
    id: 10,
    targetLevel: 8,
    barrelShape: 'V',
    widthRatio: 0.9,
    heightRatio: 0.9,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Мини-воронка',
    title_en: 'Mini Funnel',
  },

  // ═══════════════════════════════════════════════════
  // CHAPTER 3: OBSTACLES (Levels 11-15)
  // Static blockers inside the barrel
  // ═══════════════════════════════════════════════════

  {
    id: 11,
    targetLevel: 7,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [
      { x: 0, y: 0.1, radiusFraction: 0.12 },
    ],
    dropLevelCap: null,
    title_ru: 'Камень на дороге',
    title_en: 'Rock in the Way',
  },
  {
    id: 12,
    targetLevel: 8,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [
      { x: 0, y: 0, radiusFraction: 0.15 },
    ],
    dropLevelCap: null,
    title_ru: 'Центральный блок',
    title_en: 'Center Block',
  },
  {
    id: 13,
    targetLevel: 8,
    barrelShape: 'U',
    widthRatio: 0.9,
    heightRatio: 1.0,
    obstacles: [
      { x: -0.2, y: 0.15, radiusFraction: 0.1 },
      { x: 0.2, y: 0.15, radiusFraction: 0.1 },
    ],
    dropLevelCap: null,
    title_ru: 'Двойная преграда',
    title_en: 'Double Block',
  },
  {
    id: 14,
    targetLevel: 8,
    barrelShape: 'V',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [
      { x: 0, y: -0.1, radiusFraction: 0.12 },
    ],
    dropLevelCap: null,
    title_ru: 'Воронка с камнем',
    title_en: 'Funnel + Rock',
  },
  {
    id: 15,
    targetLevel: 9,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [
      { x: 0, y: 0, radiusFraction: 0.18 },
    ],
    dropLevelCap: null,
    title_ru: 'Огромный валун',
    title_en: 'Giant Boulder',
  },

  // ═══════════════════════════════════════════════════
  // CHAPTER 4: SPLIT BARRELS (Levels 16-20)
  // W-shape and asymmetric barrels
  // ═══════════════════════════════════════════════════

  {
    id: 16,
    targetLevel: 8,
    barrelShape: 'W',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Раскол',
    title_en: 'The Split',
  },
  {
    id: 17,
    targetLevel: 9,
    barrelShape: 'W',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Два мира',
    title_en: 'Two Worlds',
  },
  {
    id: 18,
    targetLevel: 8,
    barrelShape: 'asym',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Асимметрия',
    title_en: 'Asymmetry',
  },
  {
    id: 19,
    targetLevel: 9,
    barrelShape: 'asym',
    widthRatio: 0.85,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: null,
    title_ru: 'Кривой коридор',
    title_en: 'Crooked Path',
  },
  {
    id: 20,
    targetLevel: 9,
    barrelShape: 'W',
    widthRatio: 0.9,
    heightRatio: 0.9,
    obstacles: [
      { x: -0.25, y: -0.15, radiusFraction: 0.08 },
      { x: 0.25, y: -0.15, radiusFraction: 0.08 },
    ],
    dropLevelCap: null,
    title_ru: 'Раскол + Камни',
    title_en: 'Split + Rocks',
  },

  // ═══════════════════════════════════════════════════
  // CHAPTER 5: HARDCORE (Levels 21-25)
  // Drop cap restrictions — only low-level drops
  // ═══════════════════════════════════════════════════

  {
    id: 21,
    targetLevel: 9,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 0.85,
    obstacles: [],
    dropLevelCap: 2,
    title_ru: 'Только малыши',
    title_en: 'Only Small Ones',
  },
  {
    id: 22,
    targetLevel: 10,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: 2,
    title_ru: 'Длинный путь',
    title_en: 'The Long Way',
  },
  {
    id: 23,
    targetLevel: 10,
    barrelShape: 'V',
    widthRatio: 0.9,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: 2,
    title_ru: 'Воронка испытаний',
    title_en: 'Trial Funnel',
  },
  {
    id: 24,
    targetLevel: 10,
    barrelShape: 'U',
    widthRatio: 0.85,
    heightRatio: 0.85,
    obstacles: [
      { x: 0, y: 0.1, radiusFraction: 0.1 },
    ],
    dropLevelCap: 2,
    title_ru: 'Без пощады',
    title_en: 'No Mercy',
  },
  {
    id: 25,
    targetLevel: 10,
    barrelShape: 'W',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: 1,
    title_ru: 'Раскол: Хардкор',
    title_en: 'Split: Hardcore',
  },

  // ═══════════════════════════════════════════════════
  // CHAPTER 6: NIGHTMARE (Levels 26-30)
  // Maximum difficulty combinations
  // ═══════════════════════════════════════════════════

  {
    id: 26,
    targetLevel: 10,
    barrelShape: 'V',
    widthRatio: 0.8,
    heightRatio: 0.9,
    obstacles: [
      { x: 0, y: -0.1, radiusFraction: 0.1 },
    ],
    dropLevelCap: 1,
    title_ru: 'Кошмар: Воронка',
    title_en: 'Nightmare: Funnel',
  },
  {
    id: 27,
    targetLevel: 11,
    barrelShape: 'U',
    widthRatio: 1.0,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: 2,
    title_ru: 'Путь к Дракону',
    title_en: 'Road to Dragon',
  },
  {
    id: 28,
    targetLevel: 11,
    barrelShape: 'U',
    widthRatio: 0.85,
    heightRatio: 0.9,
    obstacles: [
      { x: 0, y: 0, radiusFraction: 0.12 },
    ],
    dropLevelCap: 2,
    title_ru: 'Финальное испытание',
    title_en: 'Final Trial',
  },
  {
    id: 29,
    targetLevel: 11,
    barrelShape: 'W',
    widthRatio: 0.9,
    heightRatio: 1.0,
    obstacles: [],
    dropLevelCap: 1,
    title_ru: 'Расколотый Дракон',
    title_en: 'Split Dragon',
  },
  {
    id: 30,
    targetLevel: 11,
    barrelShape: 'V',
    widthRatio: 0.75,
    heightRatio: 0.85,
    obstacles: [
      { x: -0.15, y: 0, radiusFraction: 0.08 },
      { x: 0.15, y: 0, radiusFraction: 0.08 },
    ],
    dropLevelCap: 1,
    title_ru: 'НЕВОЗМОЖНО',
    title_en: 'IMPOSSIBLE',
  },
];

/** Get a campaign level config by id (1-30) */
export function getCampaignLevel(id: number): LevelConfig | null {
  return CAMPAIGN_LEVELS.find(l => l.id === id) ?? null;
}
