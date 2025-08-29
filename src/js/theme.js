export { setTheme, toggleTheme };

function setTheme(theme = null) {
    if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-bs-theme', theme);
    if (theme == 'light') {
        document.getElementById("themeBtn").setAttribute('class', 'bi bi-sun-fill');
    } else {
        document.getElementById("themeBtn").setAttribute('class', 'bi bi-moon-stars');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-bs-theme');
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
}