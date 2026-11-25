// =========================================================
// 1. toast helper & shared storage helpers
// =========================================================
const toastEl = document.getElementById("toast");
let toastTimeout = null;

function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg.toLowerCase();
  toastEl.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2400);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// =========================================================
// 2. shared preferences: name, theme, dark mode & timer prefs
// =========================================================
let prefs = loadJSON("yuri-prefs", {
  name: "yuri",
  pinkTheme: "sakura",
  darkMode: false,
  focusMins: 25,
  breakMins: 5,
  masterVol: 50,
  chimeEnabled: true
});

function applyGlobalAppearance() {
  document.body.classList.remove("pink-strawberry", "pink-blossom", "dark-mode");
  if (prefs.pinkTheme === "strawberry") document.body.classList.add("pink-strawberry");
  if (prefs.pinkTheme === "blossom") document.body.classList.add("pink-blossom");
  if (prefs.darkMode) document.body.classList.add("dark-mode");

  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.textContent = prefs.darkMode ? "☀️ day mode" : "🌙 night mode";
  }
}

applyGlobalAppearance();

const themeToggleBtn = document.getElementById("theme-toggle");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    prefs.darkMode = !prefs.darkMode;
    saveJSON("yuri-prefs", prefs);
    applyGlobalAppearance();
    showToast(prefs.darkMode ? "night mode enabled 🌙" : "day mode enabled ☀️");
  });
}

// =========================================================
// 3. shared study progress & streak
// =========================================================
let completedSessions = Number(localStorage.getItem("yuri-sessions")) || 0;
let streakData = loadJSON("yuri-streak", { count: 1, lastDate: getTodayKey() });
const DAILY_GOAL = 4;

function recordCompletedFocusSession() {
  completedSessions += 1;
  localStorage.setItem("yuri-sessions", String(completedSessions));

  const today = getTodayKey();
  if (streakData.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streakData.count = streakData.lastDate === yesterday ? streakData.count + 1 : 1;
    streakData.lastDate = today;
    saveJSON("yuri-streak", streakData);
  }
}

// =========================================================
// 4. page: home dashboard (index.html)
// =========================================================
const pageName = document.body.dataset.page;

if (pageName === "home") {
  const greetingEl = document.getElementById("welcome-greeting");
  const datetimeEl = document.getElementById("live-datetime");
  const quoteBtn = document.getElementById("quote-btn");
  const motivationEl = document.getElementById("daily-motivation");

  greetingEl.textContent = `annyeong, ${prefs.name}! ready for a cozy study day?`;

  function updateClock() {
    const now = new Date();
    datetimeEl.textContent = now.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).toLowerCase();
  }
  updateClock();
  setInterval(updateClock, 30000);

  const quotes = [
    "🌸 slow progress is still progress — click for a new quote",
    "🍓 one study block at a time is plenty",
    "🎀 romanticize your notes & keep going",
    "🌷 rest when tired, return when ready"
  ];
  let qIdx = 0;
  quoteBtn.addEventListener("click", () => {
    qIdx = (qIdx + 1) % quotes.length;
    quoteBtn.textContent = quotes[qIdx];
    motivationEl.textContent = quotes[qIdx];
  });

  const tasks = loadJSON("yuri-tasks", [
    { id: 1, text: "review web dev lab rubric", priority: "high", dueDate: "2026-11-30", done: false },
    { id: 2, text: "upload multi-page site to github", priority: "medium", dueDate: "", done: false }
  ]);
  const homeTaskPreview = document.getElementById("home-task-preview");
  tasks.slice(0, 3).forEach((t) => {
    const li = document.createElement("li");
    li.className = "stack-item";
    const prio = t.priority || "medium";
    li.innerHTML = `<span>${t.text}</span><span class="prio-badge prio-${prio}">${prio}</span>`;
    homeTaskPreview.appendChild(li);
  });

  const exams = loadJSON("yuri-exams", [
    { id: 1, title: "midterm exam", date: "2026-12-05" }
  ]);
  const homeDeadlinesPreview = document.getElementById("home-deadlines-preview");
  exams.slice(0, 3).forEach((ex) => {
    const li = document.createElement("li");
    li.className = "stack-item";
    li.innerHTML = `<span><strong>${ex.title}</strong> (${ex.date})</span><span class="mini-pill">upcoming</span>`;
    homeDeadlinesPreview.appendChild(li);
  });

  document.getElementById("home-session-count").textContent = `${completedSessions} / ${DAILY_GOAL}`;
  document.getElementById("home-streak-pill").textContent = `🔥 ${streakData.count} day streak`;
  document.getElementById("home-goal-bar").style.width = `${Math.min(100, (completedSessions / DAILY_GOAL) * 100)}%`;

  let quickSecs = prefs.focusMins * 60;
  let quickInterval = null;
  const quickDisp = document.getElementById("home-timer-display");
  const quickStart = document.getElementById("home-start-btn");
  const quickReset = document.getElementById("home-reset-btn");

  function renderQuickTimer() {
    const m = Math.floor(quickSecs / 60);
    const s = quickSecs % 60;
    quickDisp.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  renderQuickTimer();

  quickStart.addEventListener("click", () => {
    if (quickInterval) {
      clearInterval(quickInterval);
      quickInterval = null;
      quickStart.textContent = "▶ start";
    } else {
      quickStart.textContent = "⏸ pause";
      quickInterval = setInterval(() => {
        if (quickSecs > 0) {
          quickSecs -= 1;
          renderQuickTimer();
        } else {
          clearInterval(quickInterval);
          quickInterval = null;
          recordCompletedFocusSession();
          showToast("focus block complete! 🌸");
        }
      }, 1000);
    }
  });

  quickReset.addEventListener("click", () => {
    clearInterval(quickInterval);
    quickInterval = null;
    quickStart.textContent = "▶ start";
    quickSecs = prefs.focusMins * 60;
    renderQuickTimer();
  });
}

// =========================================================
// 5. page: focus room (focus.html)
// =========================================================
if (pageName === "focus") {
  const timerDisplay = document.getElementById("timer-display");
  const timerLabel = document.getElementById("timer-label");
  const startPauseBtn = document.getElementById("start-pause-btn");
  const resetBtn = document.getElementById("reset-btn");
  const skipBtn = document.getElementById("skip-btn");
  const modeTabs = document.querySelectorAll(".mode-tab");
  const progressCircle = document.getElementById("progress-ring-circle");
  const zenBtn = document.getElementById("zen-mode-btn");

  const CIRCUMFERENCE = 2 * Math.PI * 92;
  progressCircle.style.strokeDasharray = CIRCUMFERENCE;

  let mode = "focus";
  let totalSecs = prefs.focusMins * 60;
  let remSecs = totalSecs;
  let intervalId = null;
  let running = false;

  function updateRing() {
    const m = Math.floor(remSecs / 60);
    const s = remSecs % 60;
    timerDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    const prog = totalSecs > 0 ? (totalSecs - remSecs) / totalSecs : 0;
    progressCircle.style.strokeDashoffset = CIRCUMFERENCE * prog;
  }

  function setTimerMode(newMode, mins) {
    clearInterval(intervalId);
    running = false;
    startPauseBtn.textContent = "▶ start";
    mode = newMode;
    totalSecs = mins * 60;
    remSecs = totalSecs;
    modeTabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === newMode));
    timerLabel.textContent = newMode === "focus" ? "deep focus" : "cozy break";
    updateRing();
  }

  function toggleFocusTimer() {
    if (running) {
      clearInterval(intervalId);
      running = false;
      startPauseBtn.textContent = "▶ resume";
    } else {
      running = true;
      startPauseBtn.textContent = "⏸ pause";
      intervalId = setInterval(() => {
        if (remSecs > 0) {
          remSecs -= 1;
          updateRing();
        } else {
          clearInterval(intervalId);
          running = false;
          startPauseBtn.textContent = "▶ start";
          if (mode === "focus") {
            recordCompletedFocusSession();
            showToast("session complete! 🌸");
          }
          setTimerMode(mode === "focus" ? "short" : "focus", mode === "focus" ? prefs.breakMins : prefs.focusMins);
        }
      }, 1000);
    }
  }

  startPauseBtn.addEventListener("click", toggleFocusTimer);
  resetBtn.addEventListener("click", () => setTimerMode(mode, mode === "focus" ? prefs.focusMins : prefs.breakMins));
  skipBtn.addEventListener("click", () => setTimerMode(mode === "focus" ? "short" : "focus", mode === "focus" ? prefs.breakMins : prefs.focusMins));

  modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const m = tab.dataset.mode;
      const mins = m === "focus" ? prefs.focusMins : m === "short" ? prefs.breakMins : 15;
      setTimerMode(m, mins);
    });
  });

  zenBtn.addEventListener("click", () => {
    document.querySelectorAll(".workspace-col .card:not(.timer-card)").forEach((c) => {
      c.style.display = c.style.display === "none" ? "" : "none";
    });
    showToast("toggled distraction-free view ✨");
  });

  updateRing();

  const cheers = [
    `"${prefs.name}, you're doing so well! keep your posture soft and steady."`,
    `"one paragraph, one function, or one page at a time — i'm cheering for you!"`,
    `"don't forget to sip water between focus blocks 🍓"`
  ];
  let cheerIdx = 0;
  document.getElementById("companion-cheer-btn").addEventListener("click", () => {
    cheerIdx = (cheerIdx + 1) % cheers.length;
    document.getElementById("companion-speech").textContent = cheers[cheerIdx];
  });

  const moodNotes = {
    sakura: "current room mood: sakura desk — soft pink petals & calm stationery vibes.",
    matcha: "current room mood: matcha library — quiet green pages & warm tea.",
    starlight: "current room mood: starlight study — peaceful night focus.",
    peach: "current room mood: peach cafe — sunny pastel afternoon energy."
  };
  document.querySelectorAll(".mood-vibe-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mood-vibe-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("ambient-mood-note").textContent = moodNotes[btn.dataset.mood];
    });
  });

  const musicToggleBtn = document.getElementById("music-toggle-btn");
  const soundwaveEl = document.getElementById("soundwave");
  const rainChk = document.getElementById("mix-rain");
  const cafeChk = document.getElementById("mix-cafe");
  const fireChk = document.getElementById("mix-fire");
  const natureChk = document.getElementById("mix-nature");
  const rainVol = document.getElementById("vol-rain");
  const cafeVol = document.getElementById("vol-cafe");
  const fireVol = document.getElementById("vol-fire");
  const natureVol = document.getElementById("vol-nature");

  rainVol.value = prefs.masterVol;
  document.getElementById("vol-rain-val").textContent = `${prefs.masterVol}%`;

  let audioCtx = null;
  let playingAudio = false;
  let noiseNode = null;
  let chordTimer = null;
  let gainRain = null;
  let gainCafe = null;

  function stopSounds() {
    if (noiseNode) {
      try { noiseNode.stop(); noiseNode.disconnect(); } catch (e) {}
      noiseNode = null;
    }
    clearInterval(chordTimer);
    chordTimer = null;
  }

  function startSounds() {
    stopSounds();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();

    gainRain = audioCtx.createGain();
    gainRain.gain.value = (rainChk.checked ? Number(rainVol.value) : 0) / 100 * 0.25;
    gainRain.connect(audioCtx.destination);

    gainCafe = audioCtx.createGain();
    gainCafe.gain.value = (cafeChk.checked ? Number(cafeVol.value) : 0) / 100 * 0.22;
    gainCafe.connect(audioCtx.destination);

    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buf;
    noiseNode.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = fireChk.checked ? 550 : natureChk.checked ? 420 : 1050;
    noiseNode.connect(filter);
    filter.connect(gainRain);
    noiseNode.start();

    const chords = [
      [261.63, 329.63, 392.0],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66]
    ];
    let idx = 0;
    const playChord = () => {
      if (!playingAudio || !audioCtx) return;
      const ch = chords[idx++ % chords.length];
      ch.forEach((f) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.05, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.8);
        osc.connect(g);
        g.connect(gainCafe);
        osc.start();
        osc.stop(audioCtx.currentTime + 2.9);
      });
    };
    playChord();
    chordTimer = setInterval(playChord, 3200);
  }

  function syncVolumes() {
    document.getElementById("vol-rain-val").textContent = `${rainVol.value}%`;
    document.getElementById("vol-cafe-val").textContent = `${cafeVol.value}%`;
    document.getElementById("vol-fire-val").textContent = `${fireVol.value}%`;
    document.getElementById("vol-nature-val").textContent = `${natureVol.value}%`;
    if (playingAudio && audioCtx && gainRain && gainCafe) {
      gainRain.gain.value = (rainChk.checked ? Number(rainVol.value) : 0) / 100 * 0.25;
      gainCafe.gain.value = (cafeChk.checked ? Number(cafeVol.value) : 0) / 100 * 0.22;
    }
  }

  [rainChk, cafeChk, fireChk, natureChk, rainVol, cafeVol, fireVol, natureVol].forEach((el) => {
    el.addEventListener("input", syncVolumes);
    el.addEventListener("change", syncVolumes);
  });

  function toggleSounds() {
    if (playingAudio) {
      playingAudio = false;
      stopSounds();
      musicToggleBtn.textContent = "▶ play sounds";
      soundwaveEl.classList.remove("playing");
    } else {
      playingAudio = true;
      startSounds();
      musicToggleBtn.textContent = "⏸ pause";
      soundwaveEl.classList.add("playing");
      showToast("playing background sounds 🎧");
    }
  }

  musicToggleBtn.addEventListener("click", toggleSounds);

  document.addEventListener("keydown", (e) => {
    if (["input", "textarea", "select"].includes(document.activeElement.tagName.toLowerCase())) return;
    if (e.code === "Space") { e.preventDefault(); toggleFocusTimer(); }
    if (e.key.toLowerCase() === "r") resetBtn.click();
    if (e.key.toLowerCase() === "m") toggleSounds();
  });
}

// =========================================================
// 6. page: my planner (planner.html)
//    - full task crud: add, edit, delete, complete
//    - completed/remaining counts & completion %
//    - low, medium, high priorities + optional due date
//    - month-switching academic calendar
// =========================================================
if (pageName === "planner") {
  let tasks = loadJSON("yuri-tasks", [
    { id: 1, text: "review web dev lab rubric", priority: "high", dueDate: "2026-11-30", done: false },
    { id: 2, text: "upload multi-page site to github", priority: "medium", dueDate: "", done: false }
  ]);
  let exams = loadJSON("yuri-exams", [
    { id: 1, title: "midterm exam", date: "2026-11-28" }
  ]);
  let assignments = loadJSON("yuri-assignments", [
    { id: 1, title: "html & css lab", subject: "web dev" }
  ]);

  const taskListEl = document.getElementById("task-list");
  const completedCountEl = document.getElementById("task-completed-count");
  const remainingCountEl = document.getElementById("task-remaining-count");
  const completionPctEl = document.getElementById("task-completion-pct");
  const taskPctFillEl = document.getElementById("task-pct-fill");

  const examListEl = document.getElementById("exam-list");
  const examCountPill = document.getElementById("exam-count-pill");
  const assignmentListEl = document.getElementById("assignment-list");
  const assignmentCountPill = document.getElementById("assignment-count-pill");

  const calMonthSelect = document.getElementById("cal-month-select");
  const calYearInput = document.getElementById("cal-year-input");
  const calPrevBtn = document.getElementById("cal-prev-btn");
  const calNextBtn = document.getElementById("cal-next-btn");
  const calendarGridEl = document.getElementById("calendar-grid");

  const nowDate = new Date();
  calMonthSelect.value = String(nowDate.getMonth());
  calYearInput.value = String(nowDate.getFullYear());

  function saveTasks() {
    saveJSON("yuri-tasks", tasks);
  }

  function renderTasks() {
    taskListEl.innerHTML = "";
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    const remaining = total - completed;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    completedCountEl.textContent = `completed: ${completed}`;
    remainingCountEl.textContent = `remaining: ${remaining}`;
    completionPctEl.textContent = `${pct}% done`;
    taskPctFillEl.style.width = `${pct}%`;

    tasks.forEach((t) => {
      const prio = ["low", "medium", "high"].includes(t.priority) ? t.priority : "medium";
      const dueText = t.dueDate ? `due: ${t.dueDate}` : "no due date";

      const li = document.createElement("li");
      li.className = `task-item ${t.done ? "completed" : ""}`;
      li.innerHTML = `
        <div class="task-main-col">
          <label class="task-left">
            <input type="checkbox" ${t.done ? "checked" : ""} />
            <span class="task-text">${t.text}</span>
          </label>
          <span class="task-due-sub">${dueText}</span>
        </div>
        <div class="task-actions-right">
          <span class="prio-badge prio-${prio}">${prio}</span>
          <button class="edit-task-btn" title="edit task" aria-label="edit task">✏️ edit</button>
          <button class="delete-task-btn" title="delete task" aria-label="delete task">✕</button>
        </div>
      `;

      li.querySelector('input[type="checkbox"]').addEventListener("change", () => {
        t.done = !t.done;
        saveTasks();
        renderTasks();
      });

      li.querySelector(".edit-task-btn").addEventListener("click", () => {
        const nextTitle = prompt("edit task name:", t.text);
        if (nextTitle === null) return;
        const trimmed = nextTitle.trim().toLowerCase();
        if (!trimmed) return;

        const nextPrioInput = prompt("priority (low, medium, high):", prio);
        const normPrio = nextPrioInput ? nextPrioInput.trim().toLowerCase() : prio;
        const finalPrio = ["low", "medium", "high"].includes(normPrio) ? normPrio : prio;

        const nextDue = prompt("due date (yyyy-mm-dd or leave blank):", t.dueDate || "");
        t.text = trimmed;
        t.priority = finalPrio;
        t.dueDate = nextDue === null ? (t.dueDate || "") : nextDue.trim();

        saveTasks();
        renderTasks();
        showToast("updated task ✏️");
      });

      li.querySelector(".delete-task-btn").addEventListener("click", () => {
        tasks = tasks.filter((item) => item.id !== t.id);
        saveTasks();
        renderTasks();
        showToast("deleted task");
      });

      taskListEl.appendChild(li);
    });
  }

  function renderCalendar() {
    const year = Math.min(2035, Math.max(2020, Number(calYearInput.value) || 2026));
    const month = Number(calMonthSelect.value) || 0;
    calYearInput.value = String(year);

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const eventDays = new Set();
    exams.forEach((ex) => {
      if (!ex.date) return;
      const [y, m, d] = ex.date.split("-").map(Number);
      if (y === year && m - 1 === month && d) {
        eventDays.add(d);
      }
    });

    calendarGridEl.innerHTML = "";
    for (let i = 0; i < firstDayOfMonth; i++) {
      const blank = document.createElement("div");
      blank.className = "cal-day empty";
      calendarGridEl.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = `cal-day ${eventDays.has(day) ? "has-event" : ""}`;
      cell.textContent = String(day);
      calendarGridEl.appendChild(cell);
    }
  }

  function renderPlanner() {
    renderTasks();
    renderCalendar();

    examListEl.innerHTML = "";
    examCountPill.textContent = `${exams.length} deadlines`;
    exams.forEach((ex) => {
      const li = document.createElement("li");
      li.className = "stack-item";
      li.innerHTML = `<span><strong>${ex.title}</strong> • ${ex.date}</span><button class="delete-task-btn">✕</button>`;
      li.querySelector(".delete-task-btn").addEventListener("click", () => {
        exams = exams.filter((item) => item.id !== ex.id);
        saveJSON("yuri-exams", exams);
        renderPlanner();
      });
      examListEl.appendChild(li);
    });

    assignmentListEl.innerHTML = "";
    assignmentCountPill.textContent = `${assignments.length} items`;
    assignments.forEach((a) => {
      const li = document.createElement("li");
      li.className = "stack-item";
      li.innerHTML = `<span><strong>${a.title}</strong> <span class="mini-tag">${a.subject}</span></span><button class="delete-task-btn">✕</button>`;
      li.querySelector(".delete-task-btn").addEventListener("click", () => {
        assignments = assignments.filter((item) => item.id !== a.id);
        saveJSON("yuri-assignments", assignments);
        renderPlanner();
      });
      assignmentListEl.appendChild(li);
    });
  }

  document.getElementById("task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = document.getElementById("task-input");
    const prio = document.getElementById("task-priority").value;
    const due = document.getElementById("task-due-date").value;
    const text = inp.value.trim().toLowerCase();
    if (!text) return;

    tasks.unshift({
      id: Date.now(),
      text,
      priority: prio,
      dueDate: due || "",
      done: false
    });
    inp.value = "";
    document.getElementById("task-due-date").value = "";
    saveTasks();
    renderTasks();
    showToast("added new task ✨");
  });

  document.getElementById("exam-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const titleEl = document.getElementById("exam-title");
    const dateEl = document.getElementById("exam-date");
    exams.push({ id: Date.now(), title: titleEl.value.trim().toLowerCase(), date: dateEl.value });
    titleEl.value = "";
    dateEl.value = "";
    saveJSON("yuri-exams", exams);
    renderPlanner();
    showToast("added deadline 📅");
  });

  document.getElementById("assignment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const tEl = document.getElementById("assignment-title");
    const sEl = document.getElementById("assignment-subject");
    assignments.unshift({ id: Date.now(), title: tEl.value.trim().toLowerCase(), subject: sEl.value.trim().toLowerCase() });
    tEl.value = "";
    sEl.value = "";
    saveJSON("yuri-assignments", assignments);
    renderPlanner();
    showToast("added assignment 📘");
  });

  calMonthSelect.addEventListener("change", renderCalendar);
  calYearInput.addEventListener("change", renderCalendar);

  calPrevBtn.addEventListener("click", () => {
    let m = Number(calMonthSelect.value) - 1;
    let y = Number(calYearInput.value) || 2026;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    calMonthSelect.value = String(m);
    calYearInput.value = String(y);
    renderCalendar();
  });

  calNextBtn.addEventListener("click", () => {
    let m = Number(calMonthSelect.value) + 1;
    let y = Number(calYearInput.value) || 2026;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    calMonthSelect.value = String(m);
    calYearInput.value = String(y);
    renderCalendar();
  });

  renderPlanner();
}

// =========================================================
// 7. page: study corner (study.html) — flashcards with delete
// =========================================================
if (pageName === "study") {
  const scratchpad = document.getElementById("scratchpad");
  scratchpad.value = localStorage.getItem("yuri-scratchpad") || "";
  scratchpad.addEventListener("input", () => {
    localStorage.setItem("yuri-scratchpad", scratchpad.value);
  });

  document.getElementById("download-notes-btn").addEventListener("click", () => {
    const blob = new Blob([scratchpad.value || "study with yuri notes"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-corner-notes.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast("saved notes as .txt ⬇");
  });

  let subjects = loadJSON("yuri-subjects", ["accounting", "web development", "psychology"]);
  const subjectPoolEl = document.getElementById("subject-pool");
  function renderSubjects() {
    subjectPoolEl.innerHTML = "";
    subjects.forEach((s, idx) => {
      const span = document.createElement("span");
      span.className = "subject-chip";
      span.textContent = s;
      span.title = "click to remove";
      span.style.cursor = "pointer";
      span.addEventListener("click", () => {
        subjects.splice(idx, 1);
        saveJSON("yuri-subjects", subjects);
        renderSubjects();
      });
      subjectPoolEl.appendChild(span);
    });
  }
  document.getElementById("subject-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = document.getElementById("subject-input");
    const val = inp.value.trim().toLowerCase();
    if (val && !subjects.includes(val)) {
      subjects.push(val);
      saveJSON("yuri-subjects", subjects);
      renderSubjects();
    }
    inp.value = "";
  });
  renderSubjects();

  let cards = loadJSON("yuri-flashcards", [
    { id: 1, front: "what does @media do in css?", back: "applies styles based on viewport width or device rules" }
  ]);
  const deckEl = document.getElementById("flashcard-deck");
  const cardCountEl = document.getElementById("flashcard-count-pill");

  function renderCards() {
    deckEl.innerHTML = "";
    cardCountEl.textContent = `${cards.length} ${cards.length === 1 ? "card" : "cards"}`;
    cards.forEach((c) => {
      const div = document.createElement("div");
      div.className = "flashcard-item";
      div.innerHTML = `
        <div class="flashcard-body">
          <strong>${c.front}</strong> <span class="mini-tag">(click to reveal/hide)</span>
          <div class="flashcard-answer" style="display:none;">${c.back}</div>
        </div>
        <button class="delete-task-btn" title="delete flashcard" aria-label="delete flashcard">✕</button>
      `;
      div.querySelector(".flashcard-body").addEventListener("click", () => {
        const ans = div.querySelector(".flashcard-answer");
        ans.style.display = ans.style.display === "none" ? "block" : "none";
      });
      div.querySelector(".delete-task-btn").addEventListener("click", () => {
        cards = cards.filter((item) => item.id !== c.id);
        saveJSON("yuri-flashcards", cards);
        renderCards();
        showToast("deleted flashcard");
      });
      deckEl.appendChild(div);
    });
  }

  document.getElementById("flashcard-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fEl = document.getElementById("flashcard-front");
    const bEl = document.getElementById("flashcard-back");
    cards.unshift({ id: Date.now(), front: fEl.value.trim().toLowerCase(), back: bEl.value.trim().toLowerCase() });
    fEl.value = "";
    bEl.value = "";
    saveJSON("yuri-flashcards", cards);
    renderCards();
    showToast("created flashcard 🃏");
  });

  renderCards();
}

// =========================================================
// 8. page: letter to my future self (future.html)
// =========================================================
if (pageName === "future") {
  let letters = loadJSON("yuri-future-letters", [
    {
      id: 1,
      title: "dear future yuri",
      unlockDate: "2026-11-01",
      body: "keep going at your own gentle pace—every small step matters.",
      peeked: false
    }
  ]);

  const listEl = document.getElementById("future-letters-list");
  const countPill = document.getElementById("letters-count-pill");

  function renderLetters() {
    listEl.innerHTML = "";
    countPill.textContent = `💌 ${letters.length} ${letters.length === 1 ? "letter" : "letters"}`;
    const today = getTodayKey();

    letters.forEach((letter) => {
      const isUnlocked = today >= letter.unlockDate || letter.peeked;
      const li = document.createElement("li");
      li.className = "stack-item";
      li.innerHTML = `
        <div class="task-main-col">
          <strong>${letter.title}</strong>
          <span class="mini-tag">${isUnlocked ? `unlocked (${letter.unlockDate})` : `sealed until ${letter.unlockDate}`}</span>
          <p class="mini-tag">${isUnlocked ? letter.body : "🔒 locked until your unlock date"}</p>
        </div>
        <div class="task-actions-right">
          ${!isUnlocked ? '<button class="btn-pill btn-outline btn-xs peek-letter-btn">peek</button>' : ""}
          <button class="delete-task-btn" title="delete letter" aria-label="delete letter">✕</button>
        </div>
      `;

      const peekBtn = li.querySelector(".peek-letter-btn");
      if (peekBtn) {
        peekBtn.addEventListener("click", () => {
          letter.peeked = true;
          saveJSON("yuri-future-letters", letters);
          renderLetters();
        });
      }

      li.querySelector(".delete-task-btn").addEventListener("click", () => {
        letters = letters.filter((item) => item.id !== letter.id);
        saveJSON("yuri-future-letters", letters);
        renderLetters();
      });

      listEl.appendChild(li);
    });
  }

  document.getElementById("future-letter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const titleEl = document.getElementById("letter-title");
    const dateEl = document.getElementById("letter-unlock-date");
    const bodyEl = document.getElementById("letter-body");

    letters.unshift({
      id: Date.now(),
      title: titleEl.value.trim().toLowerCase(),
      unlockDate: dateEl.value,
      body: bodyEl.value.trim().toLowerCase(),
      peeked: false
    });

    titleEl.value = "";
    dateEl.value = "";
    bodyEl.value = "";
    saveJSON("yuri-future-letters", letters);
    renderLetters();
    showToast("sealed letter to your future self 💌");
  });

  renderLetters();
}

// =========================================================
// 9. page: my progress (progress.html)
// =========================================================
if (pageName === "progress") {
  const tasks = loadJSON("yuri-tasks", []);
  const doneTasks = tasks.filter((t) => t.done).length;
  document.getElementById("stat-total-sessions").textContent = String(completedSessions);
  document.getElementById("stat-streak-days").textContent = `${streakData.count}d`;
  document.getElementById("stat-tasks-done").textContent = String(doneTasks);

  const weeklyBars = document.getElementById("weekly-bars");
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const baseVals = [2, 3, 2, Math.max(1, completedSessions), 3, 2, 1];
  days.forEach((d, i) => {
    const col = document.createElement("div");
    col.className = "week-col";
    const h = Math.min(100, baseVals[i] * 22);
    col.innerHTML = `<div class="week-bar" style="height:${h}%"></div><span class="week-day-lbl">${d}</span>`;
    weeklyBars.appendChild(col);
  });

  const badges = [
    { label: "🌸 first session", ok: completedSessions >= 1 },
    { label: "🔥 3-day streak", ok: streakData.count >= 3 },
    { label: "✅ task finisher", ok: doneTasks >= 1 },
    { label: "🎀 dedicated scholar", ok: completedSessions >= 5 }
  ];
  const badgesGrid = document.getElementById("badges-grid");
  badges.forEach((b) => {
    const el = document.createElement("span");
    el.className = `badge-chip ${b.ok ? "" : "locked"}`;
    el.textContent = b.label;
    badgesGrid.appendChild(el);
  });

  let moodHistory = loadJSON("yuri-moods", [
    { id: 1, mood: "🌸 calm & cozy", date: getTodayKey() }
  ]);
  const moodListEl = document.getElementById("mood-history-list");

  function renderMoods() {
    moodListEl.innerHTML = "";
    moodHistory.slice(0, 6).forEach((m) => {
      const li = document.createElement("li");
      li.className = "stack-item";
      li.innerHTML = `<span>${m.mood}</span><span class="mini-tag">${m.date}</span>`;
      moodListEl.appendChild(li);
    });
  }

  document.querySelectorAll(".log-mood-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      moodHistory.unshift({ id: Date.now(), mood: btn.dataset.mood, date: getTodayKey() });
      saveJSON("yuri-moods", moodHistory);
      renderMoods();
      showToast("logged mood check-in 💌");
    });
  });

  renderMoods();
}

// =========================================================
// 10. page: settings (settings.html)
// =========================================================
if (pageName === "settings") {
  const nameInput = document.getElementById("welcome-name-input");
  const namePreview = document.getElementById("current-name-preview");
  nameInput.value = prefs.name;
  namePreview.textContent = `current welcome name: ${prefs.name}`;

  document.getElementById("profile-name-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = nameInput.value.trim().toLowerCase();
    if (!val) return;
    prefs.name = val;
    saveJSON("yuri-prefs", prefs);
    namePreview.textContent = `current welcome name: ${prefs.name}`;
    showToast(`updated welcome name to ${prefs.name} 🌸`);
  });

  document.querySelectorAll(".theme-swatch-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      prefs.pinkTheme = btn.dataset.pink;
      saveJSON("yuri-prefs", prefs);
      applyGlobalAppearance();
      showToast(`theme set to ${prefs.pinkTheme} 🌷`);
    });
  });

  const focusInp = document.getElementById("pref-focus-mins");
  const breakInp = document.getElementById("pref-break-mins");
  focusInp.value = prefs.focusMins;
  breakInp.value = prefs.breakMins;

  document.getElementById("save-timer-prefs-btn").addEventListener("click", () => {
    prefs.focusMins = Math.min(180, Math.max(1, Number(focusInp.value) || 25));
    prefs.breakMins = Math.min(60, Math.max(1, Number(breakInp.value) || 5));
    saveJSON("yuri-prefs", prefs);
    showToast("saved timer preferences ⏱️");
  });

  const volSlider = document.getElementById("pref-master-vol");
  const volLbl = document.getElementById("pref-vol-label");
  const chimeChk = document.getElementById("pref-chime-enabled");
  volSlider.value = prefs.masterVol;
  volLbl.textContent = `${prefs.masterVol}%`;
  chimeChk.checked = prefs.chimeEnabled;

  volSlider.addEventListener("input", () => {
    prefs.masterVol = Number(volSlider.value);
    volLbl.textContent = `${prefs.masterVol}%`;
    saveJSON("yuri-prefs", prefs);
  });

  chimeChk.addEventListener("change", () => {
    prefs.chimeEnabled = chimeChk.checked;
    saveJSON("yuri-prefs", prefs);
  });
}
