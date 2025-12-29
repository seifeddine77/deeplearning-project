# Deep Learning CNN+LSTM Project

Un projet complet de deep learning combinant **CNN (Convolutional Neural Networks)** et **LSTM (Long Short-Term Memory)** avec:
- **Backend**: Node.js + Express
- **Framework ML**: TensorFlow.js
- **Frontend**: Angular 17
- **Styling**: SCSS

## Architecture du Projet

```
deeplearning-project/
├── server/
│   ├── routes/
│   │   ├── model.js          # Routes pour la gestion du modèle
│   │   ├── data.js           # Routes pour le traitement des données
│   │   └── training.js       # Routes pour l'entraînement
│   ├── services/
│   │   ├── modelService.js   # Logique du modèle CNN+LSTM
│   │   ├── dataService.js    # Logique de prétraitement
│   │   └── trainingService.js # Logique d'entraînement
│   └── index.js              # Serveur principal
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── dashboard/    # Tableau de bord
│   │   │   ├── data/         # Gestion des données
│   │   │   ├── model/        # Configuration du modèle
│   │   │   ├── training/     # Entraînement et évaluation
│   │   │   └── navbar/       # Barre de navigation
│   │   ├── services/
│   │   │   └── api.service.ts # Service HTTP
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── styles.scss
│   └── index.html
├── package.json
├── angular.json
├── tsconfig.json
└── README.md
```

## Pipeline de Traitement

Le projet suit le pipeline montré sur le tableau blanc:

1. **Collection (0)** - Téléchargement du dataset depuis Kaggle
2. **Prétraitement (1)** - Normalisation et préparation des données
3. **Augmentation (2)** - Crop/Slider et autres augmentations
4. **Entraînement (3)** - Entraînement du modèle CNN+LSTM
5. **Évaluation (4)** - Évaluation sur l'ensemble de test
6. **Test (5)** - Test avec d'autres données
7. **UVE (6)** - Univariate Variable Elimination

## Architecture du Modèle

### CNN (Feature Extraction)
- Conv2D: 32 filtres, 3x3
- BatchNormalization
- MaxPooling: 2x2
- Conv2D: 64 filtres, 3x3
- Conv2D: 128 filtres, 3x3

### LSTM (Temporal Processing)
- LSTM: 128 unités (avec return_sequences=True)
- Dropout: 0.5
- LSTM: 64 unités

### Dense Layers (Classification)
- Dense: 128 unités
- BatchNormalization
- Dropout: 0.5
- Output: Softmax (nombre de classes)

## Installation

### Prérequis
- Node.js 16+
- npm ou yarn

### Étapes

1. **Cloner/Naviguer vers le projet**
```bash
cd C:\Users\saife\CascadeProjects\deeplearning-project
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Démarrer le serveur**
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## Utilisation

### Mode Développement

**Terminal 1 - Backend (Node.js)**
```bash
npm run dev
```

**Terminal 2 - Frontend (Angular)**
```bash
npm run ng:serve
```

L'application Angular sera disponible sur `http://localhost:4200`

### Mode Production

```bash
npm run build
npm start
```

## API Endpoints

### Model Management
- `POST /api/model/create` - Créer un nouveau modèle
- `GET /api/model/summary` - Obtenir le résumé du modèle
- `POST /api/model/save` - Sauvegarder le modèle
- `POST /api/model/load` - Charger un modèle

### Data Processing
- `POST /api/data/upload` - Télécharger un dataset
- `POST /api/data/preprocess` - Prétraiter les données
- `POST /api/data/augment` - Augmenter les données
- `POST /api/data/split` - Diviser train/test/val
- `GET /api/data/stats` - Obtenir les statistiques

### Training & Evaluation
- `POST /api/training/start` - Démarrer l'entraînement
- `GET /api/training/history` - Obtenir l'historique
- `POST /api/training/evaluate` - Évaluer le modèle
- `POST /api/training/predict` - Faire une prédiction
- `GET /api/training/metrics` - Obtenir les métriques

## Features

### Dashboard
- Vue d'ensemble du statut du modèle
- Progression de l'entraînement
- Informations sur le dataset
- Métriques récentes

### Data Management
- Téléchargement de datasets
- Normalisation (Min-Max, Z-Score)
- Augmentation de données
- Division train/test/validation
- Statistiques des données

### Model Configuration
- Création de modèles CNN+LSTM
- Visualisation de l'architecture
- Sauvegarde/Chargement de modèles
- Résumé des paramètres

### Training & Evaluation
- Configuration d'entraînement personnalisée
- Suivi de l'historique d'entraînement
- Évaluation sur test/validation
- Prédictions en temps réel
- Métriques de performance

## Technologies

- **Backend**: Express.js, Node.js
- **ML Framework**: TensorFlow.js
- **Frontend**: Angular 17
- **Styling**: SCSS
- **HTTP Client**: Axios, HttpClient
- **State Management**: RxJS

## Configuration

Modifiez le fichier `.env`:
```
PORT=3000
NODE_ENV=development
```

## Développement

### Ajouter un nouveau composant Angular
```bash
ng generate component components/mon-composant
```

### Ajouter une nouvelle route
Modifiez `src/app/app.routes.ts`

### Ajouter un nouveau service backend
Créez un fichier dans `server/services/`

## Troubleshooting

### Port déjà utilisé
```bash
# Changer le port dans .env
PORT=3001
```

### Erreurs de build Angular
```bash
rm -rf node_modules dist
npm install
npm run ng:build
```

### Erreurs TensorFlow.js
Assurez-vous que la version de Node.js est compatible (16+)

## Prochaines Étapes

1. Intégrer un vrai dataset Kaggle
2. Ajouter la persistance des modèles
3. Implémenter le WebSocket pour le suivi en temps réel
4. Ajouter des graphiques de visualisation
5. Implémenter l'UVE (Univariate Variable Elimination)
6. Ajouter des tests unitaires

## Licence

MIT

## Auteur

Projet de Deep Learning - Université
