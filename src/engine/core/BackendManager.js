import * as tf from "@tensorflow/tfjs";
import { logger } from "../utils/Logger.js";

export class BackendManager {

    static async initBackend(preferred = 'webgl') {
        const backendOrder = this._buildFallbackOrder(preferred);

        logger.info(`🔧 Backend initialization starting (preferred: ${preferred})`);

        for (const backend of backendOrder) {
            try {
                logger.debug(`  → Tentative: ${backend}...`);

                await tf.setBackend(backend);

                await tf.ready();

                const testTensor = tf.scalar(1.0);
                const result = testTensor.dataSync()[0];
                testTensor.dispose();

                if (result === 1.0) {
                    // logger.info(`✅ Backend activé: ${backend}`);
                    this._activeBackend = backend;
                    return backend;
                }
            } catch (error) {
                logger.warn(`  ✗ Échec ${backend}: ${error.message}`);
            }
        }

        logger.error("❌ Tous les backends ont échoué. Fallback forçé vers CPU.");
        await tf.setBackend('cpu');
        await tf.ready();
        this._activeBackend = 'cpu';
        return 'cpu';
    }

    static getCurrentBackend() {
        return tf.getBackend();
    }

    static async switchBackend(newBackend) {
        try {
            logger.debug(`Switching to backend: ${newBackend}`);
            await tf.setBackend(newBackend);
            await tf.ready();

            const testTensor = tf.scalar(1.0);
            testTensor.dispose();

            this._activeBackend = newBackend;
            logger.info(`✅ Backend switched to: ${newBackend}`);
            return true;
        } catch (error) {
            logger.error(`❌ Failed to switch to ${newBackend}: ${error.message}`);
            return false;
        }
    }

    static _buildFallbackOrder(preferred) {
        const allBackends = ['webgl', 'wasm', 'cpu'];

        const order = allBackends.filter(b => b !== preferred);
        return [preferred, ...order];
    }

    static _activeBackend = null;
}

export const backendManager = BackendManager;