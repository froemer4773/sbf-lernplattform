import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ExamBogen, ExamBogenDetails, ExamQuestion, ExamAnswer } from '../../../models/models';

@Component({
  selector: 'app-exam-mode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-mode.component.html',
  styleUrl: './exam-mode.component.scss'
})
export class ExamModeComponent implements OnInit {
  // Auswahl-Modus
  boegen: ExamBogen[] = [];
  showSelection = true;

  // Prüfungs-Modus
  bogenDetails: ExamBogenDetails | null = null;
  currentQuestionIndex = 0;
  userAnswers: Map<number, string | null> = new Map(); // frage_id -> selected answer

  // Timer
  timeRemaining = 0; // in Sekunden
  timerInterval: any;
  startTime: Date | null = null;

  // UI States
  loading = true;
  error: string | null = null;
  showWarning = false; // "Nicht alle Fragen beantwortet"-Warnung

  // Shuffled answers for each question
  shuffledAnswers: Map<number, any[]> = new Map();

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check ob eine bogen_id in der Route ist
    const bogenId = this.route.snapshot.paramMap.get('id');

    if (bogenId) {
      // Direkter Start eines spezifischen Bogens
      this.showSelection = false;
      this.loadBogenAndStart(parseInt(bogenId));
    } else {
      // Zeige Bogen-Auswahl
      this.showSelection = true;
      this.loadBoegen();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ===== AUSWAHL-MODUS =====

  loadBoegen(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getExamBoegen().subscribe({
      next: (response) => {
        this.boegen = response.boegen;
        this.loading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Prüfungsbögen:', err);
        this.error = 'Fehler beim Laden der Prüfungsbögen. Bitte versuche es später erneut.';
        this.loading = false;
      }
    });
  }

  selectBogen(bogen: ExamBogen): void {
    this.showSelection = false;
    this.loadBogenAndStart(bogen.id);
  }

  // ===== PRÜFUNGS-MODUS =====

  loadBogenAndStart(bogenId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getExamBogenDetails(bogenId).subscribe({
      next: (response) => {
        this.bogenDetails = response;
        this.currentQuestionIndex = 0;
        this.userAnswers.clear();

        // Initialisiere alle Fragen mit null (nicht beantwortet)
        response.fragen.forEach(f => this.userAnswers.set(f.id, null));

        // Shuffle answers for each question
        response.fragen.forEach(frage => {
          const answers = [];
          if (frage.antwort_a) answers.push({ buchstabe: 'A', text: frage.antwort_a });
          if (frage.antwort_b) answers.push({ buchstabe: 'B', text: frage.antwort_b });
          if (frage.antwort_c) answers.push({ buchstabe: 'C', text: frage.antwort_c });
          if (frage.antwort_d) answers.push({ buchstabe: 'D', text: frage.antwort_d });
          this.shuffledAnswers.set(frage.id, this.shuffleArray(answers));
        });

        // Starte Timer
        this.timeRemaining = response.bogen.zeitlimit_minuten * 60;
        this.startTime = new Date();
        this.startTimer();

        this.loading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden des Prüfungsbogens:', err);
        this.error = 'Fehler beim Laden des Prüfungsbogens.';
        this.loading = false;
      }
    });
  }

  get currentQuestion(): ExamQuestion | null {
    if (!this.bogenDetails || this.currentQuestionIndex >= this.bogenDetails.fragen.length) {
      return null;
    }
    return this.bogenDetails.fragen[this.currentQuestionIndex];
  }

  get progress(): number {
    if (!this.bogenDetails) return 0;
    return ((this.currentQuestionIndex + 1) / this.bogenDetails.fragen.length) * 100;
  }

  get answeredCount(): number {
    return Array.from(this.userAnswers.values()).filter(a => a !== null).length;
  }

  selectAnswer(answer: string): void {
    if (this.currentQuestion) {
      this.userAnswers.set(this.currentQuestion.id, answer);
    }
  }

  isAnswerSelected(answer: string): boolean {
    if (!this.currentQuestion) return false;
    return this.userAnswers.get(this.currentQuestion.id) === answer;
  }

  isCurrentQuestionAnswered(): boolean {
    if (!this.currentQuestion) return false;
    const answer = this.userAnswers.get(this.currentQuestion.id);
    return answer !== null && answer !== undefined;
  }

  nextQuestion(): void {
    if (!this.bogenDetails) return;

    if (this.currentQuestionIndex < this.bogenDetails.fragen.length - 1) {
      this.currentQuestionIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToQuestion(index: number): void {
    if (!this.bogenDetails) return;
    if (index >= 0 && index < this.bogenDetails.fragen.length) {
      this.currentQuestionIndex = index;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  submitExam(): void {
    // Prüfe ob alle Fragen beantwortet sind
    const allAnswered = Array.from(this.userAnswers.values()).every(a => a !== null);

    if (!allAnswered && !this.showWarning) {
      this.showWarning = true;
      return;
    }

    this.stopTimer();

    // Navigiere zu Ergebnis-Seite mit Daten
    const bearbeitungszeit = this.startTime
      ? Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000)
      : 0;

    const answers: ExamAnswer[] = Array.from(this.userAnswers.entries()).map(([frage_id, selected_answer]) => ({
      frage_id,
      selected_answer
    }));

    this.router.navigate(['/exam/result'], {
      state: {
        bogen: this.bogenDetails?.bogen,
        fragen: this.bogenDetails?.fragen,
        answers,
        bearbeitungszeit
      }
    });
  }

  cancelWarning(): void {
    this.showWarning = false;
  }

  // ===== TIMER =====

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (this.timeRemaining <= 0) {
        // Zeit abgelaufen - automatisch abgeben
        this.submitExam();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get timerDisplay(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  get timerWarning(): boolean {
    return this.timeRemaining <= 300; // 5 Minuten
  }

  // ===== NAVIGATION =====

  goBack(): void {
    this.stopTimer();

    if (!this.showSelection) {
      // Zurück zur Bogen-Auswahl
      this.showSelection = true;
      this.bogenDetails = null;
      this.loadBoegen();
    } else {
      // Zurück zum Dashboard
      this.router.navigate(['/dashboard']);
    }
  }

  getQuestionImageUrl(frageId: number): string {
    return this.apiService.getQuestionImageUrl(frageId);
  }

  get currentShuffledAnswers(): any[] {
    if (!this.currentQuestion) return [];
    return this.shuffledAnswers.get(this.currentQuestion.id) || [];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

