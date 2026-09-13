> [!CAUTION]
> Preview-Version! An vielen Stellen wird's vermutlich Fehler geben. Nur für Linux.

# Musik, Bruder! - Dein Freund für deine Musik

**Musik, Bruder!** ist dein bester Freund, wenn du selbst einiges an lokaler
Musik besitzt und keine Lust mehr hast, Spotify jeden Monat 10
Euro zu spendieren. Hiermit kannst du deine Musik, eigene Bilder
für Alben, Künstler und sogar Videos (wie bei Spotify) zu
einzelnen Tracks hochladen (WOW!)!

Eine kleine Preview gefällig? Bitteschön:

[![Sehr gut und schön](https://i.ibb.co/yFTX07XH/Screenshot-From-2026-09-05-08-51-48.png)](https://cdn.savedly.net/ytagsknv)

<br>

<p align="center">…………… 🫴 ……………</p>

## Setup - Einfacher geht's nicht

> [!IMPORTANT]
> Damit alles später sauber synchronisiert werden kann, solltest du die
> Metadaten deiner Musik-Dateien vor dem Ausführen des Setups
> ausfüllen (title & artist sind wichtig). Ein gutes Tool dafür ist <a
> href="https://flathub.org/en/apps/org.gnome.EasyTAG" target="_blank">EasyTAG</a>!

Um deinen besten Freund der Musik zu installieren, gib einfach
folgenden Befehl in dein Terminal ein:

```bash
bash <(curl -fsSL https://www.heia.kim/MusikBruder/setup.sh)
```

Was das Script macht, kannst du in diesem Repo in der Datei
`setup.sh` einsehen. Die Datei auf `www.heia.kim` ist immer die
aktuellste Version!

<br>
<p align="center">…………… ❓ ……………</p>

### **Meine Musik - Wohin?**

Im Setup wirst du gefragt, ob du deine lokale Musik-Bibliothek,
also den Ordner `~/Music` synchronisieren möchtest, sofern es
diesen Ordner gibt. Falls du da
mit ja geantwortet hast, kannst du deine Musik einfach dort
belassen und neue auch dort speichern. Ansonsten geht sie in
`~/.local/share/musikbruder/public/data/user/1/tracks`.
<br>

### **Wo ist die App gespeichert?**

Hoffentlich in `~/.local/share/musikbruder`.
<br>

### **Wenn was schief geht?**

Schau in `~/.logs/musikbruder/setup.log` nach. Da das Setup
komplett quiet läuft, werden alle logs in diese Datei geschrieben.

<br>

<p align="center">…………… 🍃 ……………</p>

### Philosophie

Ich arbeite gerne und viel an diesem Projekt, aber so lange die
Abende voll Erfüllung und Zufriedenheit auch werden, so schleichen
sich doch auch einiges an Fehlern ein. Deswegen solltest Du damit
rechnen, das nicht immer alles glatt läuft! Das ist der Preis, den
wir statt den 10 Euro monatlich zahlen.
<br><br>

<p align="center">…………… 👀 ……………</p>

<p align="center">Mit viel ☕ und höchst verfügbarer ❤️ gebaut!
Ich übernehme keine Verantwortung für Over-Engineering und/oder
schlechte Performance 😘.</p>

<br>

<p align="center" style="font-weight:bold">2026 &copy; Justin Seidel. Alle Rechte vorbehalten.</p>
