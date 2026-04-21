/**
 * TelegramSDK — Singleton wrapper for Telegram WebApp SDK
 * Replaces YandexSDK for Telegram Mini App deployment.
 *
 * Provides the same public interface as YandexSDK so that
 * all imports (`from './YandexSDK'`) keep working via re-export.
 */

// ─── Telegram WebApp type declarations ──────────────

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramCloudStorage {
  setItem(key: string, value: string, callback?: (err: Error | null, stored: boolean) => void): void;
  getItem(key: string, callback?: (err: Error | null, value: string) => void): void;
  getItems(keys: string[], callback?: (err: Error | null, values: Record<string, string>) => void): void;
  removeItem(key: string, callback?: (err: Error | null, removed: boolean) => void): void;
  getKeys(callback?: (err: Error | null, keys: string[]) => void): void;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  CloudStorage: TelegramCloudStorage;
  platform: string;
  version: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// ─── Player interface (mirrors YandexPlayer) ────────

interface TelegramPlayer {
  setData(data: Record<string, unknown>, flush?: boolean): Promise<void>;
  getData(keys?: string[]): Promise<Record<string, unknown>>;
  getUniqueID(): string;
  getName(): string;
}

// ─── CloudStorage Player ────────────────────────────

class CloudStoragePlayer implements TelegramPlayer {
  private tg: TelegramWebApp;
  private static SAVE_KEY = 'spinmerge_save';

  constructor(tg: TelegramWebApp) {
    this.tg = tg;
  }

  async setData(data: Record<string, unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const json = JSON.stringify(data);
        this.tg.CloudStorage.setItem(CloudStoragePlayer.SAVE_KEY, json, (err) => {
          if (err) {
            console.warn('[TelegramSDK] CloudStorage.setItem error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async getData(): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      try {
        this.tg.CloudStorage.getItem(CloudStoragePlayer.SAVE_KEY, (err, value) => {
          if (err) {
            console.warn('[TelegramSDK] CloudStorage.getItem error:', err);
            resolve({});
            return;
          }
          if (!value) {
            resolve({});
            return;
          }
          try {
            resolve(JSON.parse(value));
          } catch {
            resolve({});
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  getUniqueID(): string {
    return String(this.tg.initDataUnsafe.user?.id ?? 'tg-unknown');
  }

  getName(): string {
    const user = this.tg.initDataUnsafe.user;
    return user ? (user.first_name + (user.last_name ? ' ' + user.last_name : '')) : 'Player';
  }
}

// ─── Mock Player (fallback for dev without Telegram) ─

class MockPlayer implements TelegramPlayer {
  private store: Record<string, unknown> = {};

  async setData(data: Record<string, unknown>): Promise<void> {
    this.store = { ...this.store, ...data };
    console.log('[MockSDK] Player.setData:', Object.keys(data));
  }

  async getData(): Promise<Record<string, unknown>> {
    console.log('[MockSDK] Player.getData');
    return { ...this.store };
  }

  getUniqueID(): string {
    return 'mock-player-id';
  }

  getName(): string {
    return 'DevPlayer';
  }
}

// ─── TelegramSDK Singleton (exported as YandexSDK) ──

export class YandexSDK {
  private static instance: YandexSDK;

  private tg: TelegramWebApp | null = null;
  private mockMode = false;
  private player: TelegramPlayer | null = null;

  private constructor() {}

  static getInstance(): YandexSDK {
    if (!YandexSDK.instance) {
      YandexSDK.instance = new YandexSDK();
    }
    return YandexSDK.instance;
  }

  // ─── Initialization ──────────────────────────────

  async init(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        this.tg = window.Telegram.WebApp;
        this.tg.ready();
        this.tg.expand();
        this.player = new CloudStoragePlayer(this.tg);
        this.mockMode = false;
        console.log('[TelegramSDK] WebApp initialized, platform:', this.tg.platform);
      } else {
        throw new Error('Telegram WebApp not available');
      }
    } catch (err) {
      console.warn('[TelegramSDK] Not in Telegram, entering mock mode:', (err as Error).message);
      this.tg = null;
      this.mockMode = true;
      this.player = new MockPlayer();
    }
  }

  // ─── Lifecycle ───────────────────────────────────

  ready(): void {
    if (this.tg) {
      console.log('[TelegramSDK] ready()');
    } else {
      console.log('[MockSDK] LoadingAPI.ready()');
    }
  }

  gameplayStart(): void {
    console.log(this.tg ? '[TelegramSDK] gameplayStart()' : '[MockSDK] GameplayAPI.start()');
  }

  gameplayStop(): void {
    console.log(this.tg ? '[TelegramSDK] gameplayStop()' : '[MockSDK] GameplayAPI.stop()');
  }

  // ─── Environment ─────────────────────────────────

  getLanguage(): string {
    if (this.tg) {
      try {
        const lang = this.tg.initDataUnsafe.user?.language_code;
        if (lang) {
          // Telegram returns 'ru', 'en', 'uk', etc. Map to our supported set.
          if (lang.startsWith('ru') || lang.startsWith('uk') || lang.startsWith('be')) return 'ru';
          return 'en';
        }
      } catch { /* fallthrough */ }
    }
    return 'ru';
  }

  // ─── Player ──────────────────────────────────────

  async getPlayer(): Promise<TelegramPlayer> {
    return this.player!;
  }

  // ─── Raw SDK (always null → AdManager goes to mock/free mode) ──

  getRawSDK(): null {
    return null;
  }

  // ─── Status ──────────────────────────────────────

  isAvailable(): boolean {
    return this.tg !== null && !this.mockMode;
  }

  isMockMode(): boolean {
    return this.mockMode;
  }
}
