import { Component, signal, computed, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { Question, SubmitAnswerRequest } from '../../../models/models';

@Component({
  selector: 'app-question-view',
  imports: [CommonModule],
  templateUrl: './question-view.component.html',
  styleUrl: './question-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionViewComponent {
  // Session / timing
  private sessionStart = Date.now();
  private questionStart = Date.now();
  private totalSessionSeconds = 0;
  private sessionId: number | string | null = null;
  private answeredCount = 0;

  questions = signal<Question[]>([]);
  currentQuestionIndex = signal<number>(0);
  selectedAnswers = signal<Map<number, string>>(new Map());
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  schein = signal<string>('');
  kategorie = signal<string>('');
  unterkategorie = signal<string | null>(null);

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
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.params.subscribe(params => {
      const schein = params['schein'];
      const kategorie = params['kategorie'];
      if (schein && kategorie) {
        this.schein.set(schein);
        this.kategorie.set(kategorie);

        // Also check for unterkategorie query parameter
        this.route.queryParams.subscribe(queryParams => {
          const unterkategorie = queryParams['unterkategorie'];
          this.unterkategorie.set(unterkategorie || null);
          this.loadQuestions(schein, kategorie, unterkategorie);
        });
      }
    });
  }

  // Ensure we send session data on destroy (best-effort)
  ngOnDestroy(): void {
    try {
      if (this.totalSessionSeconds > 0) {
        // If backend supports explicit session lifecycle, use it
        if (this.sessionId != null) {
          this.apiService.endSession(this.sessionId, this.totalSessionSeconds).subscribe({
            next: () => console.log('Session ended:', this.sessionId, this.totalSessionSeconds),
            error: (err) => console.warn('Session end failed (may be unsupported):', err)
          });
        } else {
          // Fallback: attempt to post a generic session end (server may accept without id)
          this.apiService.endSession(null, this.totalSessionSeconds).subscribe({
            next: () => console.log('Session logged (no id):', this.totalSessionSeconds),
            error: (err) => console.warn('Session logging failed (may be unsupported):', err)
          });
        }
      }
    } catch (e) {
      // ignore any errors
    }
  }

  onBack(event: Event) {
    event.preventDefault();
    this.endSessionAndNavigate('/learning/category-selection');
  }

  private endSessionAndNavigate(route: string) {
    const navigate = () => {
      try {
        this.router.navigate([route]);
      } catch (e) {
        console.warn('Navigation failed:', e);
      }
    };

    if (this.totalSessionSeconds > 0 && this.sessionId != null) {
      this.apiService.endSession(this.sessionId, this.totalSessionSeconds).subscribe({
        next: () => {
          console.log('Session ended successfully:', this.sessionId, this.totalSessionSeconds);
          navigate();
        },
        error: (err) => {
          console.warn('Session end failed:', err);
          navigate();
        }
      });
    } else {
      if (!this.sessionId) console.warn('No session_id to end');
      navigate();
    }
  }

  loadQuestions(schein: string, kategorie: string, unterkategorie?: string) {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getQuestions(schein, kategorie).subscribe({
      next: (data) => {
        // Filter by unterkategorie if provided
        let filteredQuestions = data;
        if (unterkategorie) {
          filteredQuestions = data.filter(q => q.unterkategorie === unterkategorie);
        }

        this.questions.set(filteredQuestions);
        this.currentQuestionIndex.set(0);
        // initialize session timers
        this.sessionStart = Date.now();
        this.questionStart = Date.now();
        this.totalSessionSeconds = 0;
        this.answeredCount = 0;
        this.sessionId = null;

        // Try to create a session record on the backend (best-effort).
        // Expecting backend to accept POST /progress/session/ { action: 'start' } -> { session_id }
        const currentUser = this.authService.getCurrentUser();
        const payload: any = {
          user_id: currentUser ? currentUser.id : null,
          session_type: 'kategorie',
          schein_filter: this.schein(),
          kategorie_filter: this.kategorie()
        };

        this.apiService.createSession(payload).subscribe({
          next: (resp) => {
            try {
              if (resp && (resp.session_id || resp.sessionId || resp.id)) {
                this.sessionId = resp.session_id || resp.sessionId || resp.id;
                console.log('Session started, id=', this.sessionId);
              } else {
                console.log('Session create response (no id):', resp);
              }
            } catch (e) {
              console.warn('Unable to parse session create response:', resp);
            }
          },
          error: (err) => {
            console.warn('Session create failed (may be unsupported):', err);
          }
        });
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
      // reset question timer for the new question
      this.questionStart = Date.now();
    }
  }

  previousQuestion() {
    const index = this.currentQuestionIndex();
    if (index > 0) {
      this.currentQuestionIndex.set(index - 1);
      // reset question timer when navigating
      this.questionStart = Date.now();
    }
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.questions().length) {
      this.currentQuestionIndex.set(index);
      // reset question timer when jumping
      this.questionStart = Date.now();
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
    const now = Date.now();
    let timeTakenSeconds = Math.round((now - this.questionStart) / 1000);
    if (timeTakenSeconds <= 0) timeTakenSeconds = 1;

    const request: SubmitAnswerRequest = {
      frage_id: question.frage_id,
      selected_answer: selectedAnswer!,
      time_taken_seconds: timeTakenSeconds
    };

    const token = this.authService.getToken();
    console.log('Submitting answer; auth token present?', !!token);
    // for debugging: print a short prefix (don't leak full token in logs long-term)
    if (token) console.log('Token prefix:', token.substring(0, 12) + '...');

    if (!token) {
      alert('Nicht angemeldet. Bitte einloggen.');
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.submitAnswer(request).subscribe({
      next: (response) => {
        console.log('Antwort eingereicht:', response);
        alert(response.message);
        // accumulate session seconds and move to next
        this.totalSessionSeconds += timeTakenSeconds;
        this.answeredCount++;

        const totalQuestions = this.questions().length;
        const allAnswered = this.answeredCount >= totalQuestions;

        if (allAnswered) {
          console.log('All questions answered. Ending session.');
          this.endSessionAndNavigate('/learning/category-selection');
        } else {
          this.nextQuestion();
        }
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
