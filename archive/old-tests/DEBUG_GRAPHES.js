#!/usr/bin/env node

/**
 * 🔍 DEBUG - Vérifier pourquoi les graphes ne s'affichent pas
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function debug() {
  console.log('\n🔍 DEBUG - Vérification des données pour les graphes\n');

  try {
    // 1. Vérifier les modèles
    console.log('1️⃣  Vérification des modèles...');
    const modelsRes = await axios.get(`${BASE_URL}/model/list`);
    console.log('Modèles trouvés:', modelsRes.data.models?.length || 0);
    if (modelsRes.data.models?.length > 0) {
      modelsRes.data.models.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.name} (ID: ${m.id})`);
      });
    }

    // 2. Vérifier l'historique d'entraînement
    console.log('\n2️⃣  Vérification de l\'historique d\'entraînement...');
    const historyRes = await axios.get(`${BASE_URL}/training/history`);
    const history = historyRes.data.history?.data || [];
    console.log('Sessions trouvées:', history.length);
    
    if (history.length > 0) {
      history.forEach((session, i) => {
        console.log(`\n  Session ${i + 1}:`);
        console.log(`    - Model ID: ${session.modelId}`);
        console.log(`    - Config: ${JSON.stringify(session.config)}`);
        console.log(`    - Timestamp: ${session.timestamp}`);
        
        if (session.history?.history) {
          console.log(`    - History data:`);
          console.log(`      - Loss: ${session.history.history.loss?.length || 0} points`);
          console.log(`      - Acc: ${session.history.history.acc?.length || 0} points`);
          console.log(`      - Val Loss: ${session.history.history.val_loss?.length || 0} points`);
          console.log(`      - Val Acc: ${session.history.history.val_acc?.length || 0} points`);
          
          if (session.history.history.loss?.length > 0) {
            console.log(`      - Loss values: ${session.history.history.loss.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...`);
          }
        }
      });
    } else {
      console.log('  ❌ Aucune session trouvée!');
    }

    // 3. Vérifier la structure complète
    console.log('\n3️⃣  Structure complète de la réponse:');
    console.log(JSON.stringify(historyRes.data, null, 2));

    // 4. Créer un nouveau modèle et entraîner
    console.log('\n4️⃣  Création d\'un nouveau modèle pour test...');
    const modelRes = await axios.post(`${BASE_URL}/model/create`, {
      inputShape: [64, 64, 1],
      numClasses: 10
    });
    const modelId = modelRes.data.model.modelId;
    console.log(`  ✅ Modèle créé: ${modelId}`);

    // 5. Démarrer l'entraînement
    console.log('\n5️⃣  Démarrage de l\'entraînement...');
    const trainRes = await axios.post(`${BASE_URL}/training/start`, {
      modelId: modelId,
      epochs: 2,
      batchSize: 32
    });
    console.log(`  ✅ Entraînement démarré`);

    // 6. Attendre et vérifier
    console.log('\n6️⃣  Attente de 30 secondes...');
    await new Promise(r => setTimeout(r, 30000));

    console.log('\n7️⃣  Vérification après entraînement...');
    const historyRes2 = await axios.get(`${BASE_URL}/training/history`);
    const history2 = historyRes2.data.history?.data || [];
    console.log(`  Sessions trouvées: ${history2.length}`);
    
    if (history2.length > 0) {
      const lastSession = history2[history2.length - 1];
      console.log(`\n  ✅ Dernière session:`);
      console.log(`    - Model ID: ${lastSession.modelId}`);
      console.log(`    - Loss: ${lastSession.history?.history?.loss?.[0]?.toFixed(4)} → ${lastSession.history?.history?.loss?.[lastSession.history?.history?.loss?.length - 1]?.toFixed(4)}`);
      console.log(`    - Acc: ${lastSession.history?.history?.acc?.[0]?.toFixed(4)} → ${lastSession.history?.history?.acc?.[lastSession.history?.history?.acc?.length - 1]?.toFixed(4)}`);
    }

    console.log('\n✅ DEBUG TERMINÉ\n');

  } catch (err) {
    console.error(`\n❌ Erreur: ${err.message}`);
    if (err.response?.data) {
      console.error(`Réponse: ${JSON.stringify(err.response.data, null, 2)}`);
    }
  }
}

debug();
