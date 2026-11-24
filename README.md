# Drzewo Genealogiczne

[![Deploy static content to Pages](https://github.com/Pawel-Zygler/drzewo_genealogiczne/actions/workflows/deploy.yml/badge.svg)](https://github.com/Pawel-Zygler/drzewo_genealogiczne/actions/workflows/deploy.yml)

👉 **[Kliknij tutaj, aby zobaczyć podgląd drzewa genealogicznego!](https://Pawel-Zygler.github.io/drzewo_genealogiczne/)**

Projekt dotyczący mojej rodziny.

**Uwaga do wdrożeń:** Każdy push (zapis do repozytorium) na główną gałąź automatycznie zaktualizuje interaktywne drzewo pod powyższym linkiem.

## Edycja drzewa przez link

Każdy, kto ma link do strony, może kliknąć w portret osoby i:

- edytować jej dane (imię, opis, daty, notatki),
- dodać lub zmienić zdjęcie (klik w portret w panelu),
- dodać rodzica, małżonka, dziecko lub rodzeństwo: nową osobę albo kogoś, kto już jest w drzewie,
- odłączyć powiązanie albo usunąć osobę.

Przycisk **+ Dodaj osobę** dodaje osobę bez powiązań. Zmiany widzą od razu wszyscy, którzy mają otwartą stronę.

### Wspólna baza danych (Firebase, darmowy plan)

Bez tej konfiguracji strona działa w **trybie lokalnym**: zmiany zapisują się tylko w przeglądarce, w której je zrobiono.

1. Wejdź na <https://console.firebase.google.com>, zaloguj się kontem Google i kliknij **Utwórz projekt** (np. `drzewo-genealogiczne`; Google Analytics można wyłączyć).
2. W menu **Build → Firestore Database** kliknij **Utwórz bazę danych**, wybierz lokalizację `europe-central2 (Warszawa)` i **tryb produkcyjny**.
3. W zakładce **Reguły** wklej zawartość pliku [`firestore.rules`](firestore.rules) i kliknij **Opublikuj**.
4. W **Ustawieniach projektu** (ikona zębatki) → **Twoje aplikacje** dodaj aplikację **Web** (`</>`). Firebase pokaże obiekt `firebaseConfig = { apiKey: ..., projectId: ..., ... }`. Skopiuj go w całości (od `{` do `}`).
5. W repozytorium na GitHubie: **Settings → Secrets and variables → Actions → zakładka Variables → New repository variable**. Nazwa: `FIREBASE_CONFIG`, wartość: skopiowany obiekt.
6. Uruchom ponownie wdrożenie (**Actions → Deploy static content to Pages → Run workflow**) albo zrób dowolny push.

Przy pierwszym otwarciu strony baza zostanie wypełniona danymi z `src/data/familyTree.ts`. Od tego momentu źródłem prawdy jest baza; późniejsze zmiany w tym pliku nie nadpiszą tego, co ktoś zmienił na stronie.

Te klucze Firebase nie są tajne (trafiają do przeglądarki każdego odwiedzającego); dostęp kontrolują reguły z `firestore.rules`. Każda zmiana zapisuje poprzednią wersję drzewa w kolekcji `trees/main/history`, więc przypadkowe lub złośliwe zmiany można cofnąć z konsoli Firebase.

Lokalnie: utwórz plik `.env.local` z linią `VITE_FIREBASE_CONFIG={"apiKey":"...","projectId":"...",...}` i uruchom `npm run dev`.
