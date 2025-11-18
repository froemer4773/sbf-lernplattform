# SBF-Lernplattform Backend

## ✅ Anpassungen

Dieses Backend wurde **speziell an Ihre vorhandene Datenbank angepasst**:

- ✅ Datenbank: **d0455d0b**
- ✅ DB-User: **d0455d0b**
- ✅ Tabellen:
  - `lernplattform_users`
  - `lernplattform_progress`
  - `lernplattform_sessions`
  - `lernplattform_notes`
  - `SBFSee_Ausbildung_Fragen`
  - `SBFSee_Ausbildung_Antworten`

## 🚀 Schnellstart

### 1. Dependencies installieren

```bash
cd backend
npm install
```

### 2. .env Datei erstellen

```bash
cp .env.example .env
```

Tragen Sie Ihr Datenbankpasswort ein:

```env
DB_HOST=localhost
DB_USER=d0455d0b
DB_PASSWORD=IHR_PASSWORT_HIER
DB_NAME=d0455d0b
JWT_SECRET=ein_sehr_langer_geheimer_schlüssel_min_32_zeichen
```

### 3. Server starten

```bash
# Development
npm run dev

# Production
npm start
```

Server läuft auf: http://localhost:3000

## 📡 API Endpunkte

### Authentication
- `POST /api/auth/register` - Nutzer registrieren
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Aktueller User
- `POST /api/auth/change-password` - Passwort ändern
- `PUT /api/auth/profile` - Profil aktualisieren

### Fragen & Führerscheine
- `GET /api/licenses` - Verfügbare Führerscheine (SBF-See, SBF-Binnen)
- `GET /api/categories/:schein` - Kategorien eines Führerscheins
- `GET /api/questions?schein=SBF-See&kategorie=Basisfragen` - Fragen abrufen
- `GET /api/questions/:frage_id` - Einzelne Frage mit Antworten
- `GET /api/questions/:frage_id/image` - Fragenbild als PNG
- `GET /api/questions/random?schein=SBF-See&limit=20` - Zufällige Fragen

### Fortschritt & Lernen
- `POST /api/progress/submit` - Antwort absenden
- `GET /api/progress/user?schein=SBF-See` - Benutzerfortschritt
- `GET /api/progress/categories?schein=SBF-See` - Fortschritt pro Kategorie
- `GET /api/progress/wrong?schein=SBF-See` - Falsch beantwortete Fragen
- `GET /api/progress/bookmarks` - Gespeicherte Fragen
- `POST /api/progress/bookmarks/:frage_id` - Lesezeichen setzen/entfernen
- `POST /api/progress/notes` - Notiz speichern

## 🔍 API Beispiele

### Registrierung

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.de",
    "password": "Test1234!",
    "vorname": "Max",
    "nachname": "Mustermann",
    "preferred_schein": "SBF-See"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.de",
    "password": "Test1234!"
  }'
```

Response:
```json
{
  "message": "Login erfolgreich",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "test@test.de",
    "vorname": "Max",
    "nachname": "Mustermann",
    "role": "MITGLIED",
    "preferred_schein": "SBF-See"
  }
}
```

### Fragen abrufen

```bash
# Mit Token
curl http://localhost:3000/api/questions?schein=SBF-See&kategorie=Basisfragen \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Antwort absenden

```bash
curl -X POST http://localhost:3000/api/progress/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "frage_id": 1,
    "selected_answer": "a",
    "time_taken_seconds": 15
  }'
```

Response:
```json
{
  "success": true,
  "is_correct": true,
  "korrekte_antwort": "a",
  "message": "Richtig! 🎉"
}
```

### Fortschritt abrufen

```bash
curl http://localhost:3000/api/progress/user?schein=SBF-See \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "beantwortete_fragen": 45,
  "richtige_antworten": 38,
  "gesamt_fragen": 300,
  "erfolgsquote": 84.44
}
```

## 🗂️ Datenbankstruktur

### lernplattform_users
- `id` - User ID
- `email` - E-Mail
- `password_hash` - Gehashtes Passwort
- `vorname`, `nachname` - Name
- `role` - ADMIN | TRAINER | MITGLIED
- `preferred_schein` - Bevorzugter Führerschein
- `is_approved` - Freigegeben
- `created_at`, `last_login` - Timestamps

### SBFSee_Ausbildung_Fragen
- `frage_id` - Fragen-ID
- `schein` - SBF-See | SBF-Binnen
- `kategorie` - z.B. "Basisfragen"
- `unterkategorie` - z.B. "Tafelzeichen"
- `buchseite` - z.B. "S.242"
- `frage_text` - Fragentext
- `korrekte_antwort` - a, b, c, d
- `status` - 1 = aktiv
- `image` - PNG als BLOB

### SBFSee_Ausbildung_Antworten
- `Frage_id` - Referenz zu Frage
- `antwort_buchstabe` - a, b, c, d
- `antwort_text` - Antworttext
- `ist_korrekt` - 1 = richtig, 0 = falsch

### lernplattform_progress
- `user_id` - User
- `frage_id` - Frage
- `selected_answer` - Gewählte Antwort
- `is_correct` - Richtig?
- `time_taken_seconds` - Zeit
- `attempt_number` - Versuch-Nummer
- `attempted_at` - Timestamp

### lernplattform_notes
- `user_id` - User
- `frage_id` - Frage
- `note` - Notiz-Text
- `is_bookmarked` - Lesezeichen?
- `created_at`, `updated_at` - Timestamps

## 🔒 Sicherheit

- ✅ JWT-basierte Authentifizierung
- ✅ Passwort-Hashing mit bcrypt (10 Rounds)
- ✅ Rate Limiting (100 Requests/15min)
- ✅ Helmet.js für Security Headers
- ✅ CORS konfiguriert
- ✅ SQL Injection Prevention (Prepared Statements)

## 🧪 Testing

```bash
# Health Check
curl http://localhost:3000/health

# Test Datenbankverbindung
npm run dev
# Schaue auf Konsole: "✅ Database connected successfully"
```

## 🛠️ Development

```bash
# Mit Nodemon (Auto-Reload)
npm run dev

# Production Mode
npm start
```

## 📝 Hinweise

### Bilder als BLOB
Die Bilder sind als PNG-BLOB in der Datenbank gespeichert. Der Endpunkt `/api/questions/:frage_id/image` liefert das Bild direkt als PNG.

Im Frontend:
```html
<img src="http://localhost:3000/api/questions/27/image" alt="Frage 27">
```

### Antwort-Format
Antworten werden als Buchstaben gespeichert: 'a', 'b', 'c', 'd'

### Buchseiten-Referenz
Jede Frage hat eine `buchseite` Spalte (z.B. "S.242") für Kontext/Erklärung.

## 🐛 Troubleshooting

### "Database connection failed"
- ✅ Überprüfe `.env` Datei
- ✅ Teste MariaDB: `mysql -u d0455d0b -p d0455d0b`
- ✅ Checke Firewall/Port 3306

### "Unauthorized" Fehler
- ✅ Token im Header: `Authorization: Bearer YOUR_TOKEN`
- ✅ Token-Gültigkeit (24h)
- ✅ JWT_SECRET in `.env` gesetzt

## 📞 Support

Bei Fragen:
1. Logs überprüfen: `npm run dev` (Console Output)
2. Health Check: `curl http://localhost:3000/health`
3. Datenbank testen: `mysql -u d0455d0b -p`

---

**Version**: 2.0.0 - Angepasst für bestehende Datenbank  
**Datenbank**: d0455d0b  
**Status**: ✅ Production Ready
