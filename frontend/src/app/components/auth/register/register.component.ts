import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  vorname: string = '';
  nachname: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  preferredSchein: string = '';

  licenses: string[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  passwordError: string = '';
  confirmPasswordError: string = '';

  // Password rule checks (live)
  get passwordHasUpper(): boolean {
    return /[A-ZÄÖÜ]/.test(this.password);
  }

  get passwordHasLower(): boolean {
    return /[a-zäöüß]/.test(this.password);
  }

  get passwordHasDigit(): boolean {
    return /[0-9]/.test(this.password);
  }

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiService.getLicenses().subscribe({
      next: (list) => {
        this.licenses = list.map(l => l.name);
        if (this.licenses.length) this.preferredSchein = this.licenses[0];
      },
      error: () => {
        // ignore; leave preferredSchein empty
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.passwordError = '';
    this.confirmPasswordError = '';

    if (!this.vorname || !this.nachname || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Bitte fülle alle Felder aus';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwörter stimmen nicht überein';
      return;
    }

    this.isLoading = true;

    const data = {
      vorname: this.vorname,
      nachname: this.nachname,
      email: this.email,
      password: this.password,
      preferred_schein: this.preferredSchein || ''
    };

    this.authService.register(data as any).subscribe({
      next: () => {
        this.isLoading = false;
        // navigate to login after successful registration
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        console.error('Register error', err);

        // Build a helpful, visible error message for the user that includes
        // backend-provided message/code and the HTTP status so it's not hidden
        // in the browser console.
        const statusPart = err?.status ? ` (HTTP ${err.status})` : '';
        const codePart = err?.error?.code ? ` [code: ${err.error.code}]` : '';

        // Try common fields where backend errors may live
        const backendMessage = err?.error?.error || err?.error?.message || err?.message || '';

        // Try to extract structured field errors if the backend returns them
        const fieldErrors = err?.error?.errors || err?.error?.fieldErrors || err?.error?.validation || null;

        if (fieldErrors && typeof fieldErrors === 'object') {
          // common field keys: 'password', 'passwort', 'confirmPassword', 'confirm_password'
          const pwKeys = ['password', 'passwort', 'pw', 'pass'];
          for (const k of pwKeys) {
            if (fieldErrors[k]) {
              const val = fieldErrors[k];
              this.passwordError = Array.isArray(val) ? val.join(' ') : String(val);
              break;
            }
          }

          // confirm password keys
          const cpKeys = ['confirmPassword', 'confirm_password', 'password_confirmation'];
          for (const k of cpKeys) {
            if (fieldErrors[k]) {
              const val = fieldErrors[k];
              this.confirmPasswordError = Array.isArray(val) ? val.join(' ') : String(val);
              break;
            }
          }

          // If any structured field errors were found, use a short general message as well
          const hasFieldError = !!(this.passwordError || this.confirmPasswordError);
          if (hasFieldError) {
            this.errorMessage = `Bitte überprüfe die markierten Felder${statusPart}`;
            this.isLoading = false;
            return;
          }
        }

        // If no structured field errors, inspect textual backend message and map it to the password field
        if (backendMessage) {
          // If the message mentions password rules, show it under the password field for clarity
          const lower = String(backendMessage).toLowerCase();
          const mentionsPasswordRule = /passw|groß|klein|zahl|zeichen|uppercase|lowercase|digit|special/i.test(lower);
          if (mentionsPasswordRule) {
            this.passwordError = `${backendMessage}${codePart}`;
            this.errorMessage = `Bitte überprüfe das Passwort${statusPart}`;
            this.isLoading = false;
            return;
          }

          this.errorMessage = `${backendMessage}${codePart}${statusPart}`;
        } else if (err?.statusText) {
          this.errorMessage = `${err.statusText}${statusPart}`;
        } else {
          // Fallback: stringify entire error body (useful in development)
          try {
            const body = err?.error ? JSON.stringify(err.error) : JSON.stringify(err);
            this.errorMessage = `Registrierung fehlgeschlagen${statusPart}: ${body}`;
          } catch (e) {
            this.errorMessage = `Registrierung fehlgeschlagen${statusPart}`;
          }
        }

        this.isLoading = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
