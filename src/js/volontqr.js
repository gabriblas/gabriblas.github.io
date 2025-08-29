import { PDFDocument, rgb, degrees, degreesToRadians } from "pdf-lib";
import QRCode from "qrcode-svg";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
GlobalWorkerOptions.workerSrc = new URL('../../node_modules/pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

export { makePreview, makePdf, downloadPDF, updatePDF, getOptions, stopProcessing };

let bgPdf = null;
let interrupt = false;

function getOptions() {
    return {
        links: document.getElementById('links').value.split('\n').map(link => link.trim()).filter(link => link !== ''),
        fileName: document.getElementById("fileName").value || document.getElementById("fileName").placeholder,
        fgColor: parseColor(document.getElementById('fgColor').value),
        bgColor: parseColor(document.getElementById('bgColor').value),
        ecLevel: document.getElementById('ecLevel').value,
        posX: parseInt(document.getElementById('posX').value || document.getElementById("posX").placeholder),
        posY: parseInt(document.getElementById('posY').value || document.getElementById("posY").placeholder),
        qrSize: parseInt(document.getElementById('qrSize').value || document.getElementById("qrSize").placeholder),
        qrRot: degrees(parseInt(document.getElementById('rotation').value || document.getElementById("rotation").placeholder)),
        fgAlpha: document.getElementById("fgColorAlpha").checked ? 1 : 0,
        bgAlpha: document.getElementById("bgColorAlpha").checked ? 1 : 0,
        progress: document.getElementById("progressDone"),
    };
}

function parseColor(hexColor) {
    const bigint = parseInt(hexColor.substring(1), 16);
    let r = ((bigint >> 16) & 255) / 255;
    let g = ((bigint >> 8) & 255) / 255;
    let b = (bigint & 255) / 255;
    return rgb(r, g, b);
}

async function updatePDF() {
    let bgInput = document.getElementById('bgInput');
    if (bgInput.files.length == 0) return false;

    let pdf = null;
    const arrayBuffer = await bgInput.files[0].arrayBuffer();
    try {
        pdf = await PDFDocument.load(arrayBuffer);
        bgInput.classList.remove("is-invalid");
    } catch {
        bgInput.classList.add("is-invalid");
        return false;
    }
    bgPdf = pdf;
    return true;
}

function downloadPDF(pdfBytes, name) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function makeQR(content, ecLevel) {
    const svg = new QRCode({ content, padding: 4, width: 1, height: 1, ecl: ecLevel, join: true }).svg();
    const start = svg.indexOf('d="') + 3;
    const end = svg.indexOf('" /></svg>');
    return svg.substring(start, end);
}

async function makePdf(options) {
    if (!(await updatePDF())) return;

    // using embedded pages is more efficient (and fast!)
    const output = await PDFDocument.create();
    const [bgTemplate] = await output.copyPages(bgPdf, [0]);
    const bgEmbedded = await output.embedPage(bgTemplate);

    // transform center-based coords to top-left corner coords
    const alpha = degreesToRadians(options.qrRot.angle);
    const sin_a = Math.sin(alpha);
    const cos_a = Math.cos(alpha);
    const tx = options.posX + bgTemplate.getWidth() / 2 - options.qrSize / 2 * (cos_a + sin_a);
    const ty = options.posY + bgTemplate.getHeight() / 2 + options.qrSize / 2 * (cos_a - sin_a);

    // Process BATCH_SIZE links at a time in separate processes
    // This way, the UI can still be responsive while working
    const BATCH_SIZE = 8;
    for (let i = 0; i < options.links.length; i += BATCH_SIZE) {
        if (interrupt) {
            interrupt = false;
            return null;
        }

        let batch = options.links.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (link) => {
            const page = output.addPage([bgTemplate.getWidth(), bgTemplate.getHeight()]);
            page.drawPage(bgEmbedded);

            const path = makeQR(link, options.ecLevel);
            // background (rectangle)
            page.drawSvgPath("M0,0 H1 V1 H0 Z", {
                x: tx, y: ty, color: options.bgColor,
                opacity: options.bgAlpha, rotate: options.qrRot, scale: options.qrSize
            });
            // foreground
            page.drawSvgPath(path, {
                x: tx, y: ty, color: options.fgColor,
                opacity: options.fgAlpha, rotate: options.qrRot, scale: options.qrSize
            });
        }));

        if (options.progress) {
            const processed = Math.min(i + BATCH_SIZE, options.links.length);
            const percent = Math.round((processed / options.links.length) * 100);
            options.progress.style.width = percent + "%";
            options.progress.setAttribute("aria-valuenow", percent);
            options.progress.textContent = percent + "%";
            await new Promise(r => setTimeout(r, 0)); // update UI
        }
    }

    if (options.progress) {
        options.progress.setAttribute("aria-valuenow", "Preparo il download");
        options.progress.textContent = "Preparo il download...";
    }
    return await output.save();
}

async function makePreview() {
    const options = getOptions();
    options.links = ["ANTEPRIMA"];
    options.progress = null; // do not show progress bar
    const pdfBytes = await makePdf(options);
    if (pdfBytes == null) { return };

    document.getElementById("canvasContainer").removeAttribute("hidden");
    const canvas = document.getElementById("previewCanvas");
    const ctx = canvas.getContext("2d");
    const pdf = await getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });

    // Container size: scale to fit while keeping aspect ratio
    const containerWidth = canvas.parentElement.clientWidth;
    const containerHeight = 300; // todo: adapt to screen?
    const scale = Math.min(containerWidth / viewport.width, containerHeight / viewport.height);
    const scaledViewport = page.getViewport({ scale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
}

function stopProcessing() {
    interrupt = true;
}