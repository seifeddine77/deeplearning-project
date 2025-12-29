#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function debug() {
  try {
    console.log('1️⃣  Créer un modèle...');
    const modelRes = await axios.post(`${BASE_URL}/model/create`, {
      inputShape: [64, 64, 1],
      numClasses: 10
    });

    const modelId = modelRes.data.model.modelId;
    console.log(`✅ Modèle créé: ${modelId}`);
    console.log(`   Réponse complète:`, JSON.stringify(modelRes.data, null, 2));

    console.log('\n2️⃣  Entraîner le modèle...');
    const trainRes = await axios.post(`${BASE_URL}/training/start`, {
      modelId: modelId,
      epochs: 2,
      batchSize: 32,
      learningRate: 0.001
    });

    console.log(`✅ Entraînement démarré`);
    console.log(`   Réponse complète:`, JSON.stringify(trainRes.data, null, 2));

    console.log('\n3️⃣  Attendre 50 secondes...');
    await new Promise(resolve => setTimeout(resolve, 50000));

    console.log('\n4️⃣  Récupérer l\'historique...');
    const historyRes = await axios.get(`${BASE_URL}/training/history`);
    const history = historyRes.data.history?.data || [];

    console.log(`✅ ${history.length} sessions trouvées`);
    
    history.forEach((h, i) => {
      console.log(`\n   Session ${i + 1}:`);
      console.log(`     modelId: ${h.modelId}`);
      console.log(`     Cherché: ${modelId}`);
      console.log(`     Match: ${h.modelId === modelId}`);
      console.log(`     Loss: ${h.history?.history?.loss?.[0]}`);
      console.log(`     Acc: ${h.history?.history?.acc?.[0]}`);
    });

    console.log('\n5️⃣  Vérifier le fichier de persistance...');
    const historyFile = path.join(__dirname, 'data', 'training-history.json');
    if (fs.existsSync(historyFile)) {
      const savedData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      console.log(`✅ Fichier trouvé avec ${savedData.length} sessions`);
      
      savedData.forEach((h, i) => {
        console.log(`\n   Session ${i + 1}:`);
        console.log(`     modelId: ${h.modelId}`);
        console.log(`     Cherché: ${modelId}`);
        console.log(`     Match: ${h.modelId === modelId}`);
      });
    }

  } catch (err) {
    console.error('❌ Erreur:', err.message);
    if (err.response?.data) {
      console.error('   Réponse:', err.response.data);
    }
  }
}

debug();
