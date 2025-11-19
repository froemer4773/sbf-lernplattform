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
    // Lade User aus Service
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      console.log('Current User:', user); // Debug
    });
  }

  logout(): void {
    if (confirm('Möchtest du dich wirklich abmelden?')) {
      this.authService.logout();
    }
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
}