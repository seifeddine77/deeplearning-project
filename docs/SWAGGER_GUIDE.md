# 📚 Guide Swagger - Documentation API

## 🚀 Accéder à Swagger UI

Une fois le serveur démarré (`npm start`), ouvrez dans votre navigateur:

```
http://localhost:3000/docs/swagger-ui.html
```

---

## 📋 Fichiers Swagger

| Fichier | Description |
|---------|-------------|
| `swagger.json` | Spécification OpenAPI 3.0 complète |
| `swagger-ui.html` | Interface interactive Swagger UI |
| `SWAGGER_GUIDE.md` | Ce guide |

---

## 🎯 Endpoints Documentés

### 🏗️ Model Management (4 endpoints)

**POST** `/api/model/create`
- Créer un nouveau modèle CNN+LSTM
- Paramètres: `inputShape`, `numClasses`

**GET** `/api/model/summary`
- Obtenir le résumé du modèle
- Affiche les couches et paramètres

**POST** `/api/model/save`
- Sauvegarder le modèle
- Paramètre: `modelName`

**POST** `/api/model/load`
- Charger un modèle existant
- Paramètre: `modelName`

---

### 📊 Data Processing (5 endpoints)

**POST** `/api/data/upload`
- Télécharger un dataset
- Format: multipart/form-data (fichier)

**POST** `/api/data/preprocess`
- Prétraiter les données
- Options: `minmax` ou `zscore`

**POST** `/api/data/augment`
- Augmenter les données
- Types: `crop`, `rotation`, `flip`

**POST** `/api/data/split`
- Diviser train/test/validation
- Paramètres: `trainRatio`, `testRatio`, `valRatio`

**GET** `/api/data/stats`
- Obtenir les statistiques des données
- Affiche les tailles de chaque ensemble

---

### 🚀 Training & Evaluation (5 endpoints)

**POST** `/api/training/start`
- Démarrer l'entraînement
- Paramètres: `epochs`, `batchSize`, `learningRate`, `validationSplit`

**GET** `/api/training/history`
- Obtenir l'historique d'entraînement
- Affiche les courbes de loss et accuracy

**POST** `/api/training/evaluate`
- Évaluer le modèle
- Options: `test` ou `validation`

**POST** `/api/training/predict`
- Faire une prédiction
- Paramètre: `inputData` (array)

**GET** `/api/training/metrics`
- Obtenir les métriques actuelles
- Affiche loss, accuracy, etc.

---

## 🧪 Comment Utiliser Swagger UI

### Étape 1: Ouvrir Swagger UI
```
http://localhost:3000/docs/swagger-ui.html
```

### Étape 2: Sélectionner un Endpoint
Cliquez sur un endpoint pour l'étendre

### Étape 3: Cliquer sur "Try it out"
Bouton bleu pour passer en mode édition

### Étape 4: Entrer les Paramètres
Remplissez les champs requis

### Étape 5: Cliquer sur "Execute"
Envoie la requête au serveur

### Étape 6: Voir la Réponse
Affiche le code de statut et le JSON retourné

---

## 📝 Exemples de Requêtes

### Créer un Modèle

**Request Body:**
```json
{
  "inputShape": [64, 64, 1],
  "numClasses": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Model created successfully",
  "modelSummary": "..."
}
```

---

### Prétraiter les Données

**Request Body:**
```json
{
  "normalization": "minmax"
}
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
    "max": 1
  }
}
```

---

### Démarrer l'Entraînement

**Request Body:**
```json
{
  "epochs": 10,
  "batchSize": 32,
  "learningRate": 0.001,
  "validationSplit": 0.2
}
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

---

## 🔄 Workflow Complet

1. **Créer le modèle**
   ```
   POST /api/model/create
   ```

2. **Télécharger les données**
   ```
   POST /api/data/upload
   ```

3. **Prétraiter**
   ```
   POST /api/data/preprocess
   ```

4. **Augmenter**
   ```
   POST /api/data/augment
   ```

5. **Diviser**
   ```
   POST /api/data/split
   ```

6. **Entraîner**
   ```
   POST /api/training/start
   ```

7. **Évaluer**
   ```
   POST /api/training/evaluate
   ```

8. **Prédire**
   ```
   POST /api/training/predict
   ```

---

## 🎨 Personnaliser Swagger

### Modifier le Titre
Éditer `swagger.json` ligne 3:
```json
"title": "Votre Titre"
```

### Modifier la Description
Éditer `swagger.json` ligne 4:
```json
"description": "Votre Description"
```

### Ajouter un Serveur
Éditer `swagger.json` section `servers`:
```json
"servers": [
  {
    "url": "http://localhost:3000",
    "description": "Local"
  },
  {
    "url": "https://api.example.com",
    "description": "Production"
  }
]
```

---

## 📊 Codes de Réponse

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 400 | Mauvaise requête |
| 500 | Erreur serveur |

---

## 🔐 Authentification

Actuellement, l'API n'a pas d'authentification. Pour l'ajouter:

1. Ajouter dans `swagger.json`:
```json
"components": {
  "securitySchemes": {
    "bearerAuth": {
      "type": "http",
      "scheme": "bearer"
    }
  }
}
```

2. Ajouter aux endpoints:
```json
"security": [{"bearerAuth": []}]
```

---

## 📞 Support

Pour toute question:
1. Consulter `API_EXAMPLES.md`
2. Vérifier les logs serveur
3. Tester avec Postman/Insomnia

---

## ✨ Avantages de Swagger

✅ Documentation interactive
✅ Tester les endpoints directement
✅ Voir les schémas de réponse
✅ Générer du code client
✅ Partager avec l'équipe

---

**Bon testing! 🚀**
