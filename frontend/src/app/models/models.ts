export interface User {
  id: number;
  email: string;
  vorname: string;
  nachname: string;
  role: 'ADMIN' | 'TRAINER' | 'MITGLIED';
  preferred_schein: string;
  created_at?: string;
  last_login?: string;
}

export interface License {
  name: string;
}

export interface Category {
  kategorie: string;
  unterkategorien: Unterkategorie[];
}

export interface Unterkategorie {
  name: string;
  fragen_anzahl: number;
}

export interface Question {
  frage_id: number;
  schein: string;
  kategorie: string;
  unterkategorie: string;
  buchseite: string;
  frage_text: string;
  korrekte_antwort: string;
  has_image: boolean;
  antworten: Answer[];
}

export interface Answer {
  buchstabe: string;
  text: string;
  ist_korrekt: number;
}

export interface Progress {
  beantwortete_fragen: number;
  richtige_antworten: number;
  gesamt_fragen: number;
  erfolgsquote: number;
}

export interface CategoryProgress {
  kategorie: string;
  unterkategorie: string;
  gesamt_fragen: number;
  beantwortete_fragen: number;
  richtige_antworten: number;
  fortschritt: number;
  erfolgsquote: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  vorname: string;
  nachname: string;
  preferred_schein: string;
}

export interface SubmitAnswerRequest {
  frage_id: number;
  selected_answer: string;
  time_taken_seconds: number;
}

export interface SubmitAnswerResponse {
  success: boolean;
  is_correct: boolean;
  korrekte_antwort: string;
  message: string;
}
