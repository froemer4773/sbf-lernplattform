# Deployment-Anleitung

## Automatisches Deployment mit VS Code SFTP Extension

### Methode 1: Sync mit Löschen (Empfohlen)

1. **Build erstellen:**
   ```powershell
   ng build --configuration production
   ```

2. **VS Code Command Palette öffnen:**
   - Drücke `Ctrl+Shift+P` (Windows) oder `Cmd+Shift+P` (Mac)

3. **Sync-Befehl ausführen:**
   - Tippe: `SFTP: Sync Remote -> Local`
   - ODER: `SFTP: Sync Local -> Remote`
   
4. **Mit Delete-Option:**
   - Wähle `SFTP: Sync Local -> Remote` 
   - Die Option `"delete": true` in `syncOption` sorgt dafür, dass alte Dateien auf dem Server gelöscht werden

### Methode 2: Manuelles Löschen und Upload

1. **Build erstellen:**
   ```powershell
   ng build --configuration production
   ```

2. **Remote-Ordner löschen:**
   - Rechtsklick auf Remote-Ordner in SFTP-Explorer
   - Wähle `Delete` aus
   - Bestätige das Löschen

3. **Neuen Build hochladen:**
   - Rechtsklick auf `dist/sbf-lernplattform/browser` Ordner
   - Wähle `SFTP: Upload Folder`
   - Bestätige den Upload

### Methode 3: PowerShell Deployment-Script

1. **Script ausführen:**
   ```powershell
   .\deploy.ps1
   ```

2. **FTP-Passwort eingeben** wenn aufgefordert

3. **Folge den Anweisungen** im Script

## SFTP-Konfiguration

Die Konfiguration befindet sich in `.vscode/sftp.json`:

- **Host:** v103488.kasserver.com
- **Remote Path:** /lernapp/
- **Context:** dist/sbf-lernplattform/browser
- **Sync Option:** `delete: true` - Löscht alte Dateien beim Sync

## Wichtige Befehle (VS Code Command Palette)

| Befehl | Beschreibung |
|--------|--------------|
| `SFTP: Upload Folder` | Lädt einen kompletten Ordner hoch |
| `SFTP: Sync Local -> Remote` | Synchronisiert lokal zum Server (mit Delete) |
| `SFTP: Delete` | Löscht Dateien/Ordner auf dem Server |
| `SFTP: Download Folder` | Lädt einen Server-Ordner herunter |
| `SFTP: List` | Zeigt Remote-Dateien an |

## Tipps

1. **Vor dem Upload immer bauen:**
   ```powershell
   ng build --configuration production
   ```

2. **Überprüfe den Build:**
   - Schaue in `dist/sbf-lernplattform/browser`
   - Stelle sicher, dass alle Dateien vorhanden sind

3. **Bei Problemen:**
   - Lösche `dist/` Ordner komplett
   - Baue neu: `ng build --configuration production`
   - Lade erneut hoch

4. **Schneller Workflow:**
   - Erstelle ein Task in VS Code (`tasks.json`)
   - Oder nutze `npm run build:deploy` (siehe package.json)
