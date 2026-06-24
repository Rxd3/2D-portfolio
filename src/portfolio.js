const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const overlay = document.querySelector("[data-game-overlay]");
const closeHouseButton = document.querySelector("[data-close-house]");
const enterHouseButtons = document.querySelectorAll("[data-enter-house]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const hero = document.querySelector(".hero");
const starField = document.querySelector(".star-field");
const compactStarsQuery = window.matchMedia("(max-width: 780px)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let previousFocus = null;
let parallaxFrame = null;

function createStarField() {
  if (!starField) return;

  const starCount = compactStarsQuery.matches ? 45 : 300;
  const stars = document.createDocumentFragment();

  for (let index = 0; index < starCount; index += 1) {
    const star = document.createElement("i");
    const duration = 2.4 + Math.random() * 4.1;
    const size = 1 + Math.random() * 2;
    const colorRoll = Math.random();

    star.className = "star";
    star.style.setProperty("--star-x", `${(Math.random() * 100).toFixed(2)}%`);
    star.style.setProperty("--star-y", `${(Math.random() * 100).toFixed(2)}%`);
    star.style.setProperty("--star-size", `${size.toFixed(2)}px`);
    star.style.setProperty("--star-glow", `${(size * 3).toFixed(2)}px`);
    star.style.setProperty("--star-duration", `${duration.toFixed(2)}s`);
    star.style.setProperty("--star-delay", `${(-Math.random() * duration).toFixed(2)}s`);
    star.style.setProperty("--star-peak", (0.58 + Math.random() * 0.42).toFixed(2));
    star.style.setProperty(
      "--star-color",
      colorRoll > 0.92 ? "#ffd66b" : colorRoll < 0.08 ? "#9fc7d6" : "#f2e3c6",
    );
    stars.append(star);
  }

  starField.replaceChildren(stars);
}

function resetHeroParallax() {
  hero?.style.setProperty("--star-shift-x", "0px");
  hero?.style.setProperty("--star-shift-y", "0px");
}

function updateHeroParallax(event) {
  if (!hero || compactStarsQuery.matches || reducedMotionQuery.matches) return;

  const bounds = hero.getBoundingClientRect();
  const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 16;
  const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 16;

  if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
  parallaxFrame = requestAnimationFrame(() => {
    hero.style.setProperty("--star-shift-x", `${x.toFixed(2)}px`);
    hero.style.setProperty("--star-shift-y", `${y.toFixed(2)}px`);
    parallaxFrame = null;
  });
}

createStarField();
compactStarsQuery.addEventListener("change", createStarField);
reducedMotionQuery.addEventListener("change", resetHeroParallax);
hero?.addEventListener("pointermove", updateHeroParallax, { passive: true });
hero?.addEventListener("pointerleave", resetHeroParallax);

function setHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);
}

function closeMenu() {
  navLinks?.classList.remove("is-open");
  header?.classList.remove("is-menu-open");
  menuToggle?.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  const isOpen = !navLinks?.classList.contains("is-open");
  navLinks?.classList.toggle("is-open", isOpen);
  header?.classList.toggle("is-menu-open", isOpen);
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
}

function openHouse(event) {
  previousFocus = event?.currentTarget ?? document.activeElement;
  overlay?.classList.add("is-open");
  overlay?.setAttribute("aria-hidden", "false");
  document.body.classList.add("game-open");
  closeMenu();
  closeHouseButton?.focus();
  window.dispatchEvent(new Event("resize"));
}

function closeHouse() {
  overlay?.classList.remove("is-open");
  overlay?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("game-open");
  previousFocus?.focus?.();
}

menuToggle?.addEventListener("click", toggleMenu);
navLinks?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
enterHouseButtons.forEach((button) => button.addEventListener("click", openHouse));
closeHouseButton?.addEventListener("click", closeHouse);
window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && overlay?.classList.contains("is-open")) {
    closeHouse();
  }
});

document.querySelectorAll("[data-accordion] .experience-item > button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".experience-item");
    const accordion = item?.parentElement;
    const willOpen = !item?.classList.contains("is-open");

    accordion?.querySelectorAll(".experience-item").forEach((entry) => {
      entry.classList.remove("is-open");
      entry.querySelector("button")?.setAttribute("aria-expanded", "false");
      const icon = entry.querySelector(".expand-icon");
      if (icon) icon.textContent = "+";
    });

    if (willOpen) {
      item?.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      const icon = button.querySelector(".expand-icon");
      if (icon) icon.textContent = "−";
    }
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -4%" },
);

document.querySelectorAll("main section").forEach((section) => {
  section.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 280)}ms`);
    revealObserver.observe(element);
  });
});

const sections = [...document.querySelectorAll("main section[id]")];
const navAnchors = [...document.querySelectorAll(".nav-links a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navAnchors.forEach((anchor) => {
      anchor.classList.toggle("is-active", anchor.getAttribute("href") === `#${visible.target.id}`);
    });
  },
  { rootMargin: "-22% 0px -62%", threshold: [0, 0.15, 0.35] },
);

sections.forEach((section) => sectionObserver.observe(section));

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!contactForm.reportValidity()) return;

  const data = new FormData(contactForm);
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  const subject = encodeURIComponent(`Portfolio message from ${name}`);
  const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);

  formStatus.textContent = "Your letter is ready — opening your email app…";
  window.location.href = `mailto:Resitisaoglu@gmail.com?subject=${subject}&body=${body}`;
});
