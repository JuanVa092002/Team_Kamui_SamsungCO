import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

const SLIDE_MS = 5200;

const root = document.querySelector("[data-pdf-viewer]");
if (!root) {
  // No informe section on this page.
} else {

const src = root.dataset.pdfSrc;
const canvas = root.querySelector("[data-pdf-canvas]");
const pageWrap = root.querySelector("[data-pdf-page]");
const counter = root.querySelector("[data-pdf-counter]");
const progress = root.querySelector("[data-pdf-progress]");
const prevBtn = root.querySelector("[data-pdf-prev]");
const nextBtn = root.querySelector("[data-pdf-next]");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let pdfDoc = null;
let totalPages = 0;
let currentPage = 1;
let paused = false;
let timerId = null;
let rendering = false;

const setProgress = (restart) => {
  if (!progress) return;
  progress.style.animation = "none";
  progress.offsetHeight;
  if (restart && !paused && !prefersReducedMotion) {
    progress.style.animation = `pdf-progress ${SLIDE_MS}ms linear forwards`;
  }
};

const updateCounter = () => {
  if (counter) counter.textContent = `${currentPage} / ${totalPages}`;
  if (canvas) canvas.setAttribute("aria-label", `Página ${currentPage} de ${totalPages} del informe técnico`);
};

const renderPage = async (pageNum) => {
  if (!pdfDoc || !canvas || rendering) return;
  rendering = true;
  pageWrap?.classList.add("is-changing");

  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewportBase = page.getViewport({ scale: 1 });
    const maxWidth = Math.min(root.clientWidth - 48, 720);
    const scale = maxWidth / viewportBase.width;
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    currentPage = pageNum;
    updateCounter();
  } finally {
    rendering = false;
    pageWrap?.classList.remove("is-changing");
    setProgress(true);
  }
};

const goTo = (pageNum, { userInitiated = false } = {}) => {
  if (!totalPages) return;
  let next = pageNum;
  if (next < 1) next = totalPages;
  if (next > totalPages) next = 1;
  if (userInitiated) restartAutoplay();
  renderPage(next);
};

const tick = () => {
  if (paused || prefersReducedMotion) return;
  goTo(currentPage >= totalPages ? 1 : currentPage + 1);
};

const restartAutoplay = () => {
  clearInterval(timerId);
  if (prefersReducedMotion) return;
  timerId = setInterval(tick, SLIDE_MS);
  setProgress(true);
};

const pause = () => {
  paused = true;
  if (progress) progress.style.animationPlayState = "paused";
};

const resume = () => {
  if (document.hidden) return;
  paused = false;
  if (progress) progress.style.animationPlayState = "running";
};

root.addEventListener("mouseenter", pause);
root.addEventListener("mouseleave", resume);
root.addEventListener("focusin", pause);
root.addEventListener("focusout", (event) => {
  if (!root.contains(event.relatedTarget)) resume();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
  else resume();
});

prevBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  goTo(currentPage - 1, { userInitiated: true });
});

nextBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  goTo(currentPage + 1, { userInitiated: true });
});

root.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goTo(currentPage - 1, { userInitiated: true });
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    goTo(currentPage + 1, { userInitiated: true });
  }
});

window.addEventListener(
  "resize",
  () => {
    renderPage(currentPage);
  },
  { passive: true },
);

try {
  pdfDoc = await pdfjsLib.getDocument(src).promise;
  totalPages = pdfDoc.numPages;
  await renderPage(1);
  if (!prefersReducedMotion) restartAutoplay();
} catch {
  if (counter) counter.textContent = "No se pudo cargar el PDF";
  root.classList.add("pdf-viewer--error");
}
}
