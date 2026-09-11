import {
    FaceLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

/* ============================================================
   0. EASILY EDITABLE SETTINGS
   ============================================================ */

const STORAGE_KEY = "blinkcart-state-v1";

const blinkRewards = [
    1,
    5,
    10,
    10,
    20,
    25,
    25,
    50
];

const BLINK = {
    closeThreshold: 0.19,
    openThreshold: 0.23,
    minClosedMs: 50,
    cooldownMs: 280
};

const MEDIAPIPE_WASM =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const FACE_MODEL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const LEFT_EYE = {
    outer: 33,
    inner: 133,
    top1: 159,
    top2: 158,
    bottom1: 145,
    bottom2: 153
};

const RIGHT_EYE = {
    outer: 362,
    inner: 263,
    top1: 386,
    top2: 385,
    bottom1: 374,
    bottom2: 380
};

const earnMessages = [
    "Your career in finance has begun.",
    "Passive income. Literally.",
    "Warren Buffett is worried.",
    "The hustle is blinking.",
    "Interest rates: your eyelids.",
    "GDP just twitched."
];

const purchaseMessages = [
    "Purchase successful. That was definitely necessary.",
    "Excellent financial decision. Probably.",
    "Congratulations. You own air. Or worse.",
    "Your wallet is crying.",
    "That was your money. You had it. Now you don't.",
    "Financial literacy has left the building."
];

const products = [
    {
        id: "invisible-potato",
        name: "Invisible Potato",
        price: 5,
        requiredBlinks: 5,
        icon: "🥔",
        description: "A potato you cannot see. Revolutionary. Completely invisible. Probably."
    },
    {
        id: "premium-air",
        name: "Premium Air",
        price: 25,
        requiredBlinks: 10,
        icon: "💨",
        description: "Regular air is free. This one has premium vibes."
    },
    {
        id: "imaginary-cat",
        name: "Imaginary Cat",
        price: 50,
        requiredBlinks: 15,
        icon: "🐈",
        description: "No fur. No feeding. No cat. Perfect pet."
    },
    {
        id: "firecrackers",
        name: "Firecrackers",
        price: 100,
        requiredBlinks: 20,
        icon: "🧨",
        description: "Loud, bright, and gone in two seconds. Just like your savings."
    },
    {
        id: "someones-attention",
        name: "Someone's Attention",
        price: 150,
        requiredBlinks: 25,
        icon: "👀",
        description: "Finally, something money can't buy. Except apparently it can."
    },
    {
        id: "nothing",
        name: "Nothing™",
        price: 500,
        requiredBlinks: 50,
        icon: "🕳️",
        description: "Literally nothing."
    }
];

/* ============================================================
   1. DOM ELEMENTS
   ============================================================ */

const els = {
    headerBalance: document.getElementById("headerBalance"),
    walletBalance: document.getElementById("walletBalance"),
    modePill: document.getElementById("modePill"),
    modeLabel: document.getElementById("modeLabel"),
    statBlinks: document.getElementById("statBlinks"),
    statEarned: document.getElementById("statEarned"),
    statSpent: document.getElementById("statSpent"),
    statPurchases: document.getElementById("statPurchases"),
    walletSarcasm: document.getElementById("walletSarcasm"),
    cameraStatus: document.getElementById("cameraStatus"),
    blinkCountDisplay: document.getElementById("blinkCountDisplay"),
    blinkPop: document.getElementById("blinkPop"),
    webcam: document.getElementById("webcam"),
    overlayCanvas: document.getElementById("overlayCanvas"),
    videoPlaceholder: document.getElementById("videoPlaceholder"),
    videoMessage: document.getElementById("videoMessage"),
    faceBanner: document.getElementById("faceBanner"),
    startCameraBtn: document.getElementById("startCameraBtn"),
    stopCameraBtn: document.getElementById("stopCameraBtn"),
    detectHint: document.getElementById("detectHint"),
    purchasePanel: document.getElementById("purchasePanel"),
    purchaseProductName: document.getElementById("purchaseProductName"),
    purchaseProgressLabel: document.getElementById("purchaseProgressLabel"),
    purchaseProgressBar: document.getElementById("purchaseProgressBar"),
    purchaseProgressFill: document.getElementById("purchaseProgressFill"),
    cancelPurchaseBtn: document.getElementById("cancelPurchaseBtn"),
    productGrid: document.getElementById("productGrid"),
    inventoryList: document.getElementById("inventoryList"),
    historyList: document.getElementById("historyList"),
    resetBtn: document.getElementById("resetBtn"),
    toast: document.getElementById("toast"),
    potatoCelebration: document.getElementById("potatoCelebration"),
    airCelebration: document.getElementById("airCelebration"),
    attentionScare: document.getElementById("attentionScare"),
    firecrackerCelebration: document.getElementById("firecrackerCelebration"),
    firecrackerVideo: document.getElementById("firecrackerVideo"),
    firstBlinkOverlay: document.getElementById("firstBlinkOverlay"),
    fundsOverlay: document.getElementById("fundsOverlay"),
    fundsBody: document.getElementById("fundsBody"),
    fundsDismissBtn: document.getElementById("fundsDismissBtn"),
    successOverlay: document.getElementById("successOverlay"),
    successTitle: document.getElementById("successTitle"),
    successBody: document.getElementById("successBody"),
    successDismissBtn: document.getElementById("successDismissBtn"),
    bankruptOverlay: document.getElementById("bankruptOverlay"),
    bankruptAssets: document.getElementById("bankruptAssets"),
    bankruptDismissBtn: document.getElementById("bankruptDismissBtn"),
    resetOverlay: document.getElementById("resetOverlay"),
    resetCancelBtn: document.getElementById("resetCancelBtn"),
    resetConfirmBtn: document.getElementById("resetConfirmBtn"),
    navToggle: document.querySelector(".nav-toggle"),
    mobileNav: document.getElementById("mobileNav")
};

/* ============================================================
   2. APPLICATION STATE
   ============================================================ */

const state = {
    balance: 0,
    blinkCount: 0,
    totalEarned: 0,
    totalSpent: 0,
    purchaseCount: 0,
    inventory: {},
    history: [],
    mode: "normal",
    purchase: null
};

const runtime = {
    cameraOn: false,
    stream: null,
    landmarker: null,
    animationId: null,
    lastVideoTime: -1,
    eyeIsClosed: false,
    closedAt: 0,
    lastBlinkAt: 0,
    lastFaceStatus: "",
    lastUi: {},
    storageOk: true,
    firstBlinkShown: false
};

/* ============================================================
   12. LOCAL STORAGE
   ============================================================ */

function defaultPersistedState() {
    return {
        balance: 0,
        blinkCount: 0,
        totalEarned: 0,
        totalSpent: 0,
        purchaseCount: 0,
        inventory: {},
        history: []
    };
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            Object.assign(state, defaultPersistedState());
            return;
        }
        const saved = JSON.parse(raw);
        Object.assign(state, defaultPersistedState(), saved, {
            mode: "normal",
            purchase: null
        });
        if (!state.inventory || typeof state.inventory !== "object") {
            state.inventory = {};
        }
        if (!Array.isArray(state.history)) {
            state.history = [];
        }
    } catch (error) {
        runtime.storageOk = false;
        Object.assign(state, defaultPersistedState());
        showToast("Progress could not be loaded. This session will not be saved.");
    }
}

function saveState() {
    if (!runtime.storageOk) {
        return;
    }
    try {
        const payload = {
            balance: state.balance,
            blinkCount: state.blinkCount,
            totalEarned: state.totalEarned,
            totalSpent: state.totalSpent,
            purchaseCount: state.purchaseCount,
            inventory: state.inventory,
            history: state.history.slice(0, 80)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        runtime.storageOk = false;
        showToast("Saving is unavailable. Your blink fortune is temporary.");
    }
}

function resetState() {
    Object.assign(state, defaultPersistedState(), {
        mode: "normal",
        purchase: null
    });
    runtime.firstBlinkShown = false;
    try {
        localStorage.removeItem(STORAGE_KEY);
        runtime.storageOk = true;
    } catch (error) {
        runtime.storageOk = false;
    }
    exitPurchaseMode();
    renderAll();
}

/* ============================================================
   8. WALLET / REWARDS
   ============================================================ */

function getBlinkReward(blinkNumber) {
    const index = blinkNumber - 1;
    if (index < blinkRewards.length) {
        return blinkRewards[index];
    }
    const extraSteps = index - blinkRewards.length + 1;
    const lastReward = blinkRewards[blinkRewards.length - 1];
    return lastReward + extraSteps * 25;
}

function pickMessage(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function addHistory(entry) {
    state.history.unshift({
        ...entry,
        at: Date.now()
    });
    if (state.history.length > 80) {
        state.history.length = 80;
    }
}

function applyNormalBlink() {
    state.blinkCount += 1;
    const reward = getBlinkReward(state.blinkCount);
    state.balance += reward;
    state.totalEarned += reward;
    addHistory({
        type: "earn",
        label: "Blink #" + state.blinkCount,
        amount: reward
    });
    saveState();
    renderWallet();
    renderHistory();
    animateBlinkPop();
    els.walletSarcasm.textContent = "+₹" + reward + "  ·  " + pickMessage(earnMessages);
    showToast("BLINK #" + state.blinkCount + "  +₹" + reward);

    if (state.blinkCount === 1 && !runtime.firstBlinkShown) {
        runtime.firstBlinkShown = true;
        showFirstBlinkCelebration();
    }
}

function animateBlinkPop() {
    els.blinkPop.hidden = false;
    els.blinkCountDisplay.classList.remove("pulse");
    void els.blinkCountDisplay.offsetWidth;
    els.blinkCountDisplay.classList.add("pulse");
    window.setTimeout(function () {
        els.blinkPop.hidden = true;
    }, 700);
}

function showFirstBlinkCelebration() {
    els.firstBlinkOverlay.hidden = false;
    window.setTimeout(function () {
        els.firstBlinkOverlay.hidden = true;
    }, 2400);
}

/* ============================================================
   9. PURCHASE MODE
   ============================================================ */

function startPurchase(product) {
    if (state.mode === "purchase") {
        showToast("Finish this purchase first. Or cancel it, coward.");
        return;
    }
    if (state.balance < product.price) {
        showInsufficientFunds(product);
        return;
    }

    state.mode = "purchase";
    state.purchase = {
        productId: product.id,
        blinks: 0,
        required: product.requiredBlinks
    };

    resetEyeDetector();
    renderMode();
    renderPurchasePanel();
    document.getElementById("purchasePanel").scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Purchase mode. Blink " + product.requiredBlinks + " times. No salary this time.");
}

function applyPurchaseBlink() {
    if (state.mode !== "purchase" || !state.purchase) {
        return;
    }

    state.purchase.blinks += 1;
    renderPurchasePanel();
    animateBlinkPop();

    if (state.purchase.blinks >= state.purchase.required) {
        completePurchase();
    }
}

function completePurchase() {
    const product = products.find(function (item) {
        return item.id === state.purchase.productId;
    });

    if (!product) {
        exitPurchaseMode();
        showToast("That product vanished. Fitting.");
        return;
    }

    if (state.balance < product.price) {
        showInsufficientFunds(product);
        exitPurchaseMode();
        return;
    }

    state.balance -= product.price;
    state.totalSpent += product.price;
    state.purchaseCount += 1;
    state.inventory[product.id] = (state.inventory[product.id] || 0) + 1;
    addHistory({
        type: "spend",
        label: "Purchased " + product.name,
        amount: product.price
    });
    saveState();

    const authorizedBlinks = product.requiredBlinks;
    exitPurchaseMode();
    renderAll();

    els.walletSarcasm.textContent = pickMessage(purchaseMessages);
    showSuccess(product, authorizedBlinks);

    if (product.id === "invisible-potato") {
        celebratePotatoPurchase();
    }

    if (product.id === "premium-air") {
        celebrateAirPurchase();
    }

    if (product.id === "imaginary-cat") {
        playCatPurchaseSound();
    }

    if (product.id === "firecrackers") {
        celebrateFirecrackerPurchase();
    }

    if (product.id === "someones-attention") {
        celebrateAttentionPurchase();
    }

    if (state.balance === 0) {
        window.setTimeout(showBankruptcy, 700);
    }
}

function exitPurchaseMode() {
    state.mode = "normal";
    state.purchase = null;
    resetEyeDetector();
    renderMode();
    renderPurchasePanel();
}

function cancelPurchase() {
    exitPurchaseMode();
    showToast("Purchase cancelled. Your money lives another blink.");
}

function showInsufficientFunds(product) {
    els.fundsBody.innerHTML =
        "You need ₹" + product.price + ".<br>You have ₹" + state.balance + ".<br><br>Maybe blink more.";
    els.fundsOverlay.hidden = false;
}

function showSuccess(product, blinks) {
    els.successTitle.textContent = "You now own " + product.name.toLowerCase() + ".";
    els.successBody.innerHTML =
        blinks + " blinks detected.<br>₹" + product.price + " deducted.<br><br>Congratulations.";
    els.successOverlay.hidden = false;
}

/* Isolated from blink/webcam: own nodes, own CSS timers, no shared runtime. */
const potatoFx = {
    hideTimer: 0,
    cartTimer: 0,
    headlineTimer: 0,
    cleanupTimer: 0
};

function clearPotatoFxTimers() {
    window.clearTimeout(potatoFx.hideTimer);
    window.clearTimeout(potatoFx.cartTimer);
    window.clearTimeout(potatoFx.headlineTimer);
    window.clearTimeout(potatoFx.cleanupTimer);
}

function celebratePotatoPurchase() {
    const root = els.potatoCelebration;
    if (!root) {
        return;
    }

    const layer = root.querySelector(".potato-flight-layer");
    const cart = root.querySelector(".potato-cart");
    const headline = root.querySelector("strong");
    if (!layer || !cart || !headline) {
        return;
    }

    clearPotatoFxTimers();
    while (layer.firstChild) {
        layer.removeChild(layer.firstChild);
    }

    root.classList.remove("is-celebrating");
    cart.classList.remove("is-popping");
    root.hidden = false;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reduceMotion ? 0 : 4 + Math.floor(Math.random() * 3);
    const paths = [
        { fromX: "-78px", fromY: "-46px", midX: "-18px", midY: "-22px", toX: "28px", toY: "18px", rot: "-26deg" },
        { fromX: "-42px", fromY: "-58px", midX: "8px", midY: "-16px", toX: "34px", toY: "20px", rot: "-8deg" },
        { fromX: "8px", fromY: "-52px", midX: "22px", midY: "-18px", toX: "36px", toY: "16px", rot: "14deg" },
        { fromX: "-96px", fromY: "-28px", midX: "-24px", midY: "-8px", toX: "26px", toY: "22px", rot: "-18deg" },
        { fromX: "36px", fromY: "-44px", midX: "30px", midY: "-12px", toX: "38px", toY: "18px", rot: "22deg" },
        { fromX: "-58px", fromY: "-38px", midX: "4px", midY: "-6px", toX: "32px", toY: "21px", rot: "6deg" }
    ];
    const flightMs = 600;
    const staggerMs = 48;
    const lastLandMs = count === 0 ? 80 : (count - 1) * staggerMs + flightMs;

    for (let i = 0; i < count; i += 1) {
        const path = paths[i];
        const spud = document.createElement("span");
        spud.className = "potato-flyer";
        spud.textContent = "🥔";
        spud.setAttribute("aria-hidden", "true");
        spud.style.setProperty("--from-x", path.fromX);
        spud.style.setProperty("--from-y", path.fromY);
        spud.style.setProperty("--mid-x", path.midX);
        spud.style.setProperty("--mid-y", path.midY);
        spud.style.setProperty("--to-x", path.toX);
        spud.style.setProperty("--to-y", path.toY);
        spud.style.setProperty("--from-rot", path.rot);
        spud.style.animationDuration = flightMs + "ms";
        spud.style.animationDelay = i * staggerMs + "ms";
        spud.addEventListener("animationend", function onPotatoFlyEnd(event) {
            if (event.animationName !== "potatoFlyToCart") {
                return;
            }
            if (spud.parentNode) {
                spud.parentNode.removeChild(spud);
            }
        });
        layer.appendChild(spud);
    }

    potatoFx.cartTimer = window.setTimeout(function () {
        cart.classList.add("is-popping");
    }, count === 0 ? 0 : flightMs);

    potatoFx.headlineTimer = window.setTimeout(function () {
        headline.classList.add("is-headline-in");
    }, lastLandMs);

    potatoFx.cleanupTimer = window.setTimeout(function () {
        while (layer.firstChild) {
            layer.removeChild(layer.firstChild);
        }
    }, Math.min(1180, lastLandMs + 80));

    potatoFx.hideTimer = window.setTimeout(function () {
        root.hidden = true;
        root.classList.remove("is-celebrating");
        cart.classList.remove("is-popping");
        headline.classList.remove("is-headline-in");
        while (layer.firstChild) {
            layer.removeChild(layer.firstChild);
        }
    }, 1200);

    window.requestAnimationFrame(function () {
        root.classList.add("is-celebrating");
    });
}

/* Isolated from blink/webcam and potato celebration. */
const airFx = {
    holdTimer: 0,
    hideTimer: 0
};

const AIR_HOLD_MS = 10000;
const AIR_FADE_MS = 640;

function clearAirFxTimers() {
    window.clearTimeout(airFx.holdTimer);
    window.clearTimeout(airFx.hideTimer);
}

function hideAirCelebration() {
    const root = els.airCelebration;
    if (!root) {
        return;
    }
    root.hidden = true;
    root.classList.remove("is-visible", "is-leaving");
}

function celebrateAirPurchase() {
    const root = els.airCelebration;
    if (!root) {
        return;
    }

    clearAirFxTimers();
    root.hidden = false;
    root.classList.remove("is-leaving", "is-visible");

    window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
            root.classList.add("is-visible");
        });
    });

    airFx.holdTimer = window.setTimeout(function () {
        root.classList.remove("is-visible");
        root.classList.add("is-leaving");
        airFx.hideTimer = window.setTimeout(hideAirCelebration, AIR_FADE_MS);
    }, AIR_HOLD_MS);
}

/* Isolated from blink/webcam, potato, and air celebrations. */
/* Sound file: mixkit-sweet-kitty-meow-93.wav (project root, next to index.html). */
function playCatPurchaseSound() {
    try {
        const meow = new Audio("mixkit-sweet-kitty-meow-93.wav");
        meow.loop = false;
        const playResult = meow.play();
        if (playResult && typeof playResult.catch === "function") {
            playResult.catch(function () {
                /* autoplay blocked or file missing — fail silently */
            });
        }
    } catch (error) {
        /* fail silently, do not break purchase flow */
    }
}

/* Isolated from blink/webcam, potato, air, cat, and attention effects. */
/* Video file: firecrackers-burst.mp4 · Sound file: firecracker-burst.mp3 (project root). */
const firecrackerFx = {
    hideTimer: 0
};

const FIRECRACKER_HOLD_MS = 1900;
const FIRECRACKER_HIDE_MS = 200;

function clearFirecrackerFxTimers() {
    window.clearTimeout(firecrackerFx.hideTimer);
}

function hideFirecrackerCelebration() {
    const root = els.firecrackerCelebration;
    if (!root) {
        return;
    }
    root.hidden = true;
    root.classList.remove("is-visible");
    if (els.firecrackerVideo) {
        els.firecrackerVideo.pause();
        els.firecrackerVideo.currentTime = 0;
    }
}

function playFirecrackerBurstSound() {
    try {
        const burst = new Audio("firecracker-burst.mp3");
        burst.loop = false;
        burst.volume = 0.9;
        const playResult = burst.play();
        if (playResult && typeof playResult.catch === "function") {
            playResult.catch(function () {
                /* autoplay blocked or file missing — fail silently */
            });
        }
    } catch (error) {
        /* fail silently, do not break purchase flow */
    }
}

function celebrateFirecrackerPurchase() {
    const root = els.firecrackerCelebration;
    if (!root) {
        return;
    }

    clearFirecrackerFxTimers();
    root.classList.remove("is-visible");
    root.hidden = false;

    playFirecrackerBurstSound();

    if (els.firecrackerVideo) {
        els.firecrackerVideo.currentTime = 0;
        const playResult = els.firecrackerVideo.play();
        if (playResult && typeof playResult.catch === "function") {
            playResult.catch(function () {
                /* autoplay blocked — video stays hidden gracefully */
            });
        }
    }

    window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
            root.classList.add("is-visible");
        });
    });

    firecrackerFx.hideTimer = window.setTimeout(function () {
        root.classList.remove("is-visible");
        window.setTimeout(hideFirecrackerCelebration, FIRECRACKER_HIDE_MS);
    }, FIRECRACKER_HOLD_MS);
}

/* Isolated from blink/webcam, potato, air, and cat purchase effects. */
/* Sound file: horror-stinger.wav (project root, next to index.html). */
function playAttentionScareSound() {
    try {
        const stinger = new Audio("horror-stinger.wav");
        stinger.loop = false;
        stinger.volume = 0.85;
        const playResult = stinger.play();
        if (playResult && typeof playResult.catch === "function") {
            playResult.catch(function () {
                /* autoplay blocked or file missing — fail silently */
            });
        }
    } catch (error) {
        /* fail silently, do not break purchase flow */
    }
}

const attentionFx = {
    holdTimer: 0,
    hideTimer: 0
};

const ATTENTION_HOLD_MS = 3200;
const ATTENTION_HIDE_MS = 180;

function clearAttentionFxTimers() {
    window.clearTimeout(attentionFx.holdTimer);
    window.clearTimeout(attentionFx.hideTimer);
}

function hideAttentionScare() {
    const root = els.attentionScare;
    if (!root) {
        return;
    }
    root.hidden = true;
    root.classList.remove("is-visible");
}

function celebrateAttentionPurchase() {
    const root = els.attentionScare;
    if (!root) {
        return;
    }

    clearAttentionFxTimers();
    root.classList.remove("is-visible");
    root.hidden = false;

    playAttentionScareSound();

    window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
            root.classList.add("is-visible");
        });
    });

    attentionFx.holdTimer = window.setTimeout(function () {
        root.classList.remove("is-visible");
        attentionFx.hideTimer = window.setTimeout(hideAttentionScare, ATTENTION_HIDE_MS);
    }, ATTENTION_HOLD_MS);
}

function showBankruptcy() {
    const owned = products
        .filter(function (product) {
            return state.inventory[product.id];
        })
        .map(function (product) {
            return "• " + product.name;
        });

    if (owned.length === 0) {
        owned.push("• Absolutely nothing");
    } else if (!owned.some(function (line) {
        return line.indexOf("Nothing") !== -1;
    })) {
        owned.push("• Absolutely nothing");
    }

    els.bankruptAssets.innerHTML = "Your assets:<br><br>" + owned.join("<br>");
    els.bankruptOverlay.hidden = false;
}

/* ============================================================
   4–5. MEDIAPIPE + CAMERA
   ============================================================ */

async function initFaceLandmarker() {
    if (runtime.landmarker) {
        return runtime.landmarker;
    }

    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
    const options = {
        runningMode: "VIDEO",
        numFaces: 2
    };

    try {
        runtime.landmarker = await FaceLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: {
                modelAssetPath: FACE_MODEL,
                delegate: "GPU"
            }
        });
    } catch (gpuError) {
        runtime.landmarker = await FaceLandmarker.createFromOptions(fileset, {
            ...options,
            baseOptions: {
                modelAssetPath: FACE_MODEL,
                delegate: "CPU"
            }
        });
    }
    return runtime.landmarker;
}

async function startCamera() {
    if (runtime.cameraOn) {
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showVideoMessage("This browser cannot access a camera.<br>Try a recent Chrome, Edge, or Firefox.");
        return;
    }

    els.startCameraBtn.disabled = true;
    setCameraStatus("warn", "Starting camera…");

    try {
        await initFaceLandmarker();
    } catch (error) {
        els.startCameraBtn.disabled = false;
        setCameraStatus("danger", "Vision engine failed");
        showVideoMessage("Blink detection could not load.<br>Check your internet connection and refresh.");
        return;
    }

    try {
        runtime.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
    } catch (error) {
        els.startCameraBtn.disabled = false;
        setCameraStatus("danger", "Camera access denied");
        showVideoMessage("Camera access denied.<br><br>Please allow camera access to use Blinkcart.");
        return;
    }

    els.webcam.srcObject = runtime.stream;
    await els.webcam.play().catch(function () {
        return null;
    });

    runtime.cameraOn = true;
    runtime.lastVideoTime = -1;
    resetEyeDetector();
    els.videoPlaceholder.hidden = true;
    els.videoMessage.hidden = true;
    els.stopCameraBtn.hidden = false;
    els.startCameraBtn.disabled = false;
    setCameraStatus("active", "Camera Active");
    els.detectHint.textContent = "Look at the camera. Blink like you mean it.";
    loopDetection();
}

function stopCamera() {
    if (runtime.animationId) {
        cancelAnimationFrame(runtime.animationId);
        runtime.animationId = null;
    }

    if (runtime.stream) {
        runtime.stream.getTracks().forEach(function (track) {
            track.stop();
        });
        runtime.stream = null;
    }

    els.webcam.srcObject = null;
    runtime.cameraOn = false;
    resetEyeDetector();
    hideFaceBanner();
    els.videoPlaceholder.hidden = false;
    els.videoMessage.hidden = true;
    els.stopCameraBtn.hidden = true;
    setCameraStatus("idle", "Camera Off");
    els.detectHint.textContent = "Camera stays off until you start. That is the last responsible decision you will make here.";
}

function setCameraStatus(kind, text) {
    const className = kind === "idle" ? "status-dot idle" : "status-dot " + kind;
    els.cameraStatus.innerHTML =
        '<span class="' + className + '" aria-hidden="true"></span> ' + text;
}

function showVideoMessage(html) {
    els.videoPlaceholder.hidden = true;
    els.videoMessage.hidden = false;
    els.videoMessage.innerHTML = html;
}

function setFaceBanner(text) {
    if (runtime.lastFaceStatus === text) {
        return;
    }
    runtime.lastFaceStatus = text;
    els.faceBanner.hidden = !text;
    els.faceBanner.textContent = text;
}

function hideFaceBanner() {
    setFaceBanner("");
}

/* ============================================================
   6–7. FACE / EYE / BLINK DETECTION
   ============================================================ */

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

function eyeAspectRatio(landmarks, eye) {
    const vertical1 = distance(landmarks[eye.top1], landmarks[eye.bottom1]);
    const vertical2 = distance(landmarks[eye.top2], landmarks[eye.bottom2]);
    const horizontal = distance(landmarks[eye.outer], landmarks[eye.inner]);
    if (horizontal === 0) {
        return 1;
    }
    return (vertical1 + vertical2) / (2 * horizontal);
}

function averageEar(landmarks) {
    return (eyeAspectRatio(landmarks, LEFT_EYE) + eyeAspectRatio(landmarks, RIGHT_EYE)) / 2;
}

function resetEyeDetector() {
    runtime.eyeIsClosed = false;
    runtime.closedAt = 0;
}

function confirmBlink() {
    const now = performance.now();
    if (now - runtime.lastBlinkAt < BLINK.cooldownMs) {
        return;
    }
    runtime.lastBlinkAt = now;

    if (state.mode === "purchase") {
        applyPurchaseBlink();
        return;
    }

    applyNormalBlink();
}

function processEyeOpenness(ear) {
    const now = performance.now();

    if (!runtime.eyeIsClosed && ear <= BLINK.closeThreshold) {
        runtime.eyeIsClosed = true;
        runtime.closedAt = now;
        return;
    }

    if (runtime.eyeIsClosed && ear >= BLINK.openThreshold) {
        const closedFor = now - runtime.closedAt;
        runtime.eyeIsClosed = false;
        if (closedFor >= BLINK.minClosedMs) {
            confirmBlink();
        }
    }
}

function loopDetection() {
    if (!runtime.cameraOn || !runtime.landmarker) {
        return;
    }

    const video = els.webcam;
    if (video.readyState >= 2 && video.currentTime !== runtime.lastVideoTime) {
        runtime.lastVideoTime = video.currentTime;
        let result = null;
        try {
            result = runtime.landmarker.detectForVideo(video, performance.now());
        } catch (error) {
            setFaceBanner("Detection hiccup. Holding still.");
            runtime.animationId = requestAnimationFrame(loopDetection);
            return;
        }

        const faces = result.faceLandmarks || [];
        if (faces.length === 0) {
            resetEyeDetector();
            setFaceBanner("No face detected. Blinkcart cannot tax empty air.");
        } else if (faces.length > 1) {
            resetEyeDetector();
            setFaceBanner("⚠️ MULTIPLE FACES DETECTED  Please make sure only one person is in front of the camera.");
        } else {
            hideFaceBanner();
            processEyeOpenness(averageEar(faces[0]));
        }
    }

    runtime.animationId = requestAnimationFrame(loopDetection);
}

/* ============================================================
   13. UI RENDERING
   ============================================================ */

function rupees(amount) {
    return "₹" + amount;
}

function renderWallet() {
    const snapshot = [
        state.balance,
        state.blinkCount,
        state.totalEarned,
        state.totalSpent,
        state.purchaseCount
    ].join("|");

    if (runtime.lastUi.wallet === snapshot) {
        return;
    }
    runtime.lastUi.wallet = snapshot;

    els.headerBalance.textContent = rupees(state.balance);
    els.walletBalance.textContent = rupees(state.balance);
    els.statBlinks.textContent = String(state.blinkCount);
    els.statEarned.textContent = String(state.totalEarned);
    els.statSpent.textContent = String(state.totalSpent);
    els.statPurchases.textContent = String(state.purchaseCount);
    els.blinkCountDisplay.textContent = String(state.blinkCount);
}

function renderMode() {
    const purchase = state.mode === "purchase";
    els.modeLabel.textContent = purchase ? "PURCHASE MODE" : "NORMAL MODE";
    els.modePill.classList.toggle("purchase", purchase);
}

function renderPurchasePanel() {
    if (state.mode !== "purchase" || !state.purchase) {
        els.purchasePanel.hidden = true;
        return;
    }

    const product = products.find(function (item) {
        return item.id === state.purchase.productId;
    });
    const current = state.purchase.blinks;
    const required = state.purchase.required;
    const percent = required === 0 ? 0 : Math.min(100, Math.round((current / required) * 100));

    els.purchasePanel.hidden = false;
    els.purchaseProductName.textContent = product ? product.name.toUpperCase() : "PRODUCT";
    els.purchaseProgressLabel.textContent = "Blink " + current + " / " + required;
    els.purchaseProgressFill.style.width = percent + "%";
    els.purchaseProgressBar.setAttribute("aria-valuenow", String(percent));
}

function renderMarketplace() {
    els.productGrid.innerHTML = "";
    products.forEach(function (product) {
        const owned = state.inventory[product.id] || 0;
        const card = document.createElement("article");
        card.className = "card product-card";
        card.innerHTML =
            '<p class="product-icon" aria-hidden="true">' + product.icon + "</p>" +
            "<h3>" + product.name.toUpperCase() + "</h3>" +
            '<p class="desc">' + product.description + "</p>" +
            '<div class="price-row"><span>' + rupees(product.price) + "</span>" +
            "<span>👁️ " + product.requiredBlinks + " blinks required</span></div>" +
            (owned ? '<p class="owned-count">Owned ×' + owned + "</p>" : "") +
            '<button type="button" class="btn btn-primary buy-btn">BUY WITH BLINKS</button>';

        const button = card.querySelector(".buy-btn");
        button.setAttribute("aria-label", "Buy " + product.name + " with " + product.requiredBlinks + " blinks for " + rupees(product.price));
        button.addEventListener("click", function () {
            startPurchase(product);
        });
        els.productGrid.appendChild(card);
    });
}

function renderInventory() {
    const ownedProducts = products.filter(function (product) {
        return state.inventory[product.id] > 0;
    });

    if (ownedProducts.length === 0) {
        els.inventoryList.innerHTML =
            "<p class=\"empty-copy\">Nothing here yet.<br>Your financial destruction awaits.</p>";
        return;
    }

    const items = ownedProducts.map(function (product) {
        return "<li><span>" + product.icon + " " + product.name + "</span><span>×" +
            state.inventory[product.id] + "</span></li>";
    }).join("");
    els.inventoryList.innerHTML = '<ul class="inventory-list">' + items + "</ul>";
}

function renderHistory() {
    if (state.history.length === 0) {
        els.historyList.innerHTML = '<li class="empty-copy">No transactions. Your ledger is embarrassingly empty.</li>';
        return;
    }

    els.historyList.innerHTML = state.history.map(function (entry) {
        if (entry.type === "earn") {
            return "<li><span>" + entry.label + '</span><span class="credit">+₹' + entry.amount + "</span></li>";
        }
        return "<li><span>" + entry.label + '</span><span class="debit">-₹' + entry.amount + "</span></li>";
    }).join("");
}

function renderAll() {
    renderWallet();
    renderMode();
    renderPurchasePanel();
    renderMarketplace();
    renderInventory();
    renderHistory();
}

function showToast(message) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
        els.toast.hidden = true;
    }, 2600);
}

/* ============================================================
   14. EVENT LISTENERS
   ============================================================ */

function closeOverlays(except) {
    const overlays = [
        els.fundsOverlay,
        els.successOverlay,
        els.bankruptOverlay,
        els.resetOverlay
    ];
    overlays.forEach(function (overlay) {
        if (overlay !== except) {
            overlay.hidden = true;
        }
    });
}

els.startCameraBtn.addEventListener("click", startCamera);
els.stopCameraBtn.addEventListener("click", stopCamera);
els.cancelPurchaseBtn.addEventListener("click", cancelPurchase);
els.fundsDismissBtn.addEventListener("click", function () {
    els.fundsOverlay.hidden = true;
});
els.successDismissBtn.addEventListener("click", function () {
    els.successOverlay.hidden = true;
});
els.bankruptDismissBtn.addEventListener("click", function () {
    els.bankruptOverlay.hidden = true;
});
els.resetBtn.addEventListener("click", function () {
    els.resetOverlay.hidden = false;
});
els.resetCancelBtn.addEventListener("click", function () {
    els.resetOverlay.hidden = true;
});
els.resetConfirmBtn.addEventListener("click", function () {
    resetState();
    els.resetOverlay.hidden = true;
    showToast("Wiped. You are financially unborn again.");
});

els.navToggle.addEventListener("click", function () {
    const open = els.mobileNav.hasAttribute("hidden") === false;
    if (open) {
        els.mobileNav.hidden = true;
        els.navToggle.setAttribute("aria-expanded", "false");
        els.navToggle.setAttribute("aria-label", "Open menu");
    } else {
        els.mobileNav.hidden = false;
        els.navToggle.setAttribute("aria-expanded", "true");
        els.navToggle.setAttribute("aria-label", "Close menu");
    }
});

document.querySelectorAll(".nav a, .mobile-nav a, .brand").forEach(function (link) {
    link.addEventListener("click", function () {
        els.mobileNav.hidden = true;
        els.navToggle.setAttribute("aria-expanded", "false");
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeOverlays();
        if (state.mode === "purchase") {
            cancelPurchase();
        }
    }
});

window.addEventListener("pagehide", function () {
    stopCamera();
});

/* ============================================================
   15. INITIALIZATION
   ============================================================ */

loadState();
renderAll();

if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    showToast("Use a local server. Cameras dislike lonely HTML files.");
}
