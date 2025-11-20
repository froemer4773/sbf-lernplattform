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
  SubmitAnswerResponse
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
}
