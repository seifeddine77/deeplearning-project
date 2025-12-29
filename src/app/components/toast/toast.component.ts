import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, Toast } from '../../services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="position: fixed; top: 20px; right: 20px; z-index: 9999; pointer-events: none;">
      <div *ngFor="let toast of toasts$ | async" 
        [@toastAnimation]
        style="margin-bottom: 12px; pointer-events: auto; animation: slideIn 0.3s ease-out;">
        <div [ngSwitch]="toast.type" style="border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 12px; min-width: 300px;">
          
          <!-- Success -->
          <div *ngSwitchCase="'success'" style="background: #d1fae5; border-left: 4px solid #10b981; color: #065f46;">
            <mat-icon svgIcon="check" style="vertical-align: middle; margin-right: 8px;"></mat-icon>
            <span>{{ toast.message }}</span>
          </div>

          <!-- Error -->
          <div *ngSwitchCase="'error'" style="background: #fee2e2; border-left: 4px solid #ef4444; color: #dc2626;">
            <mat-icon svgIcon="x" style="vertical-align: middle; margin-right: 8px;"></mat-icon>
            <span>{{ toast.message }}</span>
          </div>

          <!-- Warning -->
          <div *ngSwitchCase="'warning'" style="background: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e;">
            <mat-icon svgIcon="warning" style="vertical-align: middle; margin-right: 8px;"></mat-icon>
            <span>{{ toast.message }}</span>
          </div>

          <!-- Info -->
          <div *ngSwitchDefault style="background: #dbeafe; border-left: 4px solid #3b82f6; color: #1e40af;">
            <mat-icon svgIcon="info" style="vertical-align: middle; margin-right: 8px;"></mat-icon>
            <span>{{ toast.message }}</span>
          </div>

          <button (click)="toastService.remove(toast.id)" style="background: none; border: none; font-size: 1.25rem; cursor: pointer; margin-left: auto; opacity: 0.7; hover: opacity: 1;">
            <mat-icon svgIcon="x"></mat-icon>
          </button>
        </div>
      </div>
    </div>

    <style>
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    </style>
  `
})
export class ToastComponent implements OnInit {
  toasts$: Observable<Toast[]>;

  constructor(public toastService: ToastService) {
    this.toasts$ = this.toastService.toasts;
  }

  ngOnInit() {}
}
