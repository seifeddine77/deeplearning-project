import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../app/services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-content">
        <div class="login-container">
          <!-- Left Section -->
          <div class="login-left">
            <div class="brand">
              <div class="logo-container">
                <div class="logo-icon">
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="white" stroke-width="2"/>
                    <path d="M30 50 Q50 30 70 50 Q50 70 30 50" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="50" cy="50" r="5" fill="white"/>
                  </svg>
                </div>
              </div>
              <h2>Deep Learning</h2>
              <p>AI & Neural Networks</p>
            </div>
            <div class="features">
              <div class="feature">
                <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <path d="M12 1v6m0 6v6"></path>
                  <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"></path>
                  <path d="M1 12h6m6 0h6"></path>
                  <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
                </svg>
                <span>Advanced Models</span>
              </div>
              <div class="feature">
                <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                <span>Real-time Training</span>
              </div>
              <div class="feature">
                <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>Data Management</span>
              </div>
              <div class="feature">
                <svg class="feature-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>AI Analytics</span>
              </div>
            </div>
          </div>

          <!-- Right Section -->
          <div class="login-right">
            <div class="form-wrapper">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>

              <form (ngSubmit)="login()" class="login-form">
                <div class="form-group">
                  <label>Email Address</label>
                  <div class="input-wrapper">
                    <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                    <input
                      type="email"
                      [(ngModel)]="email"
                      name="email"
                      placeholder="your@email.com"
                      required
                      class="form-control"
                      [disabled]="loading"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Password</label>
                  <div class="password-group">
                    <div class="input-wrapper">
                      <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      <input
                        [type]="hidePassword ? 'password' : 'text'"
                        [(ngModel)]="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        class="form-control"
                        [disabled]="loading"
                      />
                    </div>
                    <button
                      type="button"
                      (click)="hidePassword = !hidePassword"
                      class="toggle-btn"
                    >
                      {{ hidePassword ? 'Show' : 'Hide' }}
                    </button>
                  </div>
                </div>

                <!-- Remember Me & Forgot Password -->
                <div class="form-options">
                  <label class="checkbox">
                    <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
                    Remember me
                  </label>
                  <a href="javascript:void(0)" (click)="forgotPassword(); $event.preventDefault();">
                    Forgot password?
                  </a>
                </div>

                <!-- Error Message -->
                <div *ngIf="error" class="alert alert-error">
                  {{ error }}
                </div>

                <!-- Success Message -->
                <div *ngIf="success" class="alert alert-success">
                  {{ success }}
                </div>

                <!-- Login Button -->
                <button type="submit" [disabled]="loading" class="btn-login">
                  {{ loading ? 'Signing in...' : 'Sign In' }}
                </button>
              </form>

              <!-- Register Link -->
              <div class="form-footer">
                <p>
                  Don't have an account?
                  <a href="javascript:void(0)" (click)="goToRegister(); $event.preventDefault();">
                    Create one
                  </a>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fadeInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
      pointer-events: none;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      opacity: 0.1;
      animation: float 6s ease-in-out infinite;
      background: white;
    }

    .blob-1 {
      width: 300px;
      height: 300px;
      top: -50px;
      left: -50px;
      animation-delay: 0s;
    }

    .blob-2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      right: -50px;
      animation-delay: 2s;
    }

    .blob-3 {
      width: 250px;
      height: 250px;
      top: 50%;
      right: -100px;
      animation-delay: 4s;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(30px, 30px); }
    }

    /* Login Content */
    .login-content {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0;
      min-height: auto;
      position: relative;
      z-index: 1;
    }

    .login-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      max-width: 1100px;
      width: 100%;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3), 0 0 60px rgba(255, 0, 128, 0.2);
      background: white;
      border: none;
      animation: slideUp 0.8s ease-out;
      position: relative;
      z-index: 1;
    }

    /* Left Section */
    .login-left {
      background: linear-gradient(135deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%);
      color: white;
      padding: 60px 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      animation: fadeInLeft 0.8s ease-out;
      position: relative;
      overflow: hidden;
      border-right: none;
    }

    .login-left::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: rotate 20s linear infinite;
      opacity: 0.3;
    }

    .brand {
      margin-bottom: 50px;
      position: relative;
      z-index: 1;
    }

    .logo-container {
      margin-bottom: 30px;
    }

    .logo-icon {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s ease-in-out infinite;
    }

    .logo-icon svg {
      width: 100%;
      height: 100%;;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
    }

    .brand h2 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .brand p {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 300;
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 18px;
      position: relative;
      z-index: 1;
    }

    .feature {
      font-size: 15px;
      opacity: 0.95;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      transition: all 0.3s ease;
      padding: 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .feature:hover {
      opacity: 1;
      transform: translateX(8px);
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .feature-icon {
      width: 32px;
      height: 32px;
      color: white;
      flex-shrink: 0;
      transition: all 0.3s ease;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      margin-top: 2px;
    }

    .feature:hover .feature-icon {
      transform: scale(1.15) rotate(5deg);
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
    }

    .feature-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .feature-title {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.3;
    }

    .feature-desc {
      font-size: 13px;
      opacity: 0.85;
      font-weight: 400;
      line-height: 1.4;
    }

    /* Right Section */
    .login-right {
      background: white;
      padding: 60px 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeInRight 0.8s ease-out;
      position: relative;
      overflow: hidden;
    }

    .login-right::before {
      content: '';
      position: absolute;
      top: -50px;
      right: -50px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(0, 102, 255, 0.08) 0%, transparent 70%);
      border-radius: 50%;
      animation: pulse 4s ease-in-out infinite;
      z-index: 0;
      filter: blur(60px);
    }

    .login-right::after {
      content: '';
      position: absolute;
      bottom: -100px;
      left: -100px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255, 0, 128, 0.08) 0%, transparent 70%);
      border-radius: 50%;
      animation: pulse 5s ease-in-out infinite 1s;
      z-index: 0;
      filter: blur(60px);
    }

    .form-wrapper {
      width: 100%;
      max-width: 380px;
      position: relative;
      z-index: 1;
    }

    .form-wrapper h2 {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #0066ff 0%, #00d4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      animation: slideUp 0.6s ease-out 0.2s both;
    }

    .form-wrapper > p {
      font-size: 14px;
      color: #999;
      margin-bottom: 32px;
      animation: slideUp 0.6s ease-out 0.3s both;
    }

    /* Form */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: #333;
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
      padding: 12px 14px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
      font-family: inherit;
      background: #f8f9fa;
      color: #333;
      width: 100%;
      padding-left: 40px;
    }

    .form-control::placeholder {
      color: #999;
    }

    .form-control:focus {
      outline: none;
      border-color: #0066ff;
      box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
      background: white;
    }

    .form-control:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .password-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .password-group .input-wrapper {
      flex: 1;
    }

    .toggle-btn {
      padding: 8px 12px;
      background: transparent;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: #667eea;
      font-weight: 600;
      transition: all 0.3s;
      white-space: nowrap;
    }

    .toggle-btn:hover {
      background: #f5f7fa;
      border-color: #667eea;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }

    .checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: #2c3e50;
      font-weight: 500;
    }

    .checkbox input {
      cursor: pointer;
      width: 16px;
      height: 16px;
    }

    .form-options a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }

    .form-options a:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    .alert {
      padding: 12px 14px;
      border-radius: 6px;
      font-size: 14px;
      border-left: 4px solid;
    }

    .alert-error {
      background-color: #ffebee;
      color: #c62828;
      border-left-color: #c62828;
    }

    .alert-success {
      background-color: #e8f5e9;
      color: #2e7d32;
      border-left-color: #2e7d32;
    }

    .btn-login {
      padding: 12px 16px;
      background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 8px;
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(0, 212, 255, 0.4);
    }

    .btn-login:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #ecf0f1;
    }

    .form-footer p {
      font-size: 14px;
      color: #7f8c8d;
      margin: 0;
    }

    .form-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }

    .form-footer a:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .login-container {
        grid-template-columns: 1fr;
      }

      .login-left {
        padding: 40px 30px;
        min-height: 250px;
      }

      .login-right {
        padding: 40px 30px;
      }

      .brand h2 {
        font-size: 24px;
      }

      .form-wrapper h2 {
        font-size: 24px;
      }

      .navbar-links {
        gap: 10px;
      }

      .navbar-links a {
        font-size: 12px;
      }
    }

    @media (max-width: 480px) {
      .navbar-links a {
        display: none;
      }

      .login-left {
        padding: 30px 20px;
      }

      .login-right {
        padding: 30px 20px;
      }

      .form-wrapper {
        max-width: 100%;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  loading: boolean = false;
  error: string = '';
  success: string = '';
  hidePassword: boolean = true;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }
  }

  login() {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error = '';

    this.apiService.login(this.email, this.password).subscribe(
      (response: any) => {
        this.loading = false;

        if (response.token) {
          this.authService.setSession(response.token, response.user);

          if (this.rememberMe) {
            localStorage.setItem('savedEmail', this.email);
          } else {
            localStorage.removeItem('savedEmail');
          }

          const returnUrl = String(this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard');
          this.router.navigate([returnUrl]);
        }
      },
      (error: any) => {
        this.loading = false;
        this.error = error.error?.message || 'Login failed. Please check your credentials.';
      }
    );
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
