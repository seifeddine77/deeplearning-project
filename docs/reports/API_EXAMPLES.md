# 📡 Exemples d'Utilisation de l'API

## 🔧 Configuration de Base

Tous les exemples supposent que le serveur tourne sur `http://localhost:3000`

## 📋 Model Management

### 1. Créer un Modèle

**Request:**
```bash
curl -X POST http://localhost:3000/api/model/create \
  -H "Content-Type: application/json" \
  -d '{
    "inputShape": [64, 64, 1],
    "numClasses": 10
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Model created successfully",
  "modelSummary": "..."
}
```

**JavaScript:**
```javascript
fetch('/api/model/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    inputShape: [64, 64, 1],
    numClasses: 10
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

### 2. Obtenir le Résumé du Modèle

**Request:**
```bash
curl http://localhost:3000/api/model/summary
```

**Response:**
```json
{
  "layers": [...],
  "totalParams": 2500000,
  "trainableParams": 2500000
}
```

### 3. Sauvegarder le Modèle

**Request:**
```bash
curl -X POST http://localhost:3000/api/model/save \
  -H "Content-Type: application/json" \
  -d '{"modelName": "mon-modele-v1"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Model saved successfully"
}
```

### 4. Charger un Modèle

**Request:**
```bash
curl -X POST http://localhost:3000/api/model/load \
  -H "Content-Type: application/json" \
  -d '{"modelName": "mon-modele-v1"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Model loaded successfully"
}
```

## 📊 Data Management

### 1. Télécharger un Dataset

**Request (multipart/form-data):**
```bash
curl -X POST http://localhost:3000/api/data/upload \
  -F "file=@dataset.csv"
```

**Response:**
```json
{
  "success": true,
  "message": "Dataset uploaded and processed",
  "stats": {
    "totalSamples": 1000,
    "features": 4096,
    "classes": 10,
    "filePath": "uploads/dataset.csv"
  }
}
```

**JavaScript:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('/api/data/upload', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(d => console.log(d));
```

### 2. Prétraiter les Données

**Request:**
```bash
curl -X POST http://localhost:3000/api/data/preprocess \
  -H "Content-Type: application/json" \
  -d '{"normalization": "minmax"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Data preprocessed",
  "stats": {
    "method": "minmax",
    "samplesProcessed": 1000,
    "min": 0,
    "max": 1,
    "timestamp": "2025-11-30T20:46:00.000Z"
  }
}
```

**Options de normalisation:**
- `minmax` - Normalisation Min-Max (0-1)
- `zscore` - Standardisation Z-Score (moyenne=0, std=1)

### 3. Augmenter les Données

**Request:**
```bash
curl -X POST http://localhost:3000/api/data/augment \
  -H "Content-Type: application/json" \
  -d '{
    "augmentationType": "crop",
    "params": {"cropSize": 56}
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Data augmented",
  "stats": {
    "augmentationType": "crop",
    "originalSamples": 1000,
    "augmentedSamples": 2000,
    "cropSize": 56,
    "timestamp": "2025-11-30T20:46:00.000Z"
  }
}
```

**Types d'augmentation:**
- `crop` - Crop/Slider
- `rotation` - Rotation
- `flip` - Flip horizontal/vertical

### 4. Diviser les Données

**Request:**
```bash
curl -X POST http://localhost:3000/api/data/split \
  -H "Content-Type: application/json" \
  -d '{
    "trainRatio": 0.7,
    "testRatio": 0.2,
    "valRatio": 0.1
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Data split completed",
  "stats": {
    "trainSize": 700,
    "testSize": 200,
    "valSize": 100,
    "trainRatio": 0.7,
    "testRatio": 0.2,
    "valRatio": 0.1,
    "totalSamples": 1000,
    "timestamp": "2025-11-30T20:46:00.000Z"
  }
}
```

### 5. Obtenir les Statistiques

**Request:**
```bash
curl http://localhost:3000/api/data/stats
```

**Response:**
```json
{
  "totalSamples": 1000,
  "features": 4096,
  "classes": 10,
  "filePath": "uploads/dataset.csv",
  "trainData": {"size": 700},
  "testData": {"size": 200},
  "valData": {"size": 100},
  "timestamp": "2025-11-30T20:46:00.000Z"
}
```

## 🚀 Training & Evaluation

### 1. Démarrer l'Entraînement

**Request:**
```bash
curl -X POST http://localhost:3000/api/training/start \
  -H "Content-Type: application/json" \
  -d '{
    "epochs": 10,
    "batchSize": 32,
    "learningRate": 0.001,
    "validationSplit": 0.2
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Training started",
  "history": {
    "loss": [...],
    "accuracy": [...],
    "val_loss": [...],
    "val_accuracy": [...]
  }
}
```

### 2. Obtenir l'Historique d'Entraînement

**Request:**
```bash
curl http://localhost:3000/api/training/history
```

**Response:**
```json
[
  {
    "config": {
      "epochs": 10,
      "batchSize": 32,
      "learningRate": 0.001,
      "validationSplit": 0.2
    },
    "history": {
      "loss": [0.5, 0.4, 0.3, ...],
      "accuracy": [0.8, 0.85, 0.9, ...],
      "val_loss": [0.6, 0.5, 0.4, ...],
      "val_accuracy": [0.75, 0.8, 0.85, ...]
    },
    "timestamp": "2025-11-30T20:46:00.000Z"
  }
]
```

### 3. Évaluer le Modèle

**Request:**
```bash
curl -X POST http://localhost:3000/api/training/evaluate \
  -H "Content-Type: application/json" \
  -d '{"dataset": "test"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Model evaluated",
  "metrics": {
    "dataset": "test",
    "loss": 0.245,
    "accuracy": 0.925,
    "timestamp": "2025-11-30T20:46:00.000Z"
  }
}
```

**Options de dataset:**
- `test` - Ensemble de test
- `validation` - Ensemble de validation

### 4. Faire une Prédiction

**Request:**
```bash
curl -X POST http://localhost:3000/api/training/predict \
  -H "Content-Type: application/json" \
  -d '{
    "inputData": [[[0.1, 0.2, ...], [...]], ...]
  }'
```

**Response:**
```json
{
  "success": true,
  "predictions": [0.01, 0.05, 0.1, 0.8, 0.02, ...],
  "predictedClass": 3,
  "confidence": 0.8,
  "timestamp": "2025-11-30T20:46:00.000Z"
}
```

### 5. Obtenir les Métriques

**Request:**
```bash
curl http://localhost:3000/api/training/metrics
```

**Response:**
```json
{
  "metrics": {
    "test": {
      "dataset": "test",
      "loss": 0.245,
      "accuracy": 0.925,
      "timestamp": "2025-11-30T20:46:00.000Z"
    },
    "validation": {
      "dataset": "validation",
      "loss": 0.312,
      "accuracy": 0.91,
      "timestamp": "2025-11-30T20:46:00.000Z"
    }
  },
  "isTraining": false,
  "trainingHistoryCount": 1,
  "timestamp": "2025-11-30T20:46:00.000Z"
}
```

## 🔄 Workflow Complet

### Étape 1: Créer le Modèle
```bash
curl -X POST http://localhost:3000/api/model/create \
  -H "Content-Type: application/json" \
  -d '{"inputShape": [64, 64, 1], "numClasses": 10}'
```

### Étape 2: Télécharger les Données
```bash
curl -X POST http://localhost:3000/api/data/upload \
  -F "file=@dataset.csv"
```

### Étape 3: Prétraiter
```bash
curl -X POST http://localhost:3000/api/data/preprocess \
  -H "Content-Type: application/json" \
  -d '{"normalization": "minmax"}'
```

### Étape 4: Augmenter
```bash
curl -X POST http://localhost:3000/api/data/augment \
  -H "Content-Type: application/json" \
  -d '{"augmentationType": "crop", "params": {}}'
```

### Étape 5: Diviser
```bash
curl -X POST http://localhost:3000/api/data/split \
  -H "Content-Type: application/json" \
  -d '{"trainRatio": 0.7, "testRatio": 0.2, "valRatio": 0.1}'
```

### Étape 6: Entraîner
```bash
curl -X POST http://localhost:3000/api/training/start \
  -H "Content-Type: application/json" \
  -d '{"epochs": 10, "batchSize": 32, "learningRate": 0.001, "validationSplit": 0.2}'
```

### Étape 7: Évaluer
```bash
curl -X POST http://localhost:3000/api/training/evaluate \
  -H "Content-Type: application/json" \
  -d '{"dataset": "test"}'
```

### Étape 8: Prédire
```bash
curl -X POST http://localhost:3000/api/training/predict \
  -H "Content-Type: application/json" \
  -d '{"inputData": [...]}'
```

### Étape 9: Sauvegarder
```bash
curl -X POST http://localhost:3000/api/model/save \
  -H "Content-Type: application/json" \
  -d '{"modelName": "mon-modele-final"}'
```

## 🧪 Tests avec Postman

### Importer les Endpoints

1. Ouvrir Postman
2. Créer une nouvelle collection
3. Ajouter les requests ci-dessus
4. Sauvegarder et exécuter

### Variables d'Environnement

```json
{
  "baseUrl": "http://localhost:3000",
  "modelName": "mon-modele",
  "epochs": 10,
  "batchSize": 32
}
```

## 📝 Notes

- Tous les endpoints retournent du JSON
- Les erreurs retournent un code HTTP 500
- Les timestamps sont en ISO 8601
- Les données sont en format float

## 🔗 Liens Utiles

- [cURL Documentation](https://curl.se/docs/)
- [Postman Documentation](https://learning.postman.com/)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)

---

Bon testing! 🚀
