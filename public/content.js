console.log("content.js loaded");

window.addEventListener("load", () => {
    const problemSelector = ".problem";
    const inputSelector   = "input.answer";

    let lastPrompt   = "";
    let lastAnswer   = "";
    let promptStart = Date.now();
    let keystrokes   = [];   // array to record each key event

    let sessionAttempts = [];
    let sessionStartTs  = Date.now();
    let sessionActive   = true;

    const getProblem = () => document.querySelector(problemSelector);
    const getInput   = () => document.querySelector(inputSelector);

    function attachInputListener() {
        const inputEl = getInput();
        if (!inputEl) return;

        keystrokes = [];

        inputEl.addEventListener("input", (e) => {
            const now = Date.now();
            const key = e.data === null ? "Backspace" : e.data;
            keystrokes.push({
                key,
                ts: now,
                delta: now - promptStart,
                value: inputEl.value
            });
            lastAnswer = inputEl.value;
        });
    }
    attachInputListener();

    new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (
                    node instanceof HTMLElement &&
                    node.matches(inputSelector)
                ) {
                    attachInputListener();
                }
            }
        }

        const probEl = getProblem();
        if (!probEl) return;
        const current = probEl.textContent.trim();

        if (current && current !== lastPrompt) {
            if (lastPrompt) {
                const now = Date.now();
                const [rawA, opSymbol, rawB] = lastPrompt.split(" ");
                const op = opSymbol === "×" ? "mul"
                        : opSymbol === "÷" ? "div"
                        : opSymbol === "+" ? "add"
                        : "sub";
                const a = Number(rawA), b = Number(rawB);
                const digits = [rawA.length, rawB.length];
                const numErrors = keystrokes.filter(k => k.key === "Backspace").length;

                const attempt = {
                    prompt:     lastPrompt,
                    op,
                    operands:   [a, b],
                    digits,
                    answer:     lastAnswer,
                    keystrokes,
                    numErrors,
                    startTs:    promptStart,
                    endTs:      now
                };

                sessionAttempts.push(attempt);
            }
            console.log("New prompt:", current);
            lastPrompt = current;
            lastAnswer = "";
            promptStart = Date.now();
        }
    }).observe(document.body, {
        childList: true,
        subtree:   true
    });

    const timerSelector = "#game .left";
    const getTimer = () => document.querySelector(timerSelector);

    const checkSessionEnd = () => {
        const timerEl = getTimer();
        if (!timerEl || !sessionActive) return;
        
        const match = timerEl.textContent.match(/\d+/);
        const remaining = match ? parseInt(match[0], 10) : NaN;
        if (remaining === 0) {
            
            sessionActive = false;
            const endTs = Date.now();
            const session = { startTs: sessionStartTs, endTs, attempts: sessionAttempts };
            chrome.storage.local.get({ sessions: [] }, (res) => {
                const sarr = res.sessions;
                sarr.push(session);
                chrome.storage.local.set({ sessions: sarr });
            });
        }
    };
    setInterval(checkSessionEnd, 500);

    window.addEventListener("beforeunload", () => {
        sessionActive = false;
        sessionAttempts = [];
    });
});