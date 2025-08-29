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

window.addEventListener('load', () => {
    setTheme();
    makePreview();

    // Init tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-bs-theme');
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
}

document.getElementById('bgInput').addEventListener('change', async () => {
    bgPdf = await getPDF();
    makePreview();
});

document.getElementById('generateBtn').addEventListener('click', async () => {
    const options = getOptions();

    document.getElementById("downloadGroup").setAttribute("hidden", "");
    document.getElementById("progressGroup").classList.remove("d-none");
    document.getElementById("progressGroup").classList.add("d-flex");
    options.progress.style.width = "0%";
    options.progress.setAttribute("aria-valuenow", 0);

    const pdfBytes = await makePdf(options);
    options.progress.style.width = "100%";
    options.progress.setAttribute("aria-valuenow", 100);

    if (pdfBytes != null) {
        downloadPDF(pdfBytes, options.fileName);
    }

    document.getElementById("progressGroup").classList.remove("d-flex");
    document.getElementById("progressGroup").classList.add("d-none");
    document.getElementById("downloadGroup").removeAttribute("hidden");
});

document.getElementById('stopBtn').addEventListener('click', async () => { interrupt = true; });
