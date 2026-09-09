// ==========================================================================
// GOOGLE MATERIAL YOU (M3) STUDENT HOMEWORK HUB
// Firebase Realtime Firestore & Offline Fallback
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    deleteDoc,
    doc,
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyC26Ub9WV7Swfw1lje5KvQe929ufMyiJzU",
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
    console.warn("Firebase initialization fallback:", e);
    isFirebaseOnline = false;
}

// 2. DEFAULT REALISTIC DATA
const SAMPLE_POSTS = [
    {
        id: "sample-1",
        subject: "Алгебра",
        dueDate: getRelativeDate(1), // Tomorrow
        task: "Параграф 4, повторить формулы сокращенного умножения.\nНомера: № 124 (а, б), № 126, № 131 (на оценку).",
        link: "https://resh.edu.ru",
        linkTitle: "РЭШ — конспект урока",
        createdAt: new Date().toISOString()
    },
    {
        id: "sample-2",
        subject: "Физика",
        dueDate: getRelativeDate(1), // Tomorrow
        task: "§7 'Равноускоренное движение', выписать основные формулы и график скорости в тетрадь.\nУпражнение 7 (задачи 1, 3).",
        link: "",
        linkTitle: "",
        createdAt: new Date().toISOString()
    },
    {
        id: "sample-3",
        subject: "Русский язык",
        dueDate: getRelativeDate(2), // Day after tomorrow
        task: "Упр. 82 — разобрать по составу выделенные слова, составить 2 сложноподчиненных предложения со схемой.",
        link: "",
        linkTitle: "",
        createdAt: new Date().toISOString()
    },
    {
        id: "sample-4",
        subject: "Геометрия",
        dueDate: getRelativeDate(3),
        task: "Теорема Пифагора и свойства прямоугольного треугольника. Задача на с. 38 № 15.",
        link: "",
        linkTitle: "",
        createdAt: new Date().toISOString()
    }
];

const SAMPLE_COMMENTS = [
    {
        id: "comm-1",
        postId: "sample-1",
        author: "Максим",
        text: "В 126 номере дискриминант точно положительный?",
        createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: "comm-2",
        postId: "sample-1",
        author: "Даша",
        text: "Да, там D = 49, корни x1 = 3, x2 = -4",
        createdAt: new Date(Date.now() - 1800000).toISOString()
    }
];

// State
let homeworkPosts = [];
let homeworkComments = [];
let currentSubjectFilter = "all";
let currentDateFilter = "all";
let isAuthorMode = sessionStorage.getItem("m3_author") === "true";
const AUTHOR_PIN = "1234";

// DOM Elements
const homeworkFeedEl = document.getElementById("homeworkFeed");
const emptyStateEl = document.getElementById("emptyState");
const subjectChipsContainer = document.getElementById("subjectChips");
const dateFiltersContainer = document.getElementById("dateFilters");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const authorModeBtn = document.getElementById("authorModeBtn");
const authorIcon = document.getElementById("authorIcon");
const authorBanner = document.getElementById("authorBanner");
const logoutAuthorBtn = document.getElementById("logoutAuthorBtn");
const fabAddBtn = document.getElementById("fabAddBtn");
const statusPill = document.getElementById("statusPill");
const statusText = document.getElementById("statusText");
const snackbarEl = document.getElementById("snackbar");
const snackbarMsg = document.getElementById("snackbarMsg");

// Modals
const addModalBackdrop = document.getElementById("addModalBackdrop");
const addHomeworkForm = document.getElementById("addHomeworkForm");
const pinGroup = document.getElementById("pinGroup");
const authorPinInput = document.getElementById("authorPinInput");
const dueDateInput = document.getElementById("dueDateInput");
const closeAddSheetBtn = document.getElementById("closeAddSheetBtn");
const cancelAddSheetBtn = document.getElementById("cancelAddSheetBtn");

const reportModalBackdrop = document.getElementById("reportModalBackdrop");
const reportForm = document.getElementById("reportForm");
const reportTargetType = document.getElementById("reportTargetType");
const reportTargetId = document.getElementById("reportTargetId");
const closeReportSheetBtn = document.getElementById("closeReportSheetBtn");
const cancelReportSheetBtn = document.getElementById("cancelReportSheetBtn");

// 3. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initAuthorState();
    initDefaultDate();
    initFilters();
    initModals();
    initFirebaseSync();
});

// 4. THEME CONTROLLER
function initTheme() {
    const savedTheme = localStorage.getItem("m3_theme");
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    applyTheme(initialTheme);

    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(newTheme);
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("m3_theme", theme);
    themeIcon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute("content", theme === "dark" ? "#111318" : "#fdfcff");
    }
}

// 5. AUTHOR MODE
function initAuthorState() {
    updateAuthorUI();

    authorModeBtn.addEventListener("click", () => {
        if (isAuthorMode) {
            showSnackbar("Режим автора уже включен");
        } else {
            promptAuthorLogin();
        }
    });

    logoutAuthorBtn.addEventListener("click", () => {
        isAuthorMode = false;
        sessionStorage.removeItem("m3_author");
        updateAuthorUI();
        renderFeed();
        showSnackbar("Вы вышли из режима автора");
    });
}

function updateAuthorUI() {
    if (isAuthorMode) {
        authorIcon.textContent = "lock_open";
        authorModeBtn.classList.add("active-lock");
        authorBanner.style.display = "flex";
        pinGroup.style.display = "none";
    } else {
        authorIcon.textContent = "lock";
        authorModeBtn.classList.remove("active-lock");
        authorBanner.style.display = "none";
        pinGroup.style.display = "block";
    }
}

function promptAuthorLogin() {
    const pin = prompt("Введите PIN-код автора (по умолчанию: 1234):");
    if (pin === null) return;

    if (pin.trim() === AUTHOR_PIN) {
        isAuthorMode = true;
        sessionStorage.setItem("m3_author", "true");
        updateAuthorUI();
        renderFeed();
        showSnackbar("Режим автора активирован!");
    } else {
        showSnackbar("Неверный PIN-код!");
    }
}

// 6. DEFAULT DUE DATE
function initDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    dueDateInput.value = `${yyyy}-${mm}-${dd}`;
}

function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// 7. FILTERS CONTROLLER
function initFilters() {
    // Subject Filter Chips
    subjectChipsContainer.addEventListener("click", (e) => {
        const chip = e.target.closest(".filter-chip");
        if (!chip) return;

        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        currentSubjectFilter = chip.dataset.subject;
        renderFeed();
    });

    // Date Filter Segmented Buttons
    dateFiltersContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".segment-btn");
        if (!btn) return;

        document.querySelectorAll(".segment-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentDateFilter = btn.dataset.dateFilter;
        renderFeed();
    });
}

// 8. FIREBASE SYNC & LOCAL PERSISTENCE
function initFirebaseSync() {
    const localPosts = localStorage.getItem("m3_local_posts");
    const localComments = localStorage.getItem("m3_local_comments");

    if (localPosts) {
        try { homeworkPosts = JSON.parse(localPosts); } catch(e) {}
    } else {
        homeworkPosts = [...SAMPLE_POSTS];
    }

    if (localComments) {
        try { homeworkComments = JSON.parse(localComments); } catch(e) {}
    } else {
        homeworkComments = [...SAMPLE_COMMENTS];
    }

    renderFeed();

    if (!isFirebaseOnline || !db) {
        showStatus("Автономный режим (локально)");
        return;
    }

    showStatus("Синхронизация...");

    // Real-time Posts Listener
    try {
        const qPosts = query(collection(db, "homework_posts"), orderBy("dueDate", "asc"));
        onSnapshot(qPosts, (snapshot) => {
            if (!snapshot.empty) {
                const cloudPosts = [];
                snapshot.forEach(docSnap => {
                    cloudPosts.push({ id: docSnap.id, ...docSnap.data() });
                });
                homeworkPosts = cloudPosts;
                localStorage.setItem("m3_local_posts", JSON.stringify(homeworkPosts));
            } else if (homeworkPosts.length === 0) {
                homeworkPosts = [...SAMPLE_POSTS];
            }
            renderFeed();
            showStatus("Синхронизировано");
        }, (err) => {
            console.warn("Firestore posts listener fallback:", err);
            renderFeed();
        });
    } catch (e) {
        console.warn("Firestore error:", e);
    }

    // Real-time Comments Listener
    try {
        const qComments = query(collection(db, "homework_comments"), orderBy("createdAt", "asc"));
        onSnapshot(qComments, (snapshot) => {
            if (!snapshot.empty) {
                const cloudComments = [];
                snapshot.forEach(docSnap => {
                    cloudComments.push({ id: docSnap.id, ...docSnap.data() });
                });
                homeworkComments = cloudComments;
                localStorage.setItem("m3_local_comments", JSON.stringify(homeworkComments));
                renderFeed();
            }
        }, (err) => {
            console.warn("Firestore comments error:", err);
        });
    } catch (e) {}
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
    
    // Filter posts
    const filtered = homeworkPosts.filter(post => {
        // Subject filter
        if (currentSubjectFilter !== "all" && post.subject !== currentSubjectFilter) {
            return false;
        }

        // Date filter
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

    // Date formatting
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
        if (parts.length === 3) {
            dateLabel = `${parts[2]}.${parts[1]}`;
        }
    }

    // Comments count
    const postComments = homeworkComments.filter(c => c.postId === post.id);
    const commentCount = postComments.length;

    // Link markup
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

    // Author delete button
    let deleteHtml = "";
    if (isAuthorMode) {
        deleteHtml = `
            <button class="icon-btn delete-card-btn" data-delete-id="${post.id}" title="Удалить пост">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
    }

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
                <button class="action-pill-btn report-btn" data-report-type="post" data-report-id="${post.id}" title="Пожаловаться на ошибку в задании">
                    <span class="material-symbols-outlined">flag</span>
                    <span>Репорт</span>
                </button>
                ${deleteHtml}
            </div>
        </div>

        <!-- Inline Comments Section -->
        <div class="comments-section" id="comments-${post.id}">
            <div class="comments-list" id="comments-list-${post.id}">
                ${renderCommentsHtml(postComments)}
            </div>

            <form class="comment-input-bar" data-post-id="${post.id}">
                <input type="text" class="comment-name-input" placeholder="Ваше имя..." value="${escapeHtml(localStorage.getItem('student_nickname') || '')}" maxlength="30" required>
                <div class="comment-row">
                    <input type="text" class="comment-msg-input" placeholder="Задать вопрос или написать подсказку..." maxlength="250" required>
                    <button type="submit" class="comment-send-btn" title="Отправить">
                        <span class="material-symbols-outlined">arrow_upward</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    // Toggle Comments
    const toggleBtn = card.querySelector(".toggle-comments-btn");
    const commentsSec = card.querySelector(".comments-section");
    toggleBtn.addEventListener("click", () => {
        commentsSec.classList.toggle("open");
    });

    // Report Post
    const reportBtn = card.querySelector(".report-btn");
    reportBtn.addEventListener("click", () => {
        openReportModal("post", post.id);
    });

    // Delete Post (Author)
    const deleteBtn = card.querySelector(".delete-card-btn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            deletePost(post.id);
        });
    }

    // Comment Form Submit
    const commentForm = card.querySelector(".comment-input-bar");
    commentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const nameInput = commentForm.querySelector(".comment-name-input");
        const msgInput = commentForm.querySelector(".comment-msg-input");
        
        const authorName = nameInput.value.trim();
        const text = msgInput.value.trim();

        if (!authorName || !text) return;

        localStorage.setItem("student_nickname", authorName);
        addComment(post.id, authorName, text);
        msgInput.value = "";
    });

    // Comment Report Buttons
    card.querySelectorAll(".comment-report-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const commentId = btn.dataset.commentId;
            openReportModal("comment", commentId);
        });
    });

    return card;
}

function renderCommentsHtml(comments) {
    if (!comments || comments.length === 0) {
        return `<p style="font-size: 12.5px; color: var(--md-sys-color-outline); margin-bottom: 6px;">Пока нет комментариев. Напишите первым!</p>`;
    }

    return comments.map(c => {
        const initial = (c.author || "У")[0].toUpperCase();
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
                        <span class="comment-author-name">${escapeHtml(c.author)}</span>
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
async function addComment(postId, author, text) {
    const newComment = {
        postId: postId,
        author: author,
        text: text,
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "homework_comments"), {
                ...newComment,
                createdAt: serverTimestamp()
            });
            showSnackbar("Комментарий отправлен");
            return;
        } catch (e) {
            console.warn("Error adding comment to Firebase, saving locally:", e);
        }
    }

    // Local fallback
    newComment.id = "local-comm-" + Date.now();
    homeworkComments.push(newComment);
    localStorage.setItem("m3_local_comments", JSON.stringify(homeworkComments));
    renderFeed();
    showSnackbar("Комментарий опубликован");
}

// 11. ACTIONS: ADD HOMEWORK POST
async function addHomeworkPost(subject, dueDate, task, link) {
    const newPost = {
        subject: subject,
        dueDate: dueDate,
        task: task,
        link: link || "",
        linkTitle: link ? getDomainFromUrl(link) : "",
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "homework_posts"), {
                ...newPost,
                createdAt: serverTimestamp()
            });
            showSnackbar("Задание успешно опубликовано!");
            closeAddModal();
            return;
        } catch (e) {
            console.warn("Error adding post to Firebase, saving locally:", e);
        }
    }

    // Local fallback
    newPost.id = "local-post-" + Date.now();
    homeworkPosts.unshift(newPost);
    localStorage.setItem("m3_local_posts", JSON.stringify(homeworkPosts));
    renderFeed();
    showSnackbar("Задание сохранено!");
    closeAddModal();
}

// 12. ACTIONS: DELETE POST
async function deletePost(postId) {
    if (!confirm("Удалить это задание?")) return;

    if (isFirebaseOnline && db && !postId.startsWith("sample-") && !postId.startsWith("local-")) {
        try {
            await deleteDoc(doc(db, "homework_posts", postId));
            showSnackbar("Задание удалено из базы");
            return;
        } catch(e) {
            console.warn("Delete firestore error:", e);
        }
    }

    homeworkPosts = homeworkPosts.filter(p => p.id !== postId);
    localStorage.setItem("m3_local_posts", JSON.stringify(homeworkPosts));
    renderFeed();
    showSnackbar("Задание удалено");
}

// 13. ACTIONS: SUBMIT REPORT
async function submitReport(targetType, targetId, reason) {
    const reportData = {
        targetType: targetType,
        targetId: targetId,
        reason: reason,
        createdAt: new Date().toISOString()
    };

    if (isFirebaseOnline && db) {
        try {
            await addDoc(collection(db, "homework_reports"), {
                ...reportData,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.warn("Error submitting report:", e);
        }
    }

    closeReportModal();
    showSnackbar("Жалоба отправлена автору на проверку");
}

// 14. MODAL MANAGEMENT
function initModals() {
    fabAddBtn.addEventListener("click", () => {
        openAddModal();
    });

    closeAddSheetBtn.addEventListener("click", closeAddModal);
    cancelAddSheetBtn.addEventListener("click", closeAddModal);
    addModalBackdrop.addEventListener("click", (e) => {
        if (e.target === addModalBackdrop) closeAddModal();
    });

    addHomeworkForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // PIN validation if not logged in
        if (!isAuthorMode) {
            const enteredPin = authorPinInput.value.trim();
            if (enteredPin !== AUTHOR_PIN) {
                showSnackbar("Неверный PIN автора!");
                return;
            } else {
                isAuthorMode = true;
                sessionStorage.setItem("m3_author", "true");
                updateAuthorUI();
            }
        }

        const subject = document.getElementById("subjectSelect").value;
        const dueDate = document.getElementById("dueDateInput").value;
        const task = document.getElementById("taskTextInput").value.trim();
        const link = document.getElementById("linkInput").value.trim();

        if (!subject || !dueDate || !task) {
            showSnackbar("Заполните все обязательные поля");
            return;
        }

        addHomeworkPost(subject, dueDate, task, link);
        addHomeworkForm.reset();
        initDefaultDate();
    });

    // Report Modal
    closeReportSheetBtn.addEventListener("click", closeReportModal);
    cancelReportSheetBtn.addEventListener("click", closeReportModal);
    reportModalBackdrop.addEventListener("click", (e) => {
        if (e.target === reportModalBackdrop) closeReportModal();
    });

    reportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const targetType = reportTargetType.value;
        const targetId = reportTargetId.value;
        const selectedReason = reportForm.querySelector('input[name="reportReason"]:checked').value;

        submitReport(targetType, targetId, selectedReason);
    });
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

// 15. UTILITIES
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