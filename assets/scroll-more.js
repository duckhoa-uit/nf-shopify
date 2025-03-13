document.addEventListener("DOMContentLoaded", () => {
  const scrollMoreLinks = document.querySelectorAll("[data-scroll_more]");

  scrollMoreLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSelector = link.getAttribute("data-scroll_more");
      const targetElement = document.querySelector(targetSelector);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
});
