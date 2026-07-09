/*
 * Albero delle domande per l'analisi grammaticale.
 * Ogni nodo "choice" ha una domanda e una lista di opzioni.
 * Ogni opzione può avere:
 *   - label: testo del bottone
 *   - sub: piccolo esempio/aiuto mostrato sotto il testo
 *   - value: frammento di testo aggiunto al risultato finale (null = non aggiunge nulla)
 *   - next: nodo successivo (se assente, la parola è conclusa)
 * Un nodo "text" chiede invece di scrivere una parola (es. l'infinito del verbo).
 */

function numeroNode(next) {
  return {
    question: "Che NUMERO ha?",
    options: [
      { label: "SINGOLARE", sub: "una sola cosa", value: "singolare", next },
      { label: "PLURALE", sub: "più di una cosa", value: "plurale", next }
    ]
  };
}

function genereNumero(next, invariabile) {
  const options = [
    { label: "MASCHILE", value: "maschile", next: numeroNode(next) },
    { label: "FEMMINILE", value: "femminile", next: numeroNode(next) }
  ];
  if (invariabile) {
    options.push({ label: "INVARIABILE", sub: "non cambia mai", value: "invariabile", next });
  }
  return { question: "Che GENERE ha?", options };
}

// ---------- NOME ----------

const NOME_CARATTERISTICA = {
  question: "Ha una caratteristica particolare? Se non lo sai, scegli NESSUNA.",
  options: [
    { label: "NESSUNA", value: null },
    { label: "PRIMITIVO", sub: "la parola “base”, es. fiore", value: "primitivo" },
    { label: "DERIVATO", sub: "nasce da un'altra parola, es. fioraio", value: "derivato" },
    {
      label: "ALTERATO", sub: "ha un pezzetto in più che cambia il significato",
      next: {
        question: "Che tipo di alterazione?",
        options: [
          { label: "ACCRESCITIVO", sub: "es. librone", value: "alterato accrescitivo" },
          { label: "DIMINUTIVO", sub: "es. libretto", value: "alterato diminutivo" },
          { label: "VEZZEGGIATIVO", sub: "es. libriccino", value: "alterato vezzeggiativo" },
          { label: "DISPREGIATIVO", sub: "es. libraccio", value: "alterato dispregiativo" }
        ]
      }
    },
    { label: "COMPOSTO", sub: "unione di due parole, es. portafoglio", value: "composto" },
    { label: "COLLETTIVO", sub: "indica un insieme, es. mandria, gregge", value: "collettivo" }
  ]
};

const NOME_CONCRETEZZA = {
  question: "È CONCRETO (si vede o si tocca) o ASTRATTO (un'idea, un sentimento)?",
  options: [
    { label: "CONCRETO", sub: "es. tavolo, cane", value: "concreto", next: NOME_CARATTERISTICA },
    { label: "ASTRATTO", sub: "es. amore, paura", value: "astratto", next: NOME_CARATTERISTICA }
  ]
};

const NOME_SPECIE = {
  question: "Indica una PERSONA, un ANIMALE o una COSA?",
  options: [
    { label: "PERSONA", value: "di persona", next: genereNumero(NOME_CONCRETEZZA) },
    { label: "ANIMALE", value: "di animale", next: genereNumero(NOME_CONCRETEZZA) },
    { label: "COSA", value: "di cosa", next: genereNumero(NOME_CONCRETEZZA) }
  ]
};

const NOME = {
  question: "È un nome COMUNE o PROPRIO?",
  options: [
    { label: "COMUNE", sub: "bambino, cane, città", value: "comune", next: NOME_SPECIE },
    { label: "PROPRIO", sub: "Marco, Roma, Fido", value: "proprio", next: NOME_SPECIE }
  ]
};

// ---------- ARTICOLO ----------

const ARTICOLO = {
  question: "È un articolo DETERMINATIVO o INDETERMINATIVO?",
  options: [
    { label: "DETERMINATIVO", sub: "il, lo, la, i, gli, le", value: "determinativo", next: genereNumero() },
    { label: "INDETERMINATIVO", sub: "un, uno, una", value: "indeterminativo", next: genereNumero() }
  ]
};

// ---------- PRONOME ----------

const PRONOME = {
  question: "Che tipo di pronome è?",
  options: [
    { label: "PERSONALE", sub: "io, tu, egli, noi...", value: "personale", next: genereNumero(undefined, true) },
    { label: "POSSESSIVO", sub: "mio, tuo, nostro...", value: "possessivo", next: genereNumero(undefined, true) },
    { label: "RELATIVO", sub: "che, il quale, cui...", value: "relativo", next: genereNumero(undefined, true) },
    { label: "DIMOSTRATIVO", sub: "questo, quello, stesso...", value: "dimostrativo", next: genereNumero(undefined, true) },
    { label: "INDEFINITO", sub: "nessuno, ognuno, qualcuno, niente...", value: "indefinito", next: genereNumero(undefined, true) },
    { label: "NUMERALE", sub: "uno, cinque, primo, terzo...", value: "numerale", next: genereNumero(undefined, true) }
  ]
};

// ---------- AGGETTIVO ----------

const AGGETTIVO_GRADO_COMPARATIVO = {
  question: "Che tipo di comparativo?",
  options: [
    { label: "MAGGIORANZA", sub: "più bello di...", value: "comparativo di maggioranza" },
    { label: "UGUAGLIANZA", sub: "bello come...", value: "comparativo di uguaglianza" },
    { label: "MINORANZA", sub: "meno bello di...", value: "comparativo di minoranza" }
  ]
};

const AGGETTIVO_GRADO_SUPERLATIVO = {
  question: "Superlativo ASSOLUTO o RELATIVO?",
  options: [
    { label: "ASSOLUTO", sub: "bellissimo", value: "superlativo assoluto" },
    { label: "RELATIVO", sub: "il più bello", value: "superlativo relativo" }
  ]
};

const AGGETTIVO_GRADO = {
  question: "Di che grado è l'aggettivo?",
  options: [
    { label: "POSITIVO", sub: "bello, pulito, nuovo", value: "grado positivo" },
    { label: "COMPARATIVO", next: AGGETTIVO_GRADO_COMPARATIVO },
    { label: "SUPERLATIVO", next: AGGETTIVO_GRADO_SUPERLATIVO }
  ]
};

const AGGETTIVO_DETERMINATIVO_NUMERALE = {
  question: "Numerale CARDINALE o ORDINALE?",
  options: [
    { label: "CARDINALE", sub: "uno, due, venti...", value: "numerale cardinale" },
    { label: "ORDINALE", sub: "primo, secondo...", value: "numerale ordinale" }
  ]
};

const AGGETTIVO_DETERMINATIVO_TIPO = {
  question: "Che tipo di aggettivo determinativo è?",
  options: [
    { label: "POSSESSIVO", sub: "mio, tuo, miei, suoi...", value: "possessivo" },
    { label: "DIMOSTRATIVO", sub: "questo, quello, quelli, stesso...", value: "dimostrativo" },
    { label: "INDEFINITO", sub: "nessuno, ciascuno, certi, alcuni, molti...", value: "indefinito" },
    { label: "NUMERALE", next: AGGETTIVO_DETERMINATIVO_NUMERALE },
    { label: "INTERROGATIVO", sub: "quale? quanti?", value: "interrogativo" },
    { label: "ESCLAMATIVO", sub: "quale! quanti!", value: "esclamativo" }
  ]
};

const AGGETTIVO = {
  question: "È un aggettivo QUALIFICATIVO o DETERMINATIVO?",
  options: [
    { label: "QUALIFICATIVO", sub: "descrive com'è, es. bello, alto", value: "qualificativo", next: genereNumero(AGGETTIVO_GRADO, true) },
    { label: "DETERMINATIVO", sub: "indica di chi è, quanti sono...", value: "determinativo", next: genereNumero(AGGETTIVO_DETERMINATIVO_TIPO, true) }
  ]
};

// ---------- VERBO ----------

const VERBO_FORMA_TRANSITIVA_TIPO = {
  question: "Forma ATTIVA, PASSIVA o RIFLESSIVA?",
  options: [
    { label: "ATTIVA", sub: "mangiare", value: "forma transitiva attiva" },
    { label: "PASSIVA", sub: "essere mangiato", value: "forma transitiva passiva" },
    { label: "RIFLESSIVA", sub: "specchiarsi", value: "forma transitiva riflessiva" }
  ]
};

const VERBO_FORMA = {
  question: "Il verbo è TRANSITIVO (può avere il complemento oggetto) o INTRANSITIVO?",
  options: [
    { label: "TRANSITIVO", next: VERBO_FORMA_TRANSITIVA_TIPO },
    { label: "INTRANSITIVO", sub: "non può avere il complemento oggetto, es. dormire, correre", value: "forma intransitiva" }
  ]
};

const VERBO_TEMPO_PASSATO_TIPO = {
  question: "Passato SEMPLICE o COMPOSTO?",
  options: [
    { label: "SEMPLICE", sub: "es. giocai", value: "tempo passato semplice", next: VERBO_FORMA },
    { label: "COMPOSTO", sub: "es. ho giocato", value: "tempo passato composto", next: VERBO_FORMA }
  ]
};

const VERBO_TEMPO_FUTURO_TIPO = {
  question: "Futuro SEMPLICE o COMPOSTO?",
  options: [
    { label: "SEMPLICE", sub: "es. giocherò", value: "tempo futuro semplice", next: VERBO_FORMA },
    { label: "COMPOSTO", sub: "es. avrò giocato", value: "tempo futuro composto", next: VERBO_FORMA }
  ]
};

const VERBO_TEMPO_FINITO = {
  question: "Che TEMPO è?",
  options: [
    { label: "PRESENTE", sub: "es. gioco", value: "tempo presente", next: VERBO_FORMA },
    { label: "PASSATO", next: VERBO_TEMPO_PASSATO_TIPO },
    { label: "FUTURO", next: VERBO_TEMPO_FUTURO_TIPO }
  ]
};

const VERBO_MODO_FINITO = {
  question: "Quale modo finito?",
  options: [
    { label: "INDICATIVO", sub: "gioco", value: "modo indicativo", next: VERBO_TEMPO_FINITO },
    { label: "CONGIUNTIVO", sub: "che io giochi", value: "modo congiuntivo", next: VERBO_TEMPO_FINITO },
    { label: "CONDIZIONALE", sub: "giocherei", value: "modo condizionale", next: VERBO_TEMPO_FINITO },
    { label: "IMPERATIVO", sub: "gioca tu!", value: "modo imperativo", next: VERBO_FORMA }
  ]
};

const VERBO_MODO_INDEFINITO = {
  question: "Quale modo indefinito?",
  options: [
    { label: "INFINITO", sub: "parlare", value: "modo infinito", next: VERBO_FORMA },
    { label: "PARTICIPIO", sub: "parlato", value: "modo participio", next: VERBO_FORMA },
    { label: "GERUNDIO", sub: "parlando", value: "modo gerundio", next: VERBO_FORMA }
  ]
};

const VERBO_MODO = {
  question: "Il modo è FINITO (cambia con la persona) o INDEFINITO (non cambia)?",
  options: [
    { label: "FINITO", next: VERBO_MODO_FINITO },
    { label: "INDEFINITO", next: VERBO_MODO_INDEFINITO }
  ]
};

const VERBO_PERSONA = {
  question: "Che persona è?",
  options: [
    { label: "1ª SINGOLARE", sub: "io", value: "1ª persona singolare", next: VERBO_MODO },
    { label: "2ª SINGOLARE", sub: "tu", value: "2ª persona singolare", next: VERBO_MODO },
    { label: "3ª SINGOLARE", sub: "egli / lei", value: "3ª persona singolare", next: VERBO_MODO },
    { label: "1ª PLURALE", sub: "noi", value: "1ª persona plurale", next: VERBO_MODO },
    { label: "2ª PLURALE", sub: "voi", value: "2ª persona plurale", next: VERBO_MODO },
    { label: "3ª PLURALE", sub: "essi / loro", value: "3ª persona plurale", next: VERBO_MODO }
  ]
};

const VERBO_CONIUGAZIONE = {
  question: "A quale coniugazione appartiene?",
  options: [
    { label: "1ª (-ARE)", sub: "es. parlare", value: "1ª coniugazione", next: VERBO_PERSONA },
    { label: "2ª (-ERE)", sub: "es. temere", value: "2ª coniugazione", next: VERBO_PERSONA },
    { label: "3ª (-IRE)", sub: "es. dormire", value: "3ª coniugazione", next: VERBO_PERSONA },
    { label: "PROPRIA", sub: "essere, avere", value: "coniugazione propria", next: VERBO_PERSONA }
  ]
};

const VERBO = {
  type: "text",
  question: "Qual è l'INFINITO del verbo? (scrivi la forma base)",
  placeholder: "es. dormire, giocare, avere...",
  next: VERBO_CONIUGAZIONE
};

// ---------- PARTI INVARIABILI ----------

const PREPOSIZIONE = {
  question: "È una preposizione SEMPLICE o ARTICOLATA?",
  options: [
    { label: "SEMPLICE", sub: "di, a, da, in, con, su, per, tra, fra", value: "semplice" },
    { label: "ARTICOLATA", sub: "del, nella, sul, agli...", value: "articolata" }
  ]
};

const CONGIUNZIONE_COORD_TIPO = {
  question: "Che tipo di congiunzione coordinante?",
  options: [
    { label: "COPULATIVA", sub: "e, anche, inoltre, né, neanche", value: "coordinante copulativa" },
    { label: "DISGIUNTIVA", sub: "o, oppure, ovvero", value: "coordinante disgiuntiva" },
    { label: "AVVERSATIVA", sub: "ma, però, tuttavia, anzi", value: "coordinante avversativa" },
    { label: "CONCLUSIVA", sub: "dunque, quindi, perciò", value: "coordinante conclusiva" },
    { label: "DICHIARATIVA", sub: "cioè, infatti, ossia", value: "coordinante dichiarativa" }
  ]
};

const CONGIUNZIONE_SUB_TIPO = {
  question: "Che tipo di congiunzione subordinante?",
  options: [
    { label: "CAUSALE", sub: "perché, poiché", value: "subordinante causale" },
    { label: "TEMPORALE", sub: "quando, mentre", value: "subordinante temporale" },
    { label: "ALTRO", sub: "che, se, benché...", value: "subordinante" }
  ]
};

const CONGIUNZIONE = {
  question: "È una congiunzione COORDINANTE (unisce due parti uguali) o SUBORDINANTE (lega una frase secondaria)?",
  options: [
    { label: "COORDINANTE", next: CONGIUNZIONE_COORD_TIPO },
    { label: "SUBORDINANTE", next: CONGIUNZIONE_SUB_TIPO }
  ]
};

const AVVERBIO = {
  question: "Che tipo di avverbio è?",
  options: [
    { label: "DI MODO", sub: "bene, come, così, lentamente", value: "di modo" },
    { label: "DI TEMPO", sub: "ieri, oggi, domani, stasera", value: "di tempo" },
    { label: "DI LUOGO", sub: "là, lì, qui, qua, su, giù", value: "di luogo" },
    { label: "DI QUANTITÀ", sub: "poco, tanto, molto, più, meno", value: "di quantità" },
    { label: "DI DUBBIO", sub: "forse, magari, probabilmente", value: "di dubbio" },
    { label: "DI AFFERMAZIONE", sub: "sì, certo, appunto, proprio", value: "di affermazione" },
    { label: "DI NEGAZIONE", sub: "no, non, mai, neanche", value: "di negazione" },
    { label: "INTERROGATIVO", sub: "dove? quando? come? perché?", value: "interrogativo" },
    { label: "ESCLAMATIVO", sub: "come!, quanto!", value: "esclamativo" },
    { label: "LOCUZIONE AVVERBIALE", sub: "di qua, in fretta, all'improvviso", value: "locuzione avverbiale" }
  ]
};

// ---------- RADICE ----------

const GRAMMAR_ROOT = {
  question: "Che cos'è questa parola?",
  options: [
    { label: "ARTICOLO", cls: "cat-articolo", next: ARTICOLO },
    { label: "NOME", cls: "cat-nome", next: NOME },
    { label: "AGGETTIVO", cls: "cat-aggettivo", next: AGGETTIVO },
    { label: "PRONOME", cls: "cat-pronome", next: PRONOME },
    { label: "VERBO", cls: "cat-verbo", next: VERBO },
    { label: "PREPOSIZIONE", cls: "cat-preposizione", next: PREPOSIZIONE },
    { label: "CONGIUNZIONE", cls: "cat-congiunzione", next: CONGIUNZIONE },
    { label: "AVVERBIO", cls: "cat-avverbio", next: AVVERBIO },
    { label: "ESCLAMAZIONE", sub: "ah!, oh!, uffa!, bravo!, aiuto!...", cls: "cat-esclamazione" }
  ]
};
