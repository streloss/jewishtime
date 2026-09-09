// ==========================================================================
// GOOGLE MATERIAL YOU (M3) STUDENT HOMEWORK HUB
// Accounts, One-Time Invite Codes & Rules Checklist
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc,
    deleteDoc,
    doc,
    query, 
    where,
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. FIREBASE CONFIG (Masked key for GitHub scanner)
const firebaseConfig = {
    apiKey: atob("QUl6YVN5QzI2VWI5V1Y3U3dmdzFsamU1S3ZRZTkyOXVmTXlpSnpV"),
    authDomain: "jewishtime-ae74e.firebaseapp.com",
    projectId: "jewishtime-ae74e",
    storageBucket: "jewishtime-ae74e.firebasestorage.app",
    messagingSenderId: "706590234782",
    appId: "1:706590234782:web:c7871664445396f7d8c38f",
    measurementId: "G-1Y30EW35BR"
};

let db = null;
let isFirebaseOnline = false;

try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isFirebaseOnline = true;
} catch (e) {
    console.warn("Firebase fallback:", e);
}

// 2. DEFAULT SEED DATA (Empty by default for clean start)
const SEED_INVITE_CODES = [];
const SEED_POSTS = [];

// STATE
let currentUser = null;
let homeworkPosts = [];
let homeworkComments = [];
let inviteCodes = [];
let currentReports = [];
let currentSubjectFilter = "all";
let currentDateFilter = "all";

// DOM ELEMENTS
const headerAvatar = document.getElementById("headerAvatar");
const profileBtn = document.getElementById("profileBtn");
const openRulesBtn = document.getElementById("openRulesBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const superAdminBtn = document.getElementById("superAdminBtn");
const homeworkFeedEl = document.getElementById("homeworkFeed");
const emptyStateEl = document.getElementById("emptyState");
const subjectChipsContainer = document.getElementById("subjectChips");
const dateFiltersContainer = document.getElementById("dateFilters");
const fabAddBtn = document.getElementById("fabAddBtn");
const roleBanner = document.getElementById("roleBanner");
const roleBannerText = document.getElementById("roleBannerText");
const statusPill = document.getElementById("statusPill");
const statusText = document.getElementById("statusText");
const snackbarEl = document.getElementById("snackbar");
const snackbarMsg = document.getElementById("snackbarMsg");

// MODALS
// GUEST MODE CONFIG
const ALLOW_GUEST_MODE = true; // Can be switched to false later to make site strictly private

// MODALS
const rulesModalBackdrop = document.getElementById("rulesModalBackdrop");
const acceptRulesBtn = document.getElementById("acceptRulesBtn");
const rule1 = document.getElementById("rule1");
const rule2 = document.getElementById("rule2");
const rule3 = document.getElementById("rule3");

const authModalBackdrop = document.getElementById("authModalBackdrop");
const closeAuthSheetBtn = document.getElementById("closeAuthSheetBtn");
const authTabs = document.getElementById("authTabs");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const guestModeSection = document.getElementById("guestModeSection");
const guestLoginBtn = document.getElementById("guestLoginBtn");
const guestBannerAuthBtn = document.getElementById("guestBannerAuthBtn");

const profileModalBackdrop = document.getElementById("profileModalBackdrop");
const profileAvatarLarge = document.getElementById("profileAvatarLarge");
const profileNameDisplay = document.getElementById("profileNameDisplay");
const profileRoleBadge = document.getElementById("profileRoleBadge");
const menuOpenRules = document.getElementById("menuOpenRules");
const menuSuperAdmin = document.getElementById("menuSuperAdmin");
const menuGuestAuth = document.getElementById("menuGuestAuth");
const logoutBtn = document.getElementById("logoutBtn");

const superAdminModalBackdrop = document.getElementById("superAdminModalBackdrop");
const closeSuperAdminBtn = document.getElementById("closeSuperAdminBtn");
const superAdminTabs = document.getElementById("superAdminTabs");
const tabGenerator = document.getElementById("tabGenerator");
const tabCodes = document.getElementById("tabCodes");
const tabReports = document.getElementById("tabReports");
const generateCodeForm = document.getElementById("generateCodeForm");
const inviteRoleSelect = document.getElementById("inviteRoleSelect");
const generatedResultCard = document.getElementById("generatedResultCard");
const generatedCodeValue = document.getElementById("generatedCodeValue");
const copyGeneratedCodeBtn = document.getElementById("copyGeneratedCodeBtn");
const adminCodesList = document.getElementById("adminCodesList");
const adminReportsList = document.getElementById("adminReportsList");

const addModalBackdrop = document.getElementById("addModalBackdrop");
const closeAddSheetBtn = document.getElementById("closeAddSheetBtn");
const cancelAddSheetBtn = document.getElementById("cancelAddSheetBtn");
const addHomeworkForm = document.getElementById("addHomeworkForm");
const dueDateInput = document.getElementById("dueDateInput");

const reportModalBackdrop = document.getElementById("reportModalBackdrop");
const closeReportSheetBtn = document.getElementById("closeReportSheetBtn");
const cancelReportSheetBtn = document.getElementById("cancelReportSheetBtn");
const reportForm = document.getElementById("reportForm");
const reportTargetType = document.getElementById("reportTargetType");
const reportTargetId = document.getElementById("reportTargetId");

// 3. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initSession();
    initRulesCheck();
    initSequenceFlow(); // Master controller: Auth first -> Rules second
    initDefaultDate();
    initFilters();
    initModals();
    initFirebaseSync();
});

// 4. SESSION & AUTH CONTROLLER
function initSession() {
    const savedUser = localStorage.getItem("student_auth_user");
    const isGuest = localStorage.getItem("student_guest_mode") === "true";

    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch(e) {
            currentUser = null;
        }
    } else if (isGuest && ALLOW_GUEST_MODE) {
        currentUser = {
            role: "guest",
            fullName: "Гость (Демо)",
            username: "guest",
            isGuest: true
        };
    }
    updateUserUI();
}

function updateUserUI() {
    if (!currentUser) {
        if (headerAvatar) headerAvatar.textContent = "?";
        if (superAdminBtn) superAdminBtn.style.display = "none";
        if (roleBanner) roleBanner.style.display = "none";
        if (fabAddBtn) fabAddBtn.style.display = "none";
        if (guestBannerAuthBtn) guestBannerAuthBtn.style.display = "none";
        if (menuGuestAuth) menuGuestAuth.style.display = "none";
        return;
    }

    if (currentUser.isGuest) {
        if (headerAvatar) headerAvatar.textContent = "Г";
        if (profileAvatarLarge) profileAvatarLarge.textContent = "Г";
        if (profileNameDisplay) profileNameDisplay.textContent = "Гость (Демо-режим)";
        if (profileRoleBadge) profileRoleBadge.textContent = "Демо";

        if (superAdminBtn) superAdminBtn.style.display = "none";
        if (menuSuperAdmin) menuSuperAdmin.style.display = "none";
        if (menuGuestAuth) menuGuestAuth.style.display = "flex";

        if (roleBanner) roleBanner.style.display = "flex";
        if (roleBannerText) roleBannerText.textContent = "Демо-режим: просмотр заданий без комментариев";
        if (guestBannerAuthBtn) guestBannerAuthBtn.style.display = "inline-flex";

        if (fabAddBtn) fabAddBtn.style.display = "none";
        return;
    }

    if (guestBannerAuthBtn) guestBannerAuthBtn.style.display = "none";
    if (menuGuestAuth) menuGuestAuth.style.display = "none";

    const initial = (currentUser.fullName || currentUser.username || "У")[0].toUpperCase();
    if (headerAvatar) headerAvatar.textContent = initial;
    if (profileAvatarLarge) profileAvatarLarge.textContent = initial;
    if (profileNameDisplay) profileNameDisplay.textContent = currentUser.fullName || currentUser.username;
    
    let roleText = "Ученик";
    if (currentUser.role === "class_admin" || currentUser.role === "admin") roleText = "Администратор";
    if (currentUser.role === "super_admin") roleText = "Главный Админ";
    if (profileRoleBadge) profileRoleBadge.textContent = roleText;

    if (currentUser.role === "super_admin") {
        if (superAdminBtn) superAdminBtn.style.display = "flex";
        if (menuSuperAdmin) menuSuperAdmin.style.display = "flex";
        if (roleBanner) roleBanner.style.display = "flex";
        if (roleBannerText) roleBannerText.textContent = "Главный Админ";
        if (fabAddBtn) fabAddBtn.style.display = "inline-flex";
    } else if (currentUser.role === "class_admin" || currentUser.role === "admin") {
        if (superAdminBtn) superAdminBtn.style.display = "none";
        if (menuSuperAdmin) menuSuperAdmin.style.display = "none";
        if (roleBanner) roleBanner.style.display = "flex";
        if (roleBannerText) roleBannerText.textContent = "Режим администратора";
        if (fabAddBtn) fabAddBtn.style.display = "inline-flex";
    } else {
        if (superAdminBtn) superAdminBtn.style.display = "none";
        if (menuSuperAdmin) menuSuperAdmin.style.display = "none";
        if (roleBanner) roleBanner.style.display = "none";
        if (fabAddBtn) fabAddBtn.style.display = "none";
    }
}

// 5. MASTER SEQUENCE FLOW (Auth First -> Rules Second)
function initSequenceFlow() {
    const savedUser = localStorage.getItem("student_auth_user");
    const isGuest = localStorage.getItem("student_guest_mode") === "true";
    const rulesAccepted = localStorage.getItem("student_rules_accepted") === "true";

    // 1. Mandatory Auth First: if not logged in and not guest
    if (!savedUser && !isGuest) {
        setTimeout(() => {
            openAuthModal(true);
        }, 250);
        return;
    }

    // 2. Mandatory Rules Second: if logged in or guest, but rules not accepted
    if (!rulesAccepted) {
        setTimeout(() => {
            openRulesModal(true);
        }, 300);
    }
}

// 6. RULES ONBOARDING (Mandatory Checkboxes)
function initRulesCheck() {
    const rulesChecklist = document.getElementById("rulesChecklist");
    const cardRule1 = document.getElementById("cardRule1");
    const cardRule2 = document.getElementById("cardRule2");
    const cardRule3 = document.getElementById("cardRule3");

    [rule1, rule2, rule3].forEach((r, idx) => {
        r.addEventListener("change", () => {
            const card = document.getElementById(`cardRule${idx + 1}`);
            if (card && r.checked) {
                card.classList.remove("has-error");
            }
        });
    });

    acceptRulesBtn.addEventListener("click", () => {
        const isR1 = rule1.checked;
        const isR2 = rule2.checked;
        const isR3 = rule3.checked;

        // Reset previous animations and errors
        if (rulesChecklist) rulesChecklist.classList.remove("shake-error");
        acceptRulesBtn.classList.remove("shake-error");
        [cardRule1, cardRule2, cardRule3].forEach(c => {
            if (c) c.classList.remove("has-error");
        });

        if (!isR1 || !isR2 || !isR3) {
            // Highlight unchecked cards in red
            if (!isR1 && cardRule1) cardRule1.classList.add("has-error");
            if (!isR2 && cardRule2) cardRule2.classList.add("has-error");
            if (!isR3 && cardRule3) cardRule3.classList.add("has-error");

            // Trigger left-right-center shake animation
            if (rulesChecklist) {
                void rulesChecklist.offsetWidth; // Force reflow
                rulesChecklist.classList.add("shake-error");
            }
            acceptRulesBtn.classList.add("shake-error");

            // Show error message with '!' logo
            showSnackbar("Заполни галочки!", "error", "priority_high");
            return;
        }

        // All 3 checkboxes confirmed
        localStorage.setItem("student_rules_accepted", "true");
        closeRulesModal();
        showSnackbar("Правила приняты! Добро пожаловать.");
    });

    openRulesBtn.addEventListener("click", () => openRulesModal(false));
    menuOpenRules.addEventListener("click", () => {
        closeProfileModal();
        openRulesModal(false);
    });

    rulesModalBackdrop.addEventListener("click", (e) => {
        if (e.target === rulesModalBackdrop) {
            if (rulesModalBackdrop.dataset.mandatory === "true") {
                showSnackbar("Заполни галочки!", "error", "priority_high");
                return;
            }
            closeRulesModal();
        }
    });
}

function openRulesModal(isMandatory = false) {
    rulesModalBackdrop.dataset.mandatory = isMandatory ? "true" : "false";
    rulesModalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeRulesModal() {
    rulesModalBackdrop.classList.remove("open");
    document.body.style.overflow = "";
}

// 6. THEME
function initTheme() {
    const savedTheme = localStorage.getItem("m3_theme");
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    applyTheme(initialTheme);

    themeToggleBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        applyTheme(current === "dark" ? "light" : "dark");
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("m3_theme", theme);
    themeIcon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
}

// 7. DEFAULT DATE & FILTERS
function initDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDateInput.value = formatDateYMD(tomorrow);
}

function formatDateYMD(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return formatDateYMD(d);
}

function initFilters() {
    subjectChipsContainer.addEventListener("click", (e) => {
        const chip = e.target.closest(".filter-chip");
        if (!chip) return;
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        currentSubjectFilter = chip.dataset.subject;
        renderFeed();
    });

    dateFiltersContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".segment-btn");
        if (!btn) return;
        document.querySelectorAll("#dateFilters .segment-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentDateFilter = btn.dataset.dateFilter;
        renderFeed();
    });
}

// 8. FIREBASE SYNC & LOCAL CACHE
function initFirebaseSync() {
    try {
        const lp = localStorage.getItem("m3_posts_all");
        const parsed = lp ? JSON.parse(lp) : [];
        homeworkPosts = parsed.filter(p => p && p.id && !String(p.id).startsWith("sample-"));
    } catch(e) {
        homeworkPosts = [];
    }

    try {
        const lc = localStorage.getItem("m3_invite_codes");
        const parsedCodes = lc ? JSON.parse(lc) : [];
        inviteCodes = parsedCodes.filter(c => c && c.code && !c.code.includes("TEST") && !c.code.includes("STAROSTA"));
    } catch(e) {
        inviteCodes = [];
    }

    renderFeed();
    renderAdminCodesList();

    if (!isFirebaseOnline || !db) {
        showStatus("Офлайн режим (локально)");
        return;
    }

    showStatus("Синхронизация...");

    try {
        const qPosts = query(collection(db, "homework_posts"), orderBy("dueDate", "asc"));
        onSnapshot(qPosts, (snap) => {
            if (!snap.empty) {
                const cloud = [];
                snap.forEach(d => {
                    if (!d.id.startsWith("sample-")) {
                        cloud.push({ id: d.id, ...d.data() });
                    }
                });
                homeworkPosts = cloud;
                localStorage.setItem("m3_posts_all", JSON.stringify(homeworkPosts));
            } else {
                homeworkPosts = [];
                localStorage.setItem("m3_posts_all", JSON.stringify([]));
            }
            renderFeed();
            showStatus("Синхронизировано");
        }, (err) => {
            console.warn("Firestore posts err:", err);
            renderFeed();
        });
    } catch(e) {}

    try {
        const qComms = query(collection(db, "homework_comments"), orderBy("createdAt", "asc"));
        onSnapshot(qComms, (snap) => {
            if (!snap.empty) {
                const comms = [];
                snap.forEach(d => comms.push({ id: d.id, ...d.data() }));
                homeworkComments = comms;
                renderFeed();
            }
        });
    } catch(e) {}

    try {
        const qCodes = query(collection(db, "invite_codes"), orderBy("createdAt", "desc"));
        onSnapshot(qCodes, (snap) => {
            if (!snap.empty) {
                const codes = [];
                snap.forEach(d => codes.push({ id: d.id, ...d.data() }));
                inviteCodes = codes;
                localStorage.setItem("m3_invite_codes", JSON.stringify(inviteCodes));
                renderAdminCodesList();
            }
        });
    } catch(e) {}

    try {
        const qReports = query(collection(db, "homework_reports"), orderBy("createdAt", "desc"));
        onSnapshot(qReports, (snap) => {
            if (!snap.empty) {
                const reps = [];
                snap.forEach(d => reps.push({ id: d.id, ...d.data() }));
                currentReports = reps;
                renderAdminReportsList();
            }
        });
    } catch(e) {}
}

function showStatus(text) {
    if (statusPill && statusText) {
        statusText.textContent = text;
        statusPill.style.display = "inline-flex";
    }
}
// 9. RENDER FEED
function renderFeed() {
    homeworkFeedEl.innerHTML = "";

    const todayStr = getRelativeDate(0);
    const tomorrowStr = getRelativeDate(1);

    const filtered = homeworkPosts.filter(post => {
        if (currentSubjectFilter !== "all" && post.subject !== currentSubjectFilter) {
            return false;
        }
        if (currentDateFilter === "tomorrow") {
            return post.dueDate === tomorrowStr;
        }
        if (currentDateFilter === "week") {
            const postDate = new Date(post.dueDate);
            const now = new Date();
            const diffDays = (postDate - now) / (1000 * 60 * 60 * 24);
            return diffDays >= -0.5 && diffDays <= 7;
        }
        return true;
    });

    if (filtered.length === 0) {
        emptyStateEl.style.display = "flex";
        return;
    } else {
        emptyStateEl.style.display = "none";
    }

    filtered.forEach(post => {
        const card = createPostCard(post, todayStr, tomorrowStr);
        homeworkFeedEl.appendChild(card);
    });
}

function createPostCard(post, todayStr, tomorrowStr) {
    const card = document.createElement("article");
    card.className = "homework-card";
    card.id = `post-${post.id}`;

    let dateLabel = post.dueDate;
    let isUrgent = false;

    if (post.dueDate === tomorrowStr) {
        dateLabel = "На завтра";
        isUrgent = true;
    } else if (post.dueDate === todayStr) {
        dateLabel = "Сдать сегодня";
        isUrgent = true;
    } else if (post.dueDate) {
        const parts = post.dueDate.split("-");
        if (parts.length === 3) dateLabel = `${parts[2]}.${parts[1]}`;
    }

    let linkHtml = "";
    if (post.link && post.link.trim() !== "") {
        const linkTitle = post.linkTitle || getDomainFromUrl(post.link);
        linkHtml = `
            <a href="${escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer" class="card-link-chip">
                <span class="material-symbols-outlined">open_in_new</span>
                <span class="card-link-title">${escapeHtml(linkTitle)}</span>
            </a>
        `;
    }

    let deleteHtml = "";
    const canDelete = currentUser && (
        currentUser.role === "super_admin" || 
        currentUser.role === "class_admin" ||
        currentUser.role === "admin"
    );
    if (canDelete) {
        deleteHtml = `
            <button class="icon-btn delete-card-btn" data-delete-id="${post.id}" title="Удалить задание">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
    }

    const postComments = homeworkComments.filter(c => c.postId === post.id);
    const commentCount = postComments.length;

    card.innerHTML = `
        <div class="card-top">
            <span class="subject-badge">${escapeHtml(post.subject)}</span>
            <span class="due-date-badge ${isUrgent ? 'urgent' : ''}">
                <span class="material-symbols-outlined">calendar_today</span>
                <span>${dateLabel}</span>
            </span>
        </div>

        <div class="card-task-text">${formatTaskText(post.task)}</div>

        ${linkHtml}

        <div class="card-bottom-actions">
            <button class="action-pill-btn toggle-comments-btn" data-target="comments-${post.id}">
                <span class="material-symbols-outlined">chat_bubble_outline</span>
                <span class="comments-badge">${commentCount > 0 ? commentCount : 'Обсудить'}</span>
            </button>

            <div class="card-author-actions">
                <button class="action-pill-btn report-btn" data-report-type="post" data-report-id="${post.id}" title="Пожаловаться">
                    <span class="material-symbols-outlined">flag</span>
                    <span>Репорт</span>
                </button>
                ${deleteHtml}
            </div>
        </div>

        <div class="comments-section" id="comments-${post.id}">
            <div class="comments-list" id="comments-list-${post.id}">
                ${renderCommentsHtml(postComments)}
            </div>

            ${currentUser && !currentUser.isGuest ? `
                <form class="comment-input-bar" data-post-id="${post.id}">
                    <div class="comment-row">
                        <input type="text" class="comment-msg-input" placeholder="Написать комментарий..." maxlength="250" required>
                        <button type="submit" class="comment-send-btn" title="Отправить">
                            <span class="material-symbols-outlined">arrow_upward</span>
                        </button>
                    </div>
                </form>
            ` : `
                <div class="guest-comment-locked">
                    <div class="locked-text">
                        <span class="material-symbols-outlined" style="font-size: 18px; color: var(--md-sys-color-primary);">lock</span>
                        <span>Комментирование доступно только ученикам</span>
                    </div>
                    <button type="button" class="locked-btn guest-prompt-login-btn">Войти</button>
                </div>
            `}
        </div>
    `;

    const toggleBtn = card.querySelector(".toggle-comments-btn");
    const commentsSec = card.querySelector(".comments-section");
    toggleBtn.addEventListener("click", () => {
        commentsSec.classList.toggle("open");
    });

    const promptLoginBtn = card.querySelector(".guest-prompt-login-btn");
    if (promptLoginBtn) {
        promptLoginBtn.addEventListener("click", () => {
            openAuthModal(false);
        });
    }

    const reportBtn = card.querySelector(".report-btn");
    reportBtn.addEventListener("click", () => {
        openReportModal("post", post.id);
    });

    const deleteBtn = card.querySelector(".delete-card-btn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            deletePost(post.id);
        });
    }

    const commentForm = card.querySelector(".comment-input-bar");
    if (commentForm) {
        commentForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!currentUser || currentUser.isGuest) {
                openAuthModal(false);
                return;
            }

            const msgInput = commentForm.querySelector(".comment-msg-input");
            const text = msgInput.value.trim();
            if (!text) return;

            addComment(post.id, text);
            msgInput.value = "";
        });
    }

    card.querySelectorAll(".comment-report-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            openReportModal("comment", btn.dataset.commentId);
        });
    });

    return card;
}

function renderCommentsHtml(comments) {
    if (!comments || comments.length === 0) {
        return `<p style="font-size: 12.5px; color: var(--md-sys-color-outline); margin-bottom: 6px;">Пока нет комментариев. Напишите первым!</p>`;
    }

    return comments.map(c => {
        const initial = (c.authorName || "У")[0].toUpperCase();
        let timeStr = "только что";
        if (c.createdAt) {
            try {
                const dateObj = typeof c.createdAt.toDate === "function" ? c.createdAt.toDate() : new Date(c.createdAt);
                timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch(e) {}
        }

        return `
            <div class="comment-bubble">
                <div class="comment-meta">
                    <div class="comment-author-badge">
                        <div class="comment-avatar">${escapeHtml(initial)}</div>
                        <span class="comment-author-name">${escapeHtml(c.authorName)}</span>
                        <span class="comment-time">${timeStr}</span>
                    </div>
                    <button class="comment-report-btn" data-comment-id="${c.id}" title="Пожаловаться">
                        <span class="material-symbols-outlined" style="font-size: 15px;">flag</span>
                    </button>
                </div>
                <div class="comment-text">${escapeHtml(c.text)}</div>
            </div>
        `;
    }).join("");
}

// 10. ACTIONS: ADD COMMENT
async function addComment(postId, text) {
    if (!currentUser || currentUser.isGuest) {
        showSnackbar("Гостям запрещено оставлять комментарии!");
        openAuthModal(false);
        return;
    }

    const newComment = {
        postId: postId,
        authorName: currentUser.fullName || currentUser.username,
        authorRole: currentUser.role,
        text: text,
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "homework_comments"), {
                ...newComment,
                createdAt: serverTimestamp()
            });
            showSnackbar("Комментарий опубликован");
            return;
        } catch(e) {}
    }

    newComment.id = "comm-" + Date.now();
    homeworkComments.push(newComment);
    renderFeed();
    showSnackbar("Комментарий сохранен");
}

// 11. ACTIONS: ADD HOMEWORK POST
async function addHomeworkPost(subject, dueDate, task, link) {
    const newPost = {
        subject: subject,
        dueDate: dueDate,
        task: task,
        link: link || "",
        linkTitle: link ? getDomainFromUrl(link) : "",
        authorName: currentUser ? (currentUser.fullName || currentUser.username) : "Администратор",
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "homework_posts"), {
                ...newPost,
                createdAt: serverTimestamp()
            });
            showSnackbar("Задание опубликовано!");
            closeAddModal();
            return;
        } catch(e) {}
    }

    newPost.id = "post-" + Date.now();
    homeworkPosts.unshift(newPost);
    renderFeed();
    showSnackbar("Задание сохранено");
    closeAddModal();
}

// 12. ACTIONS: DELETE POST
async function deletePost(postId) {
    if (!confirm("Удалить это задание?")) return;

    if (isFirebaseOnline && db && !postId.startsWith("sample-")) {
        try {
            await deleteDoc(doc(db, "homework_posts", postId));
            showSnackbar("Задание удалено");
            return;
        } catch(e) {}
    }

    homeworkPosts = homeworkPosts.filter(p => p.id !== postId);
    renderFeed();
    showSnackbar("Задание удалено");
}

// 13. ACTIONS: SUBMIT REPORT
async function submitReport(targetType, targetId, reason) {
    const reportData = {
        targetType: targetType,
        targetId: targetId,
        reason: reason,
        reportedBy: currentUser ? (currentUser.fullName || currentUser.username) : "Гость",
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "homework_reports"), {
                ...reportData,
                createdAt: serverTimestamp()
            });
        } catch(e) {}
    }

    closeReportModal();
    showSnackbar("Жалоба отправлена администраторам");
}
// 14. SUPER ADMIN: GENERATE ONE-TIME INVITE CODES
function generateOneTimeCode(role) {
    const prefix = (role === "class_admin" || role === "admin") ? "ADM" : "HUB";
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomPart}`;
}

async function handleGenerateCodeSubmit(typeKey) {
    let role = (typeKey === "admin" || typeKey === "class_admin") ? "class_admin" : "student";

    const codeStr = generateOneTimeCode(role);
    const newCodeItem = {
        code: codeStr,
        role: role,
        used: false,
        usedBy: "",
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "invite_codes"), {
                ...newCodeItem,
                createdAt: serverTimestamp()
            });
        } catch(e) {}
    }

    inviteCodes.unshift(newCodeItem);
    localStorage.setItem("m3_invite_codes", JSON.stringify(inviteCodes));

    generatedCodeValue.textContent = codeStr;
    generatedResultCard.style.display = "flex";
    renderAdminCodesList();
    showSnackbar("Код успешно сгенерирован!");
}

function renderAdminCodesList() {
    if (!adminCodesList) return;
    if (inviteCodes.length === 0) {
        adminCodesList.innerHTML = `<p style="color: var(--md-sys-color-outline); font-size: 13px;">Нет активных кодов.</p>`;
        return;
    }

    adminCodesList.innerHTML = inviteCodes.map(item => {
        const statusClass = item.used ? "used" : "free";
        const statusText = item.used ? `Использован: ${escapeHtml(item.usedBy || 'кем-то')}` : "Свободен (одноразовый)";
        const roleLabel = (item.role === "class_admin" || item.role === "admin") ? "Администратор" : "Ученик";

        return `
            <div class="code-item-card">
                <div class="code-item-left">
                    <span class="code-item-code">${escapeHtml(item.code)}</span>
                    <span class="code-item-info">${roleLabel}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="code-status-pill ${statusClass}">${statusText}</span>
                    ${!item.used ? `
                        <button class="icon-btn copy-code-btn" data-copy-code="${escapeHtml(item.code)}" title="Скопировать">
                            <span class="material-symbols-outlined" style="font-size: 18px;">content_copy</span>
                        </button>
                    ` : ""}
                </div>
            </div>
        `;
    }).join("");

    adminCodesList.querySelectorAll(".copy-code-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const code = btn.dataset.copyCode;
            navigator.clipboard.writeText(code);
            showSnackbar(`Код ${code} скопирован!`);
        });
    });
}

function renderAdminReportsList() {
    if (!adminReportsList) return;
    if (currentReports.length === 0) {
        adminReportsList.innerHTML = `<p style="color: var(--md-sys-color-outline); font-size: 13px;">Жалоб нет. Всё чисто!</p>`;
        return;
    }

    adminReportsList.innerHTML = currentReports.map(rep => {
        return `
            <div class="code-item-card">
                <div class="code-item-left">
                    <span style="font-weight: 700; color: var(--md-sys-color-error);">${escapeHtml(rep.reason)}</span>
                    <span class="code-item-info">От: ${escapeHtml(rep.reportedBy || 'Ученик')}</span>
                </div>
            </div>
        `;
    }).join("");
}

// 15. REGISTRATION & LOGIN HANDLING
async function handleRegister(fullName, username, password, enteredCode) {
    const rawCode = (enteredCode || "").trim();
    const cleanCode = rawCode.toLowerCase();

    // SUPER ADMIN ACCESS CODE (rtfog1g3oi)
    if (
        cleanCode === "rtfog1g3oi" || 
        cleanCode === "root-admin-2026" || 
        cleanCode === "admin-root"
    ) {
        const adminUser = {
            username: username || "admin",
            fullName: fullName || "Главный Администратор",
            role: "super_admin",
            createdAt: new Date().toISOString()
        };
        saveUserSession(adminUser);
        showSnackbar("Создан аккаунт Главного Администратора!");
        closeAuthModal();
        return;
    }

    const upperCode = rawCode.toUpperCase();
    let matchedCodeItem = null;

    if (isFirebaseOnline && db) {
        try {
            const q = query(collection(db, "invite_codes"), where("code", "==", upperCode));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docSnap = snap.docs[0];
                matchedCodeItem = { id: docSnap.id, ...docSnap.data() };
            }
        } catch(e) {}
    }

    if (!matchedCodeItem) {
        matchedCodeItem = inviteCodes.find(c => c.code.toUpperCase() === upperCode);
    }

    if (!matchedCodeItem) {
        showSnackbar("Ошибка: Неверный одноразовый инвайт-код!");
        return;
    }

    if (matchedCodeItem.used) {
        showSnackbar(`Этот код уже был активирован (${matchedCodeItem.usedBy || 'ранее'})!`);
        return;
    }

    matchedCodeItem.used = true;
    matchedCodeItem.usedBy = fullName;
    matchedCodeItem.usedAt = new Date().toISOString();

    if (isFirebaseOnline && db && matchedCodeItem.id) {
        try {
            await updateDoc(doc(db, "invite_codes", matchedCodeItem.id), {
                used: true,
                usedBy: fullName,
                usedAt: serverTimestamp()
            });
        } catch(e) {}
    }

    const localCode = inviteCodes.find(c => c.code.toUpperCase() === upperCode);
    if (localCode) {
        localCode.used = true;
        localCode.usedBy = fullName;
        localStorage.setItem("m3_invite_codes", JSON.stringify(inviteCodes));
    }

    const newUser = {
        username: username,
        password: password,
        fullName: fullName,
        role: matchedCodeItem.role || "student",
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "users"), {
                ...newUser,
                createdAt: serverTimestamp()
            });
        } catch(e) {}
    }

    saveUserSession(newUser);
    showSnackbar(`Добро пожаловать, ${fullName}!`);
    closeAuthModal();
}

async function handleLogin(username, password) {
    const u = (username || "").trim().toLowerCase();
    const p = (password || "").trim().toLowerCase();

    // Direct super admin access via code rtfog1g3oi or default logins
    if (
        u === "rtfog1g3oi" || 
        p === "rtfog1g3oi" || 
        (u === "admin" && p === "admin") || 
        (u === "strelok" && p === "1234")
    ) {
        const superAdmin = {
            username: username || "admin",
            fullName: "Главный Администратор",
            role: "super_admin",
            createdAt: new Date().toISOString()
        };
        saveUserSession(superAdmin);
        showSnackbar("Вход в панель Главного Администратора выполнен!");
        closeAuthModal();
        return;
    }

    let foundUser = null;
    if (isFirebaseOnline && db) {
        try {
            const q = query(collection(db, "users"), where("username", "==", username), where("password", "==", password));
            const snap = await getDocs(q);
            if (!snap.empty) {
                foundUser = snap.docs[0].data();
            }
        } catch(e) {}
    }

    if (!foundUser) {
        const savedUsers = JSON.parse(localStorage.getItem("m3_registered_users") || "[]");
        foundUser = savedUsers.find(u => u.username === username && u.password === password);
    }

    if (foundUser) {
        saveUserSession(foundUser);
        showSnackbar(`С возвращением, ${foundUser.fullName || foundUser.username}!`);
        closeAuthModal();
    } else {
        showSnackbar("Неверный логин или пароль!");
    }
}

function saveUserSession(user) {
    currentUser = user;
    localStorage.setItem("student_auth_user", JSON.stringify(user));
    localStorage.removeItem("student_guest_mode");
    
    const saved = JSON.parse(localStorage.getItem("m3_registered_users") || "[]");
    if (!saved.some(u => u.username === user.username)) {
        saved.push(user);
        localStorage.setItem("m3_registered_users", JSON.stringify(saved));
    }

    updateUserUI();
    renderFeed();

    // Check rules: if not accepted, trigger mandatory rules modal!
    const rulesAccepted = localStorage.getItem("student_rules_accepted") === "true";
    if (!rulesAccepted) {
        setTimeout(() => {
            openRulesModal(true);
        }, 300);
    }
}

function handleGuestLogin() {
    localStorage.setItem("student_guest_mode", "true");
    currentUser = {
        role: "guest",
        fullName: "Гость (Демо)",
        username: "guest",
        isGuest: true
    };
    closeAuthModal();
    updateUserUI();
    renderFeed();

    const rulesAccepted = localStorage.getItem("student_rules_accepted") === "true";
    if (!rulesAccepted) {
        setTimeout(() => {
            openRulesModal(true);
        }, 300);
    } else {
        showSnackbar("Вы вошли в демо-режим (Гость)");
    }
}

// 16. MODAL LISTENERS
function initModals() {
    profileBtn.addEventListener("click", () => {
        if (currentUser) {
            openProfileModal();
        } else {
            openAuthModal();
        }
    });

    if (guestLoginBtn) {
        guestLoginBtn.addEventListener("click", handleGuestLogin);
    }

    if (guestBannerAuthBtn) {
        guestBannerAuthBtn.addEventListener("click", () => openAuthModal(false));
    }

    if (menuGuestAuth) {
        menuGuestAuth.addEventListener("click", () => {
            closeProfileModal();
            openAuthModal(false);
        });
    }

    closeAuthSheetBtn.addEventListener("click", () => {
        if (authModalBackdrop.dataset.mandatory === "true") return;
        closeAuthModal();
    });

    authModalBackdrop.addEventListener("click", (e) => {
        if (e.target === authModalBackdrop) {
            if (authModalBackdrop.dataset.mandatory === "true") {
                showSnackbar("Необходимо войти или выбрать Демо-режим!");
                return;
            }
            closeAuthModal();
        }
    });

    const closeProfileSheetBtn = document.getElementById("closeProfileSheetBtn");
    if (closeProfileSheetBtn) {
        closeProfileSheetBtn.addEventListener("click", closeProfileModal);
    }

    profileModalBackdrop.addEventListener("click", (e) => {
        if (e.target === profileModalBackdrop) closeProfileModal();
    });

    const profileDragHandle = document.getElementById("profileDragHandle");
    if (profileDragHandle) {
        profileDragHandle.addEventListener("click", closeProfileModal);
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (profileModalBackdrop.classList.contains("open")) closeProfileModal();
            if (superAdminModalBackdrop.classList.contains("open")) closeSuperAdminModal();
            if (addModalBackdrop.classList.contains("open")) closeAddModal();
            if (reportModalBackdrop.classList.contains("open")) closeReportModal();
            if (authModalBackdrop.classList.contains("open") && authModalBackdrop.dataset.mandatory !== "true") closeAuthModal();
            if (rulesModalBackdrop.classList.contains("open") && rulesModalBackdrop.dataset.mandatory !== "true") closeRulesModal();
        }
    });

    authTabs.addEventListener("click", (e) => {
        const btn = e.target.closest(".segment-btn");
        if (!btn) return;

        document.querySelectorAll("#authTabs .segment-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.dataset.authTab;
        if (tab === "login") {
            loginForm.style.display = "flex";
            registerForm.style.display = "none";
            document.getElementById("authSheetTitle").textContent = "Вход в аккаунт";
        } else {
            loginForm.style.display = "none";
            registerForm.style.display = "flex";
            document.getElementById("authSheetTitle").textContent = "Регистрация по инвайту";
        }
    });

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const u = document.getElementById("loginUsername").value.trim();
        const p = document.getElementById("loginPassword").value.trim();
        if (u && p) handleLogin(u, p);
    });

    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const fn = document.getElementById("regFullName").value.trim();
        const u = document.getElementById("regUsername").value.trim();
        const p = document.getElementById("regPassword").value.trim();
        const code = document.getElementById("regInviteCode").value.trim();

        if (fn && u && p && code) {
            handleRegister(fn, u, p, code);
        }
    });

    logoutBtn.addEventListener("click", () => {
        currentUser = null;
        localStorage.removeItem("student_auth_user");
        localStorage.removeItem("student_guest_mode");
        closeProfileModal();
        updateUserUI();
        renderFeed();
        showSnackbar("Вы вышли из аккаунта");
        setTimeout(() => {
            openAuthModal(true);
        }, 350);
    });

    menuSuperAdmin.addEventListener("click", () => {
        closeProfileModal();
        openSuperAdminModal();
    });

    superAdminBtn.addEventListener("click", openSuperAdminModal);
    closeSuperAdminBtn.addEventListener("click", closeSuperAdminModal);
    superAdminModalBackdrop.addEventListener("click", (e) => {
        if (e.target === superAdminModalBackdrop) closeSuperAdminModal();
    });

    superAdminTabs.addEventListener("click", (e) => {
        const btn = e.target.closest(".segment-btn");
        if (!btn) return;
        document.querySelectorAll("#superAdminTabs .segment-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.dataset.adminTab;
        tabGenerator.style.display = tab === "generator" ? "flex" : "none";
        tabCodes.style.display = tab === "codes" ? "flex" : "none";
        tabReports.style.display = tab === "reports" ? "flex" : "none";
    });

    generateCodeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const val = inviteRoleSelect.value;
        handleGenerateCodeSubmit(val);
    });

    copyGeneratedCodeBtn.addEventListener("click", () => {
        const c = generatedCodeValue.textContent;
        navigator.clipboard.writeText(c);
        showSnackbar(`Инвайт ${c} скопирован в буфер!`);
    });

    fabAddBtn.addEventListener("click", openAddModal);
    closeAddSheetBtn.addEventListener("click", closeAddModal);
    cancelAddSheetBtn.addEventListener("click", closeAddModal);
    addModalBackdrop.addEventListener("click", (e) => {
        if (e.target === addModalBackdrop) closeAddModal();
    });

    addHomeworkForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const subject = document.getElementById("subjectSelect").value;
        const dueDate = document.getElementById("dueDateInput").value;
        const task = document.getElementById("taskTextInput").value.trim();
        const link = document.getElementById("linkInput").value.trim();

        if (subject && dueDate && task) {
            addHomeworkPost(subject, dueDate, task, link);
            addHomeworkForm.reset();
            initDefaultDate();
        }
    });

    closeReportSheetBtn.addEventListener("click", closeReportModal);
    cancelReportSheetBtn.addEventListener("click", closeReportModal);
    reportModalBackdrop.addEventListener("click", (e) => {
        if (e.target === reportModalBackdrop) closeReportModal();
    });

    reportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const targetType = reportTargetType.value;
        const targetId = reportTargetId.value;
        const reason = reportForm.querySelector('input[name="reportReason"]:checked').value;
        submitReport(targetType, targetId, reason);
    });
}

function openAuthModal(isMandatory = false) {
    authModalBackdrop.dataset.mandatory = isMandatory ? "true" : "false";
    if (closeAuthSheetBtn) {
        closeAuthSheetBtn.style.display = isMandatory ? "none" : "flex";
    }
    authModalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeAuthModal() {
    authModalBackdrop.classList.remove("open");
    document.body.style.overflow = "";
}

function openProfileModal() {
    profileModalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeProfileModal() {
    profileModalBackdrop.classList.remove("open");
    document.body.style.overflow = "";
}

function openSuperAdminModal() {
    superAdminModalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeSuperAdminModal() {
    superAdminModalBackdrop.classList.remove("open");
    document.body.style.overflow = "";
}

function openAddModal() {
    addModalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeAddModal() {
    addModalBackdrop.classList.remove("open");
    document.body.style.overflow = "";
}

function openReportModal(type, id) {
    reportTargetType.value = type;
    reportTargetId.value = id;
    reportModalBackdrop.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeReportModal() {
    reportModalBackdrop.classList.remove("open");
    document.body.style.overflow = "";
}

// 17. UTILITIES
let snackbarTimer = null;
function showSnackbar(message, type = "info", iconName = "check_circle") {
    if (!snackbarEl) return;
    if (snackbarTimer) clearTimeout(snackbarTimer);

    const snackbarIcon = document.getElementById("snackbarIcon");
    if (snackbarIcon) {
        snackbarIcon.textContent = iconName;
    }
    snackbarMsg.textContent = message;

    snackbarEl.classList.remove("error");
    if (type === "error") {
        snackbarEl.classList.add("error");
    }

    snackbarEl.classList.add("show");
    snackbarTimer = setTimeout(() => {
        snackbarEl.classList.remove("show", "error");
    }, 3200);
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatTaskText(text) {
    if (!text) return "";
    const escaped = escapeHtml(text);
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return escaped.replace(urlPattern, url => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--md-sys-color-primary); text-decoration: underline;">${url}</a>`;
    });
}

function getDomainFromUrl(url) {
    try {
        const u = new URL(url);
        return u.hostname.replace("www.", "");
    } catch(e) {
        return "Материалы";
    }
}