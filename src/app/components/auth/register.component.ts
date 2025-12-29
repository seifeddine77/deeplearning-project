import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="register-wrapper">
      <!-- Background Animation -->
      <div class="background-animation">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
      </div>

      <div class="register-container">
        <!-- Left Side - Info -->
        <div class="register-info">
          <div class="info-content">
            <h2 style="display:flex; align-items:center; gap: 10px;">
              <mat-icon svgIcon="brain"></mat-icon>
              Deep Learning Platform
            </h2>
            <p>Plateforme complète pour l'entraînement et la gestion de modèles de deep learning</p>
            
            <div class="features">
              <div class="feature">
                <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Modèles ML avancés</span>
              </div>
              <div class="feature">
                <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>Visualisations en temps réel</span>
              </div>
              <div class="feature">
                <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                <span>Performance optimisée</span>
              </div>
              <div class="feature">
                <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Sécurité garantie</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side - Form -->
        <div class="register-form-container">
          <div class="register-card">
            <!-- Header -->
            <div class="register-header">
              <h1>Créer un compte</h1>
              <p>Rejoignez notre communauté</p>
            </div>

            <!-- Alerts -->
            <div *ngIf="error" class="alert alert-error" [@slideIn]>
              <div class="alert-content">
                <span class="alert-icon"><mat-icon svgIcon="warning"></mat-icon></span>
                <div class="alert-text">
                  <strong>Erreur</strong>
                  <p>{{ error }}</p>
                </div>
              </div>
            </div>

            <div *ngIf="success" class="alert alert-success" [@slideIn]>
              <div class="alert-content">
                <span class="alert-icon"><mat-icon svgIcon="check"></mat-icon></span>
                <div class="alert-text">
                  <strong>Succès!</strong>
                  <p>{{ success }}</p>
                </div>
              </div>
            </div>

            <!-- Form -->
            <form (ngSubmit)="register(); $event.preventDefault();" class="register-form" [class.loading]="loading" (submit)="$event.preventDefault();">
              <!-- Username -->
              <div class="form-group">
                <label for="username">
                  <span class="label-text">Nom d'utilisateur</span>
                  <span class="label-required">*</span>
                </label>
                <div class="input-wrapper">
                  <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    id="username"
                    [(ngModel)]="username"
                    name="username"
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                    class="form-control"
                    [disabled]="loading"
                    minlength="3"
                  />
                </div>
              </div>

              <!-- Email -->
              <div class="form-group">
                <label for="email">
                  <span class="label-text">Adresse email</span>
                  <span class="label-required">*</span>
                </label>
                <div class="input-wrapper">
                  <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
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
              </div>

              <!-- Password -->
              <div class="form-group">
                <label for="password">
                  <span class="label-text">Mot de passe</span>
                  <span class="label-required">*</span>
                </label>
                <div class="input-wrapper">
                  <span class="input-icon"><mat-icon svgIcon="lock"></mat-icon></span>
                  <input
                    type="password"
                    id="password"
                    [(ngModel)]="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    class="form-control"
                    [disabled]="loading"
                    minlength="8"
                  />
                </div>
                <small class="password-hint">Minimum 8 caractères</small>
              </div>

              <!-- Confirm Password -->
              <div class="form-group">
                <label for="confirmPassword">
                  <span class="label-text">Confirmer le mot de passe</span>
                  <span class="label-required">*</span>
                </label>
                <div class="input-wrapper">
                  <span class="input-icon"><mat-icon svgIcon="lock"></mat-icon></span>
                  <input
                    type="password"
                    id="confirmPassword"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                    class="form-control"
                    [disabled]="loading"
                    minlength="8"
                  />
                </div>
              </div>

              <!-- Terms Checkbox -->
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    id="terms"
                    [(ngModel)]="agreeTerms"
                    name="agreeTerms"
                    [disabled]="loading"
                  />
                  <span class="checkbox-text">
                    J'accepte les <a href="#" class="link">conditions d'utilisation</a> et la <a href="#" class="link">politique de confidentialité</a>
                  </span>
                </label>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="loading || !agreeTerms"
                class="btn btn-primary btn-block"
              >
                <span *ngIf="!loading" class="btn-text">
                  <span class="btn-icon"><mat-icon svgIcon="check"></mat-icon></span>
                  Créer mon compte
                </span>
                <span *ngIf="loading" class="btn-loading">
                  <span class="spinner"></span>
                  Inscription en cours...
                </span>
              </button>
            </form>

            <!-- Footer -->
            <div class="register-footer">
              <p>Vous avez déjà un compte?
                <a href="javascript:void(0)" (click)="goToLogin(); $event.preventDefault();" class="link-primary">Se connecter</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
    }

    .register-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .background-animation {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      z-index: 0;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      opacity: 0.1;
      animation: float 6s ease-in-out infinite;
    }

    .blob-1 {
      width: 300px;
      height: 300px;
      background: white;
      top: -50px;
      left: -50px;
      animation-delay: 0s;
    }

    .blob-2 {
      width: 200px;
      height: 200px;
      background: white;
      bottom: -50px;
      right: -50px;
      animation-delay: 2s;
    }

    .blob-3 {
      width: 250px;
      height: 250px;
      background: white;
      top: 50%;
      right: -100px;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(30px, 30px); }
    }

    .register-container {
      display: flex;
      width: 100%;
      max-width: 1200px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    .register-info {
      display: none;
      flex: 1;
      background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%);
      color: white;
      padding: 60px 40px;
      justify-content: center;
      align-items: center;
    }

    .info-content h2 {
      font-size: 32px;
      margin: 0 0 20px 0;
      font-weight: 700;
    }

    .info-content p {
      font-size: 16px;
      margin: 0 0 40px 0;
      opacity: 0.9;
      line-height: 1.6;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 16px;
    }

    .feature-icon {
      width: 24px;
      height: 24px;
      color: white;
      flex-shrink: 0;
    }

    .register-form-container {
      flex: 1;
      padding: 60px 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .register-card {
      width: 100%;
      max-width: 400px;
    }

    .register-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .register-header h1 {
      font-size: 28px;
      color: #2c3e50;
      margin: 0 0 10px 0;
      font-weight: 700;
    }

    .register-header p {
      font-size: 14px;
      color: #7f8c8d;
      margin: 0;
    }

    .alert {
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .alert-error {
      background: #fee;
      border: 1px solid #fcc;
      color: #c33;
    }

    .alert-success {
      background: #efe;
      border: 1px solid #cfc;
      color: #3c3;
    }

    .alert-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      width: 100%;
    }

    .alert-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .alert-text {
      flex: 1;
    }

    .alert-text strong {
      display: block;
      margin-bottom: 4px;
    }

    .alert-text p {
      margin: 0;
      font-size: 13px;
    }

    .register-form {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
      color: #2c3e50;
      font-weight: 500;
      font-size: 14px;
    }

    .label-required {
      color: #e74c3c;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      width: 18px;
      height: 18px;
      color: #0066ff;
      pointer-events: none;
      flex-shrink: 0;
    }

    .form-control {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border: 2px solid #ecf0f1;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #0066ff;
      box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
      background: #f8f9ff;
    }

    .form-control:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .password-hint {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #95a5a6;
    }

    .checkbox-group {
      margin-bottom: 25px;
    }

    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      font-weight: normal;
      font-size: 13px;
      color: #555;
      line-height: 1.5;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      cursor: pointer;
      accent-color: #0066ff;
    }

    .checkbox-label input:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .checkbox-text {
      flex: 1;
    }

    .link {
      color: #0066ff;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }

    .link:hover {
      color: #00d4ff;
      text-decoration: underline;
    }

    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary {
      background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(0, 212, 255, 0.4);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-text {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-icon {
      font-size: 18px;
    }

    .btn-loading {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .register-footer {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #555;
    }

    .register-footer p {
      margin: 0;
    }

    .link-primary {
      color: #0066ff;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }

    .link-primary:hover {
      color: #00d4ff;
    }

    /* Responsive */
    @media (min-width: 768px) {
      .register-info {
        display: flex;
      }

      .register-form-container {
        padding: 60px 50px;
      }
    }

    @media (max-width: 600px) {
      .register-wrapper {
        padding: 10px;
      }

      .register-container {
        border-radius: 15px;
      }

      .register-form-container {
        padding: 40px 20px;
      }

      .register-card {
        max-width: 100%;
      }

      .register-header h1 {
        font-size: 24px;
      }

      .btn {
        padding: 14px;
        font-size: 15px;
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

    if (this.username.length < 3) {
      this.error = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
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

    // Simuler un délai réseau
    setTimeout(() => {
      // Appeler l'API d'inscription
      this.apiService.register(this.username, this.email, this.password).subscribe(
        (response: any) => {
          this.loading = false;
          console.log('Registration response:', response);

          // Vérifier si la réponse est un succès
          if (response && (response.success === true || response.message)) {
            this.success = 'Inscription réussie! Redirection vers la connexion...';
            this.error = '';

            // Attendre 2 secondes avant redirection
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.error = response?.message || 'Erreur lors de l\'inscription';
            this.success = '';
          }
        },
        (error: any) => {
          this.loading = false;
          console.error('Registration error:', error);

          // Gérer les différents types d'erreurs
          if (error.status === 0) {
            this.error = 'Erreur de connexion au serveur. Vérifiez que le backend est démarré sur http://localhost:3000';
          } else if (error.error?.errors && Array.isArray(error.error.errors)) {
            // Afficher les erreurs de validation détaillées
            const validationErrors = error.error.errors.map((err: any) => err.msg || err.message).join(', ');
            this.error = validationErrors;
          } else if (error.error?.message) {
            this.error = error.error.message;
          } else if (error.error?.error) {
            this.error = error.error.error;
          } else if (error.message) {
            this.error = error.message;
          } else {
            this.error = 'Erreur lors de l\'inscription. Veuillez réessayer.';
          }

          this.success = '';
        }
      );
    }, 500);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
