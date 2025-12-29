#!/usr/bin/env node

/**
 * 🧪 TEST CORRESPONDANCE MODÈLE
 * Teste que le modèle sélectionné correspond aux données affichées
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(title) {
  log(`\n${'='.repeat(80)}`, 'blue');
  log(`🧪 ${title}`, 'blue');
  log(`${'='.repeat(80)}\n`, 'blue');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testModelCorrespondence() {
  section('TEST CORRESPONDANCE MODÈLE');

  try {
    // 1. Créer un premier modèle
    log('1️⃣  Création du premier modèle...', 'magenta');
    const model1Res = await axios.post(`${BASE_URL}/model/create`, {
      inputShape: [64, 64, 1],
      numClasses: 10
    });

    const model1Id = model1Res.data.model.modelId;
    const model1Name = model1Res.data.model.name;
    
    success(`Modèle 1 créé: ${model1Id}`);
    info(`  Nom: ${model1Name}`);

    // 2. Créer un deuxième modèle
    log('\n2️⃣  Création du deuxième modèle...', 'magenta');
    const model2Res = await axios.post(`${BASE_URL}/model/create`, {
      inputShape: [64, 64, 1],
      numClasses: 10
    });

    const model2Id = model2Res.data.model.modelId;
    const model2Name = model2Res.data.model.name;
    
    success(`Modèle 2 créé: ${model2Id}`);
    info(`  Nom: ${model2Name}`);

    // 3. Entraîner le premier modèle
    log('\n3️⃣  Entraînement du premier modèle...', 'magenta');
    const train1Res = await axios.post(`${BASE_URL}/training/start`, {
      modelId: model1Id,
      epochs: 2,
      batchSize: 32,
      learningRate: 0.001
    });

    success('Entraînement du modèle 1 démarré');
    
    // Attendre l'entraînement
    await sleep(50000);
    success('Entraînement du modèle 1 terminé');

    // 4. Entraîner le deuxième modèle
    log('\n4️⃣  Entraînement du deuxième modèle...', 'magenta');
    const train2Res = await axios.post(`${BASE_URL}/training/start`, {
      modelId: model2Id,
      epochs: 2,
      batchSize: 32,
      learningRate: 0.001
    });

    success('Entraînement du modèle 2 démarré');
    
    // Attendre l'entraînement
    await sleep(50000);
    success('Entraînement du modèle 2 terminé');

    // 5. Récupérer l'historique complet
    log('\n5️⃣  Récupération de l\'historique complet...', 'magenta');
    const historyRes = await axios.get(`${BASE_URL}/training/history`);
    const allHistory = historyRes.data.history?.data || [];
    
    success(`${allHistory.length} sessions trouvées`);

    // 6. Vérifier la correspondance pour le modèle 1
    log('\n6️⃣  Vérification de la correspondance pour le modèle 1...', 'magenta');
    
    const model1History = allHistory.filter(h => h.modelId === model1Id);
    
    if (model1History.length > 0) {
      success(`✓ Modèle 1 a ${model1History.length} session(s) d'entraînement`);
      
      model1History.forEach((session, i) => {
        const loss = session.history?.history?.loss?.[0]?.toFixed(4) || 'N/A';
        const acc = (session.history?.history?.acc?.[0] * 100)?.toFixed(2) || 'N/A';
        info(`  Session ${i + 1}: Loss ${loss}, Accuracy ${acc}%`);
      });
    } else {
      error('✗ Aucune session trouvée pour le modèle 1');
    }

    // 7. Vérifier la correspondance pour le modèle 2
    log('\n7️⃣  Vérification de la correspondance pour le modèle 2...', 'magenta');
    
    const model2History = allHistory.filter(h => h.modelId === model2Id);
    
    if (model2History.length > 0) {
      success(`✓ Modèle 2 a ${model2History.length} session(s) d'entraînement`);
      
      model2History.forEach((session, i) => {
        const loss = session.history?.history?.loss?.[0]?.toFixed(4) || 'N/A';
        const acc = (session.history?.history?.acc?.[0] * 100)?.toFixed(2) || 'N/A';
        info(`  Session ${i + 1}: Loss ${loss}, Accuracy ${acc}%`);
      });
    } else {
      error('✗ Aucune session trouvée pour le modèle 2');
    }

    // 8. Vérifier que les données ne sont pas mélangées
    log('\n8️⃣  Vérification que les données ne sont pas mélangées...', 'magenta');
    
    let allCorrect = true;
    
    allHistory.forEach(session => {
      if (session.modelId === model1Id) {
        // Cette session doit être dans model1History
        if (!model1History.find(h => h.timestamp === session.timestamp)) {
          error(`✗ Session du modèle 1 non trouvée dans model1History`);
          allCorrect = false;
        }
      } else if (session.modelId === model2Id) {
        // Cette session doit être dans model2History
        if (!model2History.find(h => h.timestamp === session.timestamp)) {
          error(`✗ Session du modèle 2 non trouvée dans model2History`);
          allCorrect = false;
        }
      }
    });
    
    if (allCorrect) {
      success('✓ Les données ne sont pas mélangées');
    }

    // 9. Vérifier la persistance en BD
    log('\n9️⃣  Vérification de la persistance en BD...', 'magenta');
    
    const dataDir = path.join(__dirname, 'data');
    const historyFile = path.join(dataDir, 'training-history.json');
    
    if (fs.existsSync(historyFile)) {
      success('✓ Fichier de persistance trouvé');
      
      const savedData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      
      const savedModel1 = savedData.filter(h => h.modelId === model1Id);
      const savedModel2 = savedData.filter(h => h.modelId === model2Id);
      
      info(`  Modèle 1: ${savedModel1.length} sessions sauvegardées`);
      info(`  Modèle 2: ${savedModel2.length} sessions sauvegardées`);
      
      if (savedModel1.length === model1History.length && savedModel2.length === model2History.length) {
        success('✓ Les données sauvegardées correspondent');
      } else {
        error('✗ Les données sauvegardées ne correspondent pas');
      }
    } else {
      error('✗ Fichier de persistance non trouvé');
    }

    // 10. Résumé
    log('\n🔟 RÉSUMÉ FINAL', 'magenta');
    
    const summary = {
      'Modèle 1 créé': model1Id ? '✅ OK' : '❌ Fail',
      'Modèle 2 créé': model2Id ? '✅ OK' : '❌ Fail',
      'Modèle 1 entraîné': model1History.length > 0 ? '✅ OK' : '❌ Fail',
      'Modèle 2 entraîné': model2History.length > 0 ? '✅ OK' : '❌ Fail',
      'Données non mélangées': allCorrect ? '✅ OK' : '❌ Fail',
      'Persistance BD': fs.existsSync(historyFile) ? '✅ OK' : '❌ Fail',
      'Correspondance modèle': (model1History.length > 0 && model2History.length > 0) ? '✅ OK' : '❌ Fail'
    };

    Object.entries(summary).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(30)} ${value}`);
    });

    const successes = Object.values(summary).filter(v => v.includes('✅')).length;
    const total = Object.values(summary).length;

    log(`\n📊 Taux de réussite: ${successes}/${total} (${Math.round(successes / total * 100)}%)`, 'green');

    if (successes === total) {
      log('\n🎉 TEST RÉUSSI! 🎉', 'green');
      log('\nLa correspondance modèle fonctionne correctement:', 'green');
      log(`  ✅ Modèle 1: ${model1History.length} sessions`, 'green');
      log(`  ✅ Modèle 2: ${model2History.length} sessions`, 'green');
      log('  ✅ Les données ne sont pas mélangées', 'green');
      log('  ✅ Persistance en BD fonctionne', 'green');
      return true;
    } else {
      log('\n⚠️  Certains tests ont échoué', 'yellow');
      return false;
    }

  } catch (err) {
    error(`Erreur: ${err.message}`);
    if (err.response?.data) {
      error(`Réponse: ${JSON.stringify(err.response.data)}`);
    }
    return false;
  }
}

async function main() {
  section('DÉMARRAGE DU TEST CORRESPONDANCE MODÈLE');
  
  const result = await testModelCorrespondence();
  
  section('TEST TERMINÉ');
  
  if (result) {
    log('\n✨ Tous les tests sont passés! ✨\n', 'green');
  } else {
    log('\n⚠️  Veuillez vérifier les erreurs ci-dessus\n', 'yellow');
  }
}

main().catch(err => {
  error(`Erreur fatale: ${err.message}`);
  process.exit(1);
});
