let $inhaleSec = null;
let $duration = null;
let $playTone = null;
let $playVoice = null;
let $playBar = null;
let $volume = null;
let $txt = null;
let $status = null;
let $startBtn = null;
let $stopBtn = null;
let $breathCircle = null;
let $timers = null;
let audioCtx = null;
let preferredVoice = null;

$(document).ready(() => {
    $(document.body).append(
        $("<main>", { class: "app-shell" }).append(
            $("<section>", { class: "panel controls" }).append(
                $("<h1>").text("Breathing Timer"),
                $("<p>", { class: "subtitle" }).text("Set your pace, then follow inhale and exhale prompts."),
                $("<div>", { class: "field-grid" }).append(
                    $("<label>", { class: "field" }).append(
                        $("<span>", { class: "field-label" }).text("Seconds per inhale/exhale"),
                        $inhaleSec = $("<input>", {
                            id: "inhalesec",
                            type: "number",
                            min: 1,
                            step: 1,
                            value: 5
                        })
                    ),
                    $("<label>", { class: "field" }).append(
                        $("<span>", { class: "field-label" }).text("Session length (minutes)"),
                        $duration = $("<input>", {
                            id: "duration",
                            type: "number",
                            min: 1,
                            step: 1,
                            value: 20
                        })
                    ),
                    $("<label>", { class: "field" }).append(
                        $("<span>", { class: "field-label" }).text("Tone volume"),
                        $volume = $("<input>", {
                            type: "range",
                            id: "volSlide",
                            min: 0.0,
                            max: 1.0,
                            step: 0.01,
                            value: 0.5,
                            class: "slider"
                        })
                    )
                ),
                $("<div>", { class: "toggle-grid" }).append(
                    toggleControl("tones", "Play tones", false, el => $playTone = el),
                    toggleControl("voice", "Play voice", false, el => $playVoice = el),
                    toggleControl("bar", "Animate circle", true, el => $playBar = el)
                ),
                $("<div>", { class: "actions" }).append(
                    $startBtn = $("<button>", { class: "btn start" })
                        .text("Start")
                        .on("click", () => breathe()),
                    $stopBtn = $("<button>", { class: "btn stop", disabled: true })
                        .text("Stop")
                        .on("click", () => stopSession({ statusText: "Stopped." }))
                ),
                $status = $("<p>", { class: "status" }).text("Ready.")
            ),
            $("<section>", { class: "panel stage" }).append(
                $("<div>", { id: "breathProgressCircle" }).append(
                    $breathCircle = $("<div>", { id: "breathCircle" }),
                    $txt = $("<div>", { id: "txt" }).text("ready")
                )
            )
        )
    );

    primeVoiceSelection();
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
            primeVoiceSelection();
        };
    }
});

function toggleControl(id, label, checked, assignRef) {
    const $input = $("<input>", {
        type: "checkbox",
        id: id,
        checked: checked
    });

    assignRef($input);

    return $("<label>", { class: "toggle", for: id }).append(
        $input,
        $("<span>").text(label)
    );
}

function breathe() {
    const inhaleSec = Number($inhaleSec.val());
    const durationMin = Number($duration.val());

    if (!Number.isFinite(inhaleSec) || inhaleSec <= 0 || !Number.isFinite(durationMin) || durationMin <= 0) {
        $status.text("Enter values greater than 0.");
        return;
    }

    stopSession({ keepPrompt: true, keepStatus: true, keepButtons: true });

    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    const cycle = inhaleSec * 2 * 1000;
    const durationMs = durationMin * 60 * 1000;

    $startBtn.prop("disabled", true);
    $stopBtn.prop("disabled", false);
    $status.text("Session running...");

    $timers = {
        firstInhale: setTimeout(() => command("inhale", cycle), 0),
        firstExhale: setTimeout(() => command("exhale", cycle), cycle / 2),
        inhaleInterval: setInterval(() => command("inhale", cycle), cycle),
        delayedExhaleInterval: setTimeout(() => {
            $timers.exhaleInterval = setInterval(() => command("exhale", cycle), cycle);
        }, cycle / 2),
        sessionEnd: setTimeout(() => {
            stopSession({ statusText: "Session complete.", promptText: "done" });
        }, durationMs)
    };
}

function stopSession({
    statusText = "Ready.",
    promptText = "ready",
    keepPrompt = false,
    keepStatus = false,
    keepButtons = false
} = {}) {
    if ($timers) {
        clearTimeout($timers.firstInhale);
        clearTimeout($timers.firstExhale);
        clearInterval($timers.inhaleInterval);
        clearTimeout($timers.delayedExhaleInterval);
        clearInterval($timers.exhaleInterval);
        clearTimeout($timers.sessionEnd);
        $timers = null;
    }

    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    if ($breathCircle) {
        $breathCircle.css("animation-name", "none");
    }

    if (!keepPrompt && $txt) {
        $txt.text(promptText);
    }

    if (!keepStatus && $status) {
        $status.text(statusText);
    }

    if (!keepButtons && $startBtn && $stopBtn) {
        $startBtn.prop("disabled", false);
        $stopBtn.prop("disabled", true);
    }
}

function pickBestEnglishVoice(voices) {
    const englishVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));
    if (!englishVoices.length) {
        return null;
    }

    const preferredNameHints = [
        "siri",
        "samantha",
        "ava",
        "allison",
        "karen",
        "moira",
        "daniel",
        "google us english",
        "google uk english female",
        "microsoft aria online",
        "microsoft jenny online",
        "jenny",
        "aria",
        "zira"
    ];

    const scoredVoices = englishVoices.map(voice => {
        const name = (voice.name || "").toLowerCase();
        const uri = (voice.voiceURI || "").toLowerCase();

        let score = 0;
        if (!voice.localService) {
            score += 4;
        }
        if (voice.default) {
            score += 2;
        }
        if (voice.lang.toLowerCase() === "en-us") {
            score += 1;
        }

        for (const hint of preferredNameHints) {
            if (name.includes(hint) || uri.includes(hint)) {
                score += 8;
                break;
            }
        }

        return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    return scoredVoices[0].voice;
}

function primeVoiceSelection() {
    if (!window.speechSynthesis) {
        return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) {
        return;
    }

    preferredVoice = pickBestEnglishVoice(voices);
}

function say({
    volume = 0.5,
    rate = 0.88,
    pitch = 1.0,
    m = "Hello world.",
    lang = "en-US"
}) {
    const synth = window.speechSynthesis;
    if (!synth) {
        return;
    }

    if (!preferredVoice) {
        primeVoiceSelection();
    }

    // Cancel queued prompts so speech stays clean and does not sound clipped/stacked.
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(m);
    const selectedVoice = preferredVoice || pickBestEnglishVoice(synth.getVoices());

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || lang;
    } else {
        utterance.lang = lang;
    }

    utterance.volume = volume;
    utterance.rate = rate;
    utterance.pitch = pitch;
    synth.speak(utterance);
}

function beep({
    duration = 130,
    frequency = 500,
    volume = 0.5,
    type = "triangle",
    callback = () => {}
}) {
    if (!audioCtx) {
        const Ctor = window.AudioContext || window.webkitAudioContext || window.audioContext;
        if (!Ctor) {
            return;
        }
        audioCtx = new Ctor();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    oscillator.onended = callback;
    oscillator.start();

    setTimeout(() => oscillator.stop(), duration);
}

function command(message, cycle) {
    const playTone = $playTone.prop("checked");
    const playVoice = $playVoice.prop("checked");
    const playBar = $playBar.prop("checked");
    const volume = Number($volume.val());

    $txt.text(message);

    if (playTone) {
        beep({
            frequency: message === "inhale" ? 960 : 480,
            volume: volume
        });
    }

    if (playVoice) {
        say({
            m: message === "inhale" ? "Breathe in." : "Breathe out.",
            volume: Math.min(volume + 0.2, 1)
        });
    }

    if (playBar) {
        moveCircle(message, cycle);
    } else {
        $breathCircle.css("animation-name", "none");
    }
}

function moveCircle(message, cycle) {
    $breathCircle.css("animation-duration", `${cycle / 2}ms`);
    $breathCircle.css("animation-name", {
        inhale: "inhaleCircle",
        exhale: "exhaleCircle"
    }[message] || "none");
}
