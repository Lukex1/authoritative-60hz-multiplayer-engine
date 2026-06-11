# Webgin - Wysokoenergetyczny, Autorytatywny Silnik Gry Multiplayer 60Hz

Webgin to zaawansowany silnik gry i serwer multiplayer działający w częstotliwości 60Hz, napisany od zera w TypeScript z wykorzystaniem czystego protokołu WebSocket. Projekt powstał, aby zademonstrować biegłość architektoniczną w zakresie systemów sieciowych, optymalizacji pamięci oraz symulacji stanów gry pod ekstremalnym obciążeniem.

Silnik posiada wbudowane narzędzie **Bot Stress Tester**, zdolne do symulowania setek autonomicznych graczy poruszających się płynnie z uwzględnieniem wektorowej bezwładności oraz zaawansowanych systemów zapobiegania konfliktom ID.

### 🎮 Prezentacja Wizualna

**Panel administracyjny serwera:**
<video src="https://github.com/Lukex1/authoritative-60hz-multiplayer-engine/blob/main/gifs/adminview.mp4" autoplay loop muted playsinline width="100%"></video>

**Informacje zwracane z serwera o graczach:**
<video src="https://github.com/Lukex1/authoritative-60hz-multiplayer-engine/blob/main/gifs/playersinfo.mp4" autoplay loop muted playsinline width="100%"></video>

**Widok administracyjny oraz widok gracza podczas testów:**
<video src="https://github.com/Lukex1/authoritative-60hz-multiplayer-engine/blob/main/gifs/adminandplayerview.mp4" autoplay loop muted playsinline width="100%"></video>
### 🛠️ Główne Funkcje Techniczne

* **Autorytatywna Symulacja 60Hz:** Cała fizyka, sprawdzanie kolizji ze ścianami i pozycjonowanie są obliczane wyłącznie na serwerze, co uniemożliwia oszukiwanie po stronie klienta (anti-cheat by design).
* **Zero-Allocation Memory Pooling (Klient):** Interfejs klienta używa płaskich tablic typowanych (`Float32Array`, `Uint16Array`), aby osiągnąć zerową alokację obiektów podczas renderowania klatek, całkowicie eliminując mikroprzycięcia wywołane przez Garbage Collector (GC).
* **Proximity Culling (Czyszczenie Kontekstowe):** Inteligentny algorytm renderowania tekstu. Przy dużym obciążeniu serwera, identyfikatory tekstowe graczy są rysowane tylko wtedy, gdy znajdują się w określonym promieniu euklidesowym od lokalnego gracza, co drastycznie odciąża CPU i GPU klienta.
* **System Antykolizyjny (Monkey Patching):** Przechwytywanie metod w czasie rzeczywistym. Jeśli prawdziwy gracz połączy się i otrzyma ID zajęte przez bota, silnik natychmiastowo eksmituje bota, czyści pamięć podręczną i bezszwowo przekazuje wolny slot człowiekowi.
* **Płynne Wektory Ruchu (Steering Wandering):** Boty nie drżą w miejscu. Wykorzystują wektory prędkości, siłę skrętu oraz fizykę odbić od ścian pod odpowiednim kątem, co symuluje naturalny ruch.

### 🚀 Użyte Technologie
* **Serwer:** Node.js, TypeScript, Natywne WebSockets (transmisja binarna za pomocą pakietów `DataView` / `ArrayBuffer`).
* **Klient:** Czysty JavaScript (ES6+), HTML5 Canvas, Batchowanie wywołań rysowania (Single-Path Render).

### 💻 Szybkie Uruchomienie

1. **Instalacja zależności:**
   ```bash
   npm install