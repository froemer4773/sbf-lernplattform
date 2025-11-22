export interface User {
  id: number;
  email: string;
  vorname: string;
  nachname: string;
  role: 'ADMIN' | 'TRAINER' | 'MITGLIED';
  preferred_schein: string;
  created_at?: string;
  last_login?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  random_question_order?: boolean;
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
  fortschritt?: QuestionProgress; // Optional: Fortschritt für diese Frage
}

export interface Answer {
  buchstabe: string;
  text: string;
  ist_korrekt: number;
}

export interface QuestionProgress {
  frage_id: number;
  ist_gemerkt: number; // 0 oder 1 (wie vom Backend)
  zuletzt_richtig: number | null; // 0 oder 1 oder null
  richtig_beantwortet_anzahl: number;
  falsch_beantwortet_anzahl: number;
  richtig_hintereinander: number; // Anzahl richtig hintereinander
  letzte_beantwortung: string | null;
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

// Prüfungsmodus Interfaces
export interface ExamBogen {
  id: number;
  name: string;
  beschreibung: string;
  zeitlimit_minuten: number;
  bestehensgrenze_prozent: number;
  anzahl_fragen: number;
}

export interface ExamBogenDetails {
  bogen: {
    id: number;
    name: string;
    beschreibung: string;
    zeitlimit_minuten: number;
    bestehensgrenze_prozent: number;
    aktiv: number;
  };
  fragen: ExamQuestion[];
  anzahl_fragen: number;
}

export interface ExamQuestion {
  reihenfolge: number;
  id: number;
  frage_text: string;
  bild_url: string | null;
  antwort_a: string;
  antwort_b: string;
  antwort_c: string;
  antwort_d: string;
  richtige_antwort: string;
  kategorie_id: number;
  kategorie_name: string;
  kapitel_id: number | null;
  kapitel_bezeichnung: string | null;
}

export interface ExamAnswer {
  frage_id: number;
  selected_answer: string | null; // A, B, C, D oder null wenn nicht beantwortet
}

export interface ExamResult {
  bogen_id: number;
  bogen_name: string;
  anzahl_fragen: number;
  richtige_antworten: number;
  falsche_antworten: number;
  nicht_beantwortet: number;
  erfolgsquote: number;
  bestanden: boolean;
  zeitlimit_minuten: number;
  bearbeitungszeit_sekunden: number;
  antworten: ExamAnswer[];
}
