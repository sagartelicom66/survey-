import { isSurveyClosed, getSurveyStatus, mobileExists, saveResponse } from "./firebase.js";

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    welcome: "Welcome", continue: "Continue", back: "Back", next: "Next", submit: "Submit",
    startSurvey: "Start Survey", agreeText: "I agree to provide truthful information.",
    luckyDraw: "Lucky Draw 🎁", prize1: "₹99", prize2: "₹49",
    thankYou: "Thank You!", yourId: "Your Participant ID", keepId: "Please keep your Participant ID safe.",
    winnerAnnounced: "Winners will be announced after the survey closes.",
    surveyClosed: "Survey Closed", surveyClosedMsg: "We are no longer accepting responses. Thank you for your interest.",
    winnerSoon: "Winner announcement in", stayTuned: "Stay tuned!",
    questionOf: (a, b) => `Question ${a} of ${b}`,
    required: "This field is required.",
    mobileUsed: "This mobile number has already been used.",
    mobileInvalid: "Please enter a valid 10-digit mobile number.",
    speak: "🎤 Speak", stopRecording: "⏹ Stop", typeAnswer: "✍️ Type your answer...",
    introPoints: [
      "Your opinion is valuable.",
      "We are conducting a short survey to understand shopping experiences in our town.",
      "There are no right or wrong answers.",
      "Please answer honestly.",
      "Your information will remain confidential.",
      "The survey takes about 2–3 minutes."
    ],
    sections: { A: "About You", B: "Shopping Habits", C: "Experience", D: "Online Shopping", E: "Opinions" },
    questions: [
      // Section A
      { id: "name", section: "A", type: "text", label: "Name", required: true },
      { id: "mobile", section: "A", type: "tel", label: "Mobile Number", required: true },
      { id: "ageGroup", section: "A", type: "radio", label: "Age Group", required: true,
        options: ["Under 18", "18–25", "26–35", "36–45", "46–60", "60+"] },
      { id: "village", section: "A", type: "text", label: "Village / Area", required: true },
      { id: "purchaser", section: "A", type: "radio", label: "Who usually purchases household items?", required: true,
        options: ["Myself", "Spouse", "Parents", "Children", "Other"] },
      { id: "occupation", section: "A", type: "radio", label: "What do you do?", required: true,
        options: ["Student", "Employee", "Business", "Homemaker", "Other"] },
      // Section B
      { id: "shopFreq", section: "B", type: "radio", label: "How often do you shop?", required: true,
        options: ["Daily", "2–3 times a week", "Weekly", "Fortnightly", "Monthly"] },
      { id: "shopsVisited", section: "B", type: "text", label: "Which shops do you visit most?", required: false },
      { id: "itemsBought", section: "B", type: "checkbox", label: "What items do you usually buy?", required: true,
        options: ["Grocery", "Vegetables", "Fruits", "Dairy", "Bakery", "Stationery", "Cosmetics", "Clothing", "Electronics", "Other"] },
      { id: "monthlySpend", section: "B", type: "radio", label: "Approximately how much do you spend on shopping every month?", required: true,
        options: ["Under ₹500", "₹500–₹1000", "₹1000–₹3000", "₹3000–₹5000", "Above ₹5000"] },
      // Section C
      { id: "lastExperience", section: "C", type: "voice-text", label: "Tell us about your last shopping experience.", required: false },
      { id: "problems", section: "C", type: "checkbox-voice", label: "What problems do you usually face while shopping?", required: false,
        options: ["High prices", "Poor quality", "Unavailability of products", "Rude staff", "Long queues", "Far distance", "No home delivery", "Other"],
        followUp: { id: "problemsWhy", label: "Explain why.", type: "voice-text" } },
      { id: "urgentNeed", section: "C", type: "radio-followup", label: "Have you ever urgently needed something but couldn't get it?", required: true,
        options: ["Yes", "No"],
        followUp: { id: "urgentNeedDetail", label: "Tell us what happened.", type: "voice-text", showIf: "Yes" } },
      { id: "returnedEmpty", section: "C", type: "radio-followup", label: "Have you ever returned home because a shop didn't have the product you wanted?", required: true,
        options: ["Yes", "No"],
        followUp: { id: "returnedEmptyDetail", label: "Explain.", type: "voice-text", showIf: "Yes" } },
      { id: "multipleShops", section: "C", type: "radio-followup", label: "Have you ever visited multiple shops for one purchase?", required: true,
        options: ["Yes", "No"],
        followUp: { id: "multipleShopsWhy", label: "Tell us why.", type: "voice-text", showIf: "Yes" } },
      // Section D
      { id: "orderedOnline", section: "D", type: "radio-followup", label: "Have you ever ordered online?", required: true,
        options: ["Yes", "No"],
        followUp: { id: "onlineApps", label: "Which apps?", type: "text", showIf: "Yes" } },
      { id: "onlineLike", section: "D", type: "voice-text", label: "What did you like about ordering online? (If never ordered, why not?)", required: false },
      { id: "onlineDislike", section: "D", type: "voice-text", label: "What did you dislike about ordering online?", required: false },
      // Section E
      { id: "trustShop", section: "E", type: "voice-text", label: "What makes you trust a shop?", required: false },
      { id: "stopVisit", section: "E", type: "voice-text", label: "What makes you stop visiting a shop?", required: false },
      { id: "tryDelivery", section: "E", type: "voice-text", label: "What would encourage you to try home delivery from nearby shops?", required: false },
      { id: "deliveryCharge", section: "E", type: "radio", label: "What delivery charge feels reasonable?", required: false,
        options: ["Free", "₹10–₹20", "₹20–₹40", "₹40–₹60", "Above ₹60"] },
      { id: "improveOne", section: "E", type: "voice-text", label: "If you could improve ONE thing about shopping in your town, what would it be?", required: false },
      { id: "perfectExperience", section: "E", type: "voice-text", label: "Imagine your perfect shopping experience. Describe it.", required: false },
      { id: "suggestions", section: "E", type: "voice-text", label: "Any suggestions?", required: false }
    ]
  }
};

// Hindi translations
T.hi = {
  ...T.en,
  welcome: "स्वागत है", continue: "जारी रखें", back: "वापस", next: "आगे", submit: "जमा करें",
  startSurvey: "सर्वे शुरू करें", agreeText: "मैं सच्ची जानकारी देने के लिए सहमत हूँ।",
  luckyDraw: "लकी ड्रा 🎁",
  thankYou: "धन्यवाद!", yourId: "आपकी प्रतिभागी ID", keepId: "कृपया अपनी प्रतिभागी ID सुरक्षित रखें।",
  winnerAnnounced: "सर्वे बंद होने के बाद विजेताओं की घोषणा की जाएगी।",
  surveyClosed: "सर्वे बंद हो गया", surveyClosedMsg: "हम अब नए जवाब स्वीकार नहीं कर रहे। आपकी रुचि के लिए धन्यवाद।",
  winnerSoon: "विजेता घोषणा", stayTuned: "जुड़े रहें!",
  questionOf: (a, b) => `प्रश्न ${a} / ${b}`,
  required: "यह फ़ील्ड आवश्यक है।",
  mobileUsed: "यह मोबाइल नंबर पहले से उपयोग हो चुका है।",
  mobileInvalid: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।",
  speak: "🎤 बोलें", stopRecording: "⏹ रोकें", typeAnswer: "✍️ अपना जवाब लिखें...",
  introPoints: [
    "आपकी राय मूल्यवान है।",
    "हम अपने शहर में खरीदारी के अनुभव को समझने के लिए एक छोटा सर्वे कर रहे हैं।",
    "कोई सही या गलत जवाब नहीं है।",
    "कृपया ईमानदारी से जवाब दें।",
    "आपकी जानकारी गोपनीय रहेगी।",
    "सर्वे में लगभग 2–3 मिनट लगते हैं।"
  ],
  sections: { A: "आपके बारे में", B: "खरीदारी की आदतें", C: "अनुभव", D: "ऑनलाइन खरीदारी", E: "राय" },
  questions: T.en.questions.map((q, i) => {
    const labels = [
      "नाम", "मोबाइल नंबर", "आयु वर्ग", "गाँव / क्षेत्र",
      "घर का सामान आमतौर पर कौन खरीदता है?", "आप क्या करते हैं?",
      "आप कितनी बार खरीदारी करते हैं?", "आप किन दुकानों पर सबसे ज़्यादा जाते हैं?",
      "आप आमतौर पर क्या सामान खरीदते हैं?", "आप हर महीने खरीदारी पर लगभग कितना खर्च करते हैं?",
      "अपने आखिरी खरीदारी के अनुभव के बारे में बताएं।",
      "खरीदारी करते समय आपको आमतौर पर क्या समस्याएं आती हैं?",
      "क्या आपको कभी कोई चीज़ तुरंत चाहिए थी लेकिन मिली नहीं?",
      "क्या आप कभी इसलिए घर वापस आए क्योंकि दुकान में वह सामान नहीं था जो आप चाहते थे?",
      "क्या आपने कभी एक खरीदारी के लिए कई दुकानों का दौरा किया?",
      "क्या आपने कभी ऑनलाइन ऑर्डर किया है?",
      "ऑनलाइन ऑर्डर करने में आपको क्या अच्छा लगा? (अगर कभी नहीं किया, तो क्यों नहीं?)",
      "ऑनलाइन ऑर्डर करने में आपको क्या बुरा लगा?",
      "आप किसी दुकान पर भरोसा क्यों करते हैं?",
      "आप किसी दुकान पर जाना क्यों बंद कर देते हैं?",
      "आपके पास की दुकानों से होम डिलीवरी आज़माने के लिए आपको क्या प्रोत्साहित करेगा?",
      "डिलीवरी चार्ज कितना उचित लगता है?",
      "अगर आप अपने शहर में खरीदारी में एक चीज़ सुधार सकते हैं, तो वह क्या होगी?",
      "अपने आदर्श खरीदारी अनुभव की कल्पना करें। उसे बताएं।",
      "कोई सुझाव?"
    ];
    const optionSets = [
      null, null,
      ["18 से कम", "18–25", "26–35", "36–45", "46–60", "60+"],
      null,
      ["मैं खुद", "पति/पत्नी", "माता-पिता", "बच्चे", "अन्य"],
      ["छात्र", "कर्मचारी", "व्यवसाय", "गृहिणी", "अन्य"],
      ["रोज़", "हफ्ते में 2–3 बार", "साप्ताहिक", "पखवाड़े में", "मासिक"],
      null,
      ["किराना", "सब्ज़ियाँ", "फल", "डेयरी", "बेकरी", "स्टेशनरी", "सौंदर्य प्रसाधन", "कपड़े", "इलेक्ट्रॉनिक्स", "अन्य"],
      ["₹500 से कम", "₹500–₹1000", "₹1000–₹3000", "₹3000–₹5000", "₹5000 से अधिक"],
      null, null,
      ["हाँ", "नहीं"], ["हाँ", "नहीं"], ["हाँ", "नहीं"], ["हाँ", "नहीं"],
      null, null, null, null, null,
      ["मुफ़्त", "₹10–₹20", "₹20–₹40", "₹40–₹60", "₹60 से अधिक"],
      null, null, null
    ];
    const followUpLabels = [
      null, null, null, null, null, null, null, null, null, null, null,
      "क्यों बताएं।",
      "बताएं क्या हुआ।", "बताएं।", "क्यों बताएं।", "कौन से ऐप्स?",
      null, null, null, null, null, null, null, null, null
    ];
    const updated = { ...q, label: labels[i] };
    if (optionSets[i]) updated.options = optionSets[i];
    if (q.followUp && followUpLabels[i]) updated.followUp = { ...q.followUp, label: followUpLabels[i] };
    return updated;
  })
};

// ── State ─────────────────────────────────────────────────────────────────────
let lang = "en";
let currentQ = 0;
let answers = {};
let recognition = null;
let activeVoiceTarget = null;

const questions = () => T[lang].questions;
const t = key => T[lang][key] || T.en[key] || key;

// ── Screens ───────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + id).classList.add("active");
}

// ── i18n ──────────────────────────────────────────────────────────────────────
function applyTranslations() {
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.dataset.t;
    if (T[lang][key] && typeof T[lang][key] === "string") el.textContent = T[lang][key];
  });
  const ul = document.getElementById("intro-points");
  ul.innerHTML = t("introPoints").map(p => `<li>${p}</li>`).join("");
  document.documentElement.lang = lang;
}

// ── Welcome ───────────────────────────────────────────────────────────────────
document.querySelectorAll(".lang-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    lang = btn.dataset.lang;
    applyTranslations();
  });
});

document.getElementById("btn-welcome-continue").addEventListener("click", async () => {
  if (!lang) return showToast("Please select a language.");
  const status = await getSurveyStatus();
  if (status.status === "stopped") {
    if (status.announceAt && Date.now() < status.announceAt) {
      startCountdown(status.announceAt);
      showScreen("countdown");
    } else {
      showScreen("closed");
    }
    return;
  }
  applyTranslations();
  showScreen("intro");
});

// ── Intro ─────────────────────────────────────────────────────────────────────
const agreeCheck = document.getElementById("agree-check");
const btnStart = document.getElementById("btn-start");
agreeCheck.addEventListener("change", () => { btnStart.disabled = !agreeCheck.checked; });
btnStart.addEventListener("click", () => { currentQ = 0; answers = {}; renderQuestion(); showScreen("survey"); });

// ── Survey ────────────────────────────────────────────────────────────────────
function renderQuestion() {
  const qs = questions();
  const q = qs[currentQ];
  const total = qs.length;
  document.getElementById("progress-label").textContent = t("questionOf")(currentQ + 1, total);
  document.getElementById("progress-bar").style.width = ((currentQ + 1) / total * 100) + "%";
  document.getElementById("btn-back").textContent = currentQ === 0 ? t("back") : t("back");
  document.getElementById("btn-next").textContent = currentQ === total - 1 ? t("submit") : t("next");

  const area = document.getElementById("question-area");
  area.innerHTML = `
    <div class="section-label">${t("sections")[q.section]}</div>
    <div class="question-text">${q.label}${q.required ? ' <span class="required-star">*</span>' : ""}</div>
    <div id="input-area">${buildInput(q)}</div>
    <div class="error-msg" id="q-error"></div>
  `;
  restoreAnswer(q);
  attachInputListeners(q);
}

function buildInput(q) {
  const val = answers[q.id];
  switch (q.type) {
    case "text": return `<input type="text" id="q-input" value="${val || ""}" placeholder="${q.id === "name" ? (lang === "hi" ? "आपका नाम" : "Your name") : ""}" />`;
    case "tel": return `<input type="tel" id="q-input" value="${val || ""}" placeholder="${lang === "hi" ? "10 अंकों का नंबर" : "10-digit number"}" maxlength="10" />`;
    case "radio": return buildRadio(q, val);
    case "checkbox": return buildCheckbox(q, val);
    case "voice-text": return buildVoiceText(q.id, val);
    case "radio-followup": return buildRadioFollowup(q, val);
    case "checkbox-voice": return buildCheckboxVoice(q, val);
    default: return "";
  }
}

function buildRadio(q, val) {
  return `<div class="radio-group">${q.options.map(o =>
    `<label class="radio-opt${val === o ? " selected" : ""}">
      <input type="radio" name="q-radio" value="${o}" ${val === o ? "checked" : ""} /> ${o}
    </label>`).join("")}</div>`;
}

function buildCheckbox(q, val) {
  const checked = val || [];
  return `<div class="checkbox-group">${q.options.map(o =>
    `<label class="check-opt${checked.includes(o) ? " selected" : ""}">
      <input type="checkbox" name="q-check" value="${o}" ${checked.includes(o) ? "checked" : ""} /> ${o}
    </label>`).join("")}</div>`;
}

function buildVoiceText(id, val) {
  return `<div class="voice-text-wrap">
    <button class="voice-btn" id="voice-btn-${id}" type="button">${t("speak")}</button>
    <textarea id="q-input" placeholder="${t("typeAnswer")}">${val || ""}</textarea>
  </div>`;
}

function buildRadioFollowup(q, val) {
  const fu = q.followUp;
  const fuVal = answers[fu.id] || "";
  const showFu = val === fu.showIf;
  return `<div class="radio-group">${q.options.map(o =>
    `<label class="radio-opt${val === o ? " selected" : ""}">
      <input type="radio" name="q-radio" value="${o}" ${val === o ? "checked" : ""} /> ${o}
    </label>`).join("")}</div>
  <div id="followup-area" style="margin-top:16px;${showFu ? "" : "display:none"}">
    <div class="question-text" style="font-size:1rem">${fu.label}</div>
    ${buildVoiceText(fu.id, fuVal)}
  </div>`;
}

function buildCheckboxVoice(q, val) {
  const checked = val || [];
  const fu = q.followUp;
  const fuVal = answers[fu.id] || "";
  return `<div class="checkbox-group">${q.options.map(o =>
    `<label class="check-opt${checked.includes(o) ? " selected" : ""}">
      <input type="checkbox" name="q-check" value="${o}" ${checked.includes(o) ? "checked" : ""} /> ${o}
    </label>`).join("")}</div>
  <div style="margin-top:16px">
    <div class="question-text" style="font-size:1rem">${fu.label}</div>
    ${buildVoiceText(fu.id, fuVal)}
  </div>`;
}

function restoreAnswer() {} // answers restored via buildInput using answers[q.id]

function attachInputListeners(q) {
  // Radio
  document.querySelectorAll('input[name="q-radio"]').forEach(r => {
    r.addEventListener("change", () => {
      document.querySelectorAll(".radio-opt").forEach(o => o.classList.remove("selected"));
      r.closest(".radio-opt").classList.add("selected");
      answers[q.id] = r.value;
      if (q.followUp) {
        const fu = document.getElementById("followup-area");
        if (fu) fu.style.display = r.value === q.followUp.showIf ? "" : "none";
      }
    });
  });
  // Checkbox
  document.querySelectorAll('input[name="q-check"]').forEach(c => {
    c.addEventListener("change", () => {
      c.closest(".check-opt").classList.toggle("selected", c.checked);
      const vals = [...document.querySelectorAll('input[name="q-check"]:checked')].map(x => x.value);
      answers[q.id] = vals;
    });
  });
  // Text / tel
  const inp = document.getElementById("q-input");
  if (inp) inp.addEventListener("input", () => { answers[q.id] = inp.value; });
  // Voice buttons
  document.querySelectorAll(".voice-btn").forEach(btn => {
    const targetId = btn.id.replace("voice-btn-", "");
    btn.addEventListener("click", () => toggleVoice(btn, targetId));
  });
  // Follow-up textarea
  if (q.followUp) {
    const fuInput = document.getElementById("q-input") ? null : null; // handled below
    document.querySelectorAll("textarea").forEach(ta => {
      ta.addEventListener("input", () => {
        const voiceWrap = ta.closest(".voice-text-wrap");
        if (!voiceWrap) return;
        const voiceBtn = voiceWrap.querySelector(".voice-btn");
        if (!voiceBtn) return;
        const tid = voiceBtn.id.replace("voice-btn-", "");
        answers[tid] = ta.value;
      });
    });
  }
}

// ── Voice ─────────────────────────────────────────────────────────────────────
function toggleVoice(btn, targetId) {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    showToast(lang === "hi" ? "वॉइस इनपुट समर्थित नहीं है।" : "Voice input not supported.");
    return;
  }
  if (recognition && activeVoiceTarget === targetId) {
    recognition.stop();
    return;
  }
  if (recognition) recognition.stop();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
  recognition.interimResults = false;
  recognition.continuous = false;
  activeVoiceTarget = targetId;
  btn.textContent = t("stopRecording");
  btn.classList.add("recording");

  recognition.onresult = e => {
    const transcript = e.results[0][0].transcript;
    const ta = btn.closest(".voice-text-wrap")?.querySelector("textarea");
    if (ta) { ta.value = (ta.value ? ta.value + " " : "") + transcript; answers[targetId] = ta.value; }
  };
  recognition.onend = () => {
    btn.textContent = t("speak");
    btn.classList.remove("recording");
    recognition = null;
    activeVoiceTarget = null;
  };
  recognition.start();
}

// ── Navigation ────────────────────────────────────────────────────────────────
document.getElementById("btn-back").addEventListener("click", () => {
  if (currentQ === 0) { showScreen("intro"); return; }
  currentQ--;
  renderQuestion();
});

document.getElementById("btn-next").addEventListener("click", async () => {
  const qs = questions();
  const q = qs[currentQ];
  if (!validateQuestion(q)) return;

  if (currentQ === qs.length - 1) {
    await submitSurvey();
  } else {
    currentQ++;
    renderQuestion();
    window.scrollTo(0, 0);
  }
});

function validateQuestion(q) {
  const err = document.getElementById("q-error");
  if (!q.required) return true;

  const val = answers[q.id];
  if (!val || (Array.isArray(val) && val.length === 0) || val.trim?.() === "") {
    err.textContent = t("required");
    return false;
  }
  if (q.type === "tel") {
    if (!/^\d{10}$/.test(val)) { err.textContent = t("mobileInvalid"); return false; }
  }
  err.textContent = "";
  return true;
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function submitSurvey() {
  const mobile = answers["mobile"];
  if (await mobileExists(mobile)) {
    document.getElementById("q-error").textContent = t("mobileUsed");
    return;
  }
  const id = await saveResponse({ ...answers, language: lang });
  document.getElementById("participant-id-display").textContent = id;
  showScreen("thankyou");
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function startCountdown(announceAt) {
  const display = document.getElementById("countdown-display");
  const tick = () => {
    const diff = Math.max(0, announceAt - Date.now());
    const m = String(Math.floor(diff / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    display.textContent = `${m}:${s}`;
    if (diff > 0) setTimeout(tick, 1000);
  };
  tick();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}
