/**
 * YandexSDK.ts — Re-export proxy for Telegram build
 *
 * All game modules import { YandexSDK } from './YandexSDK'.
 * This file re-exports the TelegramSDK class under the same name,
 * so zero changes are needed in main.ts, SaveManager, or any other file.
 */

export { YandexSDK } from './TelegramSDK';
