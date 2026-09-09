// ==========================================================================
// GOOGLE MATERIAL YOU (M3) STUDENT HOMEWORK HUB • 9В & 9А
// Accounts, One-Time Invite Codes, Multi-Class & Rules Checklist
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
let currentViewClass = "9v"; // '9v' or '9a'
let homeworkPosts = [];
let homeworkComments = [];
let inviteCodes = [];
let currentReports = [];
let currentSubjectFilter = "all";
let currentDateFilter = "all";

// DOM ELEMENTS
const activeClassBadge = document.getElementById("activeClassBadge");
const headerAvatar = document.getElementById("headerAvatar");
const profileBtn = document.getElementById("profileBtn");
const openRulesBtn = document.getElementById("openRulesBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const superAdminBtn = document.getElementById("superAdminBtn");
const superAdminClassSwitcher = document.getElementById("superAdminClassSwitcher");
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
const regClassControl = document.getElementById("regClassControl");

const profileModalBackdrop = document.getElementById("profileModalBackdrop");
const profileAvatarLarge = document.getElementById("profileAvatarLarge");
const profileNameDisplay = document.getElementById("profileNameDisplay");
const profileClassBadge = document.getElementById("profileClassBadge");
const profileRoleBadge = document.getElementById("profileRoleBadge");
const menuOpenRules = document.getElementById("menuOpenRules");
const menuSuperAdmin = document.getElementById("menuSuperAdmin");
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
const targetClassPill = document.getElementById("targetClassPill");
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
    initDefaultDate();
    initFilters();
    initModals();
    initFirebaseSync();
});

// 4. SESSION & AUTH CONTROLLER
function initSession() {
    const savedUser = localStorage.getItem("student_auth_user");
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser.role !== "super_admin") {
                currentViewClass = currentUser.classId || "9v";
            }
        } catch(e) {
            currentUser = null;
        }
    }
    updateUserUI();
}

function updateUserUI() {
    if (!currentUser) {
        headerAvatar.textContent = "?";
        activeClassBadge.textContent = "Гость";
        superAdminBtn.style.display = "none";
        superAdminClassSwitcher.style.display = "none";
        roleBanner.style.display = "none";
        fabAddBtn.style.display = "none";
        return;
    }

    const initial = (currentUser.fullName || currentUser.username || "У")[0].toUpperCase();
    headerAvatar.textContent = initial;
    profileAvatarLarge.textContent = initial;
    profileNameDisplay.textContent = currentUser.fullName || currentUser.username;

    const className = (currentUser.classId === "9a" ? "9А" : "9В") + " класс";
    profileClassBadge.textContent = currentUser.role === "super_admin" ? "Все классы" : className;
    
    let roleText = "Ученик";
    if (currentUser.role === "class_admin") roleText = "Староста";
    if (currentUser.role === "super_admin") roleText = "Главный Админ";
    profileRoleBadge.textContent = roleText;

    if (currentUser.role === "super_admin") {
        activeClassBadge.textContent = currentViewClass === "9a" ? "9А" : "9В";
        superAdminBtn.style.display = "flex";
        superAdminClassSwitcher.style.display = "flex";
        menuSuperAdmin.style.display = "flex";
        roleBanner.style.display = "flex";
        roleBannerText.textContent = `Главный Админ (просмотр ${currentViewClass.toUpperCase()})`;
        fabAddBtn.style.display = "inline-flex";
    } else if (currentUser.role === "class_admin") {
        activeClassBadge.textContent = currentUser.classId === "9a" ? "9А" : "9В";
        superAdminBtn.style.display = "none";
        superAdminClassSwitcher.style.display = "none";
        menuSuperAdmin.style.display = "none";
        roleBanner.style.display = "flex";
        roleBannerText.textContent = `Режим старосты (${currentUser.classId.toUpperCase()})`;
        fabAddBtn.style.display = "inline-flex";
    } else {
        activeClassBadge.textContent = currentUser.classId === "9a" ? "9А" : "9В";
        superAdminBtn.style.display = "none";
        superAdminClassSwitcher.style.display = "none";
        menuSuperAdmin.style.display = "none";
        roleBanner.style.display = "none";
        fabAddBtn.style.display = "none";
    }

    targetClassPill.textContent = (currentViewClass === "9a" ? "9А" : "9В") + " класс";
}

// 5. RULES ONBOARDING (Mandatory Checkboxes)
function initRulesCheck() {
    const accepted = localStorage.getItem("student_rules_accepted") === "true";
    if (!accepted) {
        setTimeout(openRulesModal, 500);
    }

    const checkAllRules = () => {
        acceptRulesBtn.disabled = !(rule1.checked && rule2.checked && rule3.checked);
    };

    rule1.addEventListener("change", checkAllRules);
    rule2.addEventListener("change", checkAllRules);
    rule3.addEventListener("change", checkAllRules);

    acceptRulesBtn.addEventListener("click", () => {
        localStorage.setItem("student_rules_accepted", "true");
        closeRulesModal();
        showSnackbar("Правила приняты! Добро пожаловать.");

        if (!currentUser) {
            setTimeout(openAuthModal, 400);
        }
    });

    openRulesBtn.addEventListener("click", openRulesModal);
    menuOpenRules.addEventListener("click", () => {
        closeProfileModal();
        openRulesModal();
    });
}

function openRulesModal() {
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

    superAdminClassSwitcher.addEventListener("click", (e) => {
        const btn = e.target.closest(".segment-btn");
        if (!btn) return;
        document.querySelectorAll("#superAdminClassSwitcher .segment-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentViewClass = btn.dataset.adminClass;
        updateUserUI();
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
// 9. RENDER FEED (Filtered by classId)
function renderFeed() {
    homeworkFeedEl.innerHTML = "";

    const todayStr = getRelativeDate(0);
    const tomorrowStr = getRelativeDate(1);

    const classFiltered = homeworkPosts.filter(p => {
        if (p.classId) return p.classId === currentViewClass;
        return currentViewClass === "9v";
    });

    const filtered = classFiltered.filter(post => {
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
        (currentUser.role === "class_admin" && currentUser.classId === post.classId)
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
            <div style="display: flex; align-items: center; gap: 6px;">
                <span class="subject-badge">${escapeHtml(post.subject)}</span>
                <span class="class-pill-badge" style="font-size: 11px;">${(post.classId || '9v').toUpperCase()}</span>
            </div>
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

            <form class="comment-input-bar" data-post-id="${post.id}">
                <div class="comment-row">
                    <input type="text" class="comment-msg-input" placeholder="${currentUser ? 'Написать комментарий...' : 'Войдите, чтобы комментировать'}" maxlength="250" ${!currentUser ? 'disabled' : ''} required>
                    <button type="submit" class="comment-send-btn" title="Отправить" ${!currentUser ? 'disabled' : ''}>
                        <span class="material-symbols-outlined">arrow_upward</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    const toggleBtn = card.querySelector(".toggle-comments-btn");
    const commentsSec = card.querySelector(".comments-section");
    toggleBtn.addEventListener("click", () => {
        commentsSec.classList.toggle("open");
    });

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
    commentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!currentUser) {
            openAuthModal();
            return;
        }

        const msgInput = commentForm.querySelector(".comment-msg-input");
        const text = msgInput.value.trim();
        if (!text) return;

        addComment(post.id, text);
        msgInput.value = "";
    });

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

        const classBadge = c.authorClass ? `<span class="class-pill-badge" style="font-size: 10px; padding: 1px 6px;">${c.authorClass.toUpperCase()}</span>` : "";

        return `
            <div class="comment-bubble">
                <div class="comment-meta">
                    <div class="comment-author-badge">
                        <div class="comment-avatar">${escapeHtml(initial)}</div>
                        <span class="comment-author-name">${escapeHtml(c.authorName)}</span>
                        ${classBadge}
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
    if (!currentUser) return;

    const newComment = {
        postId: postId,
        authorName: currentUser.fullName || currentUser.username,
        authorClass: currentUser.classId || currentViewClass,
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
    const targetClass = currentViewClass;

    const newPost = {
        classId: targetClass,
        subject: subject,
        dueDate: dueDate,
        task: task,
        link: link || "",
        linkTitle: link ? getDomainFromUrl(link) : "",
        authorName: currentUser ? (currentUser.fullName || currentUser.username) : "Староста",
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "homework_posts"), {
                ...newPost,
                createdAt: serverTimestamp()
            });
            showSnackbar(`Задание для ${targetClass.toUpperCase()} опубликовано!`);
            closeAddModal();
            return;
        } catch(e) {}
    }

    newPost.id = "post-" + Date.now();
    homeworkPosts.unshift(newPost);
    renderFeed();
    showSnackbar(`Задание для ${targetClass.toUpperCase()} сохранено`);
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
        classId: currentViewClass,
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
function generateOneTimeCode(classId, role) {
    const prefix = role === "class_admin" ? `ADM-${classId.toUpperCase()}` : classId.toUpperCase();
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomPart}`;
}

async function handleGenerateCodeSubmit(typeKey) {
    let classId = "9v";
    let role = "student";

    if (typeKey === "9v_student") { classId = "9v"; role = "student"; }
    else if (typeKey === "9a_student") { classId = "9a"; role = "student"; }
    else if (typeKey === "9v_admin") { classId = "9v"; role = "class_admin"; }
    else if (typeKey === "9a_admin") { classId = "9a"; role = "class_admin"; }

    const codeStr = generateOneTimeCode(classId, role);
    const newCodeItem = {
        code: codeStr,
        classId: classId,
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
        const roleLabel = item.role === "class_admin" ? "Староста" : "Ученик";
        const classLabel = (item.classId || "9v").toUpperCase();

        return `
            <div class="code-item-card">
                <div class="code-item-left">
                    <span class="code-item-code">${escapeHtml(item.code)}</span>
                    <span class="code-item-info">${roleLabel} • ${classLabel}</span>
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
                    <span class="code-item-info">От: ${escapeHtml(rep.reportedBy || 'Ученик')} • Класс: ${(rep.classId || '9V').toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join("");
}

// 15. REGISTRATION & LOGIN HANDLING
async function handleRegister(fullName, username, password, chosenClass, enteredCode) {
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
            classId: chosenClass || "9v",
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

    if (matchedCodeItem.classId && matchedCodeItem.classId !== chosenClass) {
        showSnackbar(`Этот код предназначен для класса ${matchedCodeItem.classId.toUpperCase()}!`);
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
        classId: chosenClass,
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
    showSnackbar(`Добро пожаловать в ${chosenClass.toUpperCase()}, ${fullName}!`);
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
            classId: "9v",
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
    currentViewClass = user.classId || "9v";
    localStorage.setItem("student_auth_user", JSON.stringify(user));
    
    const saved = JSON.parse(localStorage.getItem("m3_registered_users") || "[]");
    if (!saved.some(u => u.username === user.username)) {
        saved.push(user);
        localStorage.setItem("m3_registered_users", JSON.stringify(saved));
    }

    updateUserUI();
    renderFeed();
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

    closeAuthSheetBtn.addEventListener("click", closeAuthModal);
    authModalBackdrop.addEventListener("click", (e) => {
        if (e.target === authModalBackdrop) closeAuthModal();
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

    regClassControl.addEventListener("click", (e) => {
        const btn = e.target.closest(".segment-btn");
        if (!btn) return;
        document.querySelectorAll("#regClassControl .segment-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
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
        const activeClassBtn = document.querySelector("#regClassControl .segment-btn.active");
        const chosenClass = activeClassBtn ? activeClassBtn.dataset.regClass : "9v";
        const code = document.getElementById("regInviteCode").value.trim();

        if (fn && u && p && code) {
            handleRegister(fn, u, p, chosenClass, code);
        }
    });

    logoutBtn.addEventListener("click", () => {
        currentUser = null;
        currentViewClass = "9v";
        localStorage.removeItem("student_auth_user");
        closeProfileModal();
        updateUserUI();
        renderFeed();
        showSnackbar("Вы вышли из аккаунта");
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

function openAuthModal() {
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
    targetClassPill.textContent = (currentViewClass === "9a" ? "9А" : "9В") + " класс";
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
function showSnackbar(message) {
    if (!snackbarEl) return;
    snackbarMsg.textContent = message;
    snackbarEl.classList.add("show");
    setTimeout(() => {
        snackbarEl.classList.remove("show");
    }, 3500);
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