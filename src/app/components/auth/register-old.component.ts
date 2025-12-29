import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="register-wrapper">
      <div class="register-container">
        <div class="register-card">
          <!-- Header -->
          <div class="register-header">
            <div class="header-icon">🧠</div>
            <h1>Créer un compte</h1>
            <p>Rejoignez notre plateforme de Deep Learning</p>
          </div>

          <!-- Messages d'erreur/succès -->
          <div *ngIf="error" class="alert alert-error">
            <span class="alert-icon">❌</span>
            <span class="alert-message">{{ error }}</span>
          </div>

          <div *ngIf="success" class="alert alert-success">
            <span class="alert-icon">✅</span>
            <span class="alert-message">{{ success }}</span>
          </div>

          <!-- Formulaire -->
          <form (ngSubmit)="register()" class="register-form" [class.loading]="loading">
            <!-- Username -->
            <div class="form-group">
              <label for="username">
                <span class="label-icon">👤</span>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                [(ngModel)]="username"
                name="username"
                placeholder="votre_nom_utilisateur"
                required
                class="form-control"
                [disabled]="loading"
              />
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email">
                <span class="label-icon">📧</span>
                Email
              </label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                placeholder="votre@email.com"
                required
                class="form-control"
                [disabled]="loading"
              />
            </div>

            <!-- Password -->
            <div class="form-group">
              <label for="password">
                <span class="label-icon">🔒</span>
                Mot de passe</label>
            <input
              type="password"
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
              class="form-control"
            />
            <small>Minimum 8 caractères</small>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              required
              class="form-control"
            />
          </div>

          <!-- Terms -->
          <div class="form-group checkbox">
            <input
              type="checkbox"
              id="terms"
              [(ngModel)]="agreeTerms"
              name="agreeTerms"
              required
            />
            <label for="terms">J'accepte les conditions d'utilisation</label>
          </div>

          <!-- Error Message -->
          <div *ngIf="error" class="alert alert-error">
            ❌ {{ error }}
          </div>

          <!-- Success Message -->
          <div *ngIf="success" class="alert alert-success">
            ✅ {{ success }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="loading"
            class="btn btn-primary btn-block"
          >
            <span *ngIf="!loading">S'inscrire</span>
            <span *ngIf="loading">⏳ Inscription en cours...</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="register-footer">
          <p>Vous avez déjà un compte? <a href="#" (click)="goToLogin()">Se connecter</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .register-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
      padding: 40px;
    }

    .register-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .register-header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 28px;
      margin-bottom: 10px;
    }

    .register-header p {
      margin: 0;
      color: #7f8c8d;
      font-size: 14px;
    }

    .register-form {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #2c3e50;
      font-weight: 500;
      font-size: 14px;
    }

    .form-group small {
      display: block;
      margin-top: 4px;
      color: #95a5a6;
      font-size: 12px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #bdc3c7;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-group.checkbox {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }

    .form-group.checkbox input {
      width: auto;
      margin-right: 8px;
      cursor: pointer;
    }

    .form-group.checkbox label {
      margin: 0;
      cursor: pointer;
      font-weight: normal;
    }

    .alert {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .alert-error {
      background-color: #fadbd8;
      color: #c0392b;
      border: 1px solid #e74c3c;
    }

    .alert-success {
      background-color: #d5f4e6;
      color: #27ae60;
      border: 1px solid #2ecc71;
    }

    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background-color: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #5568d3;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-block {
      width: 100%;
    }

    .register-footer {
      text-align: center;
      border-top: 1px solid #ecf0f1;
      padding-top: 20px;
      margin-top: 20px;
    }

    .register-footer p {
      margin: 10px 0;
      font-size: 14px;
      color: #7f8c8d;
    }

    .register-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
    }

    .register-footer a:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .register-card {
        padding: 30px 20px;
      }

      .register-header h1 {
        font-size: 24px;
      }
    }
  `]
})
export class RegisterComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  agreeTerms: boolean = false;
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  register() {
    // Validation
    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Veuillez remplir tous les champs';
      this.success = '';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas';
      this.success = '';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères';
      this.success = '';
      return;
    }

    if (!this.agreeTerms) {
      this.error = 'Vous devez accepter les conditions d\'utilisation';
      this.success = '';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    // Appeler l'API d'inscription
    this.apiService.register(this.username, this.email, this.password).subscribe(
      (response: any) => {
        this.loading = false;
        
        // Vérifier si la réponse est un succès
        if (response.success || response.message) {
          this.success = 'Inscription réussie! Redirection vers la connexion...';
          this.error = '';
          
          // Attendre 2 secondes avant redirection
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.error = response.message || 'Erreur lors de l\'inscription';
          this.success = '';
        }
      },
      (error: any) => {
        this.loading = false;
        
        // Gérer les différents types d'erreurs
        if (error.status === 0) {
          this.error = 'Erreur de connexion au serveur. Vérifiez que le backend est démarré.';
        } else if (error.error?.message) {
          this.error = error.error.message;
        } else if (error.error?.error) {
          this.error = error.error.error;
        } else {
          this.error = 'Erreur lors de l\'inscription. Veuillez réessayer.';
        }
        
        this.success = '';
        console.error('Registration error:', error);
      }
    );
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
