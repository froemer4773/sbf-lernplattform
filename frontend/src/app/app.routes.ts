import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'learning',
    canActivate: [authGuard],
    children: [
      {
        path: 'category-selection',
        loadComponent: () => import('./components/learning/category-selection/category-selection.component').then(m => m.CategorySelectionComponent)
      },
      {
        path: 'question-view',
        loadComponent: () => import('./components/learning/question-view/question-view.component').then(m => m.QuestionViewComponent)
      }
    ]
  },
  {
    path: 'exam',
    loadComponent: () => import('./components/exam/exam-mode/exam-mode.component').then(m => m.ExamModeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'statistics',
    loadComponent: () => import('./components/statistics/statistics.component').then(m => m.StatisticsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];