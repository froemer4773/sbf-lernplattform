import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  License,
  Category,
  Question,
  Progress,
  CategoryProgress,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  ExamBogen,
  ExamBogenDetails,
  QuestionProgress
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLicenses(): Observable<License[]> {
    return this.http.get<License[]>(`${this.apiUrl}/licenses/`);
  }

  getCategories(schein: string): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories/${schein}/`);
  }

  getQuestions(schein?: string, kategorie?: string, unterkategorie?: string): Observable<Question[]> {
    let params = new HttpParams();
    if (schein) params = params.set('schein', schein);
    if (kategorie) params = params.set('kategorie', kategorie);
    if (unterkategorie) params = params.set('unterkategorie', unterkategorie);
    return this.http.get<Question[]>(`${this.apiUrl}/questions/`, { params });
  }

  getQuestion(frageId: number): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/questions/${frageId}/`);
  }

  getQuestionImageUrl(frageId: number): string {
    return `${this.apiUrl}/questions/${frageId}/image/`;
  }

  submitAnswer(data: SubmitAnswerRequest): Observable<SubmitAnswerResponse> {
    return this.http.post<SubmitAnswerResponse>(`${this.apiUrl}/progress/submit/`, data);
  }

  // Optional: log overall learning session duration (seconds). Backend may accept
  // Session API helpers (best-effort): start and end a learning session.
  // POST /progress/session/ with { action: 'start', user_id, ... } -> returns { session_id }
  createSession(payload?: any) {
    const body = Object.assign({ action: 'start' }, payload || {});
    return this.http.post<any>(`${this.apiUrl}/progress/session/`, body);
  }

  // End session: POST /progress/session/ with { action: 'end', session_id, duration_seconds }
  endSession(sessionId: number | string | null, durationSeconds: number, payload?: any) {
    const body = Object.assign({ action: 'end', session_id: sessionId, duration_seconds: durationSeconds }, payload || {});
    return this.http.post<any>(`${this.apiUrl}/progress/session/`, body);
  }

  getUserProgress(schein?: string): Observable<Progress> {
    let params = new HttpParams();
    if (schein) params = params.set('schein', schein);
    return this.http.get<Progress>(`${this.apiUrl}/progress/user/`, { params });
  }

  getProgressByCategory(schein?: string): Observable<CategoryProgress[]> {
    let params = new HttpParams();
    if (schein) params = params.set('schein', schein);
    return this.http.get<CategoryProgress[]>(`${this.apiUrl}/progress/categories/`, { params });
  }

  getLearningTimeStats(period: 'day' | 'week' | 'month'): Observable<any> {
    let params = new HttpParams().set('period', period);
    return this.http.get<any>(`${this.apiUrl}/progress/learning-time/`, { params });
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/profile.php`, data);
  }

  deleteAccount(): Observable<any> {
    // Alternative: use account-delete.php which supports both DELETE and POST
    return this.http.delete<any>(`${this.apiUrl}/users/account.php`);
  }

  // ===== Prüfungsmodus =====

  getExamBoegen(): Observable<{ success: boolean; boegen: ExamBogen[] }> {
    return this.http.get<{ success: boolean; boegen: ExamBogen[] }>(`${this.apiUrl}/exams/boegen.php`);
  }

  getExamBogenDetails(bogenId: number): Observable<ExamBogenDetails> {
    return this.http.get<ExamBogenDetails>(`${this.apiUrl}/exams/boegen.php?id=${bogenId}`);
  }

  saveExamResult(data: any): Observable<{ success: boolean; ergebnis_id: number; message: string }> {
    return this.http.post<{ success: boolean; ergebnis_id: number; message: string }>(
      `${this.apiUrl}/exams/results.php`,
      data
    );
  }

  getExamResults(): Observable<{ success: boolean; ergebnisse: any[]; statistik: any }> {
    return this.http.get<{ success: boolean; ergebnisse: any[]; statistik: any }>(
      `${this.apiUrl}/exams/results.php`
    );
  }

  getExamResultDetail(id: number): Observable<{ success: boolean; ergebnis: any }> {
    return this.http.get<{ success: boolean; ergebnis: any }>(
      `${this.apiUrl}/exams/results.php?id=${id}`
    );
  }

  // ===== Fragenfortschritt (gemerkt, richtig/falsch) =====

  getQuestionProgress(frageId?: number): Observable<QuestionProgress | { fortschritte: QuestionProgress[] }> {
    const url = frageId
      ? `${this.apiUrl}/progress/question-progress.php?frage_id=${frageId}`
      : `${this.apiUrl}/progress/question-progress.php`;
    return this.http.get<any>(url);
  }

  saveQuestionProgress(data: {
    frage_id: number;
    ist_richtig?: number;  // 0 oder 1
    ist_gemerkt?: number   // 0 oder 1
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/progress/question-progress.php`,
      data
    );
  }

  toggleBookmark(frageId: number, ist_gemerkt: number): Observable<{ success: boolean; message: string }> {
    return this.saveQuestionProgress({ frage_id: frageId, ist_gemerkt: ist_gemerkt });
  }
}
