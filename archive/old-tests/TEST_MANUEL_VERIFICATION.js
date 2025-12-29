#!/usr/bin/env node

/**
 * 🧪 TEST DE VÉRIFICATION MANUELLE
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function test() {
  try {
    console.log('\n🧪 TEST DE VÉRIFICATION - Vérification de l\'erreur d\'entraînement\n');

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
      epochs: 2,
      batchSize: 32
    });
    console.log(`✅ Entraînement démarré\n`);

    // 3. Attendre 5 secondes
    console.log('3️⃣  Attente de 5 secondes...');
    await new Promise(r => setTimeout(r, 5000));
    console.log(`✅ Attente terminée\n`);

    // 4. Vérifier l'historique
    console.log('4️⃣  Vérification de l\'historique...');
    const historyRes = await axios.get(`${BASE_URL}/training/history`);
    const history = historyRes.data.history?.data || [];
    
    if (history.length > 0) {
      console.log(`✅ ${history.length} session(s) trouvée(s)`);
      console.log(`   Model ID: ${history[0].modelId}`);
      console.log(`   Config: ${JSON.stringify(history[0].config)}`);
    } else {
      console.log(`⚠️  Aucune session trouvée`);
    }

    console.log('\n✨ TEST TERMINÉ\n');

  } catch (error) {
    console.error(`\n❌ Erreur: ${error.message}`);
    if (error.response?.data) {
      console.error(`Réponse: ${JSON.stringify(error.response.data)}`);
    }
  }
}

test();
