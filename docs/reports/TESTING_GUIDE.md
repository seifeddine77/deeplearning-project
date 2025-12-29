# 🧪 Guide de Test Complet

## ✅ État du Projet

```
✅ Backend: 90% prêt
✅ Frontend: 80% prêt
✅ Documentation: 100% prêt
⚠️ Tests: À créer
⚠️ DevOps: À créer
```

---

## 🚀 Avant de Tester

### Étape 1: Installer les Dépendances

```bash
# Aller au dossier du projet
cd C:\Users\saife\CascadeProjects\deeplearning-project

# Installer toutes les dépendances
npm install

# Dépendances supplémentaires recommandées
npm install jsonwebtoken bcryptjs express-validator express-rate-limit
npm install winston morgan nodemailer
npm install chart.js ng2-charts
npm install redis compression
```

### Étape 2: Configurer les Variables d'Environnement

Créer/modifier `.env`:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/deeplearning

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (optionnel)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:4200
```

### Étape 3: Démarrer MongoDB (si local)

```bash
# Windows
mongod

# Ou utiliser MongoDB Atlas (cloud)
# Modifier MONGODB_URI dans .env
```

### Étape 4: Démarrer Redis (optionnel mais recommandé)

```bash
# Windows
redis-server

# Ou utiliser Redis Cloud
```

---

## 🧪 Tests Backend

### Test 1: Vérifier que le serveur démarre

```bash
# Terminal 1: Démarrer le serveur
npm start

# Ou en mode développement avec auto-reload
npm run dev
```

**Résultat attendu:**
```
Server running on port 3000
MongoDB connected
Redis connected (optionnel)
```

---

### Test 2: Tester les Endpoints API

#### A. Health Check

```bash
curl http://localhost:3000/api/health
```

**Réponse attendue:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T22:00:00Z",
  "uptime": 123.45
}
```

---

#### B. Authentification - Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

---

#### C. Authentification - Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

---

#### D. Créer un Modèle

```bash
curl -X POST http://localhost:3000/api/models/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CNN+LSTM v1",
    "architecture": "CNN+LSTM",
    "parameters": {
      "epochs": 10,
      "batchSize": 32,
      "learningRate": 0.001
    }
  }'
```

---

#### E. Uploader un Dataset

```bash
curl -X POST http://localhost:3000/api/data/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@dataset.csv"
```

---

#### F. Démarrer l'Entraînement

```bash
curl -X POST http://localhost:3000/api/training/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "model-id",
    "datasetId": "dataset-id",
    "epochs": 10
  }'
```

---

#### G. Obtenir les Notifications

```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### H. Tester le Cache

```bash
# Première requête (pas en cache)
curl -X GET http://localhost:3000/api/models \
  -H "Authorization: Bearer YOUR_TOKEN"
# Temps: ~500ms

# Deuxième requête (en cache)
curl -X GET http://localhost:3000/api/models \
  -H "Authorization: Bearer YOUR_TOKEN"
# Temps: ~10ms
```

---

### Test 3: Tester la Pagination

```bash
curl -X GET "http://localhost:3000/api/datasets?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Test 4: Tester la Compression

```bash
# Vérifier que la réponse est compressée
curl -X GET http://localhost:3000/api/large-data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept-Encoding: gzip" \
  -v
```

**Vérifier dans les headers:**
```
Content-Encoding: gzip
```

---

### Test 5: Tester le Rate Limiting

```bash
# Faire 15 requêtes rapidement
for i in {1..15}; do
  curl http://localhost:3000/api/models
done

# Après 10 requêtes, vous devriez recevoir:
# 429 Too Many Requests
```

---

## 🎨 Tests Frontend

### Test 1: Démarrer l'Application Angular

```bash
# Terminal 2: Démarrer Angular
npm run ng:serve

# Ou
ng serve
```

**Résultat attendu:**
```
✔ Compiled successfully.
Application bundle generated successfully.
Local: http://localhost:4200/
```

---

### Test 2: Accéder à l'Application

Ouvrir le navigateur:
```
http://localhost:4200
```

**Vérifier:**
- [ ] Page d'accueil charge
- [ ] Navbar visible
- [ ] Pas d'erreurs dans la console

---

### Test 3: Tester l'Authentification

1. **Register:**
   - Cliquer sur "Register"
   - Remplir le formulaire
   - Cliquer sur "Register"
   - Vérifier que l'utilisateur est créé

2. **Login:**
   - Cliquer sur "Login"
   - Entrer les identifiants
   - Cliquer sur "Login"
   - Vérifier que le token est stocké

---

### Test 4: Tester les Composants

1. **Dashboard:**
   - Vérifier que les charts s'affichent
   - Vérifier que les statistiques s'affichent

2. **Data Management:**
   - Uploader un fichier
   - Vérifier que le fichier est traité

3. **Model Management:**
   - Créer un modèle
   - Vérifier que le modèle est créé

4. **Training:**
   - Démarrer l'entraînement
   - Vérifier que la progression s'affiche
   - Vérifier que les métriques s'affichent

---

### Test 5: Tester les Charts

Vérifier que tous les charts s'affichent:
- [ ] Training Chart (loss, accuracy)
- [ ] Confusion Matrix
- [ ] ROC Curve
- [ ] Feature Importance
- [ ] Model Comparison

---

## 🔍 Tests avec Postman

### Importer la Collection

1. Ouvrir Postman
2. Cliquer sur "Import"
3. Sélectionner le fichier `docs/postman-collection.json`
4. Cliquer sur "Import"

### Tester les Endpoints

1. **Authentication:**
   - Register
   - Login
   - Get Current User
   - Logout

2. **Models:**
   - Create Model
   - Get Models
   - Get Model Details
   - Update Model
   - Delete Model

3. **Datasets:**
   - Upload Dataset
   - Get Datasets
   - Preprocess Data
   - Split Data

4. **Training:**
   - Start Training
   - Get Training History
   - Evaluate Model
   - Make Prediction

5. **Files:**
   - Validate File
   - Compress File
   - Backup File
   - Get File Info

6. **Notifications:**
   - Get Notifications
   - Get Unread Notifications
   - Mark as Read
   - Delete Notification

---

## 📊 Tests de Performance

### Test 1: Temps de Réponse

```bash
# Mesurer le temps de réponse
time curl http://localhost:3000/api/models

# Résultat attendu: < 500ms
```

---

### Test 2: Taille des Réponses

```bash
# Vérifier la taille de la réponse
curl -X GET http://localhost:3000/api/large-data \
  -H "Accept-Encoding: gzip" \
  -w "\nSize: %{size_download} bytes\n"

# Avec compression: ~20% de la taille originale
```

---

### Test 3: Cache Hit Rate

```bash
# Première requête
curl http://localhost:3000/api/models

# Vérifier les logs pour "Cache hit" ou "Cache miss"
```

---

## 🐛 Débogage

### Vérifier les Logs

```bash
# Logs du serveur
tail -f logs/combined.log

# Logs des erreurs
tail -f logs/error.log

# Logs HTTP
tail -f logs/http.log
```

---

### Vérifier MongoDB

```bash
# Connexion à MongoDB
mongo

# Sélectionner la base de données
use deeplearning

# Voir les collections
show collections

# Voir les utilisateurs
db.users.find()
```

---

### Vérifier Redis

```bash
# Connexion à Redis
redis-cli

# Voir les clés
keys *

# Voir une clé
get cache:models

# Vider le cache
flushdb
```

---

## ✅ Checklist de Test

### Backend
- [ ] Serveur démarre sans erreurs
- [ ] MongoDB connecté
- [ ] Redis connecté (optionnel)
- [ ] Health check répond
- [ ] Authentification fonctionne
- [ ] Rate limiting fonctionne
- [ ] Cache fonctionne
- [ ] Compression fonctionne
- [ ] Pagination fonctionne
- [ ] Notifications fonctionne

### Frontend
- [ ] Application démarre
- [ ] Page d'accueil charge
- [ ] Authentification fonctionne
- [ ] Dashboard affiche les données
- [ ] Charts s'affichent
- [ ] Upload de fichier fonctionne
- [ ] Entraînement démarre
- [ ] Pas d'erreurs dans la console

### Performance
- [ ] Temps de réponse < 500ms
- [ ] Compression réduit la taille de 70%
- [ ] Cache réduit le temps de 90%
- [ ] Pagination fonctionne

---

## 🚀 Prochaines Étapes

1. **Tester tous les endpoints**
2. **Vérifier les performances**
3. **Corriger les bugs trouvés**
4. **Créer les tests unitaires**
5. **Déployer en production**

---

## 📞 Troubleshooting

### Erreur: "Cannot find module"
```bash
npm install
```

### Erreur: "MongoDB connection failed"
```bash
# Vérifier que MongoDB est en cours d'exécution
mongod

# Ou modifier MONGODB_URI dans .env
```

### Erreur: "Redis connection refused"
```bash
# Vérifier que Redis est en cours d'exécution
redis-server

# Ou désactiver Redis dans .env
```

### Erreur: "Port 3000 already in use"
```bash
# Trouver le processus utilisant le port
netstat -ano | findstr :3000

# Tuer le processus
taskkill /PID <PID> /F
```

---

**Bon testing! 🚀**

Créé le: 30 Novembre 2025
Version: 1.0.0
Status: ✅ COMPLET
