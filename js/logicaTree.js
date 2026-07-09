/*
 * Albero delle domande per l'analisi logica.
 * A differenza dell'analisi grammaticale, qui si classifica un GRUPPO
 * di parole (es. "il bambino", "nel giardino") e non una singola parola.
 * Stessa struttura di grammarTree.js: question/options/value/next/skipNext.
 */

const LUOGO_TIPO = {
  question: "Che tipo di complemento di luogo?",
  options: [
    { label: "STATO IN LUOGO", sub: "dove? es. sono A CASA", value: "luogo (stato in luogo)" },
    { label: "MOTO A LUOGO", sub: "verso dove? es. vado A SCUOLA", value: "luogo (moto a luogo)" },
    { label: "MOTO DA LUOGO", sub: "da dove? es. vengo DA ROMA", value: "luogo (moto da luogo)" },
    { label: "MOTO PER LUOGO", sub: "attraverso dove? es. passo PER IL PARCO", value: "luogo (moto per luogo)" }
  ]
};

const TEMPO_TIPO = {
  question: "Che tipo di complemento di tempo?",
  options: [
    { label: "DETERMINATO", sub: "quando? es. arrivo ALLE OTTO", value: "tempo determinato" },
    { label: "CONTINUATO", sub: "per quanto tempo? es. ho studiato PER DUE ORE", value: "tempo continuato" }
  ]
};

const COMPLEMENTO_INDIRETTO = {
  question: "Che tipo di complemento indiretto?",
  options: [
    { label: "SPECIFICAZIONE", sub: "di chi? di che cosa? es. il libro DI MARCO", value: "specificazione" },
    { label: "TERMINE", sub: "a chi? a che cosa? es. regalo un fiore A MARIA", value: "termine" },
    { label: "LUOGO", next: LUOGO_TIPO },
    { label: "TEMPO", next: TEMPO_TIPO },
    { label: "CAUSA", sub: "perché? per quale motivo? es. trema DAL FREDDO", value: "causa" },
    { label: "FINE / SCOPO", sub: "per quale scopo? es. lavora PER GUADAGNARE", value: "fine o scopo" },
    { label: "MEZZO", sub: "con/per mezzo di che cosa? es. scrivo CON LA PENNA", value: "mezzo" },
    { label: "MODO", sub: "in che modo? es. corre VELOCEMENTE", value: "modo" },
    { label: "COMPAGNIA / UNIONE", sub: "con chi? con che cosa? es. esco CON I MIEI AMICI", value: "compagnia o unione" },
    { label: "AGENTE / CAUSA EFFICIENTE", sub: "da chi? da che cosa? es. inseguito DAL CANE", value: "agente o causa efficiente" }
  ]
};

const PREDICATO_TIPO = {
  question: "Il predicato è VERBALE o NOMINALE?",
  options: [
    { label: "VERBALE", sub: "un verbo che da solo dice cosa fa il soggetto, es. Il cane ABBAIA", value: "verbale" },
    { label: "NOMINALE", sub: "essere + un nome/aggettivo che dice cos'è o com'è il soggetto, es. Il cane È FEDELE", value: "nominale" }
  ]
};

const LOGICA_ROOT = {
  question: "Che funzione logica ha questo gruppo di parole?",
  options: [
    { label: "SOGGETTO", sub: "chi o che cosa compie l'azione, o di chi/cosa si dice qualcosa", cls: "cat-soggetto" },
    { label: "PREDICATO", sub: "dice cosa fa o com'è il soggetto", cls: "cat-predicato", next: PREDICATO_TIPO },
    { label: "COMPLEMENTO OGGETTO", sub: "chi? che cosa? (senza preposizione), es. Mangio LA MELA", cls: "cat-oggetto" },
    { label: "ATTRIBUTO", sub: "un aggettivo riferito a un nome, es. la casa GRANDE", cls: "cat-attributo" },
    { label: "APPOSIZIONE", sub: "un nome che si aggiunge a un altro nome, es. Roma, CAPITALE D'ITALIA", cls: "cat-apposizione" },
    { label: "COMPLEMENTO INDIRETTO", cls: "cat-indiretto", next: COMPLEMENTO_INDIRETTO }
  ]
};
