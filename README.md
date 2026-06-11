# Webgin - Wysokoenergetyczny, Autorytatywny Silnik Gry Multiplayer 60Hz

Webgin to zaawansowany silnik gry i serwer multiplayer działający w częstotliwości 60Hz, napisany od zera w TypeScript z wykorzystaniem czystego protokołu WebSocket. Projekt powstał, aby zademonstrować biegłość architektoniczną w zakresie systemów sieciowych, optymalizacji pamięci oraz symulacji stanów gry pod ekstremalnym obciążeniem.

Silnik posiada wbudowane narzędzie **Bot Stress Tester**, zdolne do symulowania setek autonomicznych graczy poruszających się płynnie z uwzględnieniem wektorowej bezwładności oraz zaawansowanych systemów zapobiegania konfliktom ID.

### 🎮 Prezentacja Wizualna

**Panel administracyjny serwera:**

https://github.com/user-attachments/assets/03f6022c-0076-4aa3-a550-76ce13fd9330


**Informacje zwracane z serwera o graczach:**

https://github.com/user-attachments/assets/5381cb3f-56c3-4b8d-b4fc-1113699cc401


**Widok administracyjny oraz widok gracza podczas testów:**

https://github.com/user-attachments/assets/0fc62311-6d8f-409a-90c1-993e11f97103

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
