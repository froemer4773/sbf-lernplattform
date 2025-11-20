# 🎯 SBF PHP Backend - KORRIGIERT für Ihre Tabellen!

## ✅ 100% Angepasst!

Dieses Backend nutzt **IHRE existierenden Tabellen**:

- ✅ `lernplattform_users` (statt `users`)
- ✅ `lernplattform_progress` (statt `user_progress`)
- ✅ `SBFSee_Ausbildung_Fragen`
- ✅ `SBFSee_Ausbildung_Antworten`

**KEINE neuen Tabellen nötig!**

---

## 🚀 Installation (5 Minuten)

### Schritt 1: Test-User erstellen (falls nicht vorhanden)

**In phpMyAdmin → SQL:**

```sql
-- Test-User anlegen (falls noch keiner existiert)
INSERT INTO lernplattform_users (
  email, 
  password_hash, 
  vorname, 
  nachname, 
  role, 
  preferred_schein,
  is_approved
) VALUES (
  'test@test.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Test',
  'User',
  'MITGLIED',
  'SBF-See',
  1
);
```

**Login-Daten:**
- E-Mail: `test@test.com`
- Passwort: `password`

---

### Schritt 2: Dateien hochladen

**Via FTP alle Dateien nach `/api/` hochladen**

---

### Schritt 3: config.php anpassen

**Öffnen: `/api/config/config.php`**

```php
// IHRE DATENBANK:
define('DB_HOST', 'localhost');
define('DB_NAME', 'd0455d0b');        // ← Ihre DB
define('DB_USER', 'ihr_username');    // ← Anpassen!
define('DB_PASS', 'ihr_passwort');    // ← Anpassen!

// JWT SECRET ÄNDERN:
define('JWT_SECRET', 'GENERIEREN_SIE_EIN_SEHR_LANGES_ZUFÄLLIGES_SECRET');

// FRONTEND DOMAIN:
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost:4200',
    'https://lernapp.4roemer.de'  // ← Ihre Domain
]);
```

---

## 🧪 Testen

### 1. Licenses
```
https://lernapp.4roemer.de/api/licenses
```

### 2. Login
```bash
curl -X POST https://lernapp.4roemer.de/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password"}'
```

**Sollte zurückgeben:**
```json
{
  "message": "Login erfolgreich",
  "token": "eyJ...",
  "user": {...}
}
```

---

## 📋 Was wurde geändert?

### Auth Endpoints:
```php
// ALT:
FROM users WHERE ...
FROM user_progress WHERE ...

// NEU:
FROM lernplattform_users WHERE ...
FROM lernplattform_progress WHERE ...
```

### Progress Tracking:
- ✅ Nutzt `lernplattform_progress` 
- ✅ Speichert `attempt_number` (für mehrere Versuche)
- ✅ Nutzt letzte Antwort pro Frage für Statistiken

---

## ✅ Checklist

- [ ] Test-User erstellt (falls nötig)
- [ ] Alle Dateien hochgeladen
- [ ] config.php angepasst (DB + JWT + Domain)
- [ ] `/api/licenses` funktioniert
- [ ] Login mit `test@test.com` / `password` funktioniert

---

## 🎉 Fertig!

Jetzt sollte Login funktionieren! 🚀

**Version**: 1.0 CORRECTED  
**Für**: Ihre bestehenden lernplattform_* Tabellen
