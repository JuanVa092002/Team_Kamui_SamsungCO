(() => {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const progress = document.querySelector("[data-scroll-progress]");

  if (header && toggle && mobileNav) {
    const closeMobile = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      mobileNav.hidden = true;
    };

    const openMobile = () => {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Cerrar menú");
      mobileNav.hidden = false;
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      if (open) closeMobile();
      else openMobile();
    });

    mobileNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMobile();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobile();
    });
  }

  if (progress) {
    let ticking = false;
    const updateProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? doc.scrollTop / max : 0;
      progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateProgress);
      },
      { passive: true },
    );
    updateProgress();
  }

  const sections = [...document.querySelectorAll("[data-section]")];
  const navLinks = document.querySelectorAll("[data-nav-link]");

  if ("IntersectionObserver" in window && sections.length > 0) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        const match = link.getAttribute("data-nav-section") === id;
        if (match) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -45% 0px", threshold: [0.1, 0.25, 0.4] },
    );

    sections.forEach((section) => observer.observe(section));
  }

  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector("[data-carousel-track]");
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  const dotsRoot = carousel.querySelector("[data-carousel-dots]");
  const slides = [...carousel.querySelectorAll(".member")];
  if (!track || slides.length === 0) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const getStep = () => {
    const first = slides[0];
    const styles = getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return first.getBoundingClientRect().width + gap;
  };

  const activeIndex = () => {
    const step = getStep();
    if (step <= 0) return 0;
    return Math.round(track.scrollLeft / step);
  };

  const goTo = (index) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({
      left: clamped * getStep(),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  if (dotsRoot) {
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel__dot";
      dot.setAttribute("aria-label", `Ir al integrante ${index + 1}`);
      dot.addEventListener("click", () => goTo(index));
      dotsRoot.appendChild(dot);
    });
  }

  const syncDots = () => {
    if (!dotsRoot) return;
    const index = activeIndex();
    [...dotsRoot.children].forEach((dot, i) => {
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  prev?.addEventListener("click", () => goTo(activeIndex() - 1));
  next?.addEventListener("click", () => goTo(activeIndex() + 1));

  let scrollTick = false;
  track.addEventListener(
    "scroll",
    () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        syncDots();
        scrollTick = false;
      });
    },
    { passive: true },
  );

  window.addEventListener("resize", syncDots, { passive: true });
  syncDots();
})();
