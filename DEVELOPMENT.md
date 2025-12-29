# 🛠️ Guide de Développement

## 📋 Avant de Commencer

1. Assurez-vous que Node.js 16+ est installé
2. Clonez/Naviguez vers le projet
3. Exécutez `npm install`
4. Lisez ce guide

## 🚀 Démarrage du Développement

### Option 1: Mode Simple (Recommandé pour débuter)
```bash
npm start
```
- Démarre le serveur Node.js sur le port 3000
- Accédez à http://localhost:3000

### Option 2: Mode Développement Avancé
**Terminal 1 - Backend avec rechargement automatique:**
```bash
npm run dev
```

**Terminal 2 - Frontend Angular (optionnel):**
```bash
npm run ng:serve
```
- Frontend sur http://localhost:4200
- Backend sur http://localhost:3000

## 📁 Structure des Fichiers

### Backend (Node.js)

#### `server/index.js`
Point d'entrée du serveur. Configure Express, les routes et les middlewares.

```javascript
// Ajouter une nouvelle route
app.use('/api/nouvelle-route', require('./routes/nouvelle-route'));
```

#### `server/routes/`
Définit les endpoints API.

**Créer une nouvelle route:**
```javascript
// server/routes/nouvelle-route.js
const express = require('express');
const router = express.Router();

router.post('/endpoint', async (req, res) => {
  try {
    // Logique ici
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### `server/services/`
Contient la logique métier.

**Créer un nouveau service:**
```javascript
// server/services/nouveauService.js
class NouveauService {
  async maMethode() {
    // Logique ici
  }
}

module.exports = new NouveauService();
```

### Frontend (Angular)

#### `src/app/components/`
Composants Angular réutilisables.

**Créer un nouveau composant:**
```bash
ng generate component components/mon-composant
```

Ou manuellement:
```typescript
// src/app/components/mon-composant/mon-composant.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-mon-composant',
  standalone: true,
  template: `<div>Mon composant</div>`,
  styles: []
})
export class MonComposantComponent {}
```

#### `src/app/services/`
Services Angular pour la communication HTTP.

**Ajouter une nouvelle méthode au service API:**
```typescript
// src/app/services/api.service.ts
monEndpoint(): Observable<any> {
  return this.http.get(`${this.apiUrl}/mon-endpoint`);
}
```

#### `src/app/app.routes.ts`
Définit les routes de l'application.

**Ajouter une nouvelle route:**
```typescript
{ path: 'mon-page', component: MonComposantComponent }
```

## 🔄 Workflow Typique

### 1. Créer un endpoint Backend

```javascript
// server/routes/users.js
router.get('/list', async (req, res) => {
  try {
    const users = await UserService.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Ajouter la méthode au Service API

```typescript
// src/app/services/api.service.ts
getUsers(): Observable<any> {
  return this.http.get(`${this.apiUrl}/users/list`);
}
```

### 3. Créer un Composant

```typescript
// src/app/components/users/users.component.ts
export class UsersComponent implements OnInit {
  users: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getUsers().subscribe(
      (data: any) => {
        this.users = data;
      },
      (error: any) => console.error('Erreur:', error)
    );
  }
}
```

### 4. Ajouter la Route

```typescript
// src/app/app.routes.ts
{ path: 'users', component: UsersComponent }
```

## 🧪 Tester les Endpoints

### Avec Postman/Insomnia

1. Démarrez le serveur: `npm start`
2. Importez les endpoints
3. Testez chaque route

### Avec cURL

```bash
# GET
curl http://localhost:3000/api/data/stats

# POST
curl -X POST http://localhost:3000/api/model/create \
  -H "Content-Type: application/json" \
  -d '{"inputShape":[64,64,1],"numClasses":10}'
```

### Avec le navigateur

Ouvrez la console (F12) et utilisez:
```javascript
fetch('/api/data/stats')
  .then(r => r.json())
  .then(d => console.log(d));
```

## 🐛 Débogage

### Backend

**Logs serveur:**
```javascript
console.log('Message:', variable);
console.error('Erreur:', error);
```

**Vérifier les erreurs:**
```bash
npm run dev  # Affiche les logs en temps réel
```

### Frontend

**Console navigateur (F12):**
- Onglet "Console" pour les erreurs
- Onglet "Network" pour les requêtes HTTP
- Onglet "Application" pour le stockage local

**Logs Angular:**
```typescript
console.log('Debug:', this.variable);
```

## 📦 Ajouter des Dépendances

### Backend
```bash
npm install nom-du-package
```

Puis importer:
```javascript
const package = require('nom-du-package');
```

### Frontend
```bash
npm install nom-du-package
```

Puis importer:
```typescript
import { Package } from 'nom-du-package';
```

## 🎨 Styling

### Global (SCSS)
```scss
// src/styles.scss
.ma-classe {
  color: #667eea;
  
  &:hover {
    color: #764ba2;
  }
}
```

### Composant (SCSS)
```typescript
@Component({
  styles: [`
    .ma-classe {
      color: #667eea;
    }
  `]
})
```

## 📝 Conventions de Code

### Nommage

**Backend:**
- Fichiers: `camelCase.js`
- Fonctions: `camelCase()`
- Classes: `PascalCase`

**Frontend:**
- Fichiers: `kebab-case.component.ts`
- Composants: `PascalCase`
- Variables: `camelCase`

### Structure

**Backend:**
```javascript
// 1. Imports
const express = require('express');

// 2. Configuration
const router = express.Router();

// 3. Routes
router.get('/endpoint', handler);

// 4. Export
module.exports = router;
```

**Frontend:**
```typescript
// 1. Imports
import { Component } from '@angular/core';

// 2. Décorateur
@Component({
  selector: 'app-mon-composant',
  template: `...`,
  styles: [`...`]
})

// 3. Classe
export class MonComposantComponent {
  // Propriétés
  // Constructeur
  // Méthodes
}
```

## 🔐 Bonnes Pratiques

### Backend

✅ **À faire:**
- Valider les entrées
- Gérer les erreurs
- Utiliser des try/catch
- Logger les erreurs
- Utiliser les variables d'environnement

❌ **À éviter:**
- Hardcoder les valeurs
- Ignorer les erreurs
- Exposer les détails d'erreur
- Faire confiance aux données utilisateur

### Frontend

✅ **À faire:**
- Utiliser les services
- Gérer les erreurs
- Afficher les messages utilisateur
- Valider les formulaires
- Utiliser les observables

❌ **À éviter:**
- Faire des appels HTTP directs
- Ignorer les erreurs
- Afficher les erreurs techniques
- Faire confiance aux données serveur

## 📊 Performance

### Backend
```javascript
// Utiliser async/await
async function handler(req, res) {
  const data = await service.getData();
  res.json(data);
}

// Mettre en cache si possible
const cache = {};
```

### Frontend
```typescript
// Utiliser OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Unsubscribe
ngOnDestroy() {
  this.subscription.unsubscribe();
}
```

## 🚀 Déploiement

### Build Production
```bash
npm run ng:build
npm run build
```

### Vérifier la build
```bash
npm start
```

## 📚 Ressources

- [Express.js Docs](https://expressjs.com/)
- [Angular Docs](https://angular.io/)
- [TensorFlow.js Docs](https://js.tensorflow.org/)
- [Node.js Docs](https://nodejs.org/)

## 🆘 Troubleshooting

### Erreur: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "Port déjà utilisé"
```bash
# Changer le port dans .env
PORT=3001
```

### Erreur: "CORS"
```javascript
// Vérifier server/index.js
app.use(cors());
```

### Erreur: "Compilation failed"
```bash
# Nettoyer et reconstruire
rm -rf dist .angular
npm run ng:build
```

## ✅ Checklist Avant de Commiter

- [ ] Code formaté
- [ ] Pas d'erreurs console
- [ ] Tests passent
- [ ] Documentation mise à jour
- [ ] Pas de fichiers temporaires
- [ ] Pas de secrets exposés

---

Bon développement! 🚀
