import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export type AuthUser = {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
} | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'token';
  private readonly userKey = 'user';

  private userSubject = new BehaviorSubject<AuthUser>(this.readUserFromStorage());
  user$ = this.userSubject.asObservable();

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  isLoggedIn$ = this.loggedInSubject.asObservable();

  constructor(private router: Router) {
    // If a stale/expired token exists at startup, clear it.
    if (!this.hasValidToken()) {
      this.clearStorage();
    }
  }

  getToken(): string {
    return localStorage.getItem(this.tokenKey) || '';
  }

  getUser(): AuthUser {
    return this.userSubject.value;
  }

  setSession(token: string, user: any) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user || {}));
    this.userSubject.next(user || null);
    this.loggedInSubject.next(this.hasValidToken());
  }

  logout(redirectToLogin: boolean = true) {
    this.clearStorage();
    this.userSubject.next(null);
    this.loggedInSubject.next(false);
    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  ensureValidSessionOrLogout(): boolean {
    if (!this.hasValidToken()) {
      this.logout(true);
      return false;
    }
    return true;
  }

  private clearStorage() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  private readUserFromStorage(): AuthUser {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const exp = this.getJwtExp(token);
    if (!exp) return true;
    return Date.now() < exp * 1000;
  }

  private getJwtExp(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const data = JSON.parse(json);
      const exp = Number(data?.exp);
      return Number.isFinite(exp) ? exp : null;
    } catch {
      return null;
    }
  }
}
