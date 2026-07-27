export function displayDialogue(text, onDisplayEnd) {
    const dialogueUI = document.getElementById('textbox-container');
    const dialogue = document.getElementById('dialog');
    const closeBtn = document.getElementById('close');

    if (!dialogueUI || !dialogue || !closeBtn) {
        onDisplayEnd?.();
        return () => {};
    }

    dialogueUI.hidden = false;

    let isClosed = false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const intervalRef = prefersReducedMotion
        ? null
        : startTypewriter(text, dialogue);

    if (prefersReducedMotion) dialogue.innerHTML = text;
    closeBtn.focus({ preventScroll: true });

    function closeDialogue() {
        if (isClosed) return;

        isClosed = true;
        dialogueUI.hidden = true;
        dialogue.innerHTML = '';
        if (intervalRef) clearInterval(intervalRef);
        closeBtn.removeEventListener('click', closeDialogue);
        document.getElementById('game')?.focus({ preventScroll: true });
        onDisplayEnd?.();
    }

    closeBtn.addEventListener('click', closeDialogue);
    return closeDialogue;
}

function startTypewriter(markup, dialogue) {
    const template = document.createElement('template');
    const fragment = document.createDocumentFragment();
    const textQueue = [];

    template.innerHTML = markup;

    function cloneMarkup(source, target) {
        source.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const textNode = document.createTextNode('');
                target.append(textNode);
                textQueue.push({ node: textNode, text: node.textContent ?? '', index: 0 });
                return;
            }

            const clone = node.cloneNode(false);
            target.append(clone);
            cloneMarkup(node, clone);
        });
    }

    cloneMarkup(template.content, fragment);
    dialogue.replaceChildren(fragment);

    let queueIndex = 0;
    const intervalRef = setInterval(() => {
        const entry = textQueue[queueIndex];

        if (!entry) {
            clearInterval(intervalRef);
            return;
        }

        entry.node.textContent += entry.text[entry.index] ?? '';
        entry.index += 1;

        if (entry.index >= entry.text.length) queueIndex += 1;
    }, 5);

    return intervalRef;
}

export function setCamScale(k) {
    const resizeFactor = k.width() / k.height();
    if (resizeFactor < 1) {
        k.camScale(k.vec2(1));
        return;

    }
    k.camScale(k.vec2(1.2));
}
