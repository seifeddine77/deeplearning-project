#!/usr/bin/env node

/**
 * 🎯 WORKFLOW COMPLET AVEC ATTENTE PROLONGÉE
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('\n🎯 WORKFLOW COMPLET AVEC ATTENTE PROLONGÉE\n');

    // 1. Créer un modèle
    console.log('1️⃣  Création du modèle...');
    const modelRes = await axios.post(`${BASE_URL}/model/create`, {
      inputShape: [64, 64, 1],
      numClasses: 10,
      modelType: 'lightweight'
    });
    const modelId = modelRes.data.model.modelId;
    console.log(`✅ Modèle créé: ${modelId}\n`);

    // 2. Démarrer l'entraînement
    console.log('2️⃣  Démarrage de l\'entraînement...');
    const trainingRes = await axios.post(`${BASE_URL}/training/start`, {
      modelId: modelId,
      epochs: 3,
      batchSize: 32
    });
    console.log(`✅ Entraînement démarré\n`);

    // 3. Attendre 15 secondes
    console.log('3️⃣  Attente de 15 secondes (entraînement + sauvegarde)...');
    for (let i = 15; i > 0; i--) {
      process.stdout.write(`\r⏳ ${i} secondes restantes...`);
      await new Promise(r => setTimeout(r, 1000));
    }
    console.log('\n✅ Attente terminée\n');

    // 4. Récupérer l'historique
    console.log('4️⃣  Récupération de l\'historique...');
    const historyRes = await axios.get(`${BASE_URL}/training/history`);
    const history = historyRes.data.history?.data || [];

    console.log(`✅ ${history.length} session(s) trouvée(s)\n`);

    if (history.length > 0) {
      const session = history[history.length - 1];
      console.log('📊 Dernière session d\'entraînement:');
      console.log(`   Model ID: ${session.modelId}`);
      console.log(`   Epochs: ${session.config?.epochs}`);
      console.log(`   Batch Size: ${session.config?.batchSize}`);
      
      if (session.history?.history?.loss) {
        const losses = session.history.history.loss;
        const accuracies = session.history.history.acc;
        console.log(`   Loss: ${losses[0]?.toFixed(4)} → ${losses[losses.length - 1]?.toFixed(4)}`);
        console.log(`   Accuracy: ${(accuracies[0] * 100)?.toFixed(2)}% → ${(accuracies[accuracies.length - 1] * 100)?.toFixed(2)}%\n`);
        
        console.log('✨ WORKFLOW COMPLET RÉUSSI! ✨\n');
      } else {
        console.log('   ⚠️  Données d\'historique incomplètes\n');
      }
    } else {
      console.log('❌ Aucune session d\'entraînement trouvée\n');
    }

  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
  }
}

test();
