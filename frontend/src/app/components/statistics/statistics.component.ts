import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface ExamResult {
  id: number;
  bogen_id: number;
  bogen_name: string;
  richtige_antworten: number;
  falsche_antworten: number;
  nicht_beantwortet: number;
  gesamt_fragen: number;
  erfolgsquote: number;
  bestanden: boolean;
  bearbeitungszeit_sekunden: number;
  abgeschlossen_am: string;
}

interface ExamStatistik {
  anzahl_pruefungen: number;
  bestandene_pruefungen: number;
  durchschnittliche_erfolgsquote: number;
  beste_erfolgsquote: number;
  schlechteste_erfolgsquote: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit {
  loading = true;
  error: string | null = null;

  examResults: ExamResult[] = [];
  examStatistik: ExamStatistik | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadExamResults();
  }

  loadExamResults(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getExamResults().subscribe({
      next: (response) => {
        this.examResults = response.ergebnisse;
        this.examStatistik = response.statistik;
        this.loading = false;
      },
      error: (err) => {
        console.error('Fehler beim Laden der Prüfungsergebnisse:', err);
        this.error = 'Fehler beim Laden der Statistiken';
        this.loading = false;
      }
    });
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')} min`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  backToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
