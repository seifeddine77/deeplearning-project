import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ErrorMessage {
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorSubject = new Subject<ErrorMessage>();
  public error$ = this.errorSubject.asObservable();

  showError(message: string, duration: number = 5000) {
    this.errorSubject.next({
      message,
      type: 'error',
      duration
    });
  }

  showWarning(message: string, duration: number = 5000) {
    this.errorSubject.next({
      message,
      type: 'warning',
      duration
    });
  }

  showSuccess(message: string, duration: number = 3000) {
    this.errorSubject.next({
      message,
      type: 'success',
      duration
    });
  }

  showInfo(message: string, duration: number = 5000) {
    this.errorSubject.next({
      message,
      type: 'info',
      duration
    });
  }
}
