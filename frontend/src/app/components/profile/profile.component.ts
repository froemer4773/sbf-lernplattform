import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { User } from '../../models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  vorname: string = '';
  nachname: string = '';
  email: string = '';
  preferredSchein: string = '';
  randomQuestionOrder: boolean = false;

  newPassword: string = '';
  confirmPassword: string = '';

  licenses: string[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  passwordError: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });

    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    // Populate form with current user data
    this.vorname = this.user.vorname;
    this.nachname = this.user.nachname;
    this.email = this.user.email;
    this.preferredSchein = this.user.preferred_schein || '';
    this.randomQuestionOrder = this.user.settings?.random_question_order || false;

    // Load available licenses
    this.apiService.getLicenses().subscribe({
      next: (list) => {
        this.licenses = list.map(l => l.name);
      },
      error: () => {
        // ignore; leave licenses empty
      }
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordError = '';

    if (!this.vorname || !this.nachname || !this.email) {
      this.errorMessage = 'Bitte fülle alle Pflichtfelder aus';
      return;
    }

    // Validate password if provided
    if (this.newPassword) {
      if (this.newPassword !== this.confirmPassword) {
        this.passwordError = 'Passwörter stimmen nicht überein';
        return;
      }
      if (this.newPassword.length < 6) {
        this.passwordError = 'Passwort muss mindestens 6 Zeichen lang sein';
        return;
      }
    }

    this.isSaving = true;

    const updateData: any = {
      vorname: this.vorname,
      nachname: this.nachname,
      email: this.email,
      preferred_schein: this.preferredSchein,
      settings: {
        random_question_order: this.randomQuestionOrder
      }
    };

    if (this.newPassword) {
      updateData.password = this.newPassword;
    }

    // Call API to update profile
    this.apiService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.successMessage = 'Profil erfolgreich aktualisiert!';

        // Update local user data
        if (this.user) {
          this.user.vorname = this.vorname;
          this.user.nachname = this.nachname;
          this.user.email = this.email;
          this.user.preferred_schein = this.preferredSchein;
          this.user.settings = { random_question_order: this.randomQuestionOrder };

          // Update in AuthService
          localStorage.setItem('user', JSON.stringify(this.user));
          this.authService['currentUserSubject'].next(this.user);
        }

        // Clear password fields
        this.newPassword = '';
        this.confirmPassword = '';

        this.isSaving = false;

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Profile update error:', err);
        this.errorMessage = err?.error?.message || 'Aktualisierung fehlgeschlagen';
        this.isSaving = false;
      }
    });
  }

  deleteAccount(): void {
    const confirmed = confirm(
      'ACHTUNG: Möchtest du deinen Account wirklich unwiderruflich löschen?\n\n' +
      'Alle deine Daten und dein gesamter Lernfortschritt werden dauerhaft gelöscht.\n\n' +
      'Diese Aktion kann NICHT rückgängig gemacht werden!'
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirmed = confirm(
      'Letzte Bestätigung:\n\n' +
      'Bist du dir absolut sicher? Dein Account wird JETZT gelöscht.'
    );

    if (!doubleConfirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    this.apiService.deleteAccount().subscribe({
      next: () => {
        // Logout and redirect
        this.authService.logout();
        alert('Dein Account wurde erfolgreich gelöscht.');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Account deletion error:', err);
        this.errorMessage = err?.error?.message || 'Löschen fehlgeschlagen. Bitte versuche es später erneut.';
        this.isDeleting = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
