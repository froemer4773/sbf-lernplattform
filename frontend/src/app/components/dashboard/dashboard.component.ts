import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Lade User direkt aus Service
    this.user = this.authService.getCurrentUser();
    console.log('Current User:', this.user); // Debug

    // Subscribe für Updates
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      console.log('User updated:', user);
    });
  }  logout(): void {
    this.authService.logout();
    // Nach Logout bleiben wir auf dem Dashboard
    this.user = null;
  }

  startLearning(): void {
    this.router.navigate(['/learning/category-selection']);
  }

  startExam(): void {
    this.router.navigate(['/exam']);
  }

  viewStatistics(): void {
    this.router.navigate(['/statistics']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
