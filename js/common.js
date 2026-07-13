/*
 * Utility condivise tra Analisi Grammaticale e Analisi Logica.
 */

function tokenizeSentence(text) {
  return text
    .split(/\s+/)
    .map((tok) => tok.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, ""))
    .filter((tok) => tok.length > 0);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function loadStateFromStorage(storageKey, defaultState) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (!parsed.settings) parsed.settings = { showHints: true };
        return parsed;
      }
    }
  } catch (e) { /* ignora */ }
  return defaultState;
}

function saveStateToStorage(storageKey, state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (e) { /* ignora, non è critico */ }
}

/**
 * Piccolo helper per generare un PDF con titolo, data e blocchi di testo
 * paginati automaticamente. Restituisce funzioni per aggiungere contenuto.
 */
function createPdfReport(title) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginLeft = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, marginLeft, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString("it-IT"), marginLeft, y);
  y += 28;

  function ensureSpace(neededHeight) {
    if (y + neededHeight > pageHeight - 40) {
      doc.addPage();
      y = 56;
    }
  }

  function addHeading(text) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const lines = doc.splitTextToSize(text, pageWidth - marginLeft * 2);
    ensureSpace(lines.length * 16);
    doc.text(lines, marginLeft, y);
    y += lines.length * 16 + 6;
  }

  function addLine(text) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, pageWidth - marginLeft * 2 - 12);
    ensureSpace(lines.length * 14);
    doc.text(lines, marginLeft + 12, y);
    y += lines.length * 14 + 4;
  }

  function addSpacer() {
    y += 14;
  }

  /**
   * Stampa "• parola : resto" con la parola in grassetto seguita dai due punti,
   * il resto in testo normale, andando a capo se necessario.
   */
  function addWordLine(word, rest) {
    const indent = marginLeft + 12;
    const bulletBold = "• " + word + " : ";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const boldWidth = doc.getTextWidth(bulletBold);
    const availWidth = pageWidth - marginLeft - indent - boldWidth;

    doc.setFont("helvetica", "normal");
    const restLines = rest ? doc.splitTextToSize(rest, Math.max(availWidth, 60)) : [""];

    ensureSpace(14);
    doc.setFont("helvetica", "bold");
    doc.text(bulletBold, indent, y);
    doc.setFont("helvetica", "normal");
    doc.text(restLines[0] || "", indent + boldWidth, y);
    y += 14;

    for (let i = 1; i < restLines.length; i++) {
      ensureSpace(14);
      doc.text(restLines[i], indent + 10, y);
      y += 14;
    }
  }

  function save(filename) {
    doc.save(filename);
  }

  return { addHeading, addLine, addWordLine, addSpacer, save };
}

/**
 * Apre il client di posta predefinito con oggetto e corpo precompilati.
 */
function openMailto(subject, bodyText) {
  const mailtoUrl =
    "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyText);
  window.location.href = mailtoUrl;
}
