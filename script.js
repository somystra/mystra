// Dastlabki ma'lumotlarni yuklash
let posts = JSON.parse(localStorage.getItem('housing_posts')) || [];
let adminAuth = JSON.parse(localStorage.getItem('admin_login')) || { user: "mystra", pass: "mystra2014" };

// Tungi/Kungi rejim funksiyasi
const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeBtn.innerText = document.body.classList.contains('dark-mode') ? "☀️ Kungi Rejim" : "🌙 Tungi Rejim";
});

// Admin kirishini tekshirish
function checkAdmin() {
    const u = document.getElementById('login').value;
    const p = document.getElementById('password').value;
    
    if(u === adminAuth.user && p === adminAuth.pass) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        renderAdminList();
    } else {
        alert("Login yoki parol xato!");
    }
}

// E'lonni saqlash (Yangi yoki Tahrir)
function savePost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const map = document.getElementById('post-map').value;
    const editIndex = document.getElementById('edit-index').value;

    if(!title || !desc) return alert("Ma'lumotlarni to'ldiring!");

    const postData = { title, desc, map };

    if(editIndex === "") {
        posts.push(postData);
    } else {
        posts[editIndex] = postData;
    }

    localStorage.setItem('housing_posts', JSON.stringify(posts));
    clearForm();
    renderAll();
}

// Sahifada va Admin panelida ko'rsatish
function renderAll() {
    // Asosiy sahifa
    const grid = document.getElementById('main-grid');
    grid.innerHTML = posts.map(p => `
        <div class="card">
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
            <a href="https://t.me/mingbulak_im_bot" class="btn-primary">Murojaat</a>
            ${p.map ? `<a href="${p.map}" target="_blank" class="btn-primary" style="background:green;">Xarita</a>` : ''}
        </div>
    `).join('');

    renderAdminList();
}

// Admin panelidagi ro'yxat
function renderAdminList() {
    const list = document.getElementById('admin-post-list');
    list.innerHTML = posts.map((p, i) => `
        <div class="admin-item">
            <span>${p.title}</span>
            <div>
                <button onclick="editPost(${i})" style="color:orange; background:none; border:none; cursor:pointer;">✎</button>
                <button onclick="deletePost(${i})" style="color:red; background:none; border:none; cursor:pointer;">✖</button>
            </div>
        </div>
    `).join('');
}

// O'chirish
function deletePost(i) {
    if(confirm("E'lonni o'chirasizmi?")) {
        posts.splice(i, 1);
        localStorage.setItem('housing_posts', JSON.stringify(posts));
        renderAll();
    }
}

// Tahrirlashga tayyorlash
function editPost(i) {
    const p = posts[i];
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-desc').value = p.desc;
    document.getElementById('post-map').value = p.map;
    document.getElementById('edit-index').value = i;
    document.getElementById('form-title').innerText = "E'lonni Tahrirlash";
    document.getElementById('save-btn').innerText = "Yangilash";
}

// Admin profilini yangilash
function updateAdmin() {
    const user = document.getElementById('new-login').value;
    const pass = document.getElementById('new-pass').value;
    if(user && pass) {
        adminAuth = { user, pass };
        localStorage.setItem('admin_login', JSON.stringify(adminAuth));
        alert("Ma'lumotlar yangilandi!");
    }
}

// Yordamchi funksiyalar
function clearForm() {
    document.getElementById('post-title').value = "";
    document.getElementById('post-desc').value = "";
    document.getElementById('post-map').value = "";
    document.getElementById('edit-index').value = "";
    document.getElementById('form-title').innerText = "Yangi E'lon Qo'shish";
    document.getElementById('save-btn').innerText = "Saqlash";
}

document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';
function closeModal() { document.getElementById('login-modal').style.display = 'none'; }
function logout() { document.getElementById('admin-panel').style.display = 'none'; }

// Dastlabki yuklash
renderAll();
