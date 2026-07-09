(function () {
  "use strict";

  const STORAGE_KEY = "analisiGrammaticale_state_v1";

  /** @type {{sentences: Array<{text:string, words: Array<{text:string, analysis: null|{category:string, parts:string[], display:string}}>}>}} */
  let state = { sentences: [] };

  let pendingWords = null; // array of strings while previewing a new sentence

  let wizard = {
    sentenceIndex: -1,
    wordIndex: -1,
    history: [], // {node, option:{label, value, next}}
    currentNode: null
  };

  // ---------- persistenza ----------

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignora, non è critico */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.sentences)) {
          state = parsed;
        }
      }
    } catch (e) { /* ignora */ }
  }

  // ---------- tokenizzazione ----------

  function tokenizeSentence(text) {
    return text
      .split(/\s+/)
      .map((tok) => tok.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, ""))
      .filter((tok) => tok.length > 0);
  }

  // ---------- utility di navigazione schermate ----------

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
  }

  function findNextUnanalyzed() {
    for (let s = 0; s < state.sentences.length; s++) {
      const words = state.sentences[s].words;
      for (let w = 0; w < words.length; w++) {
        if (!words[w].analysis) return { s, w };
      }
    }
    return null;
  }

  function allAnalyzed() {
    return state.sentences.length > 0 && findNextUnanalyzed() === null;
  }

  // ---------- SCHERMATA 1: input frasi ----------

  const sentenceInput = document.getElementById("sentence-input");
  const btnExtract = document.getElementById("btn-extract");
  const wordPreview = document.getElementById("word-preview");
  const wordChipsEl = document.getElementById("word-chips");
  const btnAddWord = document.getElementById("btn-add-word");
  const btnConfirmSentence = document.getElementById("btn-confirm-sentence");
  const btnCancelSentence = document.getElementById("btn-cancel-sentence");
  const sentenceListEl = document.getElementById("sentence-list");
  const btnStartAnalysis = document.getElementById("btn-start-analysis");

  btnExtract.addEventListener("click", () => {
    const text = sentenceInput.value.trim();
    if (!text) return;
    pendingWords = tokenizeSentence(text);
    if (pendingWords.length === 0) return;
    renderWordPreview();
  });

  function renderWordPreview() {
    wordChipsEl.innerHTML = "";
    pendingWords.forEach((word, idx) => {
      wordChipsEl.appendChild(buildEditableChip(word, idx));
    });
    wordPreview.classList.remove("hidden");
  }

  function buildEditableChip(word, idx) {
    const wrapper = document.createElement("span");
    wrapper.className = "word-chip";

    const input = document.createElement("input");
    input.type = "text";
    input.value = word;
    input.className = "word-chip-input";
    input.style.width = Math.max(2, word.length) + "ch";
    input.addEventListener("input", () => {
      input.style.width = Math.max(2, input.value.length) + "ch";
      pendingWords[idx] = input.value;
    });
    input.addEventListener("blur", () => {
      // se l'utente inserisce uno spazio, dividiamo in due parole (es. "l'amico" -> "l'" "amico")
      const parts = input.value.split(/\s+/).filter((p) => p.length > 0);
      if (parts.length > 1) {
        pendingWords.splice(idx, 1, ...parts);
        renderWordPreview();
      } else if (parts.length === 0) {
        pendingWords.splice(idx, 1);
        renderWordPreview();
      }
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "word-chip-del";
    del.textContent = "✖";
    del.title = "Rimuovi parola";
    del.addEventListener("click", () => {
      pendingWords.splice(idx, 1);
      renderWordPreview();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(del);
    return wrapper;
  }

  btnAddWord.addEventListener("click", () => {
    pendingWords.push("");
    renderWordPreview();
    const inputs = wordChipsEl.querySelectorAll(".word-chip-input");
    const last = inputs[inputs.length - 1];
    if (last) last.focus();
  });

  btnCancelSentence.addEventListener("click", () => {
    pendingWords = null;
    wordPreview.classList.add("hidden");
    sentenceInput.value = "";
  });

  btnConfirmSentence.addEventListener("click", () => {
    const words = pendingWords.map((w) => w.trim()).filter((w) => w.length > 0);
    if (words.length === 0) return;
    state.sentences.push({
      text: sentenceInput.value.trim(),
      words: words.map((w) => ({ text: w, analysis: null }))
    });
    saveState();
    pendingWords = null;
    wordPreview.classList.add("hidden");
    sentenceInput.value = "";
    renderSentenceList();
  });

  function renderSentenceList() {
    sentenceListEl.innerHTML = "";
    state.sentences.forEach((sentence, idx) => {
      const card = document.createElement("div");
      card.className = "sentence-card";

      const info = document.createElement("div");
      const analyzedCount = sentence.words.filter((w) => w.analysis).length;
      info.innerHTML =
        "<strong>" + escapeHtml(sentence.text) + "</strong>" +
        "<br><span class='muted'>" + sentence.words.length + " parole — " +
        analyzedCount + "/" + sentence.words.length + " analizzate</span>";

      const del = document.createElement("button");
      del.className = "btn btn-ghost btn-small";
      del.textContent = "🗑 Rimuovi";
      del.addEventListener("click", () => {
        state.sentences.splice(idx, 1);
        saveState();
        renderSentenceList();
      });

      card.appendChild(info);
      card.appendChild(del);
      sentenceListEl.appendChild(card);
    });

    btnStartAnalysis.disabled = state.sentences.length === 0;
  }

  btnStartAnalysis.addEventListener("click", () => {
    const target = findNextUnanalyzed() || { s: 0, w: 0 };
    startWordWizard(target.s, target.w);
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- SCHERMATA 2: wizard ----------

  const sentenceContextEl = document.getElementById("sentence-context");
  const wordChipsNavEl = document.getElementById("word-chips-nav");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const wizardQuestionEl = document.getElementById("wizard-question");
  const wizardOptionsEl = document.getElementById("wizard-options");
  const wizardTextInputEl = document.getElementById("wizard-text-input");
  const textAnswerEl = document.getElementById("text-answer");
  const btnTextContinue = document.getElementById("btn-text-continue");
  const wizardDoneEl = document.getElementById("wizard-done");
  const doneSummaryEl = document.getElementById("done-summary");
  const btnNextWord = document.getElementById("btn-next-word");
  const btnBack = document.getElementById("btn-back");

  function startWordWizard(sentenceIndex, wordIndex) {
    wizard.sentenceIndex = sentenceIndex;
    wizard.wordIndex = wordIndex;
    wizard.history = [];
    wizard.currentNode = GRAMMAR_ROOT;
    showScreen("screen-wizard");
    renderWizard();
  }

  function currentWord() {
    return state.sentences[wizard.sentenceIndex].words[wizard.wordIndex];
  }

  function renderWizard() {
    wizardDoneEl.classList.add("hidden");
    wizardTextInputEl.classList.add("hidden");
    wizardOptionsEl.classList.remove("hidden");
    wizardQuestionEl.classList.remove("hidden");

    renderSentenceContext();
    renderBreadcrumb();

    const node = wizard.currentNode;
    wizardQuestionEl.textContent = node.question;

    if (node.type === "text") {
      wizardOptionsEl.classList.add("hidden");
      wizardOptionsEl.innerHTML = "";
      wizardTextInputEl.classList.remove("hidden");
      textAnswerEl.value = "";
      textAnswerEl.placeholder = node.placeholder || "";
      textAnswerEl.focus();
    } else {
      wizardOptionsEl.innerHTML = "";
      node.options.forEach((option) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-option";
        if (option.cls) btn.classList.add(option.cls);
        else if (wizard.history.length > 0) {
          const rootCls = wizard.history[0].option.cls;
          if (rootCls) btn.classList.add(rootCls);
        }
        const strong = document.createElement("span");
        strong.className = "option-label";
        strong.textContent = option.label;
        btn.appendChild(strong);
        if (option.sub) {
          const sub = document.createElement("span");
          sub.className = "option-sub";
          sub.textContent = option.sub;
          btn.appendChild(sub);
        }
        btn.addEventListener("click", () => selectOption(option));
        wizardOptionsEl.appendChild(btn);
      });
    }

    btnBack.disabled = wizard.history.length === 0;
  }

  function renderSentenceContext() {
    const sentence = state.sentences[wizard.sentenceIndex];
    sentenceContextEl.textContent =
      "Frase " + (wizard.sentenceIndex + 1) + " di " + state.sentences.length + ": " + sentence.text;

    wordChipsNavEl.innerHTML = "";
    sentence.words.forEach((word, idx) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "nav-word-chip";
      if (idx === wizard.wordIndex) chip.classList.add("active");
      if (word.analysis) chip.classList.add("done");
      chip.textContent = word.text + (word.analysis ? " ✓" : "");
      chip.title = word.analysis ? word.analysis.display : "Non ancora analizzata";
      chip.addEventListener("click", () => {
        startWordWizard(wizard.sentenceIndex, idx);
      });
      wordChipsNavEl.appendChild(chip);
    });
  }

  function renderBreadcrumb() {
    breadcrumbEl.innerHTML = "";
    if (wizard.history.length === 0) {
      breadcrumbEl.innerHTML = "<span class='muted'>Analizzando: <strong>" + escapeHtml(currentWord().text) + "</strong></span>";
      return;
    }
    const label = document.createElement("span");
    label.className = "muted";
    label.textContent = "Parola: ";
    breadcrumbEl.appendChild(label);
    const word = document.createElement("strong");
    word.textContent = currentWord().text + "  →  ";
    breadcrumbEl.appendChild(word);
    wizard.history.forEach((entry, i) => {
      const chip = document.createElement("span");
      chip.className = "crumb";
      chip.textContent = entry.option.label;
      breadcrumbEl.appendChild(chip);
      if (i < wizard.history.length - 1) {
        const arrow = document.createElement("span");
        arrow.className = "crumb-arrow";
        arrow.textContent = "›";
        breadcrumbEl.appendChild(arrow);
      }
    });
  }

  function selectOption(option) {
    wizard.history.push({ node: wizard.currentNode, option });
    if (option.next) {
      wizard.currentNode = option.next;
      renderWizard();
    } else {
      finishWord();
    }
  }

  btnTextContinue.addEventListener("click", submitTextAnswer);
  textAnswerEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitTextAnswer();
  });

  function submitTextAnswer() {
    const text = textAnswerEl.value.trim();
    if (!text) {
      textAnswerEl.focus();
      return;
    }
    const node = wizard.currentNode;
    const option = { label: text, value: text };
    wizard.history.push({ node, option });
    if (node.next) {
      wizard.currentNode = node.next;
      renderWizard();
    } else {
      finishWord();
    }
  }

  btnBack.addEventListener("click", () => {
    if (wizard.history.length === 0) return;
    const last = wizard.history.pop();
    wizard.currentNode = last.node;
    renderWizard();
  });

  function finishWord() {
    const category = wizard.history[0].option.label;
    const parts = wizard.history.slice(1).map((h) => h.option.value).filter((v) => v);
    const display = parts.length ? category + ": " + parts.join(", ") : category;

    currentWord().analysis = { category, parts, display };
    saveState();

    renderSentenceContext();
    breadcrumbEl.innerHTML = "";
    wizardQuestionEl.classList.add("hidden");
    wizardOptionsEl.classList.add("hidden");
    wizardTextInputEl.classList.add("hidden");
    wizardDoneEl.classList.remove("hidden");
    doneSummaryEl.textContent = currentWord().text + " → " + display;

    const nextTarget = computeNextTarget();
    if (nextTarget === null) {
      btnNextWord.textContent = "📋 Vai al riepilogo";
    } else if (nextTarget.s !== wizard.sentenceIndex) {
      btnNextWord.textContent = "▶ Prossima frase";
    } else {
      btnNextWord.textContent = "▶ Parola successiva";
    }
  }

  function computeNextTarget() {
    const sentence = state.sentences[wizard.sentenceIndex];
    if (wizard.wordIndex + 1 < sentence.words.length) {
      return { s: wizard.sentenceIndex, w: wizard.wordIndex + 1 };
    }
    if (wizard.sentenceIndex + 1 < state.sentences.length) {
      return { s: wizard.sentenceIndex + 1, w: 0 };
    }
    return findNextUnanalyzed();
  }

  btnNextWord.addEventListener("click", () => {
    const target = computeNextTarget();
    if (target === null) {
      renderSummary();
      showScreen("screen-summary");
    } else {
      startWordWizard(target.s, target.w);
    }
  });

  // ---------- SCHERMATA 3: riepilogo ----------

  const summaryContentEl = document.getElementById("summary-content");
  const btnAddMore = document.getElementById("btn-add-more");
  const btnGeneratePdf = document.getElementById("btn-generate-pdf");
  const btnRestart = document.getElementById("btn-restart");

  function renderSummary() {
    summaryContentEl.innerHTML = "";
    state.sentences.forEach((sentence, sIdx) => {
      const block = document.createElement("div");
      block.className = "summary-sentence";
      const title = document.createElement("h3");
      title.textContent = (sIdx + 1) + ". " + sentence.text;
      block.appendChild(title);

      const list = document.createElement("ul");
      sentence.words.forEach((word, wIdx) => {
        const li = document.createElement("li");
        const display = word.analysis ? word.analysis.display : "(non analizzata)";
        li.innerHTML = "<strong>" + escapeHtml(word.text) + "</strong> — " + escapeHtml(display);
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-ghost btn-small";
        editBtn.textContent = "✏️";
        editBtn.title = "Modifica";
        editBtn.addEventListener("click", () => {
          startWordWizard(sIdx, wIdx);
        });
        li.appendChild(editBtn);
        list.appendChild(li);
      });
      block.appendChild(list);
      summaryContentEl.appendChild(block);
    });
  }

  btnAddMore.addEventListener("click", () => {
    showScreen("screen-input");
    renderSentenceList();
  });

  btnRestart.addEventListener("click", () => {
    if (!confirm("Vuoi davvero cancellare tutte le frasi e ricominciare da capo?")) return;
    state = { sentences: [] };
    saveState();
    showScreen("screen-input");
    renderSentenceList();
  });

  btnGeneratePdf.addEventListener("click", generatePdf);

  function generatePdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginLeft = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 56;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Analisi Grammaticale", marginLeft, y);
    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString("it-IT"), marginLeft, y);
    y += 28;

    state.sentences.forEach((sentence, idx) => {
      if (y > pageHeight - 80) { doc.addPage(); y = 56; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const title = (idx + 1) + ". " + sentence.text;
      const titleLines = doc.splitTextToSize(title, pageWidth - marginLeft * 2);
      doc.text(titleLines, marginLeft, y);
      y += titleLines.length * 16 + 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      sentence.words.forEach((word) => {
        const display = word.analysis ? word.analysis.display : "(non analizzata)";
        const line = "• " + word.text + " — " + display;
        const lines = doc.splitTextToSize(line, pageWidth - marginLeft * 2 - 12);
        if (y + lines.length * 14 > pageHeight - 40) { doc.addPage(); y = 56; }
        doc.text(lines, marginLeft + 12, y);
        y += lines.length * 14 + 4;
      });
      y += 14;
    });

    doc.save("analisi_grammaticale.pdf");
  }

  // ---------- avvio ----------

  loadState();
  renderSentenceList();
  showScreen("screen-input");
})();
