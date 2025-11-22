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
  subcategories = signal<{kategorie: string, unterkategorie: string}[]>([]);
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

    // Load all questions and extract unique categories from them
    this.apiService.getQuestions(license).subscribe({
      next: (questions) => {
        // Group questions by category and unterkategorie
        const categoryMap = new Map<string, Set<{name: string, fragen_anzahl: number}>>();

        questions.forEach(q => {
          if (!categoryMap.has(q.kategorie)) {
            categoryMap.set(q.kategorie, new Set());
          }
          const subCategories = categoryMap.get(q.kategorie)!;
          subCategories.add({
            name: q.unterkategorie,
            fragen_anzahl: 0
          });
        });

        // Count questions per subcategory
        questions.forEach(q => {
          const subCategories = categoryMap.get(q.kategorie)!;
          const subCat = Array.from(subCategories).find(s => s.name === q.unterkategorie);
          if (subCat) {
            subCat.fragen_anzahl++;
          }
        });

        // Convert to Category interface
        const categories: any[] = Array.from(categoryMap.entries()).map(([kategorie, subCats]) => ({
          kategorie,
          unterkategorien: Array.from(subCats)
        }));

        this.categories.set(categories);

        // Flatten subcategories for display
        const flatSubcategories: {kategorie: string, unterkategorie: string}[] = [];
        categories.forEach(cat => {
          cat.unterkategorien.forEach((sub: any) => {
            flatSubcategories.push({
              kategorie: cat.kategorie,
              unterkategorie: sub.name
            });
          });
        });
        this.subcategories.set(flatSubcategories);

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
