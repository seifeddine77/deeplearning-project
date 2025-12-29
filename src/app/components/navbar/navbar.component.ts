import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService, AuthUser } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <nav class="navbar" *ngIf="isLoggedIn">
      <div class="navbar-container">
        <div class="navbar-left">
          <a class="navbar-brand" routerLink="/dashboard" (click)="closeAll()">Deep Learning</a>

          <button class="burger" (click)="toggleMobileMenu()" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div class="navbar-center" [class.open]="mobileMenuOpen">
          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeAll()">Dashboard</a>
          <a routerLink="/data" routerLinkActive="active" (click)="closeAll()">Data</a>
          <a routerLink="/model" routerLinkActive="active" (click)="closeAll()">Model</a>
          <a routerLink="/training" routerLinkActive="active" (click)="closeAll()">Training</a>
          <a routerLink="/analysis" routerLinkActive="active" (click)="closeAll()">Analysis</a>
          <a routerLink="/manage-models" routerLinkActive="active" (click)="closeAll()">Models</a>
          <a routerLink="/manage-datasets" routerLinkActive="active" (click)="closeAll()">Datasets</a>
          <a routerLink="/reports" routerLinkActive="active" (click)="closeAll()">Reports</a>
          <a routerLink="/notifications" routerLinkActive="active" class="notif-link" (click)="closeAll()">
            <mat-icon svgIcon="bell" style="opacity: 0.95;"></mat-icon>
            Notifications
            <span *ngIf="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
          </a>
          <a routerLink="/mlops" routerLinkActive="active" (click)="closeAll()">MLops</a>
          <a routerLink="/kaggle" routerLinkActive="active" (click)="closeAll()">Kaggle</a>
          <a routerLink="/gemini" routerLinkActive="active" (click)="closeAll()">Gemini</a>
        </div>

        <div class="navbar-right">
          <button class="user-pill" (click)="toggleUserMenu()" aria-label="User menu">
            <span class="user-name">{{ username || 'User' }}</span>
            <mat-icon svgIcon="chevron-down" class="chev" style="opacity: 0.95;"></mat-icon>
          </button>

          <div class="user-menu" *ngIf="userMenuOpen">
            <div class="user-menu-head">
              <div class="user-menu-name">{{ username || 'User' }}</div>
              <div class="user-menu-email">{{ email || '' }}</div>
            </div>
            <button class="user-menu-item" (click)="logout()">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(90deg, #0066ff 0%, #00d4ff 50%, #7209b7 100%);
      color: white;
      padding: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      position: relative;
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 180px;
    }

    .navbar-brand {
      color: white;
      text-decoration: none;
      font-weight: 800;
      letter-spacing: 0.2px;
      font-size: 16px;
      white-space: nowrap;
    }

    .navbar-center {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      flex-wrap: wrap;
      justify-content: center;
    }

    .navbar-center a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: background 0.2s ease, opacity 0.2s ease;
      padding: 8px 10px;
      border-radius: 999px;
      opacity: 0.95;
    }

    .navbar-center a:hover {
      opacity: 1;
      background: rgba(255,255,255,0.16);
    }

    .navbar-center a.active {
      opacity: 1;
      background: rgba(255,255,255,0.22);
    }

    .notif-link {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .notif-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 6px;
      border-radius: 999px;
      background: #ef4444;
      color: white;
      font-size: 12px;
      font-weight: 800;
      line-height: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 200px;
      justify-content: flex-end;
      position: relative;
    }

    .user-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.30);
      color: white;
      padding: 8px 12px;
      border-radius: 999px;
      cursor: pointer;
      font-weight: 700;
      transition: background 0.2s ease;
    }

    .user-pill:hover {
      background: rgba(255,255,255,0.26);
    }

    .user-name {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }

    .chev {
      font-size: 12px;
      opacity: 0.9;
    }

    .user-menu {
      position: absolute;
      top: 46px;
      right: 0;
      width: 240px;
      background: rgba(17, 24, 39, 0.92);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 14px;
      padding: 10px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.25);
      backdrop-filter: blur(10px);
    }

    .user-menu-head {
      padding: 10px;
      border-radius: 10px;
      background: rgba(255,255,255,0.06);
      margin-bottom: 8px;
    }

    .user-menu-name {
      font-weight: 800;
      font-size: 14px;
      color: white;
    }

    .user-menu-email {
      font-size: 12px;
      color: rgba(255,255,255,0.75);
      margin-top: 2px;
      word-break: break-word;
    }

    .user-menu-item {
      width: 100%;
      text-align: left;
      padding: 10px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: white;
      cursor: pointer;
      font-weight: 700;
      transition: background 0.2s ease;
    }

    .user-menu-item:hover {
      background: rgba(255,255,255,0.10);
    }

    .burger {
      display: none;
      width: 42px;
      height: 38px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.12);
      cursor: pointer;
      padding: 8px;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .burger span {
      display: block;
      width: 100%;
      height: 2px;
      background: rgba(255,255,255,0.95);
      border-radius: 2px;
    }

    @media (max-width: 768px) {
      .navbar-container {
        padding: 10px 12px;
      }

      .navbar-left {
        min-width: 0;
      }

      .navbar-right {
        min-width: 0;
      }

      .burger {
        display: inline-flex;
      }

      .navbar-center {
        display: none;
      }

      .navbar-center.open {
        display: flex;
        position: absolute;
        left: 12px;
        right: 12px;
        top: 56px;
        padding: 10px;
        border-radius: 16px;
        background: rgba(17, 24, 39, 0.92);
        border: 1px solid rgba(255,255,255,0.18);
        box-shadow: 0 18px 40px rgba(0,0,0,0.25);
        backdrop-filter: blur(10px);
        justify-content: flex-start;
      }

      .navbar-center.open a {
        width: 100%;
        justify-content: space-between;
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  username: string = '';
  email: string = '';
  unreadCount = 0;

  isLoggedIn = false;
  mobileMenuOpen = false;
  userMenuOpen = false;

  private refreshTimer: any;
  private subs: Subscription[] = [];

  constructor(
    private apiService: ApiService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.subs.push(
      this.authService.isLoggedIn$.subscribe((v) => {
        this.isLoggedIn = !!v;
        if (!this.isLoggedIn) {
          this.unreadCount = 0;
          this.closeAll();
          if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
          }
          return;
        }

        this.refreshUnreadCount();
        if (!this.refreshTimer) {
          this.refreshTimer = setInterval(() => this.refreshUnreadCount(), 5000);
        }
      })
    );

    this.subs.push(
      this.authService.user$.subscribe((u: AuthUser) => {
        this.username = String((u as any)?.username || (u as any)?.name || '');
        this.email = String((u as any)?.email || '');
      })
    );

    this.subs.push(
      this.router.events.subscribe((ev) => {
        if (ev instanceof NavigationEnd) {
          this.closeAll();
        }
      })
    );
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
  }

  refreshUnreadCount() {
    this.apiService.getNotificationStats().subscribe(
      (resp: any) => {
        const unread = Number(resp?.stats?.unread ?? 0);
        this.unreadCount = Number.isFinite(unread) ? unread : 0;
      },
      () => {}
    );
  }

  logout() {
    this.unreadCount = 0;
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.closeAll();
    this.authService.logout(true);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      this.userMenuOpen = false;
    }
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }

  closeAll() {
    this.mobileMenuOpen = false;
    this.userMenuOpen = false;
  }
}
