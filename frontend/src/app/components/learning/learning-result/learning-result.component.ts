import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

interface QuestionResult {
  frage_id: number;
  frage_text: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

@Component({
  selector: 'app-learning-result',
  imports: [CommonModule],
  templateUrl: './learning-result.component.html',
  styleUrl: './learning-result.component.scss',
  standalone: true
})
export class LearningResultComponent implements OnInit {
  results = signal<QuestionResult[]>([]);
  schein = signal<string>('');
  kategorie = signal<string>('');
  unterkategorie = signal<string | null>(null);

  correctCount = computed(() => {
    return this.results().filter(r => r.is_correct).length;
  });

  incorrectCount = computed(() => {
    return this.results().filter(r => !r.is_correct).length;
  });

  totalCount = computed(() => {
    return this.results().length;
  });

  successRate = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.correctCount() / total) * 100);
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Ergebnisse aus dem History State holen
    const state = history.state;
    
    console.log('Learning Result - State:', state);
    console.log('Results:', state['results']);

    if (state && state['results'] && state['results'].length > 0) {
      this.results.set(state['results']);
      this.schein.set(state['schein'] || '');
      this.kategorie.set(state['kategorie'] || '');
      this.unterkategorie.set(state['unterkategorie'] || null);
      
      console.log('Results loaded:', this.results());
    } else {
      console.warn('No results in state, redirecting to category selection');
      // Fallback: zurück zur Kategorieauswahl
      this.router.navigate(['/learning/category-selection']);
    }
  }

  backToCategories() {
    this.router.navigate(['/learning/category-selection']);
  }

  retryQuestions() {
    const queryParams = this.unterkategorie() 
      ? { unterkategorie: this.unterkategorie() }
      : {};
    
    this.router.navigate([
      '/learning/question-view',
      this.schein(),
      this.kategorie()
    ], { queryParams });
  }
}
