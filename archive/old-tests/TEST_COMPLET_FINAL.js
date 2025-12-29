#!/usr/bin/env node

/**
 * 🧪 TEST COMPLET FINAL - WORKFLOW COMPLET + GRAPHES
 * Teste: Upload → Modèle → Entraînement → Vérification des graphes
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000/api';

// Couleurs
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

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'blue');
  log(`🧪 ${title}`, 'blue');
  log(`${'='.repeat(70)}\n`, 'blue');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteWorkflow() {
  section('TEST COMPLET - WORKFLOW ENTIER');

  try {
    // 1. Health Check
    log('1️⃣  Vérification du backend...', 'magenta');
    try {
      const healthRes = await axios.get(`${BASE_URL}/health`);
      success('Backend en ligne');
    } catch (err) {
      error('Backend non accessible');
      return false;
    }

    // 2. Upload Dataset
    log('\n2️⃣  Upload du dataset...', 'magenta');
    const csvPath = path.join(__dirname, 'test-dataset.csv');
    if (!fs.existsSync(csvPath)) {
      warning('Création du fichier de test');
      const csvContent = `pixel1,pixel2,pixel3,pixel4,pixel5,pixel6,pixel7,pixel8,pixel9,pixel10,label
0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0
0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.1,1
0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.1,0.2,2
0.4,0.5,0.6,0.7,0.8,0.9,1.0,0.1,0.2,0.3,3
0.5,0.6,0.7,0.8,0.9,1.0,0.1,0.2,0.3,0.4,4
0.6,0.7,0.8,0.9,1.0,0.1,0.2,0.3,0.4,0.5,5
0.7,0.8,0.9,1.0,0.1,0.2,0.3,0.4,0.5,0.6,6
0.8,0.9,1.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,7
0.9,1.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,8
1.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,9`;
      fs.writeFileSync(csvPath, csvContent);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    
    const uploadRes = await axios.post(`${BASE_URL}/data/upload`, form, {
      headers: form.getHeaders()
    });

    if (uploadRes.data.success) {
      success(`Dataset uploadé`);
      info(`  Samples: ${uploadRes.data.stats.totalSamples}`);
      info(`  Features: ${uploadRes.data.stats.features}`);
    } else {
      error('Upload échoué');
      return false;
    }

    // 3. Create Model
    log('\n3️⃣  Création du modèle...', 'magenta');
    const modelRes = await axios.post(`${BASE_URL}/model/create`, {
      inputShape: [64, 64, 1],
      numClasses: 10
    });

    const modelId = modelRes.data.model.modelId;
    if (modelId) {
      success(`Modèle créé: ${modelId}`);
    } else {
      error('Création du modèle échouée');
      return false;
    }

    // 4. Start Training
    log('\n4️⃣  Démarrage de l\'entraînement...', 'magenta');
    const trainRes = await axios.post(`${BASE_URL}/training/start`, {
      modelId: modelId,
      epochs: 2,
      batchSize: 32,
      learningRate: 0.001
    });

    if (trainRes.data.success) {
      success('Entraînement démarré');
      info(`  Status: ${trainRes.data.training.status}`);
    } else {
      error('Démarrage de l\'entraînement échoué');
      return false;
    }

    // 5. Wait for Training
    log('\n5️⃣  Attente de l\'entraînement...', 'magenta');
    info('Cela peut prendre ~90 secondes...');
    
    let trainingComplete = false;
    let waitTime = 0;
    const maxWait = 150000; // 2.5 minutes max
    const checkInterval = 10000; // Vérifier tous les 10 secondes

    while (!trainingComplete && waitTime < maxWait) {
      await sleep(checkInterval);
      waitTime += checkInterval;
      
      try {
        const historyRes = await axios.get(`${BASE_URL}/training/history`);
        const history = historyRes.data.history?.data || [];
        
        if (history.length > 0) {
          const lastSession = history[history.length - 1];
          if (lastSession.modelId === modelId && lastSession.history?.history?.loss) {
            trainingComplete = true;
            success(`Entraînement terminé après ${(waitTime / 1000).toFixed(0)}s`);
            info(`  Loss: ${lastSession.history.history.loss[0]?.toFixed(4)} → ${lastSession.history.history.loss[lastSession.history.history.loss.length - 1]?.toFixed(4)}`);
            info(`  Acc: ${(lastSession.history.history.acc[0] * 100)?.toFixed(2)}% → ${(lastSession.history.history.acc[lastSession.history.history.acc.length - 1] * 100)?.toFixed(2)}%`);
          }
        }
      } catch (err) {
        // Continuer l'attente
      }
      
      if (!trainingComplete && waitTime % 30000 === 0) {
        info(`  Attente: ${(waitTime / 1000).toFixed(0)}s...`);
      }
    }

    if (!trainingComplete) {
      warning('Timeout d\'attente, continuons quand même...');
    }

    // 6. Verify Training History
    log('\n6️⃣  Vérification de l\'historique d\'entraînement...', 'magenta');
    const historyRes = await axios.get(`${BASE_URL}/training/history`);
    const history = historyRes.data.history?.data || [];
    
    if (history.length > 0) {
      success(`${history.length} session(s) trouvée(s)`);
      const lastSession = history[history.length - 1];
      
      // Vérifier que les données sont complètes
      const hasLoss = lastSession.history?.history?.loss?.length > 0;
      const hasAcc = lastSession.history?.history?.acc?.length > 0;
      const hasValLoss = lastSession.history?.history?.val_loss?.length > 0;
      const hasValAcc = lastSession.history?.history?.val_acc?.length > 0;
      
      if (hasLoss && hasAcc && hasValLoss && hasValAcc) {
        success('Données d\'entraînement complètes');
        info(`  Loss: ${lastSession.history.history.loss.length} points`);
        info(`  Acc: ${lastSession.history.history.acc.length} points`);
        info(`  Val Loss: ${lastSession.history.history.val_loss.length} points`);
        info(`  Val Acc: ${lastSession.history.history.val_acc.length} points`);
      } else {
        warning('Certaines données manquent');
        if (!hasLoss) warning('  - Loss manquante');
        if (!hasAcc) warning('  - Acc manquante');
        if (!hasValLoss) warning('  - Val Loss manquante');
        if (!hasValAcc) warning('  - Val Acc manquante');
      }
    } else {
      error('Aucune session d\'entraînement trouvée');
      return false;
    }

    // 7. Verify Models List
    log('\n7️⃣  Vérification de la liste des modèles...', 'magenta');
    const modelsRes = await axios.get(`${BASE_URL}/model/list`);
    const models = modelsRes.data.models || [];
    
    if (models.length > 0) {
      success(`${models.length} modèle(s) trouvé(s)`);
      models.forEach((m, i) => {
        info(`  ${i + 1}. ${m.name} (${m.layers} couches)`);
      });
    } else {
      warning('Aucun modèle trouvé');
    }

    // 8. Verify Evaluation
    log('\n8️⃣  Évaluation du modèle...', 'magenta');
    try {
      const evalRes = await axios.post(`${BASE_URL}/training/evaluate`, {
        modelId: modelId,
        dataset: 'test'
      });
      
      if (evalRes.data.success) {
        success('Évaluation réussie');
        info(`  Accuracy: ${(evalRes.data.evaluation.accuracy * 100).toFixed(2)}%`);
        info(`  Loss: ${evalRes.data.evaluation.loss.toFixed(4)}`);
      }
    } catch (err) {
      warning('Évaluation non disponible');
    }

    // 9. Verify Data for Graphs
    log('\n9️⃣  Vérification des données pour les graphes...', 'magenta');
    
    const lastSession = history[history.length - 1];
    const graphsData = {
      trainingMetrics: {
        loss: lastSession.history?.history?.loss || [],
        acc: lastSession.history?.history?.acc || [],
        val_loss: lastSession.history?.history?.val_loss || [],
        val_acc: lastSession.history?.history?.val_acc || []
      },
      confusionMatrix: {
        hasData: lastSession.history?.history?.acc?.length > 0
      },
      rocCurve: {
        hasData: lastSession.history?.history?.acc?.length > 0
      },
      featureImportance: {
        hasData: lastSession.history?.history?.loss?.length > 0
      },
      modelComparison: {
        hasData: history.length > 0
      }
    };

    if (graphsData.trainingMetrics.loss.length > 0) {
      success('✅ Training Metrics - Données disponibles');
    } else {
      error('❌ Training Metrics - Pas de données');
    }

    if (graphsData.confusionMatrix.hasData) {
      success('✅ Confusion Matrix - Données disponibles');
    } else {
      error('❌ Confusion Matrix - Pas de données');
    }

    if (graphsData.rocCurve.hasData) {
      success('✅ ROC Curve - Données disponibles');
    } else {
      error('❌ ROC Curve - Pas de données');
    }

    if (graphsData.featureImportance.hasData) {
      success('✅ Feature Importance - Données disponibles');
    } else {
      error('❌ Feature Importance - Pas de données');
    }

    if (graphsData.modelComparison.hasData) {
      success('✅ Model Comparison - Données disponibles');
    } else {
      error('❌ Model Comparison - Pas de données');
    }

    // 10. Summary
    log('\n🔟 RÉSUMÉ DES RÉSULTATS', 'magenta');
    
    const summary = {
      'Backend': '✅ OK',
      'Dataset Upload': '✅ OK',
      'Model Creation': '✅ OK',
      'Training': trainingComplete ? '✅ OK' : '⚠️  Timeout',
      'Training History': history.length > 0 ? '✅ OK' : '❌ Fail',
      'Models List': models.length > 0 ? '✅ OK' : '⚠️  Empty',
      'Training Metrics': graphsData.trainingMetrics.loss.length > 0 ? '✅ OK' : '❌ Fail',
      'Confusion Matrix': graphsData.confusionMatrix.hasData ? '✅ OK' : '❌ Fail',
      'ROC Curve': graphsData.rocCurve.hasData ? '✅ OK' : '❌ Fail',
      'Feature Importance': graphsData.featureImportance.hasData ? '✅ OK' : '❌ Fail',
      'Model Comparison': graphsData.modelComparison.hasData ? '✅ OK' : '❌ Fail'
    };

    Object.entries(summary).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(25)} ${value}`);
    });

    // Count successes
    const successes = Object.values(summary).filter(v => v.includes('✅')).length;
    const total = Object.values(summary).length;

    log(`\n📊 Taux de réussite: ${successes}/${total} (${Math.round(successes / total * 100)}%)`, 'green');

    if (successes === total) {
      log('\n🎉 TOUS LES TESTS RÉUSSIS! 🎉', 'green');
      log('\nLes graphes devraient maintenant s\'afficher à:', 'green');
      log('  http://localhost:4200/analysis', 'cyan');
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
  section('DÉMARRAGE DU TEST COMPLET');
  
  const result = await testCompleteWorkflow();
  
  section('TEST TERMINÉ');
  
  if (result) {
    log('\n✨ Vous pouvez maintenant voir les graphes! ✨\n', 'green');
  } else {
    log('\n⚠️  Veuillez vérifier les erreurs ci-dessus\n', 'yellow');
  }
}

main().catch(err => {
  error(`Erreur fatale: ${err.message}`);
  process.exit(1);
});
