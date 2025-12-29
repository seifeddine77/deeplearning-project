# Guide de Configuration - Deep Learning CNN+LSTM

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
cd C:\Users\saife\CascadeProjects\deeplearning-project
npm install
```

### 2. Démarrage du serveur
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

### 3. Accéder à l'application
Ouvrez votre navigateur et allez à `http://localhost:3000`

---

## 🛠️ Mode Développement

Pour développer avec rechargement automatique:

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend (optionnel):**
```bash
npm run ng:serve
```

---

## 📋 Structure des Fichiers Créés

```
deeplearning-project/
├── server/
│   ├── index.js                    # Serveur Express principal
│   ├── routes/
│   │   ├── model.js               # API pour modèles
│   │   ├── data.js                # API pour données
│   │   └── training.js            # API pour entraînement
│   └── services/
│       ├── modelService.js        # Logique CNN+LSTM
│       ├── dataService.js         # Logique données
│       └── trainingService.js     # Logique entraînement
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── navbar/            # Navigation
│   │   │   ├── dashboard/         # Tableau de bord
│   │   │   ├── data/              # Gestion données
│   │   │   ├── model/             # Config modèle
│   │   │   └── training/          # Entraînement
│   │   ├── services/
│   │   │   └── api.service.ts     # Service HTTP
│   │   ├── app.component.ts       # Composant racine
│   │   └── app.routes.ts          # Routes
│   ├── main.ts                    # Point d'entrée
│   ├── index.html                 # HTML principal
│   └── styles.scss                # Styles globaux
├── angular.json                   # Config Angular
├── tsconfig.json                  # Config TypeScript
├── package.json                   # Dépendances
├── .env                           # Variables d'environnement
├── .gitignore                     # Git ignore
├── README.md                      # Documentation
└── SETUP.md                       # Ce fichier
```

---

## 🎯 Fonctionnalités Principales

### Dashboard
- Affiche le statut du modèle
- Montre la progression d'entraînement
- Affiche les métriques récentes

### Data Management
- Télécharger des datasets
- Prétraiter les données (normalisation)
- Augmenter les données (crop, rotation, flip)
- Diviser en train/test/validation
- Voir les statistiques

### Model Configuration
- Créer un modèle CNN+LSTM
- Visualiser l'architecture
- Sauvegarder/Charger des modèles
- Voir le résumé des paramètres

### Training & Evaluation
- Configurer l'entraînement
- Suivre l'historique
- Évaluer le modèle
- Faire des prédictions
- Voir les métriques

---

## 🔌 API Endpoints

### Modèles
```
POST   /api/model/create     - Créer un modèle
GET    /api/model/summary    - Résumé du modèle
POST   /api/model/save       - Sauvegarder
POST   /api/model/load       - Charger
```

### Données
```
POST   /api/data/upload      - Télécharger dataset
POST   /api/data/preprocess  - Prétraiter
POST   /api/data/augment     - Augmenter
POST   /api/data/split       - Diviser
GET    /api/data/stats       - Statistiques
```

### Entraînement
```
POST   /api/training/start       - Démarrer
GET    /api/training/history     - Historique
POST   /api/training/evaluate    - Évaluer
POST   /api/training/predict     - Prédire
GET    /api/training/metrics     - Métriques
```

---

## ⚙️ Configuration

### Changer le port
Modifiez `.env`:
```
PORT=3001
```

### Changer l'environnement
```
NODE_ENV=production
```

---

## 🐛 Troubleshooting

### Erreur: "Port déjà utilisé"
```bash
# Changer le port dans .env
PORT=3001
npm start
```

### Erreur: "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "Angular compilation failed"
```bash
# Nettoyer et reconstruire
rm -rf dist .angular
npm run ng:build
```

### Erreur: "TensorFlow.js not found"
```bash
# Vérifier la version de Node.js
node --version  # Doit être 16+

# Réinstaller TensorFlow
npm install @tensorflow/tfjs @tensorflow/tfjs-layers
```

---

## 📊 Architecture du Modèle

### Entrée
- Taille: 64x64x1 (images en niveaux de gris)

### CNN (Extraction de features)
1. Conv2D: 32 filtres, 3x3, ReLU
2. BatchNormalization
3. MaxPooling: 2x2
4. Conv2D: 64 filtres, 3x3, ReLU
5. BatchNormalization
6. MaxPooling: 2x2
7. Conv2D: 128 filtres, 3x3, ReLU
8. BatchNormalization
9. MaxPooling: 2x2

### LSTM (Traitement temporel)
1. Reshape: (8, 8, 128) → (64, 128)
2. LSTM: 128 unités, return_sequences=True
3. Dropout: 0.5
4. LSTM: 64 unités
5. Dropout: 0.5

### Dense (Classification)
1. Dense: 128 unités, ReLU
2. BatchNormalization
3. Dropout: 0.5
4. Dense: 10 classes, Softmax

---

## 🎓 Prochaines Étapes

1. **Intégrer un vrai dataset**
   - Télécharger depuis Kaggle
   - Implémenter le chargement CSV/Images

2. **Améliorer la visualisation**
   - Ajouter des graphiques avec Chart.js
   - Visualiser les courbes d'entraînement

3. **Persistance des modèles**
   - Sauvegarder en base de données
   - Historique des modèles

4. **WebSocket**
   - Suivi en temps réel de l'entraînement
   - Notifications

5. **Tests**
   - Tests unitaires (Jasmine)
   - Tests d'intégration

6. **UVE (Univariate Variable Elimination)**
   - Sélection de features
   - Réduction de dimensionnalité

---

## 📚 Ressources

- [TensorFlow.js Documentation](https://js.tensorflow.org/)
- [Angular Documentation](https://angular.io/)
- [Express.js Documentation](https://expressjs.com/)
- [Kaggle Datasets](https://www.kaggle.com/datasets)

---

## ✅ Checklist de Démarrage

- [ ] Node.js 16+ installé
- [ ] npm install exécuté
- [ ] .env configuré
- [ ] npm start lancé
- [ ] Application accessible sur http://localhost:3000
- [ ] Dashboard chargé correctement
- [ ] Tous les menus de navigation fonctionnent

---

## 💡 Tips

1. Utilisez les DevTools du navigateur (F12) pour déboguer
2. Vérifiez la console Node.js pour les erreurs serveur
3. Utilisez `npm run dev` pour le rechargement automatique
4. Testez les endpoints API avec Postman ou Insomnia
5. Gardez un terminal pour les logs du serveur

---

Bon développement! 🚀
