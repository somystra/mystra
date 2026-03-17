// 1. KONFIGURATSIYA
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

const HF_TOKEN = "hf_hf_ZeMmtgVoTJrBcEFMxAEchNzdpDgfQMwUuF"; // Hugging Face Tokenni qo'ying
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

// 2. TARJIMARLAR
const translations = {
    uz: {
        heroT: "Maktabingizga Yaqin <br><span>Aqlli Ijaralar</span>",
        heroS: "NetGlobal Team tomonidan yaratilgan innovatsion platforma.",
        viewB: "E'lonlarni ko'rish",
        secT: "Barcha E'lonlar",
        adminL: "Admin Kirish",
        addP: "Yangi Ijara",
        creatL: "Yaratuvchilar:",
        srchP: "Qidiruv...",
        aiHi: "Salom! Men NetGlobal AI yordamchisiman."
    },
    en: {
        heroT: "Smart Rentals <br><span>Near Your School</span>",
        heroS: "Innovative platform created by NetGlobal Team.",
        viewB: "View Ads",
        secT: "All Announcements",
        adminL: "Admin Login",
        addP: "New Rental",
        creatL: "Developers:",
        srchP: "Search...",
        aiHi: "Hello! I am NetGlobal AI Assistant."
    },
    ru: {
        heroT: "Умная Аренда <br><span>Рядом со Школой</span>",
        heroS: "Инновационная платформа от NetGlobal Team.",
        viewB: "Просмотреть объявления",
        secT: "Все объявления",
        adminL: "Вход для админа",
        addP: "Новая аренда",
        creatL: "Создатели:",
        srchP: "Поиск...",
        aiHi: "Привет! Я AI помощник NetGlobal."
    }
};

// 3. REJIM VA TIL LOGIKASI
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
    document.getElementById('section-title').innerText = l.secT;
    document.getElementById('admin-login-text').innerText = l.adminL;
    document.getElementById('add-post-text').innerText = l.addP;
    document.getElementById('creator-label').innerText = l.creatL;
    document.getElementById('search-input').placeholder = l.srchP;
};

// 4. AI (Hugging Face)
async function askAI(prompt) {
    try {
        const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
            headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({ inputs: `Language: ${langSelect.value}. User: ${prompt}` })
        });
        const data = await res.json();
        return data[0].generated_text || "Error";
    } catch (e) { return "Ulanish xatosi."; }
}

const chatBody = document.getElementById('ai-chat-body');
document.getElementById('ai-send-btn').onclick = async () => {
    const inp = document.getElementById('ai-user-input');
    if(!inp.value) return;
    
    chatBody.innerHTML += `<div class="ai-message user">${inp.value}</div>`;
    const reply = await askAI(inp.value);
    chatBody.innerHTML += `<div class="ai-message bot">${reply}</div>`;
    inp.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;
};

document.getElementById('ai-chat-toggle').onclick = () => document.getElementById('ai-chat-wrapper').classList.toggle('ai-chat-hidden');
document.getElementById('ai-chat-close').onclick = () => document.getElementById('ai-chat-wrapper').classList.add('ai-chat-hidden');

// 5. FIREBASE VA ADMIN
let pickerMap, marker, allPosts = [];

function render() {
    db.collection("posts").orderBy("createdAt", "desc").onSnapshot(snap => {
        const grid = document.getElementById('main-grid');
        grid.innerHTML = ""; allPosts = [];
        snap.forEach(doc => {
            const p = doc.data();
            allPosts.push({id: doc.id, ...p});
            grid.innerHTML += `
                <div class="card" data-aos="fade-up">
                    ${p.image ? `<img src="${p.image}" class="card-img">` : `<div class="card-img" style="background:#ccc"></div>`}
                    <div class="card-body">
                        <h3>${p.title}</h3>
                        <p>${p.desc}</p>
                        <a href="https://t.me/mingbulak_im_bot" class="btn-primary" style="padding:5px 15px; font-size:0.8rem">Telegram</a>
                        ${p.map ? `<a href="https://www.google.com/maps?q=${p.map}" target="_blank" style="margin-left:10px"><i class="fas fa-map-marker-alt"></i></a>` : ''}
                    </div>
                </div>`;
        });
    });
}

function initPicker() {
    if(pickerMap) return;
    pickerMap = L.map('map-picker').setView([40.9333, 71.3333], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickerMap);
    pickerMap.on('click', e => {
        if(marker) marker.setLatLng(e.latlng);
        else marker = L.marker(e.latlng).addTo(pickerMap);
        document.getElementById('selected-coords').value = `${e.latlng.lat},${e.latlng.lng}`;
    });
}

async function savePost() {
    const t = document.getElementById('post-title').value;
    const d = document.getElementById('post-desc').value;
    const c = document.getElementById('selected-coords').value;
    const i = document.getElementById('post-image').files[0];
    
    let imgB64 = "";
    if(i) {
        imgB64 = await new Promise(r => {
            const fr = new FileReader();
            fr.onload = e => r(e.target.result);
            fr.readAsDataURL(i);
        });
    }

    await db.collection("posts").add({
        title: t, desc: d, map: c, image: imgB64,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Saqlandi!");
    location.reload();
}

function checkAdmin() {
    if(document.getElementById('login').value === "mystra" && document.getElementById('password').value === "mystra2014") {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        initPicker();
    }
}

document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';
function closeModal() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
function logout() { location.reload(); }

render();
