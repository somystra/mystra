/**
 * Project: Mingbuloq IM Ijara Portali
 * Developers: NetGlobal Team
 * AI Partner: Google Gemini AI
 */

// 1. Firebase Konfiguratsiyasi (Sizning kalitlar)
const firebaseConfig = {
  apiKey: "AIzaSyCpFL2AJO17gfjQa2TTcNqa-lAdEgqVxpw",
  authDomain: "mingbulak-ijara.firebaseapp.com",
  projectId: "mingbulak-ijara",
  storageBucket: "mingbulak-ijara.firebasestorage.app",
  messagingSenderId: "999036185534",
  appId: "1:999036185534:web:112a51eb1dcf76c685a7ef"
};

// Firebaseni ishga tushirish
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. Admin ma'lumotlari
const adminAuth = { user: "mystra", pass: "mystra2014" };

// 3. Xarita o'zgaruvchilari (Admin Panel uchun)
let pickerMap;
let marker;

// --- ASOSIY IJARA LOGIKASI ---

// Rasmni kichraytirish (Optimallashtirish)
async function resizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
}

// Barcha e'lonlarni yuklash (Real-time)
let allPosts = []; // Qidiruv uchun global massiv
function renderAll() {
    const grid = document.getElementById('main-grid');
    db.collection("posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        grid.innerHTML = "";
        allPosts = [];
        if (snapshot.empty) {
            grid.innerHTML = "<p style='text-align:center; grid-column:1/-1; opacity:0.5;'>Hozircha ijaralar mavjud emas.</p>";
        }
        snapshot.forEach((doc) => {
            const p = doc.data();
            allPosts.push({ id: doc.id, ...p }); // Qidiruv uchun saqlash
            
            // Xarita linkini tayyorlash (agar koordinatalar bo'lsa)
            let mapLink = "";
            if(p.map) {
                if(p.map.startsWith('http')) {
                    mapLink = p.map; // Eski link formati
                } else {
                    // Yangi koordinata formati: "40.933,71.333"
                    mapLink = `https://www.google.com/maps?q=${p.map}`;
                }
            }

            grid.innerHTML += `
                <div class="card" data-aos="fade-up">
                    ${p.image ? `<img src="${p.image}" class="card-img" alt="Uy rasmi">` : `<div class="card-img" style="background:#334155; display:flex; align-items:center; justify-content:center;"><i class="fas fa-home fa-3x"></i></div>`}
                    <div class="card-body">
                        <h3 class="card-title">${p.title}</h3>
                        <p class="card-desc">${p.desc}</p>
                        <div class="card-actions">
                            <a href="https://t.me/mingbulak_im_bot" target="_blank" class="btn-primary" style="padding:8px 20px; font-size:0.8rem; text-decoration:none;">Bog'lanish</a>
                            ${mapLink ? `<a href="${mapLink}" target="_blank" style="color:#a855f7; font-size:0.9rem;"><i class="fas fa-location-dot"></i> Xarita</a>` : ''}
                        </div>
                    </div>
                </div>`;
        });
        renderAdminList(snapshot);
    });
}

// Yangi ijara saqlash (Xaritan belgilash bilan)
async function savePost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const coords = document.getElementById('selected-coords').value; // Xaritadan koordinatalar
    const imgInput = document.getElementById('post-image').files[0];
    const saveBtn = document.getElementById('save-btn');

    if(!title || !desc) return alert("Sarlavha va tavsifni to'ldiring!");

    saveBtn.innerText = "Saqlanmoqda...";
    saveBtn.disabled = true;

    try {
        let imgData = "";
        if (imgInput) imgData = await resizeImage(imgInput);

        await db.collection("posts").add({
            title: title,
            desc: desc,
            map: coords, // Xaritada tanlangan koordinatalar ("lat,lng")
            image: imgData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("E'lon muvaffaqiyatli saqlandi!");
        
        // Formani tozalash
        document.getElementById('post-title').value = "";
        document.getElementById('post-desc').value = "";
        document.getElementById('post-image').value = "";
        document.getElementById('selected-coords').value = "";
        if(marker) pickerMap.removeLayer(marker); // Markerni o'chirish
        marker = null;
        closeModal();

    } catch (e) {
        console.error("Xatolik:", e);
        alert("Xatolik: " + e.message);
    } finally {
        saveBtn.innerText = "Bazaga Saqlash";
        saveBtn.disabled = false;
    }
}

// --- XARITA BELGILASH LOGIKASI ---
function initMapPicker() {
    if (!pickerMap) {
        // Markaz: Mingbuloq (taxminan 40.933, 71.333)
        pickerMap = L.map('map-picker').setView([40.9333, 71.3333], 13); 

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(pickerMap);

        // Xaritani bosganda marker qo'yish
        pickerMap.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            if (marker) {
                marker.setLatLng(e.latlng);
            } else {
                marker = L.marker(e.latlng).addTo(pickerMap);
            }

            // Koordinatalarni yashirin inputga saqlash ("lat,lng" formatida)
            document.getElementById('selected-coords').value = `${lat},${lng}`;
        });
    }
    // Xarita o'lchamini modal ichida to'g'rilash
    setTimeout(() => pickerMap.invalidateSize(), 300);
}

// --- ADMIN PANEL VA LOGIN ---
function checkAdmin() {
    const u = document.getElementById('login').value;
    const p = document.getElementById('password').value;
    if(u === adminAuth.user && p === adminAuth.pass) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        initMapPicker(); // Panel ochilganda xaritani yuklash
    } else { alert("Login yoki parol xato!"); }
}

function renderAdminList(snapshot) {
    const list = document.getElementById('admin-post-list');
    list.innerHTML = "<h4>Mavjud e'lonlar:</h4>";
    snapshot.forEach((doc) => {
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:8px; border: 1px solid rgba(255,255,255,0.1);">
                <span style="font-size:0.85rem;">${doc.data().title}</span>
                <button onclick="deletePost('${doc.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>`;
    });
}

async function deletePost(id) {
    if(confirm("O'chirilsinmi?")) {
        try { await db.collection("posts").doc(id).delete(); } catch (e) { alert("Xato: " + e.message); }
    }
}

// --- QIDIRUV LOGIKASI (FILTR) ---
document.getElementById('search-toggle').onclick = () => {
    const searchBar = document.getElementById('search-bar');
    searchBar.style.display = searchBar.style.display === 'flex' ? 'none' : 'flex';
};

document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const grid = document.getElementById('main-grid');
    grid.innerHTML = "";

    const filtered = allPosts.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.desc.toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        grid.innerHTML = "<p style='text-align:center; grid-column:1/-1; opacity:0.5;'>Siz izlagan ijara topilmadi.</p>";
    }

    filtered.forEach((p) => {
        let mapLink = p.map ? (p.map.startsWith('http') ? p.map : `https://www.google.com/maps?q=${p.map}`) : "";
        grid.innerHTML += `
            <div class="card card-filtered">
                ${p.image ? `<img src="${p.image}" class="card-img">` : `<div class="card-img" style="background:#334155;"></div>`}
                <div class="card-body">
                    <h3 class="card-title">${p.title}</h3>
                    <p class="card-desc">${p.desc}</p>
                    <div class="card-actions">
                        <a href="https://t.me/mingbulak_im_bot" target="_blank" class="btn-primary" style="padding:8px 20px; font-size:0.8rem;">Bog'lanish</a>
                        ${mapLink ? `<a href="${mapLink}" target="_blank" style="color:#a855f7; font-size:0.9rem;">Xarita</a>` : ''}
                    </div>
                </div>
            </div>`;
    });
});

// --- GEMINI AI CHATBOT LOGIKASI ---
// DIQQAT: API Keyni xavfsizlik uchun serverda saqlash yaxshiroq.
// Hozircha sinov uchun brauzerda qoldiramiz.
const GEMINI_API_KEY = "AIzaSyDbKDjKIr1OQujrhwMMKcmSudSAmIJqIaA";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

const aiChatToggle = document.getElementById('ai-chat-toggle');
const aiChatWrapper = document.getElementById('ai-chat-wrapper');
const aiChatClose = document.getElementById('ai-chat-close');
const aiUserInput = document.getElementById('ai-user-input');
const aiSendBtn = document.getElementById('ai-send-btn');
const aiChatBody = document.getElementById('ai-chat-body');

aiChatToggle.onclick = () => aiChatWrapper.classList.toggle('ai-chat-hidden');
aiChatClose.onclick = () => aiChatWrapper.classList.add('ai-chat-hidden');

async function getGeminiResponse(prompt) {
    const history = Array.from(aiChatBody.children).map(msg => msg.innerText).join('\n');
    const fullPrompt = `Sen Mingbuloq IM ijara saytining AI yordamchisisan. Maktab o'quvchilari va ota-onalarga o'zbek tilida, xushmuomala javob ber. Sayt haqida ma'lumot: yaratuvchilar NetGlobal Team, bu saytda maktab atrofidagi ijaralar bor. Savol: ${prompt}`;
    
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) { return "Xatolik yuz berdi, API kalitni tekshiring."; }
}

async function sendAiMessage() {
    const prompt = aiUserInput.value.trim();
    if (!prompt) return;

    // User xabari
    aiChatBody.innerHTML += `<div class="ai-message user">${prompt}</div>`;
    aiUserInput.value = "";
    aiChatBody.scrollTop = aiChatBody.scrollHeight; // Avto scroll

    // Bot "yozmoqda"
    const typingMsg = document.createElement('div');
    typingMsg.className = 'ai-message bot';
    typingMsg.innerText = "...yozmoqda";
    aiChatBody.appendChild(typingMsg);

    // AI javobini olish
    const response = await getGeminiResponse(prompt);
    aiChatBody.removeChild(typingMsg); // Yozmoqdan o'chirish
    aiChatBody.innerHTML += `<div class="ai-message bot">${response}</div>`;
    aiChatBody.scrollTop = aiChatBody.scrollHeight;
}

aiSendBtn.onclick = sendAiMessage;
aiUserInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendAiMessage(); });

// MODAL VA YORDAMCHI FUNKSIYALAR
document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';
function closeModal() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
function logout() { location.reload(); }

// ISHGA TUSHIRISH
renderAll();
