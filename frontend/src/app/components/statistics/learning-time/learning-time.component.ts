import { Component, OnInit, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface LearningTimeData {
  period: string;
  total_seconds: number;
  total_minutes: number;
  total_hours: number;
  session_count: number;
}

interface LearningTimeResponse {
  period: string;
  data: LearningTimeData[];
  summary: {
    total_seconds: number;
    total_minutes: number;
    total_hours: number;
    total_sessions: number;
  };
}

@Component({
  selector: 'app-learning-time',
  imports: [CommonModule, RouterLink],
  templateUrl: './learning-time.component.html',
  styleUrl: './learning-time.component.scss'
})
export class LearningTimeComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  selectedPeriod = signal<'day' | 'week' | 'month'>('week');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  data = signal<LearningTimeData[]>([]);
  summary = signal<any>(null);

  private chart: Chart | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Chart will be created after data loads
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.getLearningTimeStats(this.selectedPeriod()).subscribe({
      next: (response: LearningTimeResponse) => {
        this.data.set(response.data);
        this.summary.set(response.summary);
        this.loading.set(false);
        this.updateChart();
      },
      error: (err) => {
        console.error('Failed to load learning time stats:', err);
        this.error.set('Fehler beim Laden der Lernzeit-Statistiken');
        this.loading.set(false);
      }
    });
  }

  changePeriod(period: 'day' | 'week' | 'month'): void {
    this.selectedPeriod.set(period);
    this.loadData();
  }

  getPeriodLabel(): string {
    switch (this.selectedPeriod()) {
      case 'day': return 'Letzte 7 Tage';
      case 'week': return 'Letzte 12 Wochen';
      case 'month': return 'Letzte 12 Monate';
      default: return '';
    }
  }

  formatPeriodLabel(period: string): string {
    const selected = this.selectedPeriod();
    if (selected === 'week') {
      // Format: 2025-W47 -> KW 47/2025
      const parts = period.split('-W');
      return `KW ${parts[1]}/${parts[0]}`;
    } else if (selected === 'month') {
      // Format: 2025-11 -> Nov 2025
      const [year, month] = period.split('-');
      const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return period; // day format is already good (YYYY-MM-DD)
  }

  private updateChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.chartCanvas) {
      // Canvas not ready yet, will be called again after view init
      setTimeout(() => this.updateChart(), 100);
      return;
    }

    const chartData = this.data();
    const labels = chartData.map(d => this.formatPeriodLabel(d.period));
    const values = chartData.map(d => d.total_minutes);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Lernzeit (Minuten)',
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + ' min';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const minutes = context.parsed.y ?? 0;
                const hours = (minutes / 60).toFixed(1);
                return `${minutes} min (${hours} h)`;
              }
            }
          }
        }
      }
    };

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, config);
    }
  }
}
