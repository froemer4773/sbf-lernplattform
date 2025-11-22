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
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
    // Kein authGuard - Gast-Zugriff erlaubt
  },
  {
    path: 'learning',
    // Kein authGuard - Gast-Zugriff erlaubt
    children: [
      {
        path: 'category-selection',
        loadComponent: () => import('./components/learning/category-selection/category-selection.component').then(m => m.CategorySelectionComponent)
      },
      {
        path: 'question-view',
        loadComponent: () => import('./components/learning/question-view/question-view.component').then(m => m.QuestionViewComponent)
      },
      {
        path: 'questions/:schein/:kategorie',
        loadComponent: () => import('./components/learning/question-view/question-view.component').then(m => m.QuestionViewComponent)
      },
      {
        path: 'result',
        loadComponent: () => import('./components/learning/learning-result/learning-result.component').then(m => m.LearningResultComponent)
      }
    ]
  },
  {
    path: 'exam',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/exam/exam-mode/exam-mode.component').then(m => m.ExamModeComponent)
      },
      {
        path: 'bogen/:id',
        loadComponent: () => import('./components/exam/exam-mode/exam-mode.component').then(m => m.ExamModeComponent)
      },
      {
        path: 'result',
        loadComponent: () => import('./components/exam/exam-result/exam-result.component').then(m => m.ExamResultComponent)
      }
    ]
  },
  {
    path: 'statistics',
    loadComponent: () => import('./components/statistics/statistics.component').then(m => m.StatisticsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'statistics/learning-time',
    loadComponent: () => import('./components/statistics/learning-time/learning-time.component').then(m => m.LearningTimeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'impressum',
    loadComponent: () => import('./components/legal/impressum/impressum.component').then(m => m.ImpressumComponent)
  },
  {
    path: 'datenschutz',
    loadComponent: () => import('./components/legal/datenschutz/datenschutz.component').then(m => m.DatenschutzComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
