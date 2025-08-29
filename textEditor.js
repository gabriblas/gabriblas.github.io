const editor = document.getElementById('linksEditor');
const textarea = editor.querySelector('#links');
const highlights = editor.querySelector('.highlights');
const gutter = editor.querySelector('.gutter');

function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function isValidHttpUrl(s) {
    s = s.trim();
    if (!s) return true; // empty line are easily discarded later
    try {
        const u = new URL(s);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

function render() {
    const value = textarea.value.replace(/\r\n/g, '\n');
    const lines = value.split('\n');

    // Line numbers
    gutter.textContent = lines.map((_, i) => i + 1).join('\n');

    // Highlights per line
    let anyInvalid = false;
    const html = lines.map(line => {
        const valid = isValidHttpUrl(line);
        if (!valid && line.trim() !== '') anyInvalid = true;
        const display = line === '' ? ' ' : line; // keep line height for blanks
        return `<div class="line ${valid ? 'valid' : 'invalid'}">${escapeHtml(display)}</div>`;
    }).join('');
    highlights.innerHTML = html;

    // Toggle overall invalid styling
    editor.classList.toggle('invalid', anyInvalid);
}

function syncScroll() {
    highlights.scrollTop = textarea.scrollTop;
    highlights.scrollLeft = textarea.scrollLeft; // horizontal sync
    gutter.scrollTop = textarea.scrollTop;
}

textarea.addEventListener('input', render);
textarea.addEventListener('scroll', syncScroll);
window.addEventListener('load', () => { render(); syncScroll(); });