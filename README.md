# Analisi Grammaticale e Logica

🇮🇹 [Italiano](#italiano) · 🇬🇧 [English](#english)

---

## Italiano

App web pensata per bambini della scuola primaria per esercitarsi nell'analisi grammaticale e nell'analisi logica di frasi in lingua italiana, con un percorso guidato a bottoni grandi e colorati.

Nessuna installazione richiesta: è un sito statico (HTML/CSS/JavaScript) che funziona interamente nel browser, anche offline, su PC, tablet e smartphone.

### Come si usa

Apri `index.html` e scegli quale analisi vuoi fare:

- **🔠 Analisi Grammaticale** (`grammaticale.html`) — analizza ogni singola parola della frase (articolo, nome, aggettivo, pronome, verbo, preposizione, congiunzione, avverbio, esclamazione) con tutte le sue caratteristiche (genere, numero, tempo, modo...).
- **🧩 Analisi Logica** (`logica.html`) — raggruppa le parole della frase (es. "il bambino") e classifica ogni gruppo (soggetto, predicato verbale/nominale, complemento oggetto, attributo, apposizione, complementi indiretti come specificazione, termine, luogo, tempo, causa, mezzo, modo...).

In entrambe le modalità:

1. Si scrive una frase e il sito ne estrae le parole (modificabili prima di confermare).
2. Si può ripetere per inserire più frasi prima di iniziare l'analisi.
3. Un percorso a domande e bottoni guida passo dopo passo la classificazione di ogni parola (o gruppo di parole).
4. Se una risposta non si conosce, il bottone **"Non lo so, salta"** permette di andare avanti comunque, segnando quel punto come incompleto (⚠) e modificabile in seguito.
5. Un interruttore iniziale permette di attivare o disattivare i suggerimenti/esempi mostrati sotto i bottoni.
6. A fine lavoro, il riepilogo permette di:
   - generare un **PDF** con tutta l'analisi;
   - **inviarla via email** (si apre il programma di posta predefinito con testo già pronto);
   - aggiungere altre frasi o ricominciare da capo.

Tutto il lavoro in corso viene salvato automaticamente nel browser (localStorage), senza bisogno di account o connessione a un server.

### Struttura del progetto

```
index.html            pagina iniziale (scelta tra le due modalità)
grammaticale.html      Analisi Grammaticale
logica.html            Analisi Logica
css/style.css          stile grafico condiviso
js/common.js           utility condivise (tokenizzazione, salvataggio, PDF, email)
js/grammarTree.js       albero delle domande per l'Analisi Grammaticale
js/app.js              logica dell'Analisi Grammaticale
js/logicaTree.js        albero delle domande per l'Analisi Logica
js/appLogica.js         logica dell'Analisi Logica
js/vendor/jspdf.umd.min.js  libreria per la generazione dei PDF (inclusa localmente, nessuna dipendenza esterna)
```

### Sviluppo locale

Nessuna build necessaria. Basta aprire `index.html` nel browser, oppure avviare un server statico locale:

```bash
python3 -m http.server 8080
# poi apri http://localhost:8080/index.html
```

---

## English

A web app designed for primary school children to practice Italian grammatical analysis (parts of speech) and logical/syntactic analysis (sentence structure), through a guided step-by-step flow of big, colorful buttons.

No installation required: it's a static site (HTML/CSS/JavaScript) that runs entirely in the browser, even offline, on desktop, tablet and mobile.

### How it works

Open `index.html` and choose which type of analysis to run:

- **🔠 Grammatical Analysis** (`grammaticale.html`) — analyzes each individual word of the sentence (article, noun, adjective, pronoun, verb, preposition, conjunction, adverb, interjection) with all of its features (gender, number, tense, mood...).
- **🧩 Logical/Syntactic Analysis** (`logica.html`) — groups the words of the sentence (e.g. "the boy") and classifies each group (subject, verbal/nominal predicate, direct object, attribute, apposition, indirect complements such as specification, term, place, time, cause, means, manner...).

In both modes:

1. Type a sentence and the app extracts its words (editable before confirming).
2. You can repeat this to add several sentences before starting the analysis.
3. A step-by-step question-and-button flow guides the classification of each word (or group of words).
4. If an answer isn't known yet, the **"I don't know, skip"** button lets you move on anyway, marking that step as incomplete (⚠) and editable later.
5. A toggle at the start lets you turn the hints/examples shown under each button on or off.
6. When done, the summary screen lets you:
   - generate a **PDF** with the full analysis;
   - **send it by email** (opens the default mail app with the text already filled in);
   - add more sentences or start over.

All work in progress is automatically saved in the browser (localStorage) — no account or server connection needed.

### Project structure

```
index.html            landing page (choose between the two modes)
grammaticale.html      Grammatical Analysis
logica.html            Logical Analysis
css/style.css          shared styling
js/common.js           shared utilities (tokenizing, storage, PDF, email)
js/grammarTree.js       question tree for Grammatical Analysis
js/app.js              Grammatical Analysis logic
js/logicaTree.js        question tree for Logical Analysis
js/appLogica.js         Logical Analysis logic
js/vendor/jspdf.umd.min.js  PDF generation library (bundled locally, no external dependency)
```

### Local development

No build step needed. Just open `index.html` in your browser, or run a local static server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/index.html
```
