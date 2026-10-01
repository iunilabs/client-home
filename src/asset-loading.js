import {DefaultLoadingManager} from 'three';
import {assetUrl} from './asset-url.js';

// All existing Three loaders use this manager, including their decoder
// workers. Keeping path adaptation here preserves the baked skin contract.
export function installAssetBase() {
  DefaultLoadingManager.setURLModifier(assetUrl);
}
