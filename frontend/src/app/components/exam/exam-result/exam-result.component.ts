import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamQuestion, ExamAnswer } from '../../../models/models';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

interface DetailedResult {
  frage: ExamQuestion;
  userAnswer: string | null;
  isCorrect: boolean;
}

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-result.component.html',
  styleUrl: './exam-result.component.scss'
})
export class ExamResultComponent implements OnInit {
  bogen: any = null;
  fragen: ExamQuestion[] = [];
  answers: ExamAnswer[] = [];
  bearbeitungszeit = 0;

  // Berechnete Werte
  richtigeAntworten = 0;
  falscheAntworten = 0;
  nichtBeantwortet = 0;
  erfolgsquote = 0;
  bestanden = false;

  detailedResults: DetailedResult[] = [];
  showDetails = false;
  saving = false;
  saveError: string | null = null;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    // Hole Daten aus Navigation State
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state && state.bogen) {
      this.bogen = state.bogen;
      this.fragen = state.fragen || [];
      this.answers = state.answers || [];
      this.bearbeitungszeit = state.bearbeitungszeit || 0;
    }
  }

  ngOnInit(): void {
    if (!this.bogen) {
      // Keine Daten vorhanden - zurück zum Dashboard
      this.router.navigate(['/dashboard']);
      return;
    }

    this.calculateResults();
    this.saveResultIfLoggedIn();
  }

  calculateResults(): void {
    // Zähle richtig, falsch, nicht beantwortet
    this.richtigeAntworten = 0;
    this.falscheAntworten = 0;
    this.nichtBeantwortet = 0;

    this.detailedResults = this.fragen.map(frage => {
      const userAnswerObj = this.answers.find(a => a.frage_id === frage.id);
      const userAnswer = userAnswerObj?.selected_answer || null;

      let isCorrect = false;
      if (userAnswer === null) {
        this.nichtBeantwortet++;
      } else {
        // Vergleiche die Antworttexte statt der Buchstaben (wegen Shuffling)
        const userAnswerText = this.getAnswerText(frage, userAnswer);
        const correctAnswerText = this.getAnswerText(frage, frage.richtige_antwort);

        if (userAnswerText === correctAnswerText) {
          this.richtigeAntworten++;
          isCorrect = true;
        } else {
          this.falscheAntworten++;
        }
      }

      return {
        frage,
        userAnswer,
        isCorrect
      };
    });

    // Erfolgsquote berechnen
    const gesamtFragen = this.fragen.length;
    this.erfolgsquote = gesamtFragen > 0
      ? Math.round((this.richtigeAntworten / gesamtFragen) * 100)
      : 0;

    // Bestanden?
    this.bestanden = this.erfolgsquote >= this.bogen.bestehensgrenze_prozent;
  }

  get bearbeitungszeitFormatted(): string {
    const minutes = Math.floor(this.bearbeitungszeit / 60);
    const seconds = this.bearbeitungszeit % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')} Minuten`;
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  retryExam(): void {
    this.router.navigate(['/exam/bogen', this.bogen.id]);
  }

  backToSelection(): void {
    this.router.navigate(['/exam']);
  }

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getAnswerText(frage: ExamQuestion, answer: string): string {
    switch (answer?.toUpperCase()) {
      case 'A': return frage.antwort_a;
      case 'B': return frage.antwort_b;
      case 'C': return frage.antwort_c;
      case 'D': return frage.antwort_d || '';
      default: return '';
    }
  }

  saveResultIfLoggedIn(): void {
    // Nur speichern wenn User eingeloggt ist
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.saving = true;
    this.saveError = null;

    // Detaillierte Antworten für Backend vorbereiten
    const antworten = this.detailedResults.map(result => ({
      frage_id: result.frage.id,
      selected_answer: result.userAnswer,
      is_correct: result.isCorrect
    }));

    const data = {
      bogen_id: this.bogen.id,
      richtige_antworten: this.richtigeAntworten,
      falsche_antworten: this.falscheAntworten,
      nicht_beantwortet: this.nichtBeantwortet,
      gesamt_fragen: this.fragen.length,
      erfolgsquote: this.erfolgsquote,
      bestanden: this.bestanden,
      bearbeitungszeit_sekunden: this.bearbeitungszeit,
      antworten: antworten
    };

    this.apiService.saveExamResult(data).subscribe({
      next: (response) => {
        console.log('Prüfungsergebnis gespeichert:', response);
        this.saving = false;
      },
      error: (err) => {
        console.error('Fehler beim Speichern:', err);
        this.saveError = 'Ergebnis konnte nicht gespeichert werden';
        this.saving = false;
      }
    });
  }
}

