import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div style="min-height: calc(100vh - 70px); background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding: 32px 24px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 2.2rem; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            <mat-icon svgIcon="bell" style="vertical-align: -6px; margin-right: 10px; color: rgba(255,255,255,0.95);"></mat-icon>
            Notifications
          </h1>
          <p style="margin: 10px 0 0 0; font-size: 1rem; color: rgba(255,255,255,0.9);">See system events and report status</p>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); padding: 18px; margin-bottom: 18px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <div style="font-weight: 700; color: #111;">Unread: <span style="color: #ef4444;">{{ unreadCount }}</span></div>
            <div style="font-weight: 600; color: #111;">Total: <span style="color: #0066ff;">{{ totalCount }}</span></div>
            <div *ngIf="errorMessage" style="color: #b91c1c; font-weight: 600;">{{ errorMessage }}</div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button (click)="refresh()" [disabled]="isLoading" style="padding: 10px 14px; background: #0ea5e9; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">
              <mat-icon svgIcon="refresh" style="vertical-align: -4px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
              {{ isLoading ? 'Loading...' : 'Refresh' }}
            </button>
            <button (click)="markAllRead()" [disabled]="isLoading || unreadCount === 0" style="padding: 10px 14px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; opacity: {{(isLoading || unreadCount === 0) ? 0.7 : 1}};">
              <mat-icon svgIcon="check" style="vertical-align: -4px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
              Mark all read
            </button>
          </div>
        </div>

        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="padding: 14px 18px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 800; color: #111;">Latest notifications</div>
            <div style="font-size: 0.875rem; color: #6b7280;">Showing {{ notifications.length }} items</div>
          </div>

          <div *ngIf="notifications.length === 0" style="padding: 40px; text-align: center; color: #6b7280;">
            No notifications yet.
          </div>

          <div *ngFor="let n of notifications" style="padding: 14px 18px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 14px; align-items: flex-start;">
            <div style="width: 10px; height: 10px; border-radius: 999px; margin-top: 7px;" [style.background]="n.read ? '#94a3b8' : '#ef4444'"></div>

            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <div>
                  <div style="font-weight: 800; color: #111;">{{ n.title || 'Notification' }}</div>
                  <div style="color: #374151; margin-top: 4px;">{{ n.message }}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 0.8rem; color: #6b7280;">{{ formatDate(n.timestamp || n.createdAt) }}</div>
                  <div style="font-size: 0.8rem; font-weight: 700; margin-top: 4px;" [style.color]="typeColor(n.type)">{{ (n.type || 'info') | uppercase }}</div>
                </div>
              </div>

              <div *ngIf="n.data" style="margin-top: 10px; font-size: 0.85rem; color: #334155; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; overflow-x: auto;">
                <pre style="margin: 0; white-space: pre-wrap;">{{ toPrettyJson(n.data) }}</pre>
              </div>

              <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button *ngIf="!n.read" (click)="markRead(n)" [disabled]="isLoading" style="padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">
                  <mat-icon svgIcon="check" style="vertical-align: -3px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
                  Mark read
                </button>
                <button (click)="remove(n)" [disabled]="isLoading" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; opacity: {{isLoading ? 0.7 : 1}};">
                  <mat-icon svgIcon="x" style="vertical-align: -3px; margin-right: 8px; color: rgba(255,255,255,0.95);"></mat-icon>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  totalCount = 0;
  unreadCount = 0;
  isLoading = false;
  errorMessage = '';

  private refreshTimer: any;

  constructor(private apiService: ApiService, private toastService: ToastService) {}

  ngOnInit() {
    this.refresh();
    this.refreshTimer = setInterval(() => this.refreshStatsOnly(), 5000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  refresh() {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getNotifications(100).subscribe(
      (resp: any) => {
        this.notifications = resp?.notifications || [];
        this.totalCount = Number(resp?.count ?? this.notifications.length);
        this.unreadCount = this.notifications.filter((n: any) => !n.read).length;
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Failed to load notifications';
      }
    );
  }

  private refreshStatsOnly() {
    this.apiService.getNotificationStats().subscribe(
      (resp: any) => {
        const stats = resp?.stats;
        if (stats) {
          this.totalCount = Number(stats.total ?? this.totalCount);
          this.unreadCount = Number(stats.unread ?? this.unreadCount);
        }
      },
      () => {}
    );
  }

  markAllRead() {
    this.isLoading = true;
    this.apiService.markAllNotificationsRead().subscribe(
      () => {
        this.toastService.success('All notifications marked as read', 2500);
        this.refresh();
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to mark all as read', 3000);
      }
    );
  }

  markRead(n: any) {
    const id = String(n?.id || n?._id || '');
    if (!id) return;
    this.isLoading = true;

    this.apiService.markNotificationRead(id).subscribe(
      () => {
        n.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to mark as read', 3000);
      }
    );
  }

  remove(n: any) {
    const id = String(n?.id || n?._id || '');
    if (!id) return;
    this.isLoading = true;

    this.apiService.deleteNotification(id).subscribe(
      () => {
        this.notifications = this.notifications.filter((x: any) => (x?.id || x?._id) !== (n?.id || n?._id));
        this.totalCount = Math.max(0, this.totalCount - 1);
        if (!n.read) this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.error(err?.error?.message || 'Failed to delete notification', 3000);
      }
    );
  }

  typeColor(type: string): string {
    switch ((type || '').toLowerCase()) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#0066ff';
    }
  }

  formatDate(v: any): string {
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleString();
    } catch {
      return '';
    }
  }

  toPrettyJson(v: any): string {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
}
