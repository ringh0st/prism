import { readJson, writeJson } from './storage.js';

/*
 * The owner's testing switch (Me → account, admins only): every built-in level opens on this device, without
 * writing any fake progress, so stars, rewards and stats stay real. Players never see it.
 */
const KEY = 'prism.openAllLevels.v1';

export const areAllLevelsOpen = () => readJson(KEY, false) === true;

export const setAllLevelsOpen = (isOpen) => writeJson(KEY, Boolean(isOpen));
