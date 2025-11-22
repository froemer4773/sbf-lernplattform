import { Component, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
  categories = signal<{name: string, count: number}[]>([]);
  subcategories = signal<{name: string, count: number}[]>([]);
  selectedLicense = signal<string | null>(null);
  selectedCategory = signal<string | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  private allQuestionsForLicense: any[] = [];
  private allQuestionsForCategory: any[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.loadLicenses();

    // Lade Kategorien, wenn eine Lizenz ausgewählt wird
    effect(() => {
      const selected = this.selectedLicense();
      if (selected) {
        this.loadCategories(selected);
      }
    }, { allowSignalWrites: true });

    // Lade Unterkategorien, wenn eine Kategorie ausgewählt wird
    effect(() => {
      const license = this.selectedLicense();
      const category = this.selectedCategory();
      if (license && category) {
        this.loadSubcategories(license, category);
      }
    }, { allowSignalWrites: true });
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
    this.selectedCategory.set(null);
    this.subcategories.set([]);

    // Load all questions and extract unique categories
    this.apiService.getQuestions(license).subscribe({
      next: (questions) => {
        this.allQuestionsForLicense = questions;

        // Count questions per category
        const categoryMap = new Map<string, number>();
        questions.forEach(q => {
          categoryMap.set(q.kategorie, (categoryMap.get(q.kategorie) || 0) + 1);
        });

        // Convert to array with counts
        const categoriesWithCounts = Array.from(categoryMap.entries()).map(([name, count]) => ({
          name,
          count
        }));

        this.categories.set(categoriesWithCounts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Kategorien:', err);
        this.error.set('Fehler beim Laden der Kategorien');
        this.loading.set(false);
      }
    });
  }

  loadSubcategories(license: string, category: string) {
    this.loading.set(true);
    this.error.set(null);

    // Load questions for this category and extract unique subcategories
    this.apiService.getQuestions(license, category).subscribe({
      next: (questions) => {
        this.allQuestionsForCategory = questions;

        // Count questions per subcategory
        const subcategoryMap = new Map<string, number>();
        questions.forEach(q => {
          subcategoryMap.set(q.unterkategorie, (subcategoryMap.get(q.unterkategorie) || 0) + 1);
        });

        // Convert to array with counts
        const subcategoriesWithCounts = Array.from(subcategoryMap.entries()).map(([name, count]) => ({
          name,
          count
        }));

        this.subcategories.set(subcategoriesWithCounts);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Unterkategorien:', err);
        this.error.set('Fehler beim Laden der Unterkategorien');
        this.loading.set(false);
      }
    });
  }

  selectLicense(license: License) {
    this.selectedLicense.set(license.name);
    this.selectedCategory.set(null);
    this.subcategories.set([]);
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  getTotalQuestionsForCategory(): number {
    return this.allQuestionsForCategory.length;
  }

  getCategoryIcon(categoryName: string): string {
    const iconMap: {[key: string]: string} = {
      'Gesetzliche Grundlagen': '📖',
      'Schallsignale': '🔊',
      'Lichter und Sichtzeichen': '🚩',
      'Seemannschaft': '⚓',
      'Ausweichregeln': '🔀',
      'Schifffahrtszeichen': '🏴',
      'Verkehrstrennungsgebiete': '🚦',
      'Fahrwasser': '〰️'
    };
    return iconMap[categoryName] || '📚';
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  isAuthenticated(): boolean {
    return !!this.authService.getToken();
  }
}
