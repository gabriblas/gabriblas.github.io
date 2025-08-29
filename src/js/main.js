import * as bootstrap from 'bootstrap';
import { makePreview, getOptions, updatePDF, makePdf, downloadPDF, stopProcessing } from './volontqr';
import { setTheme, toggleTheme } from './theme';
import { textarea, render, syncScroll } from './textEditor';

window.addEventListener('load', () => {
    setTheme();
    makePreview();

    // Init tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

document.getElementById("themeToggle").addEventListener("click", toggleTheme);

textarea.addEventListener('input', render);
textarea.addEventListener('scroll', syncScroll);
window.addEventListener('load', () => { render(); syncScroll(); });

document.getElementById('bgInput').addEventListener("change", makePreview);
document.getElementById('qrSize').addEventListener("change", makePreview);
document.getElementById('posX').addEventListener("change", makePreview);
document.getElementById('posY').addEventListener("change", makePreview);
document.getElementById('rotation').addEventListener("change", makePreview);
document.getElementById('fgColorAlpha').addEventListener("change", makePreview);
document.getElementById('fgColor').addEventListener("change", makePreview);
document.getElementById('bgColorAlpha').addEventListener("change", makePreview);
document.getElementById('bgColor').addEventListener("change", makePreview);
document.getElementById('ecLevel').addEventListener("change", makePreview);
document.getElementById('bgInput').addEventListener('change', async () => { updatePDF(); makePreview(); });


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

document.getElementById("stopBtn").addEventListener("click", stopProcessing);