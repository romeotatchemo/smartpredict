
window.workerDemo = {
    mlWorker: null,
    // Créer une instance du Web Worker
    // Remarque: le chemin est relatif à index.html
    createInstance() {
        this.mlWorker = new Worker(
            new URL('/src/engine/workers/ml.worker.js', import.meta.url),
            { type: 'module' }  // CRUCIAL: déclarer comme module pour utiliser imports ES
        );

        console.log('🚀 Worker instance created. Waiting for ready message...');

        // Écouter les messages entrants
        this.mlWorker.onmessage = (event) => {
            const { type, prediction, message, processingTimeMs, memoryInfo } = event.data;

            if (type === 'ready') {
                console.log('✅ WORKER READY!', event.data);
            } else if (type === 'result') {
                console.log('📊 PREDICTION RESULT:', prediction);
                console.log(`   Processing time: ${processingTimeMs}ms`);
                if (memoryInfo) {
                    console.log(`   Memory: ${memoryInfo.numTensors} tensors, ${(memoryInfo.numBytes / 1024 / 1024).toFixed(1)} MB`);
                }
            } else if (type === 'error') {
                console.error('❌ WORKER ERROR:', message);
            } else {
                console.log(`📨 Message type: ${type}`, event.data);
            }
        };

        // Écouter les erreurs du worker
        this.mlWorker.onerror = (error) => {
            console.error('❌ Worker error:', error.message, error.filename, error.lineno);
        };
    },

    // Créer un profil de test avec 16 features
    // (temporal + categorical, comme dans les inférences churn normales)
    createTestProfile() {
        const singleStep = [
            // Temporal features (4):
            100,        // deltaTime
            0.5,        // velocity
            0.1,        // acceleration
            0.8,        // relativeTime

            // Categorical features one-hot encoded (12):
            1, 0, 0, 0, 0, 0, 0, 0,  // page (first page)
            1, 0, 0, 0,               // action (first action)
        ];
        // Construire 12 timesteps
        const testProfile = Array.from(
            { length: 12 },
            () => [...singleStep]
        );

        console.log('📤 Sending predict message to worker with test profile...');

        this.mlWorker.postMessage({
            type: 'predict-churn',
            messageId: Math.random().toString(36),
            data: {
                features: testProfile,
                startTime: Date.now(),
            },
        });

        console.log('⏳ Waiting for result...');
    },

    // Boucle de 10 prédictions consécutives
    async predictionsTest() {
        console.log('🔄 Running 10 predictions to check memory stability...');

        const memoryResults = [];

        for (let i = 0; i < 10; i++) {
            const testProfile = [100, 0.5, 0.1, 0.8, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
            const testProfiles = Array.from(
                { length: 12 },
                () => [...testProfile]
            );

            this.mlWorker.postMessage({
                type: 'predict-churn',
                messageId: `test-${i}`,
                data: {
                    features: testProfiles,
                    startTime: Date.now(),
                },
            });

            // Ajouter un petit délai entre les messages
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('✅ All 10 prediction messages sent. Monitor the console for results.');
    }
}