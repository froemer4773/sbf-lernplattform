import { Component, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { License, Category } from '../../../models/models';

@Component({
  selector: 'app-category-selection',
  imports: [CommonModule, RouterLink],
  templateUrl: './category-selection.component.html',
  styleUrl: './category-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySelectionComponent {
  licenses = signal<License[]>([]);
  categories = signal<Category[]>([]);
  selectedLicense = signal<string | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.loadLicenses();

    // Lade Kategorien, wenn eine Lizenz ausgewählt wird
    effect(() => {
      const selected = this.selectedLicense();
      if (selected) {
        this.loadCategories(selected);
      }
    });
  }

  loadLicenses() {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getLicenses().subscribe({
      next: (data) => {
        this.licenses.set(data);
        // Wähle die erste Lizenz automatisch aus
        if (data.length > 0) {
          this.selectedLicense.set(data[0].name);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Lizenzen:', err);
        this.error.set('Fehler beim Laden der Lizenzen');
        this.loading.set(false);
      }
    });
  }

  loadCategories(license: string) {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getCategories(license).subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Kategorien:', err);
        this.error.set('Fehler beim Laden der Kategorien');
        this.loading.set(false);
      }
    });
  }

  selectLicense(license: License) {
    this.selectedLicense.set(license.name);
  }

  getCategoryPath(category: any): string[] {
    if (this.selectedLicense()) {
      return ['/learning/questions', this.selectedLicense()!, category.kategorie];
    }
    return [];
  }
}
