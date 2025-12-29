import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationEnd, Router } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { Subscription } from 'rxjs';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, MatIconModule],
  template: `
    <app-navbar *ngIf="showNavbar"></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 60px);
      padding: 20px;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Deep Learning CNN+LSTM Project';

  showNavbar = true;
  private sub: Subscription | null = null;

  constructor(
    private router: Router,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.iconRegistry.addSvgIcon(
      'search',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/search.svg')
    );
    this.iconRegistry.addSvgIcon(
      'info',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/info.svg')
    );
    this.iconRegistry.addSvgIcon(
      'dashboard',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/dashboard.svg')
    );
    this.iconRegistry.addSvgIcon(
      'database',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/database.svg')
    );
    this.iconRegistry.addSvgIcon(
      'refresh',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/refresh.svg')
    );
    this.iconRegistry.addSvgIcon(
      'upload',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/upload.svg')
    );
    this.iconRegistry.addSvgIcon(
      'download',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/download.svg')
    );
    this.iconRegistry.addSvgIcon(
      'settings',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/settings.svg')
    );
    this.iconRegistry.addSvgIcon(
      'check',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/check.svg')
    );
    this.iconRegistry.addSvgIcon(
      'x',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/x.svg')
    );
    this.iconRegistry.addSvgIcon(
      'warning',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/warning.svg')
    );
    this.iconRegistry.addSvgIcon(
      'mail',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/mail.svg')
    );
    this.iconRegistry.addSvgIcon(
      'chart',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/chart.svg')
    );
    this.iconRegistry.addSvgIcon(
      'image',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/image.svg')
    );
    this.iconRegistry.addSvgIcon(
      'split',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/split.svg')
    );
    this.iconRegistry.addSvgIcon(
      'bell',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bell.svg')
    );
    this.iconRegistry.addSvgIcon(
      'chevron-down',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/chevron-down.svg')
    );
    this.iconRegistry.addSvgIcon(
      'file',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/file.svg')
    );
    this.iconRegistry.addSvgIcon(
      'robot',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/robot.svg')
    );

    this.iconRegistry.addSvgIcon(
      'brain',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/brain.svg')
    );
    this.iconRegistry.addSvgIcon(
      'plus',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/plus.svg')
    );
    this.iconRegistry.addSvgIcon(
      'save',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/save.svg')
    );
    this.iconRegistry.addSvgIcon(
      'tree',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/tree.svg')
    );
    this.iconRegistry.addSvgIcon(
      'rocket',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/rocket.svg')
    );
    this.iconRegistry.addSvgIcon(
      'bolt',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/bolt.svg')
    );
    this.iconRegistry.addSvgIcon(
      'key',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/key.svg')
    );
    this.iconRegistry.addSvgIcon(
      'play',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/play.svg')
    );
    this.iconRegistry.addSvgIcon(
      'cap',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/cap.svg')
    );
    this.iconRegistry.addSvgIcon(
      'target',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/target.svg')
    );
    this.iconRegistry.addSvgIcon(
      'flask',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/flask.svg')
    );
    this.iconRegistry.addSvgIcon(
      'one',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/one.svg')
    );
    this.iconRegistry.addSvgIcon(
      'two',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/two.svg')
    );
    this.iconRegistry.addSvgIcon(
      'three',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/three.svg')
    );
    this.iconRegistry.addSvgIcon(
      'four',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/four.svg')
    );
    this.iconRegistry.addSvgIcon(
      'five',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/five.svg')
    );
    this.iconRegistry.addSvgIcon(
      'six',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/six.svg')
    );

    this.iconRegistry.addSvgIcon(
      'lock',
      this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/lock.svg')
    );

    this.updateNavbarVisibility(this.router.url);
    this.sub = this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        this.updateNavbarVisibility(ev.urlAfterRedirects || ev.url);
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
  }

  private updateNavbarVisibility(url: string) {
    const clean = String(url || '').split('?')[0];
    this.showNavbar = !(clean === '/login' || clean === '/register');
  }
}
