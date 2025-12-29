# 📚 Documentation Swagger

Ce dossier contient la documentation interactive de l'API REST.

## 📁 Fichiers

- **`swagger.json`** - Spécification OpenAPI 3.0 complète
- **`swagger-ui.html`** - Interface Swagger UI interactive
- **`SWAGGER_GUIDE.md`** - Guide d'utilisation complet

## 🚀 Accès Rapide

Une fois le serveur démarré (`npm start`):

```
http://localhost:3000/docs/swagger-ui.html
```

## 📋 Endpoints Disponibles

### Model Management
- `POST /api/model/create` - Créer un modèle
- `GET /api/model/summary` - Résumé du modèle
- `POST /api/model/save` - Sauvegarder
- `POST /api/model/load` - Charger

### Data Processing
- `POST /api/data/upload` - Télécharger dataset
- `POST /api/data/preprocess` - Prétraiter
- `POST /api/data/augment` - Augmenter
- `POST /api/data/split` - Diviser
- `GET /api/data/stats` - Statistiques

### Training & Evaluation
- `POST /api/training/start` - Démarrer entraînement
- `GET /api/training/history` - Historique
- `POST /api/training/evaluate` - Évaluer
- `POST /api/training/predict` - Prédire
- `GET /api/training/metrics` - Métriques

## 🎯 Utilisation

1. Ouvrir `http://localhost:3000/docs/swagger-ui.html`
2. Sélectionner un endpoint
3. Cliquer "Try it out"
4. Entrer les paramètres
5. Cliquer "Execute"
6. Voir la réponse

## 📖 Lire aussi

- `SWAGGER_GUIDE.md` - Guide complet
- `../API_EXAMPLES.md` - Exemples cURL
- `../README.md` - Documentation générale

---

**Bon testing! 🚀**
