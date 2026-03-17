// 1. FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCpFL2AJO17gfjQa2TTcNqa-lAdEgqVxpw",
    authDomain: "mingbulak-ijara.firebaseapp.com",
    projectId: "mingbulak-ijara",
    storageBucket: "mingbulak-ijara.firebasestorage.app",
    messagingSenderId: "999036185534",
    appId: "1:999036185534:web:112a51eb1dcf76c685a7ef"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. AI CONFIG (HUGGING FACE)
const HF_TOKEN = "_hf_ZeMmtgVoTJrBcEFMxAEchNzdpDgfQMwUuF"; 
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

// 3. TRANSLATIONS
const translations = {
    uz: {
        heroT: "Maktabingizga Yaqin <br><span>Aqlli Ijaralar</span>",
        heroS: "NetGlobal Team tomonidan yaratilgan innovatsion platforma.",
        viewB: "E'lonlarni ko'rish",
        postB: "<i class='fab fa-telegram'></i> E'lon berish",
        secT: "Barcha E'lonlar",
        adminL: "Admin Kirish",
        creatL: "Yaratuvchilar:",
        srchP: "Qidiruv..."
    },
    en: {
        heroT: "Smart Rentals <br><span>Near Your School</span>",
        heroS: "Innovative platform created by NetGlobal Team.",
        viewB: "View Ads",
        postB: "<i class='fab fa-telegram'></i> Post Ad",
        secT: "All Announcements",
        adminL: "Admin Login",
        creatL: "Developers:",
        srchP: "Search..."
    },
    ru: {
        heroT: "Умная Аренда <br><span>Рядом со Школой</span>",
        heroS: "Инновационная платформа от NetGlobal Team.",
        viewB: "Просмотреть объявления",
        postB: "<i class='fab fa-telegram'></i> Подать объявление",
        secT: "Все объявления",
        adminL: "Вход для админа",
        creatL: "Создатели:",
        srchP: "Поиск..."
    }
};

// 4. THEME & LANG LOGIC
const themeBtn = document.getElementById('theme-toggle');
const langSelect = document.getElementById('lang-select');

themeBtn.onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeBtn.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
};

langSelect.onchange = (e) => {
    const l = translations[e.target.value];
    document.getElementById('hero-title').innerHTML = l.heroT;
    document.getElementById('hero-subtitle').innerText = l.heroS;
    document.getElementById('view-btn').innerText = l.viewB;
    document.getElementById('post-btn').innerHTML = l.postB;
    document.getElementById('section-title').innerText = l.secT;
    document.getElementById('admin-login-text').innerText = l.adminL;
    document.getElementById('creator-label').innerText = l.creatL;
    document.getElementById('search-input').placeholder = l.srchP;
};

// 5. AI FUNCTION
async function askAI(prompt) {
    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
            headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({ inputs: `Javobni ${langSelect.value} tilida ber. Savol: ${prompt}` }),
        });
        const result = await response.json();
        return result[0].generated_text.split("Savol:")[0] || "AI javob bera olmadi.";
    } catch (e) { return "Ulanishda xato!"; }
}

const chatBody = document.getElementById('ai-chat-body');
document.getElementById('ai-send-btn').onclick = async () => {
    const inp = document.getElementById('ai-user-input');
    if(!inp.value) return;
    chatBody.innerHTML += `<div class="ai-message user">${inp.value}</div>`;
    const msg = inp.value; inp.value = "";
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-message bot'; botMsg.innerText = "...";
    chatBody.appendChild(botMsg);
    const reply = await askAI(msg);
    botMsg.innerText = reply;
    chatBody.scrollTop = chatBody.scrollHeight;
};

document.getElementById('ai-chat-toggle').onclick = () => document.getElementById('ai-chat-wrapper').classList.toggle('ai-chat-hidden');
document.getElementById('ai-chat-close').onclick = () => document.getElementById('ai-chat-wrapper').classList.add('ai-chat-hidden');

// 6. FIREBASE & ADMIN
let pickerMap, marker;
function render() {
    db.collection("posts").orderBy("createdAt", "desc").onSnapshot(snap => {
        const grid = document.getElementById('main-grid');
        grid.innerHTML = "";
        snap.forEach(doc => {
            const p = doc.data();
            grid.innerHTML += `
                <div class="card" data-aos="fade-up">
                    <img src="${p.image || 'https://via.placeholder.com/300'}" class="card-img">
                    <div class="card-body">
                        <h3>${p.title}</h3>
                        <p>${p.desc}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
                            <a href="https://t.me/mingbulak_im_bot" target="_blank" class="btn-primary" style="padding:8px 15px; font-size:0.8rem">Bog'lanish</a>
                            ${p.map ? `<a href="https://www.google.com/maps?q=${p.map}" target="_blank" style="color:var(--primary)"><i class="fas fa-map-marked-alt fa-lg"></i></a>` : ''}
                        </div>
                    </div>
                </div>`;
        });
    });
}

function initMap() {
    if (pickerMap) return;
    pickerMap = L.map('map-picker').setView([40.9333, 71.3333], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickerMap);
    pickerMap.on('click', e => {
        if (marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(pickerMap);
        document.getElementById('selected-coords').value = `${e.latlng.lat},${e.latlng.lng}`;
    });
}

async function savePost() {
    const t = document.getElementById('post-title').value;
    const d = document.getElementById('post-desc').value;
    const c = document.getElementById('selected-coords').value;
    const i = document.getElementById('post-image').files[0];
    if(!t || !d) return alert("To'ldiring!");
    
    let imgB64 = "";
    if(i) {
        imgB64 = await new Promise(r => {
            const reader = new FileReader();
            reader.onload = e => r(e.target.result);
            reader.readAsDataURL(i);
        });
    }

    await db.collection("posts").add({ title: t, desc: d, map: c, image: imgB64, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert("Saqlandi!"); closeModal();
}

document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';
function checkAdmin() {
    if(document.getElementById('login').value === "mystra" && document.getElementById('password').value === "mystra2014") {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        initMap();
    }
}

function closeModal() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
function logout() { location.reload(); }

render();
