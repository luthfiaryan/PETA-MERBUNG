let lightThemeBtn, darkThemeBtn;

window.addEventListener("DOMContentLoaded", () => {
  lightThemeBtn = document.getElementById("radio-light-theme");
  darkThemeBtn = document.getElementById("radio-dark-theme");

  lightThemeBtn.addEventListener("click", () => setTheme("light"));
  darkThemeBtn.addEventListener("click", () => setTheme("dark"));

  loadTheme();
});

function setTheme(theme) {
  const themeMap = {
    light: "mintlify",
    dark: "spotify",
  };
  document.documentElement.setAttribute(
    "data-theme",
    themeMap[theme] || "mintlify"
  );
  localStorage.setItem("theme", themeMap[theme] || "mintlify");
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "mintlify";
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (!lightThemeBtn || !darkThemeBtn) return;
  if (savedTheme === "spotify") {
    darkThemeBtn.checked = true;
  } else {
    lightThemeBtn.checked = true;
  }
}

loadTheme();
