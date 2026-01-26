export * from './configuration';
export * from './swagger.config';
export { config as appConfig } from './envs/default';
import { config as defaultConfig } from './envs/default';
export const config = defaultConfig; // Alias for main.ts compatibility
