/**
 * main.ts — Full game lifecycle and integration for Spin Merge
 * Agent 6: Integrator
 *
 * Wires all modules: SDK, i18n, managers, UI screens, navigation,
 * save/load, ads, upgrade application.
 */

import { Application, Container } from 'pixi.js';
import '../index.css';

// ─── Core Systems ───────────────────────────────────
import { GameScene } from './game/GameScene';
import { ScoreSystem } from './game/ScoreSystem';
import { UpgradeManager } from './meta/UpgradeManager';
import type { UpgradeId } from './meta/UpgradeManager';
import { SkinManager } from './meta/SkinManager';
import { SaveManager } from './meta/SaveManager';
import type { SaveData } from './meta/SaveManager';

// ─── SDK & Audio ────────────────────────────────────
import { YandexSDK } from './sdk/YandexSDK';
import { AdManager } from './sdk/AdManager';
import { AudioManager } from './audio/AudioManager';

// ─── UI Screens ─────────────────────────────────────
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { BackgroundSystem } from './ui/BackgroundSystem';
import { ShopScreen } from './ui/ShopScreen';
import { GachaScreen } from './ui/GachaScreen';
import { GameOverPopup } from './ui/GameOverPopup';
import { WardrobeScreen } from './ui/WardrobeScreen';
import { SettingsPopup } from './ui/SettingsPopup';

// ─── i18n ───────────────────────────────────────────
import { loadLocale } from './i18n/i18n';

// ─── App State ──────────────────────────────────────

interface AppState {
  app: Application;
  sdk: YandexSDK;
  scoreSystem: ScoreSystem;
  upgradeManager: UpgradeManager;
  skinManager: SkinManager;
  saveManager: SaveManager;
  adManager: AdManager;
  audioManager: AudioManager;
  highScore: number;
  language: string | null;
  // Active UI references (only one screen at a time)
  currentScreen: 'menu' | 'game' | 'shop' | 'gacha' | 'gameover' | 'wardrobe';
  gameScene: GameScene | null;
  hud: HUD | null;
  mainMenu: MainMenu | null;
  shopScreen: ShopScreen | null;
  gachaScreen: GachaScreen | null;
  gameOverPopup: GameOverPopup | null;
  wardrobeScreen: WardrobeScreen | null;
  settingsPopup: SettingsPopup | null;
  bgSystem: BackgroundSystem;
  gameRoot: Container;
  logicalWidth: number;
  logicalHeight: number;
  startGameCoins: number; // audit fix #8: moved from module global
  hasUsedContinue: boolean; // Fix 3: only 1 continue per game
  lastFreeGachaTime: number; // Fix 4: free gacha cooldown
}

// ─── Main Entry Point ───────────────────────────────

async function main(): Promise<void> {
  // 1. Initialize Yandex SDK
  const sdk = YandexSDK.getInstance();
  await sdk.init();

  // 3. Initialize PixiJS Application
  const app = new Application();
  await app.init({
    background: 0x1a1a2e,
    resizeTo: window,
    antialias: true,
  });

  const gameContainer = document.getElementById('game');
  if (gameContainer) {
    gameContainer.appendChild(app.canvas as HTMLCanvasElement);
  }

  // Create Universal Background and Game Root structure
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const bgSystem = new BackgroundSystem(sw, sh);
  const gameRoot = new Container();
  
  app.stage.addChildAt(bgSystem, 0);
  app.stage.addChildAt(gameRoot, 1);

  // Handle window resize (resolution scaling)
  window.addEventListener('resize', () => {
    const newW = window.innerWidth;
    const newH = window.innerHeight;
    bgSystem.resize(newW, newH);

    // Letterboxing scale for gameRoot
    const scale = Math.min(newW / sw, newH / sh);
    gameRoot.scale.set(scale);
    gameRoot.position.set(
      (newW - sw * scale) / 2,
      (newH - sh * scale) / 2
    );
  });

  // 4. Prevent context menu and text selection
  app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('selectstart', (e) => e.preventDefault());

  // 5. Create all managers
  const scoreSystem = new ScoreSystem();
  const upgradeManager = new UpgradeManager();
  const skinManager = new SkinManager();
  const saveManager = new SaveManager();
  const adManager = new AdManager();
  const audioManager = new AudioManager();

  // 6. Load saved data and apply to managers
  const saveData = await saveManager.load();
  applySaveData(saveData, scoreSystem, upgradeManager, skinManager, audioManager);

  // 6.5 Apply Language Override
  const playerLang = saveData.language ?? sdk.getLanguage();
  loadLocale(playerLang);

  // 7. Signal SDK ready
  sdk.ready();

  // 8. Build app state
  const state: AppState = {
    app,
    sdk,
    scoreSystem,
    upgradeManager,
    skinManager,
    saveManager,
    adManager,
    audioManager,
    highScore: saveData.highScore,
    language: saveData.language,
    currentScreen: 'menu',
    gameScene: null,
    hud: null,
    mainMenu: null,
    shopScreen: null,
    gachaScreen: null,
    gameOverPopup: null,
    wardrobeScreen: null,
    settingsPopup: null,
    bgSystem,
    gameRoot,
    logicalWidth: sw,
    logicalHeight: sh,
    startGameCoins: 0,
    hasUsedContinue: false,
    lastFreeGachaTime: 0,
  };

  // 9. Setup visibility handler for audio
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      audioManager.mute();
    } else {
      audioManager.unmute();
    }
  });

  // 10. Start background ticker & show main menu
  startGlobalTicker(state);
  showMainMenu(state);

  console.log('[SpinMerge] Application initialized successfully');
}

// Global ticker for background
function startGlobalTicker(state: AppState) {
  state.app.ticker.add((ticker) => {
    const dtSeconds = (ticker.deltaTime * 16.67) / 1000;
    state.bgSystem.update(dtSeconds);
  });
}

// ─── Save/Load Helpers ──────────────────────────────

function applySaveData(
  data: SaveData,
  scoreSystem: ScoreSystem,
  upgradeManager: UpgradeManager,
  skinManager: SkinManager,
  audioManager: AudioManager,
): void {
  scoreSystem.setCoins(data.coins);
  upgradeManager.loadUpgradeState(data.upgrades);
  upgradeManager.applyAllEffects(scoreSystem);
  skinManager.loadState({
    unlockedSkins: data.unlockedSkins,
    activeSkinId: data.activeSkinId,
    gachaPityCounter: data.gachaPityCounter,
    legendaryProgress: data.legendaryProgress,
  });
  audioManager.setSoundEnabled(data.soundEnabled);
}

function collectSaveData(state: AppState): SaveData {
  return {
    upgrades: state.upgradeManager.getUpgradeState(),
    coins: state.scoreSystem.coins,
    highScore: state.highScore,
    unlockedSkins: state.skinManager.getUnlockedSkins(),
    activeSkinId: state.skinManager.getActiveSkin(),
    gachaPityCounter: state.skinManager.getPityCounter(),
    legendaryProgress: {
      8: state.skinManager.getLegendaryProgress(8),
      9: state.skinManager.getLegendaryProgress(9),
    },
    soundEnabled: state.audioManager.soundEnabled,
    language: state.language,
  };
}

async function autoSave(state: AppState): Promise<void> {
  await state.saveManager.save(collectSaveData(state));
}

// ─── Screen Management ──────────────────────────────

function clearCurrentScreen(state: AppState): void {
  if (state.gameScene) {
    state.gameScene.destroy();
    state.gameScene = null;
  }
  if (state.hud) {
    state.hud.destroy();
    state.hud = null;
  }
  if (state.mainMenu) {
    state.mainMenu.destroy();
    state.mainMenu = null;
  }
  if (state.shopScreen) {
    state.shopScreen.destroy();
    state.shopScreen = null;
  }
  if (state.gachaScreen) {
    state.gachaScreen.destroy();
    state.gachaScreen = null;
  }
  if (state.wardrobeScreen) {
    state.wardrobeScreen.destroy();
    state.wardrobeScreen = null;
  }
  if (state.gameOverPopup) {
    state.gameOverPopup.destroy();
    state.gameOverPopup = null;
  }
  if (state.settingsPopup) {
    state.settingsPopup.destroy();
    state.settingsPopup = null;
  }
  // Clear gameRoot instead of app.stage
  state.gameRoot.removeChildren();
}

// ─── Main Menu ──────────────────────────────────────

function showMainMenu(state: AppState): void {
  clearCurrentScreen(state);
  state.currentScreen = 'menu';
  state.bgSystem.setMode('menu');
  state.sdk.gameplayStop();

  const sw = state.logicalWidth;
  const sh = state.logicalHeight;

  state.mainMenu = new MainMenu(sw, sh, state.highScore, state.scoreSystem.coins, {
    onPlay: () => {
      state.audioManager.play('button_click');
      startGame(state);
    },
    onShop: () => {
      state.audioManager.play('button_click');
      showShop(state);
    },
    onGacha: () => {
      state.audioManager.play('button_click');
      showGacha(state);
    },
    onWardrobe: () => {
      state.audioManager.play('button_click');
      showWardrobe(state);
    },
    onSettings: () => {
      state.audioManager.play('button_click');
      showSettings(state);
    },
  });

  state.gameRoot.addChild(state.mainMenu.container);
}

// ─── Start Game ─────────────────────────────────────

function startGame(state: AppState): void {
  clearCurrentScreen(state);
  state.currentScreen = 'game';
  state.bgSystem.setMode('gameplay');
  state.sdk.gameplayStart();

  // Reset score for new game (keep coins)
  state.scoreSystem.setScore(0);
  state.hasUsedContinue = false; // Fix 3: reset continue flag for new game

  // Track starting coins for earned coins calculation (audit fix #8)
  state.startGameCoins = state.scoreSystem.coins;

  const sw = state.logicalWidth;

  // Apply upgrades to scene parameters
  const barrelMult = state.upgradeManager.getEffect('barrelSize') as number;

  // Track combo
  let comboCount = 0;
  let lastMergeTime = 0;

  // Create game scene with economy systems
  state.gameScene = new GameScene(state.app, {
    onGameOver: (score, coins) => {
      handleGameOver(state, score, coins);
    },
    onMerge: (level, x, y) => {
      state.audioManager.play('merge_pop');
      state.audioManager.play('coin');

      // Score + coins (calculate first so we can use result)
      const result = state.scoreSystem.onMerge(level);
      if (state.hud) {
        state.hud.updateScore(result.newScore);
        state.hud.updateCoins(result.newTotalCoins);
        state.hud.showCoinPopup(result.earnedCoins, x, y - 30);
      }

      // Floating score VFX at merge point
      const skinColor = state.skinManager.getCreatureColor(level);
      const colorNum = parseInt(skinColor.replace('#', ''), 16);
      state.gameScene?.vfx.showFloatingScore(x, y - 20, result.earnedCoins, colorNum);

      // Background flash for all merges (stronger for higher levels)
      if (level >= 3) {
        state.bgSystem.triggerMergeFlash(level * 0.04);
      }

      // Combo check
      const now = performance.now();
      if (now - lastMergeTime < 500) {
        comboCount++;
        if (comboCount >= 2) {
          if (state.hud) state.hud.showCombo(comboCount);
          // VFX combo flash
          state.gameScene?.vfx.showComboFlash(x, y - 50, comboCount);
        }
      } else {
        comboCount = 1;
      }
      lastMergeTime = now;
    },
    onDrop: () => {
      state.audioManager.play('drop');
    },
  }, state.scoreSystem, state.upgradeManager, state.skinManager);

  // Apply barrel size upgrade
  state.gameScene.setBarrelRadiusMultiplier(barrelMult);

  state.gameRoot.addChild(state.gameScene.container);

  // Create HUD
  state.hud = new HUD(sw, {
    onPause: () => {
      // Simple pause: return to menu
      state.audioManager.play('button_click');
      
      // Save progress if player exits mid-game
      const currentScore = state.scoreSystem.score;
      if (currentScore > state.highScore) {
        state.highScore = currentScore;
      }
      autoSave(state);

      showMainMenu(state);
    },
    onSoundToggle: () => {
      const newState = !state.audioManager.soundEnabled;
      state.audioManager.setSoundEnabled(newState);
      autoSave(state);
    },
  });
  state.hud.updateCoins(state.scoreSystem.coins);
  state.hud.updateScore(0);
  state.hud.setSoundIcon(state.audioManager.soundEnabled);
  state.gameRoot.addChild(state.hud.container);

  // Start the physics
  state.gameScene.start();
}

// ─── Game Over ──────────────────────────────────────

function handleGameOver(state: AppState, score: number, _coins: number): void {
  state.currentScreen = 'gameover';
  state.bgSystem.setMode('static');
  state.sdk.gameplayStop();
  state.audioManager.play('gameover');

  // Increment games played for interstitial tracking
  state.adManager.incrementGamesPlayed();

  // Calculate earned coins for this game
  const coinsEarned = state.scoreSystem.coins - state.startGameCoins;

  // Check new record
  const isNewRecord = score > state.highScore;
  if (isNewRecord) {
    state.highScore = score;
  }

  // Auto-save
  autoSave(state);

  const sw = state.logicalWidth;
  const sh = state.logicalHeight;

  // Fix 3: allow continue only if not already used this game
  const canContinue = !state.hasUsedContinue;

  state.gameOverPopup = new GameOverPopup(sw, sh, score, coinsEarned, isNewRecord, {
    onContinue: (method: 'ad' | 'coins') => {
      if (state.hasUsedContinue) return; // Fix 3: block double-continue
      state.hasUsedContinue = true;

      const performContinue = () => {
        // Reward: show vortex VFX then remove top 5 creatures
        if (state.gameScene) {
          const barrel = state.gameScene.container;
          const cx = barrel.width / 2;
          const cy = barrel.height * 0.3;
          state.gameScene.vfx.showVortex(cx, cy, () => {
            state.gameScene?.removeTopCreatures(5);
          });
        }
        
        // Resume game
        state.audioManager.resumeAll();
        if (state.gameOverPopup) {
          state.gameRoot.removeChild(state.gameOverPopup.container);
          state.gameOverPopup.destroy();
          state.gameOverPopup = null;
        }
        if (state.gameScene) {
          state.gameScene.resume();
          state.currentScreen = 'game';
          state.sdk.gameplayStart();
        }
      };

      if (method === 'ad') {
        state.audioManager.pauseAll();
        state.adManager.showRewarded(
          () => { }, // We do reward in onClose to ensure smooth resume
          () => { performContinue(); },
        );
      } else if (method === 'coins') {
        const cost = 100;
        if (state.scoreSystem.coins >= cost) {
          state.scoreSystem.addCoins(-cost);
          state.audioManager.play('coin');
          if (state.hud) state.hud.updateCoins(state.scoreSystem.coins);
          autoSave(state);
          performContinue();
        }
      }
    },
    onRetry: () => {
      state.audioManager.play('button_click');
      // Show interstitial every 2nd game
      if (state.adManager.shouldShowInterstitial()) {
        state.audioManager.pauseAll();
        state.adManager.showInterstitial({
          onOpen: () => { state.audioManager.pauseAll(); },
          onClose: () => {
            state.audioManager.resumeAll();
            startGame(state);
          },
        });
      } else {
        startGame(state);
      }
    },
    onMenu: () => {
      state.audioManager.play('button_click');
      // Show interstitial every 2nd game
      if (state.adManager.shouldShowInterstitial()) {
        state.audioManager.pauseAll();
        state.adManager.showInterstitial({
          onOpen: () => { state.audioManager.pauseAll(); },
          onClose: () => {
            state.audioManager.resumeAll();
            showMainMenu(state);
          },
        });
      } else {
        showMainMenu(state);
      }
    },
  }, canContinue);

  state.gameRoot.addChild(state.gameOverPopup.container);
}

// ─── Shop Screen ────────────────────────────────────

function showShop(state: AppState): void {
  clearCurrentScreen(state);
  state.currentScreen = 'shop';
  state.bgSystem.setMode('static');

  const sw = state.logicalWidth;
  const sh = state.logicalHeight;

  state.shopScreen = new ShopScreen(sw, sh, state.upgradeManager, state.scoreSystem, {
    onBuy: (upgradeId: UpgradeId) => {
      const success = state.upgradeManager.tryUpgrade(upgradeId, state.scoreSystem);
      if (success) {
        state.audioManager.play('upgrade');
        state.shopScreen?.refresh();
        autoSave(state);
      }
    },
    onFreeAd: (upgradeId: UpgradeId) => {
      state.audioManager.pauseAll();
      state.adManager.showRewarded(
        () => {
          // Fix 1: Grant coins equal to 30% of the next level cost (instead of free upgrade)
          const nextCost = state.upgradeManager.getCost(upgradeId);
          if (nextCost > 0) {
            const grant = Math.max(50, Math.floor(nextCost * 0.3));
            state.scoreSystem.addCoins(grant);
            state.audioManager.play('coin');
          }
        },
        () => {
          state.audioManager.resumeAll();
          state.shopScreen?.refresh();
          autoSave(state);
        },
      );
    },
    onBack: () => {
      state.audioManager.play('button_click');
      showMainMenu(state);
    },
  });

  state.gameRoot.addChild(state.shopScreen.container);
}

// ─── Gacha Screen ───────────────────────────────────

function showGacha(state: AppState): void {
  clearCurrentScreen(state);
  state.currentScreen = 'gacha';
  state.bgSystem.setMode('static');

  const sw = state.logicalWidth;
  const sh = state.logicalHeight;

  state.gachaScreen = new GachaScreen(sw, sh, state.skinManager, state.scoreSystem, {
    onSpin: () => {
      const result = state.skinManager.spinGacha(state.scoreSystem);
      if (result) {
        state.audioManager.play('gacha_spin');
        autoSave(state);
      }
      return result;
    },
    onFreeSpin: () => {
      // Fix 4: Check 180-second cooldown for free gacha
      const now = Date.now();
      const cooldownMs = 180_000; // 3 minutes
      if (now - state.lastFreeGachaTime < cooldownMs) {
        const remainSec = Math.ceil((cooldownMs - (now - state.lastFreeGachaTime)) / 1000);
        console.log(`[Gacha] Free spin cooldown: ${remainSec}s remaining`);
        return; // blocked by cooldown
      }

      state.audioManager.pauseAll();
      state.adManager.showRewarded(
        () => {
          state.lastFreeGachaTime = Date.now(); // Fix 4: start cooldown
          // Reward: free gacha spin
          const result = state.skinManager.spinGachaFree();
          state.audioManager.play('gacha_spin');
          if (result.refundCoins > 0) {
            state.scoreSystem.addCoins(result.refundCoins);
          }
          // Show result in gacha screen and refresh UI (audit fix #6)
          if (state.gachaScreen) {
            state.gachaScreen.showResult(result);
            state.gachaScreen.refresh();
          }
        },
        () => {
          state.audioManager.resumeAll();
          autoSave(state);
        },
      );
    },
    onLegendaryAd: (skinId: number) => {
      state.audioManager.pauseAll();
      state.adManager.showRewarded(
        () => {
          // Reward: progress toward legendary
          const unlocked = state.skinManager.watchAdForLegendary(skinId);
          if (unlocked) {
            state.audioManager.play('gacha_spin');
          }
        },
        () => {
          state.audioManager.resumeAll();
          state.gachaScreen?.refresh();
          autoSave(state);
        },
      );
    },
    onBack: () => {
      state.audioManager.play('button_click');
      showMainMenu(state);
    },
  });

  state.gameRoot.addChild(state.gachaScreen.container);
}

// ─── Wardrobe Screen ────────────────────────────────

function showWardrobe(state: AppState): void {
  clearCurrentScreen(state);
  state.currentScreen = 'wardrobe';
  state.bgSystem.setMode('static');

  const sw = state.logicalWidth;
  const sh = state.logicalHeight;

  state.wardrobeScreen = new WardrobeScreen(sw, sh, state.skinManager, {
    onSelectSkin: (skinId: number) => {
      state.audioManager.play('button_click');
      state.skinManager.setActiveSkin(skinId);
      state.wardrobeScreen?.refresh();
      autoSave(state);
    },
    onBack: () => {
      state.audioManager.play('button_click');
      showMainMenu(state);
    },
  });

  state.gameRoot.addChild(state.wardrobeScreen.container);
}

// ─── Settings Popup ─────────────────────────────────

function showSettings(state: AppState): void {
  // If already open, ignore
  if (state.settingsPopup) return;
  
  const sw = state.logicalWidth;
  const sh = state.logicalHeight;

  state.settingsPopup = new SettingsPopup(
    sw, sh,
    state.audioManager.soundEnabled,
    {
      onSoundToggle: () => {
        const on = !state.audioManager.soundEnabled;
        state.audioManager.setSoundEnabled(on);
        state.audioManager.play('button_click');
        autoSave(state);
      },
      onLanguageToggle: async () => {
        state.audioManager.play('button_click');
        const currentLang = state.language ?? state.sdk.getLanguage();
        const nextLang = currentLang === 'ru' ? 'en' : 'ru';
        state.language = nextLang;
        await autoSave(state);
        window.location.reload();
      },
      onReset: async () => {
        state.audioManager.play('button_click');
        await state.saveManager.resetProgress();
        // Reload page to completely reset state
        window.location.reload();
      },
      onClose: () => {
        state.audioManager.play('button_click');
        if (state.settingsPopup) {
          state.gameRoot.removeChild(state.settingsPopup.container);
          state.settingsPopup.destroy();
          state.settingsPopup = null;
        }
      }
    }
  );

  state.gameRoot.addChild(state.settingsPopup.container);
}

// ─── Start ──────────────────────────────────────────

main().catch(console.error);
