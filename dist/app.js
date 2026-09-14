"use strict";

const STORAGE_KEY = "senin-dunyan-vault-v1";
const BIRTHDAY = "2026-09-21";
const prayers = [
  { id: "sabah", name: "Sabah", note: "Güne huzurla başla", symbol: "☼" },
  { id: "ogle", name: "Öğle", note: "Günün ortasında dur", symbol: "◐" },
  { id: "ikindi", name: "İkindi", note: "Kalbini tazele", symbol: "◒" },
  { id: "aksam", name: "Akşam", note: "Şükürle tamamla", symbol: "◑" },
  { id: "yatsi", name: "Yatsı", note: "Geceyi huzurla kapat", symbol: "☾" }
];

const hadiths = [
  { text: "Ameller niyetlere göredir; herkes için niyet ettiği vardır.", source: "Sahih el-Buhârî 1" },
  { text: "Kendin için sevdiğini kardeşin için de sevmedikçe iman olgunlaşmaz.", source: "Sahih el-Buhârî 13 · Sahih Müslim 45" },
  { text: "Allah’a ve ahiret gününe inanan ya hayır söylesin ya da sussun.", source: "Sahih el-Buhârî 6018 · Sahih Müslim 47" },
  { text: "İlim aramak için yola çıkana Allah, cennete giden yolu kolaylaştırır.", source: "Câmiʿ et-Tirmizî 2646" },
  { text: "Temizlik imanın yarısıdır.", source: "Sahih Müslim 223" },
  { text: "Allah sizin görünüşlerinize değil, kalplerinize ve amellerinize bakar.", source: "Sahih Müslim 2564" },
  { text: "Allah’ın en sevdiği amel, az da olsa devamlı yapılanıdır.", source: "Sahih el-Buhârî 6464" },
  { text: "Merhamet edenlere Rahmân merhamet eder. Yeryüzündekilere merhamet edin.", source: "Câmiʿ et-Tirmizî 1924" },
  { text: "Güçlü kişi, öfke anında kendine hâkim olabilendir.", source: "Sahih el-Buhârî 6114 · Sahih Müslim 2609" },
  { text: "Sadaka malı eksiltmez; affedenin izzetini Allah artırır.", source: "Sahih Müslim 2588" },
  { text: "Kardeşinin yüzüne gülümsemen senin için bir sadakadır.", source: "Câmiʿ et-Tirmizî 1956" },
  { text: "Güçlü mümin Allah’a daha hayırlı ve daha sevimlidir; her ikisinde de hayır vardır.", source: "Sahih Müslim 2664" },
  { text: "Dünyada bir garip veya yolcu gibi ol.", source: "Sahih el-Buhârî 6416" },
  { text: "Din samimiyettir.", source: "Sahih Müslim 55" },
  { text: "Allah’a en sevimli amel, vaktinde kılınan namazdır.", source: "Sahih el-Buhârî 527" },
  { text: "Kim bir müminin sıkıntısını giderirse Allah da onun ahiret sıkıntılarından birini giderir.", source: "Sahih Müslim 2699" },
  { text: "Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin.", source: "Sahih el-Buhârî 69 · Sahih Müslim 1734" },
  { text: "Doğruluk iyiliğe, iyilik de cennete götürür.", source: "Sahih el-Buhârî 6094 · Sahih Müslim 2607" },
  { text: "Müminin işi ne güzeldir: Bollukta şükreder, darlıkta sabreder.", source: "Sahih Müslim 2999" },
  { text: "Allah kulunun tövbesine, kaybettiğini bulan kişiden daha çok sevinir.", source: "Sahih Müslim 2747" },
  { text: "Bir kimseye hayra vesile olmak, o hayrı yapmak gibidir.", source: "Câmiʿ et-Tirmizî 2670" },
  { text: "Güzel söz sadakadır.", source: "Sahih el-Buhârî 2989 · Sahih Müslim 1009" },
  { text: "Müslüman, insanların elinden ve dilinden emin olduğu kimsedir.", source: "Sahih el-Buhârî 10 · Sahih Müslim 40" },
  { text: "Allah yumuşaktır; yumuşaklığı sever.", source: "Sahih Müslim 2593" }
];

const eventTypes = {
  work: { label: "Çalışma", color: "#6f62bb", icon: "◷" },
  period: { label: "Regl", color: "#c54870", icon: "●" },
  vacation: { label: "İzin / Tatil", color: "#2f9b87", icon: "◇" },
  appointment: { label: "Randevu", color: "#d18b31", icon: "○" },
  other: { label: "Diğer", color: "#8f7482", icon: "·" }
};

const authScreen = document.querySelector("#auth-screen");
const setupForm = document.querySelector("#setup-form");
const unlockForm = document.querySelector("#unlock-form");
const authError = document.querySelector("#auth-error");
const app = document.querySelector("#app");
const viewContainer = document.querySelector("#view-container");
const dialog = document.querySelector("#app-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogEyebrow = document.querySelector("#dialog-eyebrow");
const dialogContent = document.querySelector("#dialog-content");
const toast = document.querySelector("#toast");
const backupFile = document.querySelector("#backup-file");
const birthdayCelebration = document.querySelector("#birthday-celebration");

let state = null;
let encryptionKey = null;
let vaultSalt = null;
let currentView = "today";
let selectedDate = localISO(new Date());
let prayerDate = selectedDate;
let calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let watchFilter = "all";
let saveQueue = Promise.resolve();
let toastTimer = null;
let autoLockTimer = null;

function localISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISO(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatDate(value, options = { weekday: "long", day: "numeric", month: "long" }) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return new Intl.DateTimeFormat("tr-TR", options).format(date);
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveKey(pin, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function initialState(name) {
  return {
    version: 1,
    profile: { name: name.trim(), birthday: BIRTHDAY, createdAt: new Date().toISOString() },
    events: [
      {
        id: "civil-wedding-2027-04-16",
        title: "Nikâh günümüz 💍",
        type: "appointment",
        startDate: "2027-04-16",
        endDate: "2027-04-16",
        startTime: "",
        endTime: "",
        notes: "Resmî nikâhımızın günü.",
        updatedAt: new Date().toISOString()
      }
    ],
    diary: [],
    watchlist: [],
    prayers: {},
    updatedAt: new Date().toISOString()
  };
}

async function encryptSnapshot(snapshot) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, encryptionKey, new TextEncoder().encode(snapshot));
  const vault = {
    version: 1,
    salt: bytesToBase64(vaultSalt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
}

function queueSave() {
  state.updatedAt = new Date().toISOString();
  const snapshot = JSON.stringify(state);
  saveQueue = saveQueue.then(() => encryptSnapshot(snapshot)).catch(() => showToast("Kaydedilemedi. Lütfen tekrar dene."));
  return saveQueue;
}

async function unlockVault(pin) {
  const vault = JSON.parse(localStorage.getItem(STORAGE_KEY));
  vaultSalt = base64ToBytes(vault.salt);
  const key = await deriveKey(pin, vaultSalt);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(vault.iv) },
    key,
    base64ToBytes(vault.ciphertext)
  );
  encryptionKey = key;
  state = JSON.parse(new TextDecoder().decode(plain));
}

async function createVault(name, pin) {
  vaultSalt = crypto.getRandomValues(new Uint8Array(16));
  encryptionKey = await deriveKey(pin, vaultSalt);
  state = initialState(name);
  await queueSave();
}

function showAuthError(message) {
  authError.textContent = message;
  authError.hidden = false;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function resetAutoLock() {
  clearTimeout(autoLockTimer);
  if (!state) return;
  autoLockTimer = setTimeout(lockApp, 30 * 60 * 1000);
}

function enterApp() {
  authScreen.hidden = true;
  app.hidden = false;
  document.body.classList.add("app-open");
  currentView = "today";
  updateNavigation();
  renderCurrentView();
  resetAutoLock();
  registerWebMCP();
  launchBirthdayCelebration();
}

function launchBirthdayCelebration() {
  if (localISO(new Date()) !== BIRTHDAY || sessionStorage.getItem("birthday-celebrated")) return;
  sessionStorage.setItem("birthday-celebrated", "yes");
  const symbols = ["♡", "✦", "✨", "🌸"];
  for (let index = 0; index < 36; index += 1) {
    const piece = document.createElement("span");
    piece.className = "birthday-piece";
    piece.textContent = symbols[index % symbols.length];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--size", `${.9 + Math.random() * 1.5}rem`);
    piece.style.setProperty("--delay", `${Math.random() * 1.8}s`);
    piece.style.setProperty("--duration", `${4 + Math.random() * 2.5}s`);
    piece.style.setProperty("--drift", `${-70 + Math.random() * 140}px`);
    birthdayCelebration.appendChild(piece);
  }
  setTimeout(() => birthdayCelebration.replaceChildren(), 8500);
}

function lockApp() {
  clearTimeout(autoLockTimer);
  state = null;
  encryptionKey = null;
  app.hidden = true;
  authScreen.hidden = false;
  setupForm.hidden = true;
  unlockForm.hidden = false;
  unlockForm.reset();
  authError.hidden = true;
  document.body.classList.remove("app-open");
  document.querySelector("#unlock-pin").focus();
}

function updateNavigation() {
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === currentView));
}

function setView(view) {
  currentView = view;
  updateNavigation();
  renderCurrentView();
  document.querySelector(".main-area").scrollTo({ top: 0, behavior: "smooth" });
}

function headerHTML(eyebrow, title, subtitle, action = "") {
  return `<header class="view-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${subtitle ? `<p class="view-subtitle">${subtitle}</p>` : ""}</div>${action ? `<div class="header-actions">${action}</div>` : ""}</header>`;
}

function birthdayHTML() {
  const today = parseISO(localISO(new Date()));
  const birthday = parseISO(BIRTHDAY);
  const distance = Math.round((birthday - today) / 86400000);
  if (distance > 0) {
    return `<article class="surface birthday-card"><p class="eyebrow">Doğum gününe</p><h2>${distance} gün kaldı</h2><p>21 Eylül yaklaşıyor. Bu küçük dünya, güzel günlerini biriktirsin diye hazırlandı.</p><div class="countdown-row"><div class="countdown-chip"><strong>${distance}</strong><small>gün</small></div><div class="countdown-chip"><strong>21</strong><small>eylül</small></div><div class="countdown-chip"><strong>♡</strong><small>senin</small></div></div></article>`;
  }
  if (distance === 0) {
    return `<article class="surface birthday-card"><p class="eyebrow">Bugün senin günün</p><h2>İyi ki doğdun!</h2><p>Hayatıma kattığın her güzellik için teşekkür ederim. Gülüşün hiç eksilmesin, kalbin hep huzurla dolsun.</p><div class="birthday-message"><strong>Seni çok seviyorum ♡</strong><span>Bugün ve her gün, iyi ki varsın.</span></div></article>`;
  }
  return `<article class="surface birthday-card"><p class="eyebrow">21 · 09 · 2026</p><h2>İyi ki doğdun</h2><p>Bu küçük dünya o güzel günün hatırası; yeni anılarla büyümeye devam etsin.</p></article>`;
}

function getDailyHadith() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const day = Math.floor((today - start) / 86400000);
  return hadiths[day % hadiths.length];
}

function eventsForDate(date) {
  return state.events.filter((event) => event.startDate <= date && (event.endDate || event.startDate) >= date);
}

function eventTime(event) {
  if (event.startTime && event.endTime) return `${event.startTime}–${event.endTime}`;
  if (event.startTime) return event.startTime;
  if (event.startDate !== event.endDate) return `${formatDate(event.startDate, { day: "numeric", month: "short" })}–${formatDate(event.endDate, { day: "numeric", month: "short" })}`;
  return eventTypes[event.type]?.label || "Kayıt";
}

function emptyHTML(icon, text) {
  return `<div class="empty-state"><span aria-hidden="true">${icon}</span><p>${text}</p></div>`;
}

function renderToday() {
  const today = localISO(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "Günaydın" : hour < 18 ? "Güzel bir gün" : "İyi akşamlar";
  const checked = prayers.filter((prayer) => state.prayers[today]?.[prayer.id]).length;
  const hadith = getDailyHadith();
  const upcoming = state.events
    .filter((event) => (event.endDate || event.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || (a.startTime || "").localeCompare(b.startTime || ""))
    .slice(0, 4);

  viewContainer.innerHTML = `
    ${headerHTML("Bugün", `${greeting}, ${escapeHTML(state.profile.name)}`, formatDate(new Date()), `<button class="icon-button" data-action="lock" aria-label="Uygulamayı kilitle">⌁</button>`)}
    <div class="dashboard-grid">
      <div class="stack">
        ${birthdayHTML()}
        <section class="surface hadith-card">
          <div class="section-heading"><div><h2>Günün hadisi</h2><p>Her güne küçük bir hatırlatma</p></div><span class="hadith-mark" aria-hidden="true">“</span></div>
          <p class="hadith-text">${hadith.text}</p>
          <p class="hadith-source">${hadith.source}</p>
        </section>
      </div>
      <div class="stack">
        <section class="surface surface-inner">
          <div class="section-heading"><div><h2>Bugünün namazları</h2><p>${checked}/5 tamamlandı</p></div><button class="section-link" data-view="prayer">Detaylar</button></div>
          <div class="prayer-summary"><div class="progress-ring" style="--progress:${checked * 72}deg"><strong>${checked}/5</strong></div><p class="view-subtitle">Her işaret, kendine ayırdığın huzurlu bir an.</p></div>
          <div class="prayer-mini-list">${prayers.map((prayer) => `<button class="prayer-mini ${state.prayers[today]?.[prayer.id] ? "done" : ""}" data-action="toggle-prayer" data-prayer="${prayer.id}" data-date="${today}"><span>${state.prayers[today]?.[prayer.id] ? "✓" : prayer.symbol}</span>${prayer.name}</button>`).join("")}</div>
        </section>
        <section class="surface surface-inner">
          <div class="section-heading"><div><h2>Yaklaşanlar</h2><p>Takviminden</p></div><button class="section-link" data-action="new-event" data-date="${today}">Yeni ekle</button></div>
          <div class="event-list">${upcoming.length ? upcoming.map((event) => eventRowHTML(event)).join("") : emptyHTML("◇", "Henüz yaklaşan bir kayıt yok.")}</div>
        </section>
      </div>
    </div>`;
}

function eventRowHTML(event, withActions = false) {
  const type = eventTypes[event.type] || eventTypes.other;
  return `<article class="list-row"><span class="list-icon" style="background:${type.color}20;color:${type.color}">${type.icon}</span><div><h3>${escapeHTML(event.title)}</h3><p>${formatDate(event.startDate, { day: "numeric", month: "short", year: "numeric" })} · ${eventTime(event)}</p></div>${withActions ? `<div class="row-actions"><button class="tiny-button" data-action="edit-event" data-id="${event.id}" aria-label="Düzenle">✎</button><button class="tiny-button" data-action="delete-event" data-id="${event.id}" aria-label="Sil">×</button></div>` : ""}</article>`;
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const first = new Date(year, month, 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const gridStart = addDays(first, -mondayIndex);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const selectedEvents = eventsForDate(selectedDate);
  const monthLabel = formatDate(first, { month: "long", year: "numeric" });

  viewContainer.innerHTML = `
    ${headerHTML("Planın", "Takvim", "Çalışma, izin, regl günleri ve tüm planların.", `<button class="solid-button" data-action="new-event" data-date="${selectedDate}">+ <span class="hide-mobile">Yeni kayıt</span></button>`)}
    <div class="calendar-layout">
      <section class="surface calendar-card">
        <div class="calendar-toolbar"><h2>${monthLabel}</h2><div class="calendar-arrows"><button class="icon-button" data-action="calendar-prev" aria-label="Önceki ay">‹</button><button class="icon-button" data-action="calendar-next" aria-label="Sonraki ay">›</button></div></div>
        <div class="calendar-weekdays"><span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span></div>
        <div class="calendar-grid">${days.map((day) => {
          const iso = localISO(day);
          const dayEvents = eventsForDate(iso);
          const classes = ["day-cell", day.getMonth() !== month ? "outside" : "", iso === localISO(new Date()) ? "today" : "", iso === selectedDate ? "selected" : ""].filter(Boolean).join(" ");
          return `<button class="${classes}" data-action="select-day" data-date="${iso}"><span class="day-number">${day.getDate()}</span><span class="event-dots">${dayEvents.slice(0, 4).map((event) => `<i class="event-dot" style="--dot:${eventTypes[event.type]?.color || eventTypes.other.color}"></i>`).join("")}</span>${dayEvents[0] ? `<span class="event-label">${escapeHTML(dayEvents[0].title)}</span>` : ""}</button>`;
        }).join("")}</div>
        <div class="legend">${Object.values(eventTypes).map((type) => `<span><i style="--dot:${type.color}"></i>${type.label}</span>`).join("")}</div>
      </section>
      <aside class="surface selected-day">
        <p class="eyebrow">Seçili gün</p><h2 class="selected-day-date">${formatDate(selectedDate)}</h2>
        <div class="event-list">${selectedEvents.length ? selectedEvents.map((event) => eventRowHTML(event, true)).join("") : emptyHTML("○", "Bu gün için henüz kayıt yok.")}</div>
        <button class="solid-button" style="width:100%;margin-top:1rem" data-action="new-event" data-date="${selectedDate}">+ Bu güne ekle</button>
      </aside>
    </div>`;
}

function renderDiary() {
  const entries = [...state.diary].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  viewContainer.innerHTML = `
    ${headerHTML("Kendine ait", "Günlük", "Düşüncelerin burada güvende.", `<button class="solid-button" data-action="new-diary">+ <span class="hide-mobile">Yeni sayfa</span></button>`)}
    <div class="diary-grid">${entries.length ? entries.map((entry) => `<article class="surface diary-card" data-action="edit-diary" data-id="${entry.id}"><span class="mood">${entry.mood}</span><time>${formatDate(entry.date, { day: "numeric", month: "long", year: "numeric" })}</time><h2>${escapeHTML(entry.title || "Bugünden...")}</h2><p>${escapeHTML(entry.body)}</p></article>`).join("") : emptyHTML("✎", "İlk sayfan seni bekliyor. Bugün nasıl hissettiğini yazabilirsin.")}</div>`;
}

function renderWatch() {
  const filtered = state.watchlist.filter((item) => watchFilter === "all" || item.status === watchFilter);
  const watched = state.watchlist.filter((item) => item.status === "watched").length;
  viewContainer.innerHTML = `
    ${headerHTML("Küçük arşivin", "İzlediklerim", `${watched} yapım tamamlandı · ${state.watchlist.length} toplam`, `<button class="solid-button" data-action="new-media">+ <span class="hide-mobile">Film / dizi</span></button>`)}
    <div class="filter-row"><button class="filter-button ${watchFilter === "all" ? "active" : ""}" data-action="filter-media" data-filter="all">Tümü</button><button class="filter-button ${watchFilter === "watching" ? "active" : ""}" data-action="filter-media" data-filter="watching">İzliyorum</button><button class="filter-button ${watchFilter === "planned" ? "active" : ""}" data-action="filter-media" data-filter="planned">Listemde</button><button class="filter-button ${watchFilter === "watched" ? "active" : ""}" data-action="filter-media" data-filter="watched">İzledim</button></div>
    <div class="media-list">${filtered.length ? filtered.map((item) => {
      const statusLabels = { watched: "İzledim", watching: "İzliyorum", planned: "Listemde" };
      return `<article class="surface media-card"><div class="media-cover">${escapeHTML(item.title.charAt(0).toLocaleUpperCase("tr-TR"))}</div><div class="media-meta"><h2>${escapeHTML(item.title)}</h2><p>${item.type === "series" ? "Dizi" : "Film"} · ${statusLabels[item.status]}</p>${item.rating ? `<p class="stars">${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}</p>` : ""}${item.notes ? `<p>${escapeHTML(item.notes)}</p>` : ""}<div class="media-tags"><span class="tag">${statusLabels[item.status]}</span><button class="tiny-button" data-action="edit-media" data-id="${item.id}" aria-label="Düzenle">✎</button><button class="tiny-button" data-action="delete-media" data-id="${item.id}" aria-label="Sil">×</button></div></div></article>`;
    }).join("") : emptyHTML("▷", "Bu bölüm henüz boş. İlk film veya dizini ekle.")}</div>`;
}

function renderPrayer() {
  const checked = prayers.filter((prayer) => state.prayers[prayerDate]?.[prayer.id]).length;
  const selected = parseISO(prayerDate);
  const weekStart = addDays(selected, -((selected.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  viewContainer.innerHTML = `
    ${headerHTML("Huzur anların", "İbadet", "Namazlarını işaretle, devamlılığını nazikçe takip et.")}
    <div class="prayer-page-grid">
      <section class="surface surface-inner">
        <div class="date-switcher"><button class="icon-button" data-action="prayer-prev" aria-label="Önceki gün">‹</button><strong>${formatDate(prayerDate)}</strong><button class="icon-button" data-action="prayer-next" aria-label="Sonraki gün">›</button></div>
        <div class="prayer-list">${prayers.map((prayer) => {
          const done = state.prayers[prayerDate]?.[prayer.id];
          return `<label class="prayer-check ${done ? "done" : ""}"><input type="checkbox" data-action="toggle-prayer" data-prayer="${prayer.id}" data-date="${prayerDate}" ${done ? "checked" : ""}/><span class="custom-check">✓</span><span><strong>${prayer.name}</strong><small>${prayer.note}</small></span><span class="prayer-symbol">${prayer.symbol}</span></label>`;
        }).join("")}</div>
      </section>
      <section class="surface surface-inner">
        <div class="section-heading"><div><h2>Bu haftanın ritmi</h2><p>${checked}/5 bugün tamamlandı</p></div><div class="progress-ring" style="--progress:${checked * 72}deg;width:4.2rem;height:4.2rem"><strong>${checked}</strong></div></div>
        <div class="week-bars">${week.map((day) => {
          const iso = localISO(day);
          const count = prayers.filter((prayer) => state.prayers[iso]?.[prayer.id]).length;
          return `<div class="week-bar-wrap"><div class="week-bar" style="height:${Math.max(6, count * 18)}%" title="${count}/5"></div><span>${formatDate(day, { weekday: "short" }).slice(0,2)}</span></div>`;
        }).join("")}</div>
      </section>
    </div>`;
}

function renderSettings() {
  viewContainer.innerHTML = `
    ${headerHTML("Kontrol sende", "Ayarlar", "Gizlilik, yedekleme ve kişisel bilgiler.")}
    <div class="settings-grid">
      <section class="surface settings-card"><h2>Profilin</h2><p>Uygulamada görünen ismini değiştirebilirsin.</p><form id="profile-form" class="dialog-form"><label><span>Adın</span><input name="name" value="${escapeHTML(state.profile.name)}" required /></label><button class="solid-button" type="submit">Kaydet</button></form></section>
      <section class="surface settings-card"><h2>Şifreli yedek</h2><p>Tüm kayıtlarını tek bir şifreli dosya olarak indir. Yeni cihazda aynı PIN ile geri yükleyebilirsin.</p><div class="button-row"><button class="solid-button" data-action="export-backup">Yedeği indir</button><button class="soft-button" data-action="import-backup">Yedek yükle</button></div></section>
      <section class="surface settings-card"><h2>PIN ve kilit</h2><p>PIN’in olmadan içeriklerin okunamaz. 30 dakika hareketsizlikte uygulama kendini kilitler.</p><div class="button-row"><button class="soft-button" data-action="change-pin">PIN değiştir</button><button class="soft-button" data-action="lock">Şimdi kilitle</button></div></section>
      <section class="surface settings-card"><h2>Gizliliğin</h2><p>Takvim, regl bilgileri, günlük ve listelerin şifreli biçimde yalnızca bu cihazda tutulur. Sunucuya gönderilmez.</p><span class="tag">AES‑GCM ile şifreli</span></section>
    </div>`;
  document.querySelector("#profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    state.profile.name = new FormData(event.currentTarget).get("name").trim();
    await queueSave();
    showToast("İsmin güncellendi.");
    renderSettings();
  });
}

function renderCurrentView() {
  if (!state) return;
  const renderers = { today: renderToday, calendar: renderCalendar, diary: renderDiary, watch: renderWatch, prayer: renderPrayer, settings: renderSettings };
  (renderers[currentView] || renderToday)();
}

function openDialog(eyebrow, title, content) {
  dialogEyebrow.textContent = eyebrow;
  dialogTitle.textContent = title;
  dialogContent.innerHTML = content;
  dialog.showModal();
}

function closeDialog() {
  if (dialog.open) dialog.close();
}

function openEventForm(id = null, date = selectedDate) {
  const existing = id ? state.events.find((event) => event.id === id) : null;
  const item = existing || { title: "", type: "work", startDate: date, endDate: date, startTime: "", endTime: "", notes: "" };
  openDialog(existing ? "Kayıt" : "Takvim", existing ? "Kaydı düzenle" : "Yeni kayıt", `
    <form class="dialog-form" id="event-form">
      <label><span>Başlık</span><input name="title" value="${escapeHTML(item.title)}" placeholder="Örn. Sabah vardiyası" required /></label>
      <label><span>Tür</span><select name="type">${Object.entries(eventTypes).map(([key, value]) => `<option value="${key}" ${item.type === key ? "selected" : ""}>${value.label}</option>`).join("")}</select></label>
      <div class="form-grid"><label><span>Başlangıç</span><input type="date" name="startDate" value="${item.startDate}" required /></label><label><span>Bitiş</span><input type="date" name="endDate" value="${item.endDate || item.startDate}" required /></label></div>
      <div class="form-grid"><label><span>Başlangıç saati</span><input type="time" name="startTime" value="${item.startTime || ""}" /></label><label><span>Bitiş saati</span><input type="time" name="endTime" value="${item.endTime || ""}" /></label></div>
      <label><span>Not</span><textarea name="notes" placeholder="İstersen küçük bir not ekle">${escapeHTML(item.notes || "")}</textarea></label>
      <div class="dialog-actions"><button class="soft-button dialog-close" type="button">Vazgeç</button><button class="solid-button" type="submit">Kaydet</button></div>
    </form>`);
  document.querySelector("#event-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.endDate < values.startDate) return showToast("Bitiş tarihi başlangıçtan önce olamaz.");
    const record = { ...item, ...values, id: existing?.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (existing) state.events = state.events.map((entry) => entry.id === existing.id ? record : entry);
    else state.events.push(record);
    selectedDate = record.startDate;
    calendarCursor = new Date(parseISO(record.startDate).getFullYear(), parseISO(record.startDate).getMonth(), 1);
    await queueSave();
    closeDialog();
    showToast("Takvime kaydedildi.");
    renderCurrentView();
  });
}

function openDiaryForm(id = null) {
  const existing = id ? state.diary.find((entry) => entry.id === id) : null;
  const item = existing || { date: localISO(new Date()), title: "", mood: "😊", body: "" };
  openDialog(existing ? "Günlük" : "Yeni sayfa", existing ? "Sayfanı düzenle" : "Bugünden...", `
    <form class="dialog-form" id="diary-form">
      <div class="form-grid"><label><span>Tarih</span><input type="date" name="date" value="${item.date}" required /></label><label><span>Bugünkü ruh hâlin</span><select name="mood"><option ${item.mood === "😊" ? "selected" : ""}>😊</option><option ${item.mood === "🥰" ? "selected" : ""}>🥰</option><option ${item.mood === "😌" ? "selected" : ""}>😌</option><option ${item.mood === "🥺" ? "selected" : ""}>🥺</option><option ${item.mood === "😔" ? "selected" : ""}>😔</option><option ${item.mood === "😴" ? "selected" : ""}>😴</option></select></label></div>
      <label><span>Başlık</span><input name="title" value="${escapeHTML(item.title)}" placeholder="Bugünün başlığı" /></label>
      <label><span>İçinden geçenler</span><textarea name="body" placeholder="Bugün nasıl geçti?" required>${escapeHTML(item.body)}</textarea></label>
      <div class="dialog-actions">${existing ? `<button class="danger-button" type="button" data-action="delete-diary" data-id="${existing.id}">Sil</button>` : ""}<button class="soft-button dialog-close" type="button">Vazgeç</button><button class="solid-button" type="submit">Kaydet</button></div>
    </form>`);
  document.querySelector("#diary-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const record = { ...item, ...values, id: existing?.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (existing) state.diary = state.diary.map((entry) => entry.id === existing.id ? record : entry);
    else state.diary.push(record);
    await queueSave();
    closeDialog();
    showToast("Günlüğüne kaydedildi.");
    renderDiary();
  });
}

function openMediaForm(id = null) {
  const existing = id ? state.watchlist.find((entry) => entry.id === id) : null;
  const item = existing || { title: "", type: "movie", status: "planned", rating: 0, notes: "" };
  openDialog(existing ? "Arşiv" : "Yeni yapım", existing ? "Kaydı düzenle" : "Film veya dizi ekle", `
    <form class="dialog-form" id="media-form">
      <label><span>Adı</span><input name="title" value="${escapeHTML(item.title)}" placeholder="Film veya dizinin adı" required /></label>
      <div class="form-grid"><label><span>Tür</span><select name="type"><option value="movie" ${item.type === "movie" ? "selected" : ""}>Film</option><option value="series" ${item.type === "series" ? "selected" : ""}>Dizi</option></select></label><label><span>Durum</span><select name="status"><option value="planned" ${item.status === "planned" ? "selected" : ""}>Listemde</option><option value="watching" ${item.status === "watching" ? "selected" : ""}>İzliyorum</option><option value="watched" ${item.status === "watched" ? "selected" : ""}>İzledim</option></select></label></div>
      <label><span>Puanın</span><select name="rating"><option value="0">Henüz puan yok</option>${[1,2,3,4,5].map((rating) => `<option value="${rating}" ${Number(item.rating) === rating ? "selected" : ""}>${"★".repeat(rating)}${"☆".repeat(5-rating)}</option>`).join("")}</select></label>
      <label><span>Notun</span><textarea name="notes" placeholder="Neyi sevdin, kiminle izledin?">${escapeHTML(item.notes || "")}</textarea></label>
      <div class="dialog-actions"><button class="soft-button dialog-close" type="button">Vazgeç</button><button class="solid-button" type="submit">Kaydet</button></div>
    </form>`);
  document.querySelector("#media-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.rating = Number(values.rating);
    const record = { ...item, ...values, id: existing?.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (existing) state.watchlist = state.watchlist.map((entry) => entry.id === existing.id ? record : entry);
    else state.watchlist.push(record);
    await queueSave();
    closeDialog();
    showToast("Listene kaydedildi.");
    renderWatch();
  });
}

function openPinForm() {
  openDialog("Güvenlik", "PIN değiştir", `<form class="dialog-form" id="pin-form"><label><span>Mevcut PIN</span><input type="password" inputmode="numeric" name="current" required minlength="4" /></label><div class="form-grid"><label><span>Yeni PIN</span><input type="password" inputmode="numeric" name="next" required minlength="4" maxlength="12" /></label><label><span>Yeni PIN tekrar</span><input type="password" inputmode="numeric" name="confirm" required minlength="4" maxlength="12" /></label></div><div class="dialog-actions"><button class="soft-button dialog-close" type="button">Vazgeç</button><button class="solid-button" type="submit">PIN’i değiştir</button></div></form>`);
  document.querySelector("#pin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!/^\d{4,12}$/.test(values.next)) return showToast("Yeni PIN 4–12 rakam olmalı.");
    if (values.next !== values.confirm) return showToast("Yeni PIN’ler eşleşmiyor.");
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const testKey = await deriveKey(values.current, base64ToBytes(stored.salt));
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(stored.iv) }, testKey, base64ToBytes(stored.ciphertext));
      vaultSalt = crypto.getRandomValues(new Uint8Array(16));
      encryptionKey = await deriveKey(values.next, vaultSalt);
      await queueSave();
      closeDialog();
      showToast("PIN’in değiştirildi.");
    } catch {
      showToast("Mevcut PIN doğru değil.");
    }
  });
}

async function togglePrayer(date, prayerId) {
  state.prayers[date] ||= {};
  state.prayers[date][prayerId] = !state.prayers[date][prayerId];
  await queueSave();
  renderCurrentView();
}

async function deleteById(collection, id, message) {
  if (!confirm("Bu kaydı silmek istediğine emin misin?")) return;
  state[collection] = state[collection].filter((entry) => entry.id !== id);
  await queueSave();
  closeDialog();
  showToast(message);
  renderCurrentView();
}

function exportBackup() {
  const payload = { app: "Senin Dünyan", exportedAt: new Date().toISOString(), vault: JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `senin-dunyan-yedek-${localISO(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Şifreli yedeğin indirildi.");
}

async function importBackup(file) {
  try {
    const payload = JSON.parse(await file.text());
    const vault = payload.vault || payload;
    if (vault.version !== 1 || !vault.salt || !vault.iv || !vault.ciphertext) throw new Error("invalid");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
    showToast("Yedek yüklendi. PIN’inle açabilirsin.");
    setTimeout(() => location.reload(), 700);
  } catch {
    showToast("Bu dosya geçerli bir yedek değil.");
  }
}

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool || window.__seninDunyanTools) return;
  window.__seninDunyanTools = true;
  const register = (tool) => Promise.resolve(context.registerTool(tool)).catch(() => {});
  register({
    name: "create_calendar_entry",
    title: "Takvim kaydı oluştur",
    description: "Kilidi açık Senin Dünyan uygulamasında çalışma, regl, tatil, randevu veya diğer türde takvim kaydı oluşturur.",
    inputSchema: { type: "object", properties: { title: { type: "string", minLength: 1 }, type: { type: "string", enum: Object.keys(eventTypes) }, startDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, endDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, startTime: { type: "string" }, endTime: { type: "string" }, notes: { type: "string" } }, required: ["title", "type", "startDate"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      if (!state) throw new Error("Uygulama kilitli.");
      if (!input.title?.trim() || !eventTypes[input.type] || !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) throw new Error("Geçersiz takvim kaydı.");
      const endDate = input.endDate || input.startDate;
      if (endDate < input.startDate) throw new Error("Bitiş tarihi başlangıçtan önce olamaz.");
      const entry = { id: crypto.randomUUID(), title: input.title.trim(), type: input.type, startDate: input.startDate, endDate, startTime: input.startTime || "", endTime: input.endTime || "", notes: input.notes || "", updatedAt: new Date().toISOString() };
      state.events.push(entry);
      await queueSave();
      if (currentView === "calendar" || currentView === "today") renderCurrentView();
      return { id: entry.id, saved: true, startDate: entry.startDate };
    }
  });
  register({
    name: "check_prayer",
    title: "Namazı tamamlandı işaretle",
    description: "Kilidi açık uygulamada seçilen namazı belirtilen gün için tamamlandı olarak işaretler.",
    inputSchema: { type: "object", properties: { prayer: { type: "string", enum: prayers.map((item) => item.id) }, date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } }, required: ["prayer"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      if (!state) throw new Error("Uygulama kilitli.");
      const date = input.date || localISO(new Date());
      if (!prayers.some((item) => item.id === input.prayer) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Geçersiz namaz kaydı.");
      state.prayers[date] ||= {};
      state.prayers[date][input.prayer] = true;
      await queueSave();
      if (currentView === "prayer" || currentView === "today") renderCurrentView();
      return { prayer: input.prayer, date, completed: true };
    }
  });
}

setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.querySelector("#setup-name").value.trim();
  const pin = document.querySelector("#setup-pin").value;
  const confirmation = document.querySelector("#setup-pin-confirm").value;
  if (!/^\d{4,12}$/.test(pin)) return showToast("PIN 4–12 rakamdan oluşmalı.");
  if (pin !== confirmation) return showToast("PIN’ler eşleşmiyor.");
  try {
    await createVault(name, pin);
    setupForm.reset();
    enterApp();
  } catch {
    showToast("Özel alan oluşturulamadı.");
  }
});

unlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authError.hidden = true;
  try {
    await unlockVault(document.querySelector("#unlock-pin").value);
    unlockForm.reset();
    enterApp();
  } catch {
    showAuthError("PIN doğru değil. Lütfen tekrar dene.");
  }
});

document.addEventListener("click", async (event) => {
  resetAutoLock();
  const close = event.target.closest(".dialog-close");
  if (close) return closeDialog();
  const nav = event.target.closest("[data-view]");
  if (nav) return setView(nav.dataset.view);
  const action = event.target.closest("[data-action]");
  if (!action || !state) return;
  const { id, date, prayer, filter } = action.dataset;
  switch (action.dataset.action) {
    case "lock": lockApp(); break;
    case "new-event": openEventForm(null, date || selectedDate); break;
    case "edit-event": openEventForm(id); break;
    case "delete-event": await deleteById("events", id, "Takvim kaydı silindi."); break;
    case "select-day": selectedDate = date; renderCalendar(); break;
    case "calendar-prev": calendarCursor.setMonth(calendarCursor.getMonth() - 1); renderCalendar(); break;
    case "calendar-next": calendarCursor.setMonth(calendarCursor.getMonth() + 1); renderCalendar(); break;
    case "new-diary": openDiaryForm(); break;
    case "edit-diary": openDiaryForm(id); break;
    case "delete-diary": await deleteById("diary", id, "Günlük sayfası silindi."); break;
    case "new-media": openMediaForm(); break;
    case "edit-media": openMediaForm(id); break;
    case "delete-media": await deleteById("watchlist", id, "Kayıt listeden silindi."); break;
    case "filter-media": watchFilter = filter; renderWatch(); break;
    case "toggle-prayer": await togglePrayer(date, prayer); break;
    case "prayer-prev": prayerDate = localISO(addDays(parseISO(prayerDate), -1)); renderPrayer(); break;
    case "prayer-next": prayerDate = localISO(addDays(parseISO(prayerDate), 1)); renderPrayer(); break;
    case "export-backup": exportBackup(); break;
    case "import-backup": backupFile.click(); break;
    case "change-pin": openPinForm(); break;
  }
});

document.querySelector("#mobile-lock").addEventListener("click", lockApp);
document.querySelectorAll(".restore-auth").forEach((button) => button.addEventListener("click", () => backupFile.click()));
backupFile.addEventListener("change", () => backupFile.files[0] && importBackup(backupFile.files[0]));
document.addEventListener("keydown", resetAutoLock);
document.addEventListener("visibilitychange", () => { if (!document.hidden) resetAutoLock(); });
dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDialog(); });

if (localStorage.getItem(STORAGE_KEY)) {
  setupForm.hidden = true;
  unlockForm.hidden = false;
} else {
  setupForm.hidden = false;
  unlockForm.hidden = true;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}
