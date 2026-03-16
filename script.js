// 1. Firebase Konfiguratsiyasi
const firebaseConfig = {
    apiKey: "AIzaSyCrJYqb9ClyUygAfJPoTqXmq5w2TGAvAkY",
    authDomain: "mingbulak-ijara-32bea.firebaseapp.com",
    projectId: "mingbulak-ijara-32bea",
    storageBucket: "mingbulak-ijara-32bea.firebasestorage.app",
    messagingSenderId: "1057060835809",
    appId: "1:1057060835809:web:c267dc2666ce262d45c2a0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const adminAuth = { user: "mystra", pass: "mystra2014" };

// --- YANGI: Rasmni kichraytirish funksiyasi ---
async function resizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Rasmni kengligini 800px ga tushiramiz
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Sifatni 0.7 (70%) qilib saqlaymiz, bu hajmni keskin kamaytiradi
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
}

// Bazadan ma'lumotlarni o'qish
function renderAll() {
    const grid = document.getElementById('main-grid');
    db.collection("posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        grid.innerHTML = "";
        snapshot.forEach((doc) => {
            const p = doc.data();
            grid.innerHTML += `
                <div class="card">
                    ${p.image ? `<img src="${p.image}" class="card-img">` : `<div class="card-img" style="display:flex;align-items:center;justify-content:center;background:#eee;color:#999;">Rasm yo'q</div>`}
                    <h3>${p.title}</h3>
                    <p>${p.desc}</p>
                    <div style="margin-top:15px; display:flex; gap:10px;">
                        <a href="https://t.me/mingbulak_im_bot" class="btn-action">Murojaat</a>
                        ${p.map ? `<a href="${p.map}" target="_blank" class="btn-action" style="background:#27ae60;">Xarita</a>` : ''}
                    </div>
                </div>`;
        });
        renderAdminList(snapshot);
    });
}

// E'lon saqlash
async function savePost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const map = document.getElementById('post-map').value;
    const imgFile = document.getElementById('post-image').files[0];
    const editId = document.getElementById('edit-id').value;

    if(!title || !desc) return alert("Sarlavha va tavsifni to'ldiring!");

    let imgData = "";
    if (imgFile) {
        // Avvalgidan farqli ravishda endi resizeImage funksiyasini chaqiramiz
        imgData = await resizeImage(imgFile);
    }

    const postData = {
        title,
        desc,
        map,
        createdAt: new Date()
    };

    if (imgData) postData.image = imgData;

    try {
        if(editId === "") {
            await db.collection("posts").add(postData);
        } else {
            await db.collection("posts").doc(editId).update(postData);
        }
        clearForm();
        alert("Muvaffaqiyatli saqlandi!");
    } catch (e) {
        console.error("Xatolik tafsiloti:", e);
        alert("Xatolik yuz berdi. Iltimos, boshqa rasm tanlang yoki bazani tekshiring.");
    }
}

// --- Admin Panel va Tungi rejim funksiyalari (o'zgarishsiz qoladi) ---
document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
    document.getElementById('theme-toggle').innerText = document.body.classList.contains('dark-mode') ? "☀️ Kungi Rejim" : "🌙 Tungi Rejim";
};

function checkAdmin() {
    const u = document.getElementById('login').value;
    const p = document.getElementById('password').value;
    if(u === adminAuth.user && p === adminAuth.pass) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    } else { alert("Login yoki parol xato!"); }
}

function renderAdminList(snapshot) {
    const list = document.getElementById('admin-post-list');
    list.innerHTML = "";
    snapshot.forEach((doc) => {
        const p = doc.data();
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; padding:10px; background:rgba(0,0,0,0.05); margin-bottom:5px; border-radius:8px;">
                <span>${p.title}</span>
                <div>
                    <button onclick="editPost('${doc.id}')" style="color:orange; border:none; background:none; cursor:pointer; font-size:1.2em;">✎</button>
                    <button onclick="deletePost('${doc.id}')" style="color:red; border:none; background:none; cursor:pointer; font-size:1.2em;">✖</button>
                </div>
            </div>`;
    });
}

async function deletePost(id) {
    if(confirm("O'chirilsinmi?")) {
        await db.collection("posts").doc(id).delete();
    }
}

async function editPost(id) {
    const doc = await db.collection("posts").doc(id).get();
    const p = doc.data();
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-desc').value = p.desc;
    document.getElementById('post-map').value = p.map;
    document.getElementById('edit-id').value = id;
    document.getElementById('form-title').innerText = "Tahrirlash";
    document.getElementById('save-btn').innerText = "Yangilash";
}

function clearForm() {
    document.getElementById('post-title').value = "";
    document.getElementById('post-desc').value = "";
    document.getElementById('post-map').value = "";
    document.getElementById('post-image').value = "";
    document.getElementById('edit-id').value = "";
    document.getElementById('form-title').innerText = "Yangi E'lon Qo'shish";
}

document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';
function closeModal() { document.getElementById('login-modal').style.display = 'none'; }
function logout() { document.getElementById('admin-panel').style.display = 'none'; }

renderAll();
