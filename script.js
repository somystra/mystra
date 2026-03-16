// YANGI API KONFIGURATSIYA
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

// Admin paroli
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

// Bazadan ma'lumotlarni o'qib chiqarish
function renderAll() {
    const grid = document.getElementById('main-grid');
    db.collection("posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        grid.innerHTML = "";
        snapshot.forEach((doc) => {
            const p = doc.data();
            grid.innerHTML += `
                <div class="card" data-aos="fade-up">
                    ${p.image ? `<img src="${p.image}" class="card-img">` : `<div class="card-img" style="background:#334155;"></div>`}
                    <h3 style="margin-top:15px;">${p.title}</h3>
                    <p style="opacity:0.7; font-size:0.9rem; margin:10px 0;">${p.desc}</p>
                    <div style="display:flex; gap:10px;">
                        <a href="https://t.me/mingbulak_im_bot" class="btn-primary" style="padding:8px 15px; font-size:0.8rem; text-decoration:none;">Bog'lanish</a>
                        ${p.map ? `<a href="${p.map}" target="_blank" style="color:white; font-size:0.8rem; margin-top:8px;">Xarita</a>` : ''}
                    </div>
                </div>`;
        });
        renderAdminList(snapshot);
    });
}

// IJARA SAQLASH FUNKSIYASI
async function savePost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const map = document.getElementById('post-map').value;
    const imgFile = document.getElementById('post-image').files[0];

    if(!title || !desc) return alert("Sarlavha va tavsifni yozing!");

    const saveBtn = document.getElementById('save-btn');
    saveBtn.innerText = "Saqlanmoqda...";
    saveBtn.disabled = true;

    let imgData = "";
    if (imgFile) imgData = await resizeImage(imgFile);

    try {
        await db.collection("posts").add({
            title: title,
            desc: desc,
            map: map,
            image: imgData,
            createdAt: new Date()
        });
        alert("Muvaffaqiyatli saqlandi!");
        document.getElementById('post-title').value = "";
        document.getElementById('post-desc').value = "";
        closeModal();
    } catch (e) {
        alert("Xatolik yuz berdi: " + e.message);
    } finally {
        saveBtn.innerText = "Bazaga Saqlash";
        saveBtn.disabled = false;
    }
}

// Admin Panel Boshqaruvi
function checkAdmin() {
    const u = document.getElementById('login').value;
    const p = document.getElementById('password').value;
    if(u === adminAuth.user && p === adminAuth.pass) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    } else { alert("Xato login yoki parol!"); }
}

function renderAdminList(snapshot) {
    const list = document.getElementById('admin-post-list');
    list.innerHTML = "<h4>Mavjud e'lonlar:</h4>";
    snapshot.forEach((doc) => {
        list.innerHTML += `<div style="display:flex; justify-content:space-between; margin:10px 0; background:rgba(255,255,255,0.05); padding:5px; border-radius:5px;">
            <span style="font-size:0.8rem;">${doc.data().title}</span>
            <button onclick="deletePost('${doc.id}')" style="color:#ef4444; background:none; border:none; cursor:pointer;">O'chirish</button>
        </div>`;
    });
}

async function deletePost(id) {
    if(confirm("O'chirilsinmi?")) await db.collection("posts").doc(id).delete();
}

document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';
function closeModal() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
function logout() { location.reload(); }

// Sayt ishga tushganda e'lonlarni yuklash
renderAll();
