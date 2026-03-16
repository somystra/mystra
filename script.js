/**
 * Project: Mingbulak IM Ijara Portali
 * Developers: NetGlobal Team
 */

// 1. Firebase Konfiguratsiyasi
const firebaseConfig = {
    apiKey: "AIzaSyCpFL2AJO17gfjQa2TTcNqa-lAdEgqVxpw",
    authDomain: "mingbulak-ijara.firebaseapp.com",
    projectId: "mingbulak-ijara",
    storageBucket: "mingbulak-ijara.firebasestorage.app",
    messagingSenderId: "999036185534",
    appId: "1:999036185534:web:112a51eb1dcf76c685a7ef"
};

// 2. Firebaseni ishga tushirish
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. Admin ma'lumotlari
const adminAuth = { user: "mystra", pass: "mystra2014" };

// Rasmni kichraytirish (Bazaga sig'ishi uchun)
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
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

// ASOSIY FUNKSIYA: E'lonlarni ko'rsatish
function renderAll() {
    const grid = document.getElementById('main-grid');
    // Real-time listener: Baza o'zgarganda sayt o'zi yangilanadi
    db.collection("posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        grid.innerHTML = "";
        if (snapshot.empty) {
            grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; opacity:0.5;">Hozircha e'lonlar yo'q...</p>`;
            return;
        }
        snapshot.forEach((doc) => {
            const p = doc.data();
            grid.innerHTML += `
                <div class="card" data-aos="fade-up">
                    ${p.image ? `<img src="${p.image}" class="card-img">` : `<div class="card-img" style="background:#334155;"></div>`}
                    <div style="padding:15px;">
                        <h3>${p.title}</h3>
                        <p style="opacity:0.7; font-size:0.9rem; margin:10px 0;">${p.desc}</p>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <a href="https://t.me/mingbulak_im_bot" class="btn-primary" style="padding:8px 15px; font-size:0.8rem; text-decoration:none;">Bog'lanish</a>
                            ${p.map ? `<a href="${p.map}" target="_blank" style="color:#a855f7; font-size:0.8rem;">Xarita</a>` : ''}
                        </div>
                    </div>
                </div>`;
        });
        renderAdminList(snapshot);
    }, (error) => {
        console.error("Firebase o'qishda xato:", error);
    });
}

// ASOSIY FUNKSIYA: Saqlash
async function savePost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const map = document.getElementById('post-map').value;
    const imgFile = document.getElementById('post-image').files[0];
    const saveBtn = document.getElementById('save-btn');

    if(!title || !desc) return alert("Sarlavha va tavsifni to'ldiring!");

    saveBtn.innerText = "Saqlanmoqda...";
    saveBtn.disabled = true;

    try {
        let imgData = "";
        if (imgFile) imgData = await resizeImage(imgFile);

        // BAZAGA YUBORISH
        await db.collection("posts").add({
            title: title,
            desc: desc,
            map: map,
            image: imgData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Muvaffaqiyatli saqlandi!");
        
        // Formani tozalash
        document.getElementById('post-title').value = "";
        document.getElementById('post-desc').value = "";
        document.getElementById('post-image').value = "";
        closeModal();

    } catch (e) {
        console.error("Xatolik:", e);
        alert("SAQLANMADI! Sababi: " + e.message);
    } finally {
        saveBtn.innerText = "Bazaga Saqlash";
        saveBtn.disabled = false;
    }
}

// ADMIN PANEL FUNKSIYALARI
function checkAdmin() {
    const u = document.getElementById('login').value;
    const p = document.getElementById('password').value;
    if(u === adminAuth.user && p === adminAuth.pass) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    } else { alert("Xato!"); }
}

function renderAdminList(snapshot) {
    const list = document.getElementById('admin-post-list');
    list.innerHTML = "<h4>Boshqarish:</h4>";
    snapshot.forEach((doc) => {
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; margin:10px 0; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px;">
                <span>${doc.data().title}</span>
                <button onclick="deletePost('${doc.id}')" style="color:red; background:none; border:none; cursor:pointer;">O'chirish</button>
            </div>`;
    });
}

async function deletePost(id) {
    if(confirm("O'chirilsinmi?")) {
        try {
            await db.collection("posts").doc(id).delete();
        } catch(e) { alert("Xato: " + e.message); }
    }
}

// MODAL VA CHIQISH
document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';

function closeModal() { 
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); 
}

function logout() {
    // Sahifani yangilamaymiz, shunchaki admin panelni yopamiz
    document.getElementById('admin-panel').style.display = 'none';
    alert("Admin paneldan chiqdingiz. E'lonlar saqlangan bo'lsa, sahifada ko'rinadi.");
}

// ISHGA TUSHIRISH
renderAll();
