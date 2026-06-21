export function displayDialogue(text, onDisplayEnd) {
    const dialogueUI = document.getElementById('textbox-container');
    const dialogue = document.getElementById('dialog');
    const closeBtn = document.getElementById('close');

    dialogueUI.style.display = 'block';

    let index = 0;
    let currentText = '';
    let isClosed = false;
    const intervalRef = setInterval(() => {
        if (index < text.length) {
            currentText += text[index];
            dialogue.innerHTML = currentText;
            index++;
            return;
        }
        clearInterval(intervalRef);
    }, 5);

    function closeDialogue() {
        if (isClosed) return;

        isClosed = true;
        dialogueUI.style.display = 'none';
        dialogue.innerHTML = '';
        clearInterval(intervalRef);
        closeBtn.removeEventListener('click', closeDialogue);
        onDisplayEnd();
    }

    closeBtn.addEventListener('click', closeDialogue);
    return closeDialogue;
}
export function setCamScale(k) {
    const resizeFactor = k.width() / k.height() ;
    if (resizeFactor < 1) {
        k.camScale(k.vec2(1));
        return;
    
    };
    k.camScale(k.vec2( 1.2));
    
    
}
