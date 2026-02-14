//  TO DO
//  2. $txt color contrast
//  3. kill references to document.getElementById() - $breathCircle

let $inhaleSec = null
let $duration = null
let $playTone = null
let $playVoice = null
let $playBar = null
let $volume = null
let $txt = null
let $breathCircle = null
let $timers = null

function Player () {
    // let...
    let counter = 1
    return {
        // methods go here
        get() {
            return counter
        },
        inc() {
            counter++
        }
    }
}

$(document).ready(() =>
    $(document.body).append(
        $("<div>")
            .append(
                $("<p>")
                    .html("Seconds per inhale/exhale (sec): ")
                    .append(
                        $inhaleSec = $("<input>", {
                            id: "inhalesec",
                            type: "number",
                            value: 5
                        })
                    )
            ),
        $("<div>")
            .append(
                $("<p>")
                    .html("Length of practice (minutes): ")
                    .append(
                        $duration = $("<input>", {
                            id: "duration",
                            type: "number",
                            value: 90
                        })
                    )
            ),
        $("<div>")
            .append(
                $("<p>")
                    .append(
                        $playTone = $("<input>", {
                            type: "checkbox",
                            id: "tones",
                            checked: false
                        })
                    )
                    .append(" Play tones")
            ),
        $("<div>")
            .append(
                $("<p>")
                    .append(
                        $playVoice = $("<input>", {
                            type: "checkbox",
                            id: "voice",
                            checked: false
                        })
                    )
                    .append(" Play voice")
            ),
        $("<div>")
            .append(
                $("<p>")
                    .append(
                        $playBar = $("<input>", {
                            type: "checkbox",
                            id: "bar",
                            checked: true
                        })
                    )
                    .append(" Progress circle")
            ),
        $("<div>")
            .append(
                $("<p>")
                    .html("Volume")
                    .append(
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
        $("<div>")
            .append(
                $("<button>")
                    .html("Start Timer")
                    .on("click", () => breathe()))
            .append(
                $("<button>")
                    .html("Stop Timer")
                    .on("click", () => {
                        // console.log("stop")
                        clearInterval($timers[0])
                        clearInterval($timers[1])
                        clearTimeout($timers[2])
                        clearTimeout($timers[3])
                        clearTimeout($timers[4])
                        $breathCircle.css("animation-name", "none")
                        $txt.text("")
                    })
            ),
        $("<div>", {
            id: "breathProgressCircle"
        })
            .append(
                $breathCircle = $("<div>", {
                    id: "breathCircle"
                }),
                $txt = $("<div>", {
                    id: "txt"
                })
            )
        ))

function breathe() {
    const inhaleSec = $inhaleSec.val()
    const duration = $duration.val()

    const cycle = 2 * inhaleSec * 1000; // ms for a full breath cycle
    const duration_ms = duration * 60 * 1000

    $timers = []  // create separate inhale and exhale timers

    // initiate breathing before setInterval kicks in
    $timers[2] = setTimeout(() => command("inhale", cycle), 0)
    $timers[3] = setTimeout(() => command("exhale", cycle), cycle / 2)

    // inhale timer on cycle
    $timers[0] = setInterval(() => command("inhale", cycle), cycle)

    $timers[4] = setTimeout(() => {  // delays exhale timer by half a cycle

        // exhale timer
        $timers[1] = setInterval(() => command("exhale", cycle), cycle)
        
        // clear timers.  
        // Position here to make sure there are available timer IDs
        setTimeout(() => {
            clearInterval($timers[0])
            clearInterval($timers[1])
        }, duration_ms)

    }, cycle / 2)
}

function say({
        voice = 10,
        voiceURI = "native", 
        volume = 0.5,
        rate = 1.0,
        pitch = 0.8,
        m = "Hello world.",
        lang = "en-US"
    }) {
        var voices = window.speechSynthesis.getVoices();
        speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(), {
            voice: voices[voice],  // en has 1, 10, 17
            voiceURI: voiceURI,
            volume: volume,
            rate: rate,
            pitch: pitch,
            text: m,
            lang: lang
    }))
}

function beep({
    duration = 125, //duration of the tone in milliseconds. Default is 500
    frequency = 500, //frequency of the tone in hertz. default is 440
    volume = 0.5, //volume of the tone. Default is 1, off is 0.
    type = "triangle", //type of tone. Possible values are sine, square, sawtooth, triangle, and custom. Default is sine.
    callback = () => console.log("callback test") //callback to use on end of tone
    }) {
    var audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);
    var oscillator = audioCtx.createOscillator()
    var gainNode = audioCtx.createGain()

    gainNode.connect(audioCtx.destination)
    gainNode.gain.value = volume

    oscillator.connect(gainNode)
    oscillator.frequency.value = frequency
    oscillator.type = type
    oscillator.onended = callback
    oscillator.start()

    setTimeout(() => oscillator.stop(), duration)
}



function command(message, cycle) {
    const playTone = $playTone.prop("checked")
    const playVoice = $playVoice.prop("checked")
    const playBar = $playBar.prop("checked")
    const volume = $volume.val()

    $txt.text(message)

    if (playTone) {
        if (message === "inhale") {
            beep({ frequency: 1000, volume: volume })
        } else {
            beep({ volume: volume })
        }
    }

    if (playVoice) {
        if (message === "inhale") {
            say({ m: "Inhale." })
        } else {
            say({ m: "Exhale." })
        }
    }

    if (playBar) {
        // move(message, cycle)
        moveCircle(message, cycle)
    }

}

function moveCircle(message, cycle) {
    // const elem = document.getElementById("breathCircle")
    // const elem = $("#breathCircle")
    // const elem = $breathCircle
    $breathCircle.css("animation-duration", cycle / 2 + "ms")
    $breathCircle.css("animation-name", {
        inhale: "inhaleCircle",
        exhale: "exhaleCircle"
    }[message] || console.error("invalid message: " + message))
}