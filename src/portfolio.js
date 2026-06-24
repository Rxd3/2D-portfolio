const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const overlay = document.querySelector("[data-game-overlay]");
const closeHouseButton = document.querySelector("[data-close-house]");
const enterHouseButtons = document.querySelectorAll("[data-enter-house]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

let previousFocus = null;

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

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

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

