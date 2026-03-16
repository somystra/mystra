/**
 * Project: Mingbulak IM Ijara Portali
 * Developers: NetGlobal Team
 * Technology: Firebase Firestore
 */

// 1. Firebase Konfiguratsiyasi (Siz yuborgan yangi API kalitlar)
const firebaseConfig = {
  apiKey: "AIzaSyCpFL2AJO17gfjQa2TTcNqa-lAdEgqVxpw",
  authDomain: "mingbulak-ijara.firebaseapp.com",
  projectId: "mingbulak-ijara",
  storageBucket: "mingbulak-ijara.firebasestorage.app",
  messagingSenderId: "999036185534",
  appId: "1:999036185534:web:112a51eb1dcf76c685a7ef"
};

// 2. Firebaseni ishga tushirish (Compat mode)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. Admin ma'lumotlari
const adminAuth = { user: "mystra", pass: "mystra2014" };

/**
 * Rasmni optimallashtirish:
 * Bazaga katta rasm ketmasligi uchun uni 500px gacha kichraytiradi.
 */
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

/**
 * Ma'lumotlarni o'qish (Real-time):
 * Bazadagi o'zgarishlarni darhol saytga chiqaradi.
 */
function renderAll() {
    const grid = document.getElementById('main-grid');
    db.collection("posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        grid.innerHTML = "";
        if (snapshot.empty) {
            grid.innerHTML = "<p style='text-align:center; grid-column: 1/-1; opacity:0.5;'>Hozircha ijaralar mavjud emas.</p>";
        }
        snapshot.forEach((doc) => {
            const p = doc.data();
            grid.innerHTML += `
                <div class="card" data-aos="fade-up">
                    ${p.image ? `<img src="${p.image}" class="card-img" alt="Uy rasmi">` : `<div class="card-img" style="background:#334155; display:flex; align-items:center; justify-content:center;"><i class="fas fa-home fa-3x"></i></div>`}
                    <div style="padding:15px;">
                        <h3 style="margin-bottom:10px; color:#fff;">${p.title}</h3>
                        <p style="opacity:0.8; font-size:0.9rem; margin-bottom:15px;">${p.desc}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <a href="https://t.me/mingbulak_im_bot" target="_blank" class="btn-primary" style="padding:8px 20px; font-size:0.85rem; text-decoration:none;">Bog'lanish</a>
                            ${p.map ? `<a href="${p.map}" target="_blank" style="color:#a855f7; font-size:0.9rem;"><i class="fas fa-location-dot"></i> Xarita</a>` : ''}
                        </div>
                    </div>
                </div>`;
        });
        renderAdminList(snapshot);
    }, (error) => {
        console.error("Ma'lumot o'qishda xato:", error);
    });
}

/**
 * Yangi ijara qo'shish:
 * "Saqlanmoqda..." muammosini hal qiladi.
 */
async function savePost() {
    const titleInput = document.getElementById('post-title');
    const descInput = document.getElementById('post-desc');
    const mapInput = document.getElementById('post-map');
    const imgInput = document.getElementById('post-image');
    const saveBtn = document.getElementById('save-btn');

    if(!titleInput.value || !descInput.value) {
        return alert("Iltimos, sarlavha va tavsifni to'ldiring!");
    }

    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Saqlanmoqda...";
    saveBtn.disabled = true;

    try {
        let imgBase64 = "";
        if (imgInput.files[0]) {
            imgBase64 = await resizeImage(imgInput.files[0]);
        }

        await db.collection("posts").add({
            title: titleInput.value,
            desc: descInput.value,
            map: mapInput.value,
            image: imgBase64,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("E'lon muvaffaqiyatli qo'shildi!");
        
        // Formani tozalash
        titleInput.value = "";
        descInput.value = "";
        mapInput.value = "";
        imgInput.value = "";
        closeModal();

    } catch (e) {
        console.error("Xatolik tafsiloti:", e);
        alert("Xatolik: " + e.message);
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

/**
 * Admin Panel va Login
 */
function checkAdmin() {
    const u = document.getElementById('login').value;
    const p = document.getElementById('password').value;
    if(u === adminAuth.user && p === adminAuth.pass) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        // Kirganda login/parol maydonlarini tozalash
        document.getElementById('login').value = "";
        document.getElementById('password').value = "";
    } else { 
        alert("Login yoki parol xato!"); 
    }
}

function renderAdminList(snapshot) {
    const list = document.getElementById('admin-post-list');
    list.innerHTML = "<h4 style='margin-bottom:10px;'>Mavjud e'lonlar:</h4>";
    snapshot.forEach((doc) => {
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:10px; margin-bottom:8px; border: 1px solid rgba(255,255,255,0.1);">
                <span style="font-size:0.85rem;">${doc.data().title}</span>
                <button onclick="deletePost('${doc.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>`;
    });
}

async function deletePost(id) {
    if(confirm("Ushbu e'lonni o'chirmoqchimisiz?")) {
        try {
            await db.collection("posts").doc(id).delete();
        } catch (e) {
            alert("O'chirishda xato: " + e.message);
        }
    }
}

// Yordamchi funksiyalar
document.getElementById('admin-btn').onclick = () => {
    document.getElementById('login-modal').style.display = 'flex';
};

function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

function logout() {
    document.getElementById('admin-panel').style.display = 'none';
    // Sahifani to'liq yangilash (Xavfsizlik uchun)
    location.reload(); 
}

// Dasturni ishga tushirish
renderAll();
