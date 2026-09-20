"use strict";

const STORAGE_KEY = "senin-dunyan-vault-v1";
const LANGUAGE_KEY = "senin-dunyan-language";
const BIRTHDAY = "2026-09-21";
const i18n = window.SENIN_DUNYAN_I18N;
let uiLanguage = localStorage.getItem(LANGUAGE_KEY) === "tr" ? "tr" : "de";

function t(key, values = {}) {
  let text = i18n[uiLanguage]?.[key] ?? i18n.de[key] ?? key;
  Object.entries(values).forEach(([name, value]) => { text = text.replaceAll(`{${name}}`, value); });
  return text;
}

function translateStaticUI() {
  document.documentElement.lang = uiLanguage;
  document.querySelector('meta[name="description"]').content = t("meta.description");
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => { element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel)); });
  document.querySelectorAll("[data-language]").forEach((button) => button.classList.toggle("active", button.dataset.language === uiLanguage));
}

function setLanguage(language) {
  if (!i18n[language]) return;
  uiLanguage = language;
  localStorage.setItem(LANGUAGE_KEY, language);
  translateStaticUI();
  if (dialog.open) closeDialog();
  if (state) renderCurrentView();
}

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

const lifeModules = {
  wishes: { icon: "♡", color: "#c54870" },
  cycle: { icon: "◉", color: "#a83264" },
  habits: { icon: "✓", color: "#2f9b87" },
  tasks: { icon: "☑", color: "#6f62bb" },
  moods: { icon: "☺", color: "#d18b31" },
  us: { icon: "∞", color: "#b13c6e" },
  recipes: { icon: "♨", color: "#c26a3f" },
  duas: { icon: "☾", color: "#4f689e" },
  health: { icon: "+", color: "#3f8f72" },
  finance: { icon: "€", color: "#94732c" },
  birthdays: { icon: "✦", color: "#9a4771" },
  motivation: { icon: "☀", color: "#c9852f" }
};

const motivationKeys = Array.from({ length: 12 }, (_, index) => `motivation.${index + 1}`);

const mediaCatalog = [
  { id: "catalog-mcu-iron-man", title: "Iron Man", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-incredible-hulk", title: "The Incredible Hulk", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-iron-man-2", title: "Iron Man 2", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-thor", title: "Thor", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-captain-america-first-avenger", title: "Captain America: The First Avenger", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-avengers", title: "The Avengers", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-iron-man-3", title: "Iron Man 3", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-thor-dark-world", title: "Thor: The Dark World", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-captain-america-winter-soldier", title: "Captain America: The Winter Soldier", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-guardians-galaxy", title: "Guardians of the Galaxy", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-avengers-age-ultron", title: "Avengers: Age of Ultron", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-ant-man", title: "Ant-Man", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-civil-war", title: "Captain America: Civil War", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-doctor-strange", title: "Doctor Strange", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-guardians-galaxy-2", title: "Guardians of the Galaxy Vol. 2", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-spider-man-homecoming", title: "Spider-Man: Homecoming", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-thor-ragnarok", title: "Thor: Ragnarok", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-black-panther", title: "Black Panther", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-infinity-war", title: "Avengers: Infinity War", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-ant-man-wasp", title: "Ant-Man and the Wasp", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-captain-marvel", title: "Captain Marvel", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-endgame", title: "Avengers: Endgame", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-spider-man-far-home", title: "Spider-Man: Far From Home", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-black-widow", title: "Black Widow", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-shang-chi", title: "Shang-Chi and the Legend of the Ten Rings", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-eternals", title: "Eternals", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-spider-man-no-way-home", title: "Spider-Man: No Way Home", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-doctor-strange-multiverse", title: "Doctor Strange in the Multiverse of Madness", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-thor-love-thunder", title: "Thor: Love and Thunder", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-wakanda-forever", title: "Black Panther: Wakanda Forever", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-quantumania", title: "Ant-Man and the Wasp: Quantumania", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-guardians-galaxy-3", title: "Guardians of the Galaxy Vol. 3", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-the-marvels", title: "The Marvels", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-deadpool-wolverine", title: "Deadpool & Wolverine", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-captain-america-brave-new-world", title: "Captain America: Brave New World", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-thunderbolts", title: "Thunderbolts*", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-fantastic-four-first-steps", title: "The Fantastic Four: First Steps", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-mcu-spider-man-brand-new-day", title: "Spider-Man: Brand New Day", type: "movie", collection: "Marvel · MCU" },
  { id: "catalog-avatar-last-airbender", title: "Avatar: Der Herr der Elemente", type: "series", collection: "Avatar" },
  { id: "catalog-hp-philosophers-stone", title: "Harry Potter und der Stein der Weisen", type: "movie", collection: "Harry Potter" },
  { id: "catalog-hp-chamber-secrets", title: "Harry Potter und die Kammer des Schreckens", type: "movie", collection: "Harry Potter" },
  { id: "catalog-hp-prisoner-azkaban", title: "Harry Potter und der Gefangene von Askaban", type: "movie", collection: "Harry Potter" },
  { id: "catalog-hp-goblet-fire", title: "Harry Potter und der Feuerkelch", type: "movie", collection: "Harry Potter" },
  { id: "catalog-hp-order-phoenix", title: "Harry Potter und der Orden des Phönix", type: "movie", collection: "Harry Potter" },
  { id: "catalog-hp-half-blood-prince", title: "Harry Potter und der Halbblutprinz", type: "movie", collection: "Harry Potter" },
  { id: "catalog-hp-deathly-hallows-1", title: "Harry Potter und die Heiligtümer des Todes – Teil 1", type: "movie", collection: "Harry Potter" },
  { id: "catalog-hp-deathly-hallows-2", title: "Harry Potter und die Heiligtümer des Todes – Teil 2", type: "movie", collection: "Harry Potter" }
];
const completeMediaCatalog = [...mediaCatalog, ...(window.SENIN_DUNYAN_EXTRA_MEDIA || [])];

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
let watchTypeFilter = "all";
let watchSort = "desc";
let activeLifeModule = "wishes";
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
  return new Intl.DateTimeFormat(uiLanguage === "tr" ? "tr-TR" : "de-DE", options).format(date);
}

function formatRating(value) {
  return new Intl.NumberFormat(uiLanguage === "tr" ? "tr-TR" : "de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

function eventTypeLabel(type) {
  return t(`event.${type}`);
}

function prayerName(prayer) {
  return t(`prayer.${prayer.id}`);
}

function prayerNote(prayer) {
  return t(`prayer.${prayer.id}Note`);
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeExternalURL(value = "") {
  try {
    const url = new URL(String(value).trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function safeImageURL(value = "") {
  const image = String(value).trim();
  if (/^data:image\/(?:jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(image)) return image;
  return safeExternalURL(image);
}

function compressWishImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.size || !file.type.startsWith("image/")) return reject(new Error("invalid"));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("image"));
      image.onload = () => {
        const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .76));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
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
  const createdAt = new Date().toISOString();
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
    watchlist: completeMediaCatalog.map((item) => ({ ...item, status: "planned", rating: null, notes: "", updatedAt: createdAt })),
    mediaCatalogVersion: 2,
    ratingScaleVersion: 2,
    prayers: {},
    lifeItems: [
      { id: "birthday-her", module: "birthdays", title: "Mein Geburtstag", category: "birthday", date: BIRTHDAY, note: "", updatedAt: createdAt }
    ],
    lifeChecks: {},
    lifeVersion: 2,
    updatedAt: new Date().toISOString()
  };
}

function normalizeMediaTitle(title) {
  return String(title || "").normalize("NFKC").trim().toLocaleLowerCase("tr-TR");
}

function applyDataMigrations() {
  state.watchlist ||= [];
  state.lifeItems ||= [];
  state.lifeChecks ||= {};
  let changed = false;
  if ((state.lifeVersion || 0) < 1) {
    const updatedAt = new Date().toISOString();
    const seeds = [
      { id: "birthday-her", module: "birthdays", title: "Mein Geburtstag", category: "birthday", date: BIRTHDAY, note: "", updatedAt }
    ];
    const ids = new Set(state.lifeItems.map((item) => item.id));
    seeds.forEach((item) => { if (!ids.has(item.id)) state.lifeItems.push(item); });
    state.lifeVersion = 1;
    changed = true;
  }
  if ((state.lifeVersion || 0) < 2) {
    const removedPresetIds = new Set(["wish-raffaello", "wish-kinder", "wish-snickers"]);
    state.lifeItems = state.lifeItems.filter((item) => !removedPresetIds.has(item.id));
    state.lifeVersion = 2;
    changed = true;
  }
  if ((state.ratingScaleVersion || 0) < 2) {
    state.watchlist.forEach((item) => {
      const oldRating = Number(item.rating || 0);
      item.rating = oldRating > 0 ? Math.min(10, oldRating * 2) : null;
    });
    state.ratingScaleVersion = 2;
    changed = true;
  }
  if ((state.mediaCatalogVersion || 0) >= 2) return changed;
  const existingTitles = new Set(state.watchlist.map((item) => normalizeMediaTitle(item.title)));
  const updatedAt = new Date().toISOString();
  completeMediaCatalog.forEach((item) => {
    if (existingTitles.has(normalizeMediaTitle(item.title))) return;
    state.watchlist.push({ ...item, status: "planned", rating: null, notes: "", updatedAt });
  });
  state.mediaCatalogVersion = 2;
  return true;
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
  saveQueue = saveQueue.then(() => encryptSnapshot(snapshot)).catch(() => showToast(t("toast.saveFailed")));
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
    return `<article class="surface birthday-card"><p class="eyebrow">${t("birthday.until")}</p><h2>${t("birthday.daysLeft", { count: distance })}</h2><p>${t("birthday.approaches")}</p><div class="countdown-row"><div class="countdown-chip"><strong>${distance}</strong><small>${t("birthday.days")}</small></div><div class="countdown-chip"><strong>21</strong><small>${t("birthday.september")}</small></div><div class="countdown-chip"><strong>♡</strong><small>${t("birthday.yours")}</small></div></div></article>`;
  }
  if (distance === 0) {
    return `<article class="surface birthday-card"><p class="eyebrow">${t("birthday.yourDay")}</p><h2>${t("birthday.happy")}</h2><p>${t("birthday.message")}</p><div class="birthday-message"><strong>${t("birthday.love")}</strong><span>${t("birthday.always")}</span></div></article>`;
  }
  return `<article class="surface birthday-card"><p class="eyebrow">21 · 09 · 2026</p><h2>${t("birthday.happy")}</h2><p>${t("birthday.memory")}</p></article>`;
}

function getDailyHadith() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const day = Math.floor((today - start) / 86400000);
  return hadiths[day % hadiths.length];
}

function getDailyMotivation() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const day = Math.floor((today - start) / 86400000);
  const custom = state?.lifeItems?.filter((item) => item.module === "motivation") || [];
  if (custom.length) return custom[day % custom.length].title;
  return t(motivationKeys[day % motivationKeys.length]);
}

function eventsForDate(date) {
  return state.events.filter((event) => event.startDate <= date && (event.endDate || event.startDate) >= date);
}

function eventTime(event) {
  if (event.startTime && event.endTime) return `${event.startTime}–${event.endTime}`;
  if (event.startTime) return event.startTime;
  if (event.startDate !== event.endDate) return `${formatDate(event.startDate, { day: "numeric", month: "short" })}–${formatDate(event.endDate, { day: "numeric", month: "short" })}`;
  return eventTypes[event.type] ? eventTypeLabel(event.type) : t("common.entry");
}

function emptyHTML(icon, text) {
  return `<div class="empty-state"><span aria-hidden="true">${icon}</span><p>${text}</p></div>`;
}

function renderToday() {
  const today = localISO(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 11 ? t("today.morning") : hour < 18 ? t("today.day") : t("today.evening");
  const checked = prayers.filter((prayer) => state.prayers[today]?.[prayer.id]).length;
  const hadith = getDailyHadith();
  const upcoming = state.events
    .filter((event) => (event.endDate || event.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || (a.startTime || "").localeCompare(b.startTime || ""))
    .slice(0, 4);

  viewContainer.innerHTML = `
    ${headerHTML(t("nav.today"), `${greeting}, ${escapeHTML(state.profile.name)}`, formatDate(new Date()), `<button class="icon-button" data-action="lock" aria-label="${t("common.lock")}">⌁</button>`)}
    <div class="dashboard-grid">
      <div class="stack">
        ${birthdayHTML()}
        <section class="surface hadith-card">
          <div class="section-heading"><div><h2>${t("today.hadith")}</h2><p>${t("today.hadithHint")}</p></div><span class="hadith-mark" aria-hidden="true">“</span></div>
          <p class="hadith-text">${uiLanguage === "de" ? i18n.hadithDe[hadiths.indexOf(hadith)] : hadith.text}</p>
          <p class="hadith-source">${hadith.source}</p>
        </section>
        <section class="surface motivation-card">
          <span class="motivation-sun" aria-hidden="true">☀</span>
          <div><p class="eyebrow">${t("life.dailyMotivation")}</p><p>${escapeHTML(getDailyMotivation())}</p></div>
          <button class="section-link" data-view="life" data-life-module="motivation">${t("common.details")}</button>
        </section>
      </div>
      <div class="stack">
        <section class="surface surface-inner">
          <div class="section-heading"><div><h2>${t("today.prayers")}</h2><p>${t("today.completed", { count: checked })}</p></div><button class="section-link" data-view="prayer">${t("common.details")}</button></div>
          <div class="prayer-summary"><div class="progress-ring" style="--progress:${checked * 72}deg"><strong>${checked}/5</strong></div><p class="view-subtitle">${t("today.prayerHint")}</p></div>
          <div class="prayer-mini-list">${prayers.map((prayer) => `<button class="prayer-mini ${state.prayers[today]?.[prayer.id] ? "done" : ""}" data-action="toggle-prayer" data-prayer="${prayer.id}" data-date="${today}"><span>${state.prayers[today]?.[prayer.id] ? "✓" : prayer.symbol}</span>${prayerName(prayer)}</button>`).join("")}</div>
        </section>
        <section class="surface surface-inner">
          <div class="section-heading"><div><h2>${t("today.upcoming")}</h2><p>${t("today.fromCalendar")}</p></div><button class="section-link" data-action="new-event" data-date="${today}">${t("today.addNew")}</button></div>
          <div class="event-list">${upcoming.length ? upcoming.map((event) => eventRowHTML(event)).join("") : emptyHTML("◇", t("today.noUpcoming"))}</div>
        </section>
      </div>
    </div>`;
}

function eventRowHTML(event, withActions = false) {
  const type = eventTypes[event.type] || eventTypes.other;
  return `<article class="list-row"><span class="list-icon" style="background:${type.color}20;color:${type.color}">${type.icon}</span><div><h3>${escapeHTML(event.title)}</h3><p>${formatDate(event.startDate, { day: "numeric", month: "short", year: "numeric" })} · ${eventTime(event)}</p></div>${withActions ? `<div class="row-actions"><button class="tiny-button" data-action="edit-event" data-id="${event.id}" aria-label="${t("common.edit")}">✎</button><button class="tiny-button" data-action="delete-event" data-id="${event.id}" aria-label="${t("common.delete")}">×</button></div>` : ""}</article>`;
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
    ${headerHTML(t("calendar.eyebrow"), t("nav.calendar"), t("calendar.subtitle"), `<button class="solid-button" data-action="new-event" data-date="${selectedDate}">+ <span class="hide-mobile">${t("calendar.new")}</span></button>`)}
    <div class="calendar-layout">
      <section class="surface calendar-card">
        <div class="calendar-toolbar"><h2>${monthLabel}</h2><div class="calendar-arrows"><button class="icon-button" data-action="calendar-prev" aria-label="${t("calendar.previousMonth")}">‹</button><button class="icon-button" data-action="calendar-next" aria-label="${t("calendar.nextMonth")}">›</button></div></div>
        <div class="calendar-weekdays">${t("calendar.weekdays").split(",").map((day) => `<span>${day}</span>`).join("")}</div>
        <div class="calendar-grid">${days.map((day) => {
          const iso = localISO(day);
          const dayEvents = eventsForDate(iso);
          const classes = ["day-cell", day.getMonth() !== month ? "outside" : "", iso === localISO(new Date()) ? "today" : "", iso === selectedDate ? "selected" : ""].filter(Boolean).join(" ");
          return `<button class="${classes}" data-action="select-day" data-date="${iso}"><span class="day-number">${day.getDate()}</span><span class="event-dots">${dayEvents.slice(0, 4).map((event) => `<i class="event-dot" style="--dot:${eventTypes[event.type]?.color || eventTypes.other.color}"></i>`).join("")}</span>${dayEvents[0] ? `<span class="event-label">${escapeHTML(dayEvents[0].title)}</span>` : ""}</button>`;
        }).join("")}</div>
        <div class="legend">${Object.entries(eventTypes).map(([key, type]) => `<span><i style="--dot:${type.color}"></i>${eventTypeLabel(key)}</span>`).join("")}</div>
      </section>
      <aside class="surface selected-day">
        <p class="eyebrow">${t("calendar.selected")}</p><h2 class="selected-day-date">${formatDate(selectedDate)}</h2>
        <div class="event-list">${selectedEvents.length ? selectedEvents.map((event) => eventRowHTML(event, true)).join("") : emptyHTML("○", t("calendar.empty"))}</div>
        <button class="solid-button" style="width:100%;margin-top:1rem" data-action="new-event" data-date="${selectedDate}">+ ${t("calendar.addDay")}</button>
      </aside>
    </div>`;
}

function renderDiary() {
  const entries = [...state.diary].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  viewContainer.innerHTML = `
    ${headerHTML(t("diary.eyebrow"), t("nav.diary"), t("diary.subtitle"), `<button class="solid-button" data-action="new-diary">+ <span class="hide-mobile">${t("diary.new")}</span></button>`)}
    <div class="diary-grid">${entries.length ? entries.map((entry) => `<article class="surface diary-card" data-action="edit-diary" data-id="${entry.id}"><span class="mood">${entry.mood}</span><time>${formatDate(entry.date, { day: "numeric", month: "long", year: "numeric" })}</time><h2>${escapeHTML(entry.title || t("diary.defaultTitle"))}</h2><p>${escapeHTML(entry.body)}</p></article>`).join("") : emptyHTML("✎", t("diary.empty"))}</div>`;
}

function renderWatch() {
  const filtered = state.watchlist.filter((item) =>
    (watchFilter === "all" || item.status === watchFilter) &&
    (watchTypeFilter === "all" || item.type === watchTypeFilter)
  );
  const sorted = [...filtered].sort((first, second) => {
    const firstRated = first.rating !== null && first.rating !== undefined && first.rating !== "";
    const secondRated = second.rating !== null && second.rating !== undefined && second.rating !== "";
    if (firstRated !== secondRated) return firstRated ? -1 : 1;
    const ratingDifference = Number(first.rating || 0) - Number(second.rating || 0);
    if (ratingDifference) return watchSort === "asc" ? ratingDifference : -ratingDifference;
    return first.title.localeCompare(second.title, uiLanguage === "tr" ? "tr-TR" : "de-DE");
  });
  const watched = state.watchlist.filter((item) => item.status === "watched").length;
  const movieCount = state.watchlist.filter((item) => item.type === "movie").length;
  const seriesCount = state.watchlist.filter((item) => item.type === "series").length;
  const statusLabels = { watched: t("watch.watched"), watching: t("watch.watching"), planned: t("watch.planned") };
  viewContainer.innerHTML = `
    ${headerHTML(t("watch.eyebrow"), t("watch.title"), t("watch.summary", { watched, total: state.watchlist.length }), `<button class="solid-button" data-action="new-media">+ <span class="hide-mobile">${t("watch.add")}</span></button>`)}
    <div class="media-tabs" role="tablist" aria-label="${t("watch.title")}">
      <button role="tab" aria-selected="${watchTypeFilter === "all"}" class="media-tab ${watchTypeFilter === "all" ? "active" : ""}" data-action="filter-media-type" data-type="all">${t("common.all")} <span>${state.watchlist.length}</span></button>
      <button role="tab" aria-selected="${watchTypeFilter === "movie"}" class="media-tab ${watchTypeFilter === "movie" ? "active" : ""}" data-action="filter-media-type" data-type="movie">${t("watch.movies")} <span>${movieCount}</span></button>
      <button role="tab" aria-selected="${watchTypeFilter === "series"}" class="media-tab ${watchTypeFilter === "series" ? "active" : ""}" data-action="filter-media-type" data-type="series">${t("watch.series")} <span>${seriesCount}</span></button>
    </div>
    <div class="filter-row"><button class="filter-button ${watchFilter === "all" ? "active" : ""}" data-action="filter-media" data-filter="all">${t("common.all")}</button><button class="filter-button ${watchFilter === "watching" ? "active" : ""}" data-action="filter-media" data-filter="watching">${t("watch.watching")}</button><button class="filter-button ${watchFilter === "planned" ? "active" : ""}" data-action="filter-media" data-filter="planned">${t("watch.planned")}</button><button class="filter-button ${watchFilter === "watched" ? "active" : ""}" data-action="filter-media" data-filter="watched">${t("watch.watched")}</button><button class="filter-button" data-action="sort-media" data-sort="${watchSort === "desc" ? "asc" : "desc"}" title="${t("watch.sortTitle")}">${t("watch.rating")} ${watchSort === "desc" ? "↓" : "↑"}</button></div>
    <div class="media-list">${sorted.length ? sorted.map((item) => {
      const hasRating = item.rating !== null && item.rating !== undefined && item.rating !== "";
      const collection = item.collection === "Ihre Liste" ? t("watch.personalList") : item.collection;
      return `<article class="surface media-card"><div class="media-cover">${escapeHTML(item.title.charAt(0).toLocaleUpperCase(uiLanguage === "tr" ? "tr-TR" : "de-DE"))}</div><div class="media-meta"><h2>${escapeHTML(item.title)}</h2><p>${item.type === "series" ? t("common.series") : t("common.movie")} · ${statusLabels[item.status]}</p>${hasRating ? `<p class="rating-score"><strong>${formatRating(Number(item.rating))}</strong><span>/ 10</span></p>` : `<p>${t("watch.unrated")}</p>`}${item.notes ? `<p>${escapeHTML(item.notes)}</p>` : ""}<div class="media-tags">${collection ? `<span class="tag">${escapeHTML(collection)}</span>` : ""}<span class="tag">${statusLabels[item.status]}</span><button class="tiny-button" data-action="edit-media" data-id="${item.id}" aria-label="${t("common.edit")}">✎</button><button class="tiny-button" data-action="delete-media" data-id="${item.id}" aria-label="${t("common.delete")}">×</button></div></div></article>`;
    }).join("") : emptyHTML("▷", t("watch.empty"))}</div>`;
}

function renderPrayer() {
  const checked = prayers.filter((prayer) => state.prayers[prayerDate]?.[prayer.id]).length;
  const selected = parseISO(prayerDate);
  const weekStart = addDays(selected, -((selected.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  viewContainer.innerHTML = `
    ${headerHTML(t("prayer.eyebrow"), t("prayer.title"), t("prayer.subtitle"))}
    <div class="prayer-page-grid">
      <section class="surface surface-inner">
        <div class="date-switcher"><button class="icon-button" data-action="prayer-prev" aria-label="${t("prayer.previousDay")}">‹</button><strong>${formatDate(prayerDate)}</strong><button class="icon-button" data-action="prayer-next" aria-label="${t("prayer.nextDay")}">›</button></div>
        <div class="prayer-list">${prayers.map((prayer) => {
          const done = state.prayers[prayerDate]?.[prayer.id];
          return `<label class="prayer-check ${done ? "done" : ""}"><input type="checkbox" data-action="toggle-prayer" data-prayer="${prayer.id}" data-date="${prayerDate}" ${done ? "checked" : ""}/><span class="custom-check">✓</span><span><strong>${prayerName(prayer)}</strong><small>${prayerNote(prayer)}</small></span><span class="prayer-symbol">${prayer.symbol}</span></label>`;
        }).join("")}</div>
      </section>
      <section class="surface surface-inner">
        <div class="section-heading"><div><h2>${t("prayer.week")}</h2><p>${t("prayer.todayCompleted", { count: checked })}</p></div><div class="progress-ring" style="--progress:${checked * 72}deg;width:4.2rem;height:4.2rem"><strong>${checked}</strong></div></div>
        <div class="week-bars">${week.map((day) => {
          const iso = localISO(day);
          const count = prayers.filter((prayer) => state.prayers[iso]?.[prayer.id]).length;
          return `<div class="week-bar-wrap"><div class="week-bar" style="height:${Math.max(6, count * 18)}%" title="${count}/5"></div><span>${formatDate(day, { weekday: "short" }).slice(0,2)}</span></div>`;
        }).join("")}</div>
      </section>
    </div>`;
}

function moduleItems(module) {
  return (state.lifeItems || []).filter((item) => item.module === module).sort((a, b) => (b.date || b.updatedAt || "").localeCompare(a.date || a.updatedAt || ""));
}

function lifeModuleSummary(module, items) {
  const today = localISO(new Date());
  if (module === "habits") {
    const done = items.filter((item) => state.lifeChecks?.[today]?.[item.id]).length;
    return t("life.habitProgress", { done, total: items.length });
  }
  if (module === "cycle" && items.length) {
    const starts = items.map((item) => item.date).filter(Boolean).sort();
    const last = starts.at(-1);
    const interval = starts.length > 1 ? Math.max(20, Math.min(40, Math.round((parseISO(starts.at(-1)) - parseISO(starts.at(-2))) / 86400000))) : 28;
    return t("life.nextCycle", { date: formatDate(addDays(parseISO(last), interval), { day: "numeric", month: "long" }) });
  }
  if (module === "finance") {
    const expenses = items.filter((item) => item.category === "expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const goals = items.filter((item) => item.category === "goal").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return t("life.financeSummary", { expenses: formatRating(expenses), goals: formatRating(goals) });
  }
  return t("life.entryCount", { count: items.length });
}

function lifeItemMeta(item) {
  const parts = [];
  if (item.date) parts.push(formatDate(item.date, { day: "numeric", month: "short", year: "numeric" }));
  if (item.endDate) parts.push(`${t("common.end")}: ${formatDate(item.endDate, { day: "numeric", month: "short" })}`);
  if (item.category) parts.push(t(`life.option.${item.category}`));
  if (item.amount) parts.push(`${formatRating(Number(item.amount))} €`);
  if (item.target) parts.push(`${t("life.target")}: ${formatRating(Number(item.target))} €`);
  return parts.join(" · ");
}

function lifeItemHTML(item) {
  const module = lifeModules[item.module];
  const today = localISO(new Date());
  const checkable = item.module === "habits" || item.module === "tasks" || item.module === "duas" || (item.module === "us" && item.category === "goal");
  const done = item.module === "habits" ? Boolean(state.lifeChecks?.[today]?.[item.id]) : Boolean(item.done);
  const title = item.module === "moods" ? `${item.mood || "😊"} ${item.title || t("life.moodEntry")}` : item.module === "cycle" ? t("life.cycleEntry") : item.id === "birthday-her" ? t("life.myBirthday") : item.title;
  const imageURL = item.module === "wishes" ? safeImageURL(item.image) : "";
  const productURL = item.module === "wishes" ? safeExternalURL(item.link) : "";
  return `<article class="life-entry ${done ? "done" : ""}">
    ${imageURL ? `<img class="wish-thumb" src="${escapeHTML(imageURL)}" alt="" />` : checkable ? `<button class="life-check" data-action="toggle-life" data-id="${item.id}" aria-label="${t("life.toggle")}">${done ? "✓" : ""}</button>` : `<span class="life-entry-icon" style="--module-color:${module.color}">${module.icon}</span>`}
    <div class="life-entry-copy"><h3>${escapeHTML(title)}</h3>${lifeItemMeta(item) ? `<p>${escapeHTML(lifeItemMeta(item))}</p>` : ""}${item.note ? `<small>${escapeHTML(item.note)}</small>` : ""}${item.details ? `<small>${escapeHTML(item.details)}</small>` : ""}${productURL ? `<a class="wish-link" href="${escapeHTML(productURL)}" target="_blank" rel="noopener noreferrer">${t("life.openLink")} ↗</a>` : ""}</div>
    <div class="row-actions"><button class="tiny-button" data-action="edit-life" data-id="${item.id}" aria-label="${t("common.edit")}">✎</button><button class="tiny-button" data-action="delete-life" data-id="${item.id}" aria-label="${t("common.delete")}">×</button></div>
  </article>`;
}

function renderLife() {
  const items = moduleItems(activeLifeModule);
  const module = lifeModules[activeLifeModule];
  viewContainer.innerHTML = `
    ${headerHTML(t("life.eyebrow"), t("nav.life"), t("life.subtitle"))}
    <section class="surface motivation-hero"><span>☀</span><div><p class="eyebrow">${t("life.dailyMotivation")}</p><h2>${escapeHTML(getDailyMotivation())}</h2></div></section>
    <div class="life-module-grid">${Object.entries(lifeModules).map(([key, entry]) => `<button class="life-module ${activeLifeModule === key ? "active" : ""}" data-action="life-module" data-module="${key}" style="--module-color:${entry.color}"><span>${entry.icon}</span><strong>${t(`life.${key}`)}</strong><small>${moduleItems(key).length}</small></button>`).join("")}</div>
    <section class="surface life-panel">
      <div class="section-heading life-panel-heading"><div><p class="eyebrow">${module.icon} ${t(`life.${activeLifeModule}`)}</p><h2>${t(`life.${activeLifeModule}Title`)}</h2><p>${lifeModuleSummary(activeLifeModule, items)}</p></div><button class="solid-button" data-action="new-life" data-module="${activeLifeModule}">+ ${t("common.add")}</button></div>
      <div class="life-entry-list">${items.length ? items.map(lifeItemHTML).join("") : emptyHTML(module.icon, t(`life.${activeLifeModule}Empty`))}</div>
    </section>`;
}

function lifeFormFields(module, item) {
  const title = (label = t("common.title"), placeholder = t("life.titlePlaceholder")) => `<label><span>${label}</span><input name="title" value="${escapeHTML(item.title || "")}" placeholder="${placeholder}" required /></label>`;
  const note = (label = t("common.note"), placeholder = t("life.notePlaceholder")) => `<label><span>${label}</span><textarea name="note" placeholder="${placeholder}">${escapeHTML(item.note || "")}</textarea></label>`;
  const date = (label = t("common.date"), required = false) => `<label><span>${label}</span><input type="date" name="date" value="${item.date || ""}" ${required ? "required" : ""} /></label>`;
  const select = (name, label, options) => `<label><span>${label}</span><select name="${name}">${options.map((value) => `<option value="${value}" ${item[name] === value ? "selected" : ""}>${t(`life.option.${value}`)}</option>`).join("")}</select></label>`;
  switch (module) {
    case "wishes": {
      const existingImage = safeImageURL(item.image);
      const remoteImage = existingImage && !existingImage.startsWith("data:") ? existingImage : "";
      return `${title(t("life.wishName"))}<div class="form-grid">${select("category", t("common.type"), ["sweets", "fashion", "beauty", "book", "other"])}${date(t("life.wishDate"))}</div><label><span>${t("life.productLink")}</span><input name="link" type="url" inputmode="url" value="${escapeHTML(item.link || "")}" placeholder="https://…" /></label><label><span>${t("life.imageLink")}</span><input name="imageUrl" type="url" inputmode="url" value="${escapeHTML(remoteImage)}" placeholder="https://…/bild.jpg" /></label><label><span>${t("life.uploadImage")}</span><input name="imageFile" type="file" accept="image/*" /><small class="field-hint">${t("life.imageHint")}</small></label>${existingImage ? `<div class="wish-image-preview"><img src="${escapeHTML(existingImage)}" alt="" /><label><input type="checkbox" name="removeImage" /> <span>${t("life.removeImage")}</span></label></div>` : ""}${note()}`;
    }
    case "cycle": return `<div class="form-grid">${date(t("life.cycleStart"), true)}<label><span>${t("life.cycleEnd")}</span><input type="date" name="endDate" value="${item.endDate || ""}" /></label></div>${note(t("life.symptoms"), t("life.symptomsPlaceholder"))}`;
    case "habits": return `${title(t("life.habitName"), t("life.habitPlaceholder"))}${note()}`;
    case "tasks": return `${title(t("life.taskName"))}<div class="form-grid">${select("category", t("common.type"), ["task", "shopping"])}${date(t("life.dueDate"))}</div>${note()}`;
    case "moods": return `<div class="form-grid">${date(t("common.date"), true)}<label><span>${t("life.mood")}</span><select name="mood">${["😊","🥰","😌","🥺","😔","😴","😤"].map((mood) => `<option ${item.mood === mood ? "selected" : ""}>${mood}</option>`).join("")}</select></label></div>${title(t("life.moodTitle"), t("life.moodPlaceholder"))}${note()}`;
    case "us": return `${title(t("life.memoryName"))}<div class="form-grid">${select("category", t("common.type"), ["memory", "goal"])}${date()}</div>${note()}`;
    case "recipes": return `${title(t("life.recipeName"))}${note(t("life.ingredients"), t("life.ingredientsPlaceholder"))}<label><span>${t("life.preparation")}</span><textarea name="details" placeholder="${t("life.preparationPlaceholder")}">${escapeHTML(item.details || "")}</textarea></label>`;
    case "duas": return `${title(t("life.duaName"))}${note(t("life.duaText"), t("life.duaPlaceholder"))}`;
    case "health": return `${title(t("life.healthName"))}<div class="form-grid">${select("category", t("common.type"), ["medication", "allergy", "contact", "doctor"])}${date()}</div>${note(t("life.details"))}`;
    case "finance": return `${title(t("life.financeName"))}${select("category", t("common.type"), ["expense", "goal"])}<div class="form-grid"><label><span>${t("life.amount")}</span><input name="amount" type="number" inputmode="decimal" min="0" step="0.01" value="${item.amount || ""}" /></label><label><span>${t("life.target")}</span><input name="target" type="number" inputmode="decimal" min="0" step="0.01" value="${item.target || ""}" /></label></div>${date()}${note()}`;
    case "birthdays": return `${title(t("life.personName"))}<div class="form-grid">${select("category", t("common.type"), ["birthday", "gift"])}${date(t("common.date"), true)}</div>${note(t("life.giftIdea"), t("life.giftPlaceholder"))}`;
    case "motivation": return `${title(t("life.message"), t("life.messagePlaceholder"))}`;
    default: return title();
  }
}

function openLifeForm(module, id = null) {
  const existing = id ? state.lifeItems.find((entry) => entry.id === id) : null;
  const item = existing || { module, title: "", note: "", date: module === "moods" ? localISO(new Date()) : "", category: module === "tasks" ? "task" : "" };
  openDialog(t(`life.${module}`), existing ? t("life.edit") : t("life.new"), `<form class="dialog-form" id="life-form">${lifeFormFields(module, item)}<div class="dialog-actions">${existing ? `<button class="danger-button" type="button" data-action="delete-life" data-id="${existing.id}">${t("common.delete")}</button>` : ""}<button class="soft-button dialog-close" type="button">${t("common.cancel")}</button><button class="solid-button" type="submit">${t("common.save")}</button></div></form>`);
  document.querySelector("#life-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData);
    if (module === "wishes") {
      const rawLink = String(values.link || "").trim();
      if (rawLink && !safeExternalURL(rawLink)) return showToast(t("life.invalidLink"));
      values.link = safeExternalURL(rawLink);
      let image = item.image || "";
      if (values.removeImage === "on") image = "";
      const rawImageURL = String(values.imageUrl || "").trim();
      if (rawImageURL && !safeImageURL(rawImageURL)) return showToast(t("life.invalidImage"));
      if (rawImageURL) image = safeImageURL(rawImageURL);
      const imageFile = formData.get("imageFile");
      if (imageFile?.size) {
        if (imageFile.size > 12 * 1024 * 1024) return showToast(t("life.imageTooLarge"));
        try { image = await compressWishImage(imageFile); }
        catch { return showToast(t("life.invalidImage")); }
      }
      values.image = image;
      delete values.imageUrl;
      delete values.imageFile;
      delete values.removeImage;
    }
    const record = { ...item, ...values, module, id: existing?.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (existing) state.lifeItems = state.lifeItems.map((entry) => entry.id === existing.id ? record : entry);
    else state.lifeItems.push(record);
    await queueSave();
    closeDialog();
    showToast(t("life.saved"));
    renderLife();
  });
}

async function toggleLifeItem(id) {
  const item = state.lifeItems.find((entry) => entry.id === id);
  if (!item) return;
  if (item.module === "habits") {
    const today = localISO(new Date());
    state.lifeChecks[today] ||= {};
    state.lifeChecks[today][id] = !state.lifeChecks[today][id];
  } else {
    item.done = !item.done;
  }
  await queueSave();
  renderLife();
}

function renderSettings() {
  viewContainer.innerHTML = `
    ${headerHTML(t("settings.eyebrow"), t("nav.settings"), t("settings.subtitle"))}
    <div class="settings-grid">
      <section class="surface settings-card"><h2>${t("settings.profile")}</h2><p>${t("settings.profileText")}</p><form id="profile-form" class="dialog-form"><label><span>${t("auth.name")}</span><input name="name" value="${escapeHTML(state.profile.name)}" required /></label><button class="solid-button" type="submit">${t("common.save")}</button></form></section>
      <section class="surface settings-card"><h2>${t("common.language")}</h2><p>${t("settings.languageText")}</p><div class="language-switch settings-language"><button type="button" data-language="de">${t("common.german")}</button><button type="button" data-language="tr">${t("common.turkish")}</button></div></section>
      <section class="surface settings-card"><h2>${t("settings.backup")}</h2><p>${t("settings.backupText")}</p><div class="button-row"><button class="solid-button" data-action="export-backup">${t("settings.download")}</button><button class="soft-button" data-action="import-backup">${t("settings.upload")}</button></div></section>
      <section class="surface settings-card"><h2>${t("settings.pinLock")}</h2><p>${t("settings.pinText")}</p><div class="button-row"><button class="soft-button" data-action="change-pin">${t("settings.changePin")}</button><button class="soft-button" data-action="lock">${t("settings.lockNow")}</button></div></section>
      <section class="surface settings-card"><h2>${t("settings.privacy")}</h2><p>${t("settings.privacyText")}</p><span class="tag">${t("settings.encrypted")}</span></section>
    </div>`;
  translateStaticUI();
  document.querySelector("#profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    state.profile.name = new FormData(event.currentTarget).get("name").trim();
    await queueSave();
    showToast(t("toast.nameUpdated"));
    renderSettings();
  });
}

function renderCurrentView() {
  if (!state) return;
  const renderers = { today: renderToday, calendar: renderCalendar, diary: renderDiary, watch: renderWatch, prayer: renderPrayer, life: renderLife, settings: renderSettings };
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
  openDialog(existing ? t("form.record") : t("nav.calendar"), existing ? t("form.editRecord") : t("form.newRecord"), `
    <form class="dialog-form" id="event-form">
      <label><span>${t("common.title")}</span><input name="title" value="${escapeHTML(item.title)}" placeholder="${t("form.shiftPlaceholder")}" required /></label>
      <label><span>${t("common.type")}</span><select name="type">${Object.entries(eventTypes).map(([key]) => `<option value="${key}" ${item.type === key ? "selected" : ""}>${eventTypeLabel(key)}</option>`).join("")}</select></label>
      <div class="form-grid"><label><span>${t("common.start")}</span><input type="date" name="startDate" value="${item.startDate}" required /></label><label><span>${t("common.end")}</span><input type="date" name="endDate" value="${item.endDate || item.startDate}" required /></label></div>
      <div class="form-grid"><label><span>${t("common.startTime")}</span><input type="time" name="startTime" value="${item.startTime || ""}" /></label><label><span>${t("common.endTime")}</span><input type="time" name="endTime" value="${item.endTime || ""}" /></label></div>
      <label><span>${t("common.note")}</span><textarea name="notes" placeholder="${t("form.notePlaceholder")}">${escapeHTML(item.notes || "")}</textarea></label>
      <div class="dialog-actions"><button class="soft-button dialog-close" type="button">${t("common.cancel")}</button><button class="solid-button" type="submit">${t("common.save")}</button></div>
    </form>`);
  document.querySelector("#event-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.endDate < values.startDate) return showToast(t("form.endBeforeStart"));
    const record = { ...item, ...values, id: existing?.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (existing) state.events = state.events.map((entry) => entry.id === existing.id ? record : entry);
    else state.events.push(record);
    selectedDate = record.startDate;
    calendarCursor = new Date(parseISO(record.startDate).getFullYear(), parseISO(record.startDate).getMonth(), 1);
    await queueSave();
    closeDialog();
    showToast(t("form.calendarSaved"));
    renderCurrentView();
  });
}

function openDiaryForm(id = null) {
  const existing = id ? state.diary.find((entry) => entry.id === id) : null;
  const item = existing || { date: localISO(new Date()), title: "", mood: "😊", body: "" };
  openDialog(existing ? t("form.diary") : t("form.newPage"), existing ? t("form.editPage") : t("form.fromToday"), `
    <form class="dialog-form" id="diary-form">
      <div class="form-grid"><label><span>${t("common.date")}</span><input type="date" name="date" value="${item.date}" required /></label><label><span>${t("form.mood")}</span><select name="mood"><option ${item.mood === "😊" ? "selected" : ""}>😊</option><option ${item.mood === "🥰" ? "selected" : ""}>🥰</option><option ${item.mood === "😌" ? "selected" : ""}>😌</option><option ${item.mood === "🥺" ? "selected" : ""}>🥺</option><option ${item.mood === "😔" ? "selected" : ""}>😔</option><option ${item.mood === "😴" ? "selected" : ""}>😴</option></select></label></div>
      <label><span>${t("common.title")}</span><input name="title" value="${escapeHTML(item.title)}" placeholder="${t("form.todayTitle")}" /></label>
      <label><span>${t("form.thoughts")}</span><textarea name="body" placeholder="${t("form.dayPlaceholder")}" required>${escapeHTML(item.body)}</textarea></label>
      <div class="dialog-actions">${existing ? `<button class="danger-button" type="button" data-action="delete-diary" data-id="${existing.id}">${t("common.delete")}</button>` : ""}<button class="soft-button dialog-close" type="button">${t("common.cancel")}</button><button class="solid-button" type="submit">${t("common.save")}</button></div>
    </form>`);
  document.querySelector("#diary-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const record = { ...item, ...values, id: existing?.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (existing) state.diary = state.diary.map((entry) => entry.id === existing.id ? record : entry);
    else state.diary.push(record);
    await queueSave();
    closeDialog();
    showToast(t("form.diarySaved"));
    renderDiary();
  });
}

function openMediaForm(id = null) {
  const existing = id ? state.watchlist.find((entry) => entry.id === id) : null;
  const item = existing || { title: "", type: "movie", status: "planned", rating: null, notes: "" };
  const ratingValue = item.rating === null || item.rating === undefined || item.rating === "" ? "" : String(item.rating).replace(".", ",");
  openDialog(existing ? t("form.archive") : t("form.newMedia"), existing ? t("form.editMedia") : t("form.addMedia"), `
    <form class="dialog-form" id="media-form">
      <label><span>${t("form.name")}</span><input name="title" value="${escapeHTML(item.title)}" placeholder="${t("form.mediaPlaceholder")}" required /></label>
      <div class="form-grid"><label><span>${t("common.type")}</span><select name="type"><option value="movie" ${item.type === "movie" ? "selected" : ""}>${t("common.movie")}</option><option value="series" ${item.type === "series" ? "selected" : ""}>${t("common.series")}</option></select></label><label><span>${t("form.status")}</span><select name="status"><option value="planned" ${item.status === "planned" ? "selected" : ""}>${t("watch.planned")}</option><option value="watching" ${item.status === "watching" ? "selected" : ""}>${t("watch.watching")}</option><option value="watched" ${item.status === "watched" ? "selected" : ""}>${t("watch.watched")}</option></select></label></div>
      <label><span>${t("form.yourRating")}</span><input name="rating" type="text" inputmode="decimal" value="${ratingValue}" placeholder="${t("form.ratingPlaceholder")}" pattern="^(?:10(?:[.,]0)?|[0-9](?:[.,][0-9])?)$" /><small class="field-hint">${t("form.ratingHint")}</small></label>
      <label><span>${t("form.yourNote")}</span><textarea name="notes" placeholder="${t("form.mediaNotePlaceholder")}">${escapeHTML(item.notes || "")}</textarea></label>
      <div class="dialog-actions"><button class="soft-button dialog-close" type="button">${t("common.cancel")}</button><button class="solid-button" type="submit">${t("common.save")}</button></div>
    </form>`);
  document.querySelector("#media-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const rawRating = String(values.rating || "").trim().replace(",", ".");
    if (rawRating && !/^(?:10(?:\.0)?|[0-9](?:\.[0-9])?)$/.test(rawRating)) return showToast(t("form.invalidRating"));
    values.rating = rawRating === "" ? null : Number(rawRating);
    const record = { ...item, ...values, id: existing?.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (existing) state.watchlist = state.watchlist.map((entry) => entry.id === existing.id ? record : entry);
    else state.watchlist.push(record);
    await queueSave();
    closeDialog();
    showToast(t("form.mediaSaved"));
    renderWatch();
  });
}

function openPinForm() {
  openDialog(t("pin.security"), t("pin.change"), `<form class="dialog-form" id="pin-form"><label><span>${t("pin.current")}</span><input type="password" inputmode="numeric" name="current" required minlength="4" /></label><div class="form-grid"><label><span>${t("pin.new")}</span><input type="password" inputmode="numeric" name="next" required minlength="4" maxlength="12" /></label><label><span>${t("pin.repeat")}</span><input type="password" inputmode="numeric" name="confirm" required minlength="4" maxlength="12" /></label></div><div class="dialog-actions"><button class="soft-button dialog-close" type="button">${t("common.cancel")}</button><button class="solid-button" type="submit">${t("pin.change")}</button></div></form>`);
  document.querySelector("#pin-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!/^\d{4,12}$/.test(values.next)) return showToast(t("pin.invalid"));
    if (values.next !== values.confirm) return showToast(t("pin.noMatch"));
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const testKey = await deriveKey(values.current, base64ToBytes(stored.salt));
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(stored.iv) }, testKey, base64ToBytes(stored.ciphertext));
      vaultSalt = crypto.getRandomValues(new Uint8Array(16));
      encryptionKey = await deriveKey(values.next, vaultSalt);
      await queueSave();
      closeDialog();
      showToast(t("pin.changed"));
    } catch {
      showToast(t("pin.wrongCurrent"));
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
  if (!confirm(t("toast.confirmDelete"))) return;
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
  showToast(t("toast.backupDownloaded"));
}

async function importBackup(file) {
  try {
    const payload = JSON.parse(await file.text());
    const vault = payload.vault || payload;
    if (vault.version !== 1 || !vault.salt || !vault.iv || !vault.ciphertext) throw new Error("invalid");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
    showToast(t("toast.backupLoaded"));
    setTimeout(() => location.reload(), 700);
  } catch {
    showToast(t("toast.invalidBackup"));
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
  if (!/^\d{4,12}$/.test(pin)) return showToast(t("toast.invalidPin"));
  if (pin !== confirmation) return showToast(t("toast.pinMismatch"));
  try {
    await createVault(name, pin);
    setupForm.reset();
    enterApp();
  } catch {
    showToast(t("toast.createFailed"));
  }
});

unlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authError.hidden = true;
  try {
    await unlockVault(document.querySelector("#unlock-pin").value);
    if (applyDataMigrations()) await queueSave();
    unlockForm.reset();
    enterApp();
  } catch {
    showAuthError(t("toast.wrongPin"));
  }
});

document.addEventListener("click", async (event) => {
  resetAutoLock();
  const languageButton = event.target.closest("[data-language]");
  if (languageButton) return setLanguage(languageButton.dataset.language);
  const close = event.target.closest(".dialog-close");
  if (close) return closeDialog();
  const nav = event.target.closest("[data-view]");
  if (nav) {
    if (nav.dataset.lifeModule) activeLifeModule = nav.dataset.lifeModule;
    return setView(nav.dataset.view);
  }
  const action = event.target.closest("[data-action]");
  if (!action || !state) return;
  const { id, date, prayer, filter, sort, type, module } = action.dataset;
  switch (action.dataset.action) {
    case "lock": lockApp(); break;
    case "new-event": openEventForm(null, date || selectedDate); break;
    case "edit-event": openEventForm(id); break;
    case "delete-event": await deleteById("events", id, t("toast.eventDeleted")); break;
    case "select-day": selectedDate = date; renderCalendar(); break;
    case "calendar-prev": calendarCursor.setMonth(calendarCursor.getMonth() - 1); renderCalendar(); break;
    case "calendar-next": calendarCursor.setMonth(calendarCursor.getMonth() + 1); renderCalendar(); break;
    case "new-diary": openDiaryForm(); break;
    case "edit-diary": openDiaryForm(id); break;
    case "delete-diary": await deleteById("diary", id, t("toast.diaryDeleted")); break;
    case "new-media": openMediaForm(); break;
    case "edit-media": openMediaForm(id); break;
    case "delete-media": await deleteById("watchlist", id, t("toast.mediaDeleted")); break;
    case "filter-media": watchFilter = filter; renderWatch(); break;
    case "filter-media-type": watchTypeFilter = type; renderWatch(); break;
    case "sort-media": watchSort = sort; renderWatch(); break;
    case "toggle-prayer": await togglePrayer(date, prayer); break;
    case "prayer-prev": prayerDate = localISO(addDays(parseISO(prayerDate), -1)); renderPrayer(); break;
    case "prayer-next": prayerDate = localISO(addDays(parseISO(prayerDate), 1)); renderPrayer(); break;
    case "life-module": activeLifeModule = module; renderLife(); break;
    case "new-life": openLifeForm(module); break;
    case "edit-life": {
      const item = state.lifeItems.find((entry) => entry.id === id);
      if (item) openLifeForm(item.module, id);
      break;
    }
    case "delete-life": await deleteById("lifeItems", id, t("life.deleted")); break;
    case "toggle-life": await toggleLifeItem(id); break;
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

translateStaticUI();

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
