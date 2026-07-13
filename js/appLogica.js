(function () {
  "use strict";

  const STORAGE_KEY = "analisiLogica_state_v1";

  /** @type {{sentences: Array<{text:string, words:string[], groups: Array<{wordIndices:number[], analysis:{category:string|null, parts:string[], display:string, cls:string|null}}>}>, settings:{showHints:boolean}}} */
  let state = { sentences: [], settings: { showHints: true } };

  let pendingWords = null;

  let wizard = {
    sentenceIndex: -1,
    selection: [], // indici delle parole selezionate per il gruppo corrente
    history: [],
    currentNode: null
  };

  let groupNextAction = null;

  function saveState() {
    saveStateToStorage(STORAGE_KEY, state);
  }

  function loadState() {
    state = loadStateFromStorage(STORAGE_KEY, state);
  }

  function assignedIndexSet(sentence) {
    const set = new Set();
    sentence.groups.forEach((g) => g.wordIndices.forEach((i) => set.add(i)));
    return set;
  }

  function computeUnassigned(sentence) {
    const assigned = assignedIndexSet(sentence);
    const result = [];
    for (let i = 0; i < sentence.words.length; i++) {
      if (!assigned.has(i)) result.push(i);
    }
    return result;
  }

  function findFirstIncompleteSentence() {
    for (let s = 0; s < state.sentences.length; s++) {
      if (computeUnassigned(state.sentences[s]).length > 0) return s;
    }
    return null;
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
  const toggleHints = document.getElementById("toggle-hints");

  toggleHints.checked = state.settings.showHints;
  toggleHints.addEventListener("change", () => {
    state.settings.showHints = toggleHints.checked;
    saveState();
  });

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
      words: words,
      groups: []
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

      const assignedCount = sentence.words.length - computeUnassigned(sentence).length;
      const info = document.createElement("div");
      info.innerHTML =
        "<strong>" + escapeHtml(sentence.text) + "</strong>" +
        "<br><span class='muted'>" + sentence.words.length + " parole — " +
        assignedCount + "/" + sentence.words.length + " classificate</span>";

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
    const idx = findFirstIncompleteSentence();
    startSentenceWizard(idx !== null ? idx : 0);
  });

  // ---------- SCHERMATA 2: raggruppamento + classificazione ----------

  const sentenceContextEl = document.getElementById("sentence-context");
  const groupingPanelEl = document.getElementById("grouping-panel");
  const classifyPanelEl = document.getElementById("classify-panel");
  const wordBankEl = document.getElementById("word-bank");
  const currentGroupPreviewEl = document.getElementById("current-group-preview");
  const btnClearSelection = document.getElementById("btn-clear-selection");
  const btnConfirmGroup = document.getElementById("btn-confirm-group");
  const btnSkipRemaining = document.getElementById("btn-skip-remaining");

  const currentWordBigEl = document.getElementById("current-word-big");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const wizardQuestionEl = document.getElementById("wizard-question");
  const wizardOptionsEl = document.getElementById("wizard-options");
  const wizardDoneEl = document.getElementById("wizard-done");
  const doneSummaryEl = document.getElementById("done-summary");
  const btnNextGroup = document.getElementById("btn-next-group");
  const btnBack = document.getElementById("btn-back");
  const btnSkip = document.getElementById("btn-skip");

  function currentSentence() {
    return state.sentences[wizard.sentenceIndex];
  }

  function startSentenceWizard(sentenceIndex) {
    wizard.sentenceIndex = sentenceIndex;
    wizard.selection = [];
    showScreen("screen-wizard");
    showGroupingPanel();
    renderGrouping();
  }

  function showGroupingPanel() {
    groupingPanelEl.classList.remove("hidden");
    classifyPanelEl.classList.add("hidden");
  }

  function showClassifyPanel() {
    groupingPanelEl.classList.add("hidden");
    classifyPanelEl.classList.remove("hidden");
  }

  function renderGrouping() {
    const sentence = currentSentence();
    sentenceContextEl.textContent =
      "Frase " + (wizard.sentenceIndex + 1) + " di " + state.sentences.length + ": " + sentence.text;

    wordBankEl.innerHTML = "";
    sentence.words.forEach((word, idx) => {
      const group = sentence.groups.find((g) => g.wordIndices.includes(idx));
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "bank-word-chip";
      if (group) {
        chip.classList.add("assigned");
        if (group.analysis.cls) chip.classList.add(group.analysis.cls);
        chip.title = group.analysis.display;
        chip.textContent = word;
        chip.addEventListener("click", () => maybeEditGroup(group));
      } else {
        if (wizard.selection.includes(idx)) chip.classList.add("selected");
        chip.textContent = word;
        chip.addEventListener("click", () => toggleWordSelection(idx));
      }
      wordBankEl.appendChild(chip);
    });

    const selectedWords = wizard.selection
      .slice()
      .sort((a, b) => a - b)
      .map((i) => sentence.words[i]);
    currentGroupPreviewEl.textContent = selectedWords.length
      ? selectedWords.join(" ")
      : "Tocca le parole qui sopra per formare un gruppo";

    btnConfirmGroup.disabled = wizard.selection.length === 0;

    const unassignedCount = computeUnassigned(sentence).length;
    btnSkipRemaining.classList.toggle("hidden", unassignedCount === 0);
  }

  function toggleWordSelection(idx) {
    const pos = wizard.selection.indexOf(idx);
    if (pos === -1) wizard.selection.push(idx);
    else wizard.selection.splice(pos, 1);
    renderGrouping();
  }

  function maybeEditGroup(group) {
    const sentence = currentSentence();
    const words = group.wordIndices.map((i) => sentence.words[i]).join(" ");
    const label = group.analysis.category || "non classificato";
    const ok = confirm("Vuoi modificare il gruppo \"" + words + "\" (attualmente: " + label + ")?\nDovrai classificarlo di nuovo.");
    if (!ok) return;
    const pos = sentence.groups.indexOf(group);
    if (pos !== -1) sentence.groups.splice(pos, 1);
    saveState();
    renderGrouping();
  }

  btnClearSelection.addEventListener("click", () => {
    wizard.selection = [];
    renderGrouping();
  });

  btnConfirmGroup.addEventListener("click", () => {
    if (wizard.selection.length === 0) return;
    wizard.history = [];
    wizard.currentNode = LOGICA_ROOT;
    showClassifyPanel();
    renderClassify();
  });

  btnSkipRemaining.addEventListener("click", () => {
    const sentence = currentSentence();
    const unassigned = computeUnassigned(sentence);
    if (unassigned.length === 0) return;
    sentence.groups.push({
      wordIndices: unassigned,
      analysis: { category: null, parts: [], display: "(non specificato)", cls: null }
    });
    saveState();
    wizard.selection = [];
    goAfterSentenceComplete();
  });

  function renderClassify() {
    wizardDoneEl.classList.add("hidden");
    wizardOptionsEl.classList.remove("hidden");
    wizardQuestionEl.classList.remove("hidden");

    renderBreadcrumb();

    const sentence = currentSentence();
    const groupWords = wizard.selection
      .slice()
      .sort((a, b) => a - b)
      .map((i) => sentence.words[i])
      .join(" ");

    const rootCls = wizard.history.length > 0 ? wizard.history[0].option.cls : null;
    currentWordBigEl.className = "current-word-big" + (rootCls ? " " + rootCls : "");
    currentWordBigEl.textContent = groupWords;

    const node = wizard.currentNode;
    wizardQuestionEl.textContent = node.question;

    wizardOptionsEl.innerHTML = "";
    node.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-option";
      if (option.cls) btn.classList.add(option.cls);
      else if (rootCls) btn.classList.add(rootCls);
      const strong = document.createElement("span");
      strong.className = "option-label";
      strong.textContent = option.label;
      btn.appendChild(strong);
      if (option.sub && state.settings.showHints) {
        const sub = document.createElement("span");
        sub.className = "option-sub";
        sub.textContent = option.sub;
        btn.appendChild(sub);
      }
      btn.addEventListener("click", () => selectOption(option));
      wizardOptionsEl.appendChild(btn);
    });

    btnBack.disabled = wizard.history.length === 0;
  }

  function renderBreadcrumb() {
    breadcrumbEl.innerHTML = "";
    const visible = wizard.history.filter((entry) => !entry.option.skipped);
    visible.forEach((entry, i) => {
      const chip = document.createElement("span");
      chip.className = "crumb";
      chip.textContent = entry.option.label;
      breadcrumbEl.appendChild(chip);
      if (i < visible.length - 1) {
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
      renderClassify();
    } else {
      finishGroup();
    }
  }

  btnBack.addEventListener("click", () => {
    if (wizard.history.length === 0) return;
    const last = wizard.history.pop();
    wizard.currentNode = last.node;
    renderClassify();
  });

  btnSkip.addEventListener("click", () => {
    const node = wizard.currentNode;
    const target = node.skipNext;
    wizard.history.push({ node, option: { label: "non so", value: null, skipped: true } });
    if (target) {
      wizard.currentNode = target;
      renderClassify();
    } else {
      finishGroup();
    }
  });

  function finishGroup() {
    const rootSkipped = wizard.history.length > 0 && wizard.history[0].option.skipped;
    const category = rootSkipped ? null : wizard.history[0].option.label;
    const cls = rootSkipped ? null : wizard.history[0].option.cls || null;
    const parts = rootSkipped ? [] : wizard.history.slice(1).map((h) => h.option.value).filter((v) => v);

    let display;
    if (category === null) {
      display = "(non specificato)";
    } else {
      const categoryLabel = capitalizeFirst(category);
      display = parts.length ? categoryLabel + " " + parts.join(", ") : categoryLabel;
    }

    const sentence = currentSentence();
    const wordIndices = wizard.selection.slice().sort((a, b) => a - b);
    sentence.groups.push({ wordIndices, analysis: { category, parts, display, cls } });
    saveState();

    const groupWords = wordIndices.map((i) => sentence.words[i]).join(" ");
    wizard.selection = [];

    breadcrumbEl.innerHTML = "";
    wizardQuestionEl.classList.add("hidden");
    wizardOptionsEl.classList.add("hidden");
    wizardDoneEl.classList.remove("hidden");
    doneSummaryEl.textContent = groupWords + " → " + display;

    const remaining = computeUnassigned(sentence).length;
    if (remaining > 0) {
      groupNextAction = { type: "continue-grouping" };
      btnNextGroup.textContent = "▶ Continua a raggruppare";
    } else if (wizard.sentenceIndex + 1 < state.sentences.length) {
      groupNextAction = { type: "next-sentence", index: wizard.sentenceIndex + 1 };
      btnNextGroup.textContent = "▶ Prossima frase";
    } else {
      const nextIncomplete = findFirstIncompleteSentence();
      if (nextIncomplete !== null) {
        groupNextAction = { type: "next-sentence", index: nextIncomplete };
        btnNextGroup.textContent = "▶ Prossima frase";
      } else {
        groupNextAction = { type: "summary" };
        btnNextGroup.textContent = "📋 Vai al riepilogo";
      }
    }
  }

  function goAfterSentenceComplete() {
    const nextIncomplete = findFirstIncompleteSentence();
    if (nextIncomplete !== null) {
      startSentenceWizard(nextIncomplete);
    } else {
      renderSummary();
      showScreen("screen-summary");
    }
  }

  btnNextGroup.addEventListener("click", () => {
    if (!groupNextAction) return;
    if (groupNextAction.type === "continue-grouping") {
      showGroupingPanel();
      renderGrouping();
    } else if (groupNextAction.type === "next-sentence") {
      startSentenceWizard(groupNextAction.index);
    } else {
      renderSummary();
      showScreen("screen-summary");
    }
  });

  // ---------- SCHERMATA 3: riepilogo ----------

  const summaryContentEl = document.getElementById("summary-content");
  const btnAddMore = document.getElementById("btn-add-more");
  const btnGeneratePdf = document.getElementById("btn-generate-pdf");
  const btnSendEmail = document.getElementById("btn-send-email");
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
      const orderedGroups = sentence.groups.slice().sort((a, b) => a.wordIndices[0] - b.wordIndices[0]);
      orderedGroups.forEach((group) => {
        const li = document.createElement("li");
        const words = group.wordIndices.map((i) => sentence.words[i]).join(" ");
        li.innerHTML = "<strong>" + escapeHtml(words) + "</strong> : " + escapeHtml(group.analysis.display);
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-ghost btn-small";
        editBtn.textContent = "✏️";
        editBtn.title = "Modifica";
        editBtn.addEventListener("click", () => {
          const pos = sentence.groups.indexOf(group);
          if (pos !== -1) sentence.groups.splice(pos, 1);
          saveState();
          startSentenceWizard(sIdx);
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
    state = { sentences: [], settings: state.settings };
    saveState();
    showScreen("screen-input");
    renderSentenceList();
  });

  btnGeneratePdf.addEventListener("click", () => {
    const report = createPdfReport("Analisi Logica");
    state.sentences.forEach((sentence, idx) => {
      report.addHeading((idx + 1) + ". " + sentence.text);
      const orderedGroups = sentence.groups.slice().sort((a, b) => a.wordIndices[0] - b.wordIndices[0]);
      orderedGroups.forEach((group) => {
        const words = group.wordIndices.map((i) => sentence.words[i]).join(" ");
        report.addWordLine(words, group.analysis.display);
      });
      report.addSpacer();
    });
    report.save("analisi_logica.pdf");
  });

  btnSendEmail.addEventListener("click", () => {
    const lines = [];
    state.sentences.forEach((sentence, idx) => {
      lines.push((idx + 1) + ". " + sentence.text);
      const orderedGroups = sentence.groups.slice().sort((a, b) => a.wordIndices[0] - b.wordIndices[0]);
      orderedGroups.forEach((group) => {
        const words = group.wordIndices.map((i) => sentence.words[i]).join(" ");
        lines.push("   • " + words + " : " + group.analysis.display);
      });
      lines.push("");
    });
    openMailto("Analisi Logica", lines.join("\n"));
  });

  // ---------- avvio ----------

  loadState();
  renderSentenceList();
  showScreen("screen-input");
})();
