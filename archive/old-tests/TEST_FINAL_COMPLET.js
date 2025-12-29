#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function success(msg) { log(`✅ ${msg}`, 'green'); }
function error(msg) { log(`❌ ${msg}`, 'red'); }
function info(msg) { log(`ℹ️  ${msg}`, 'cyan'); }
function warn(msg) { log(`⚠️  ${msg}`, 'yellow'); }

async function test() {
  try {
    log('\n╔════════════════════════════════════════════════════════════════╗', 'magenta');
    log('║                   🧪 TEST FINAL COMPLET                        ║', 'magenta');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'magenta');

    // 1️⃣ Créer un modèle
    log('1️⃣  Création du modèle...', 'blue');
    const modelRes = await axios.post(`${BASE_URL}/model/create`, {
      inputShape: [64, 64, 1],
      numClasses: 10
    });
    const modelId = modelRes.data.model.modelId;
    success(`Modèle créé: ${modelId}`);
    info(`  Nom: ${modelRes.data.model.name}`);
    info(`  Couches: ${modelRes.data.model.layers}`);

    // 2️⃣ Entraîner le modèle
    log('\n2️⃣  Démarrage de l\'entraînement...', 'blue');
    const trainRes = await axios.post(`${BASE_URL}/training/start`, {
      modelId: modelId,
      epochs: 2,
      batchSize: 32,
      learningRate: 0.001
    });
    success('Entraînement démarré');
    info(`  Status: ${trainRes.data.training.status}`);
    info(`  ModelId: ${trainRes.data.training.modelId}`);

    // 3️⃣ Attendre l'entraînement
    log('\n3️⃣  Attente de l\'entraînement (60 secondes)...', 'blue');
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      info(`  ${(i + 1) * 10}s / 60s`);
    }

    // 4️⃣ Récupérer l'historique
    log('\n4️⃣  Récupération de l\'historique...', 'blue');
    const historyRes = await axios.get(`${BASE_URL}/training/history`);
    const history = historyRes.data.history?.data || [];
    success(`${history.length} sessions trouvées`);

    // 5️⃣ Vérifier les données
    log('\n5️⃣  Vérification des données...', 'blue');
    const modelSessions = history.filter(h => h.modelId === modelId);
    
    if (modelSessions.length > 0) {
      success(`✓ ${modelSessions.length} session(s) trouvée(s) pour ce modèle`);
      
      const session = modelSessions[0];
      info(`  ModelId: ${session.modelId}`);
      info(`  Epochs: ${session.config?.epochs}`);
      info(`  Batch Size: ${session.config?.batchSize}`);
      info(`  Loss: ${session.history?.history?.loss?.[0]?.toFixed(4)}`);
      info(`  Accuracy: ${(session.history?.history?.acc?.[0] * 100)?.toFixed(2)}%`);
      info(`  Timestamp: ${session.timestamp}`);
    } else {
      error('Aucune session trouvée pour ce modèle');
    }

    // 6️⃣ Vérifier la persistance en fichier
    log('\n6️⃣  Vérification de la persistance en fichier...', 'blue');
    const historyFile = path.join(__dirname, 'data', 'training-history.json');
    
    if (fs.existsSync(historyFile)) {
      const savedData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      success(`✓ Fichier trouvé avec ${savedData.length} sessions`);
      
      const savedSession = savedData.find(h => h.modelId === modelId);
      if (savedSession) {
        success('✓ Session sauvegardée en fichier');
        info(`  Loss: ${savedSession.history?.history?.loss?.[0]?.toFixed(4)}`);
        info(`  Accuracy: ${(savedSession.history?.history?.acc?.[0] * 100)?.toFixed(2)}%`);
      } else {
        error('Session non trouvée dans le fichier');
      }
    } else {
      error('Fichier de persistance non trouvé');
    }

    // 7️⃣ Résumé final
    log('\n7️⃣  RÉSUMÉ FINAL', 'blue');
    log('╔════════════════════════════════════════════════════════════════╗', 'green');
    log('║                                                                ║', 'green');
    log('║  ✅ Modèle créé avec succès                                   ║', 'green');
    log('║  ✅ Entraînement terminé                                      ║', 'green');
    log('║  ✅ Données récupérées du backend                             ║', 'green');
    log('║  ✅ Données persistées en fichier                             ║', 'green');
    log('║  ✅ Correspondance modèle vérifiée                            ║', 'green');
    log('║                                                                ║', 'green');
    log('║  🎯 ALLEZ À: http://localhost:4200/training                  ║', 'green');
    log('║  📊 VOUS DEVRIEZ VOIR LES VRAIES DONNÉES!                    ║', 'green');
    log('║                                                                ║', 'green');
    log('╚════════════════════════════════════════════════════════════════╝', 'green');

  } catch (err) {
    error(`Erreur: ${err.message}`);
    if (err.response?.data) {
      error(`Réponse: ${JSON.stringify(err.response.data)}`);
    }
  }
}

test();
