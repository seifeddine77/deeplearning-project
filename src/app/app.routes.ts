import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'data',
    loadComponent: () => import('./components/data/data.component')
      .then(m => m.DataComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'model',
    loadComponent: () => import('./components/model/model.component')
      .then(m => m.ModelComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'training',
    loadComponent: () => import('./components/training/training-enhanced.component')
      .then(m => m.TrainingEnhancedComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'analysis',
    loadComponent: () => import('./components/analysis/analysis.component')
      .then(m => m.AnalysisComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./components/notifications/notifications.component')
      .then(m => m.NotificationsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/reports.component')
      .then(m => m.ReportsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'manage-models',
    loadComponent: () => import('./components/manage-models/manage-models.component')
      .then(m => m.ManageModelsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'manage-datasets',
    loadComponent: () => import('./components/manage-datasets/manage-datasets.component')
      .then(m => m.ManageDatasetsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'mlops',
    loadComponent: () => import('./components/mlops/mlops.component')
      .then(m => m.MlopsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'kaggle',
    loadComponent: () => import('./components/kaggle/kaggle.component')
      .then(m => m.KaggleComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'gemini',
    loadComponent: () => import('./components/gemini/gemini.component')
      .then(m => m.GeminiComponent),
    canActivate: [AuthGuard]
  }
];
