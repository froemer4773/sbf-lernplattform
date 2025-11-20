import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Question, SubmitAnswerRequest } from '../../../models/models';

@Component({
  selector: 'app-question-view',
  imports: [CommonModule, RouterLink],
  templateUrl: './question-view.component.html',
  styleUrl: './question-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionViewComponent {
  questions = signal<Question[]>([]);
  currentQuestionIndex = signal<number>(0);
  selectedAnswers = signal<Map<number, string>>(new Map());
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  schein = signal<string>('');
  kategorie = signal<string>('');

  currentQuestion = computed(() => {
    const questions = this.questions();
    const index = this.currentQuestionIndex();
    return index >= 0 && index < questions.length ? questions[index] : null;
  });

  progress = computed(() => {
    const total = this.questions().length;
    const current = this.currentQuestionIndex() + 1;
    return { current, total, percentage: total > 0 ? (current / total) * 100 : 0 };
  });

  constructor(
    public apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      const schein = params['schein'];
      const kategorie = params['kategorie'];
      if (schein && kategorie) {
        this.schein.set(schein);
        this.kategorie.set(kategorie);
        this.loadQuestions(schein, kategorie);
      }
    });
  }

  loadQuestions(schein: string, kategorie: string) {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getQuestions(schein, kategorie).subscribe({
      next: (data) => {
        this.questions.set(data);
        this.currentQuestionIndex.set(0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden der Fragen:', err);
        this.error.set('Fehler beim Laden der Fragen');
        this.loading.set(false);
      }
    });
  }

  selectAnswer(answer: string) {
    const question = this.currentQuestion();
    if (question) {
      const newMap = new Map(this.selectedAnswers());
      newMap.set(question.frage_id, answer);
      this.selectedAnswers.set(newMap);
    }
  }

  nextQuestion() {
    const index = this.currentQuestionIndex();
    if (index < this.questions().length - 1) {
      this.currentQuestionIndex.set(index + 1);
    }
  }

  previousQuestion() {
    const index = this.currentQuestionIndex();
    if (index > 0) {
      this.currentQuestionIndex.set(index - 1);
    }
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.questions().length) {
      this.currentQuestionIndex.set(index);
    }
  }

  submitAnswer() {
    const question = this.currentQuestion();
    const selectedAnswers = this.selectedAnswers();

    if (!question || !selectedAnswers.has(question.frage_id)) {
      alert('Bitte wählen Sie eine Antwort aus');
      return;
    }

    const selectedAnswer = selectedAnswers.get(question.frage_id);
    const request: SubmitAnswerRequest = {
      frage_id: question.frage_id,
      selected_answer: selectedAnswer!,
      time_taken_seconds: 0
    };

    this.apiService.submitAnswer(request).subscribe({
      next: (response) => {
        console.log('Antwort eingereicht:', response);
        alert(response.message);
        this.nextQuestion();
      },
      error: (err) => {
        console.error('Fehler beim Einreichen der Antwort:', err);
        const errorMsg = err.error?.message || err.message || 'Fehler beim Einreichen der Antwort';
        alert(`Fehler: ${errorMsg}`);
      }
    });
  }

  getAnswerStatus(answerId: string): string {
    const question = this.currentQuestion();
    if (!question) return '';

    const selectedAnswers = this.selectedAnswers();
    const selected = selectedAnswers.get(question.frage_id);

    if (selected === answerId) {
      return 'selected';
    }
    return '';
  }
}
