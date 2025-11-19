import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Bitte fÃ¼lle alle Felder aus';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          console.log('Login erfolgreich', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Login Fehler', error);
          this.errorMessage = error.error?.error || 'Login fehlgeschlagen';
          this.isLoading = false;
        }
      });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
