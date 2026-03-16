let posts = JSON.parse(localStorage.getItem('housing_data_v2')) || [];
let admin = JSON.parse(localStorage.getItem('admin_data_v2')) || { user: "mystra", pass: "mystra2014" };

// Tungi rejim
document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
    document.getElementById('theme-toggle').innerText = document.body.classList.contains('dark-mode') ? "☀️ Kungi Rejim" : "🌙 Tungi Rejim";
};

// Rasmni Base64 ga o'tkazish
async function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Admin Kirish
function checkAdmin() {
    const u = document.getElementById('login').value;
    const p = document.getElementById('password').value;
    if(u === admin.user && p === admin.pass) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        renderAdminList();
    } else { alert("Login yoki parol xato!"); }
}

// E'lon saqlash
async function savePost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const map = document.getElementById('post-map').value;
    const imgFile = document.getElementById('post-image').files[0];
    const editIndex = document.getElementById('edit-index').value;

    if(!title || !desc) return alert("Ma'lumotlarni to'ldiring!");

    let imgData = "";
    if (imgFile) {
        imgData = await getBase64(imgFile);
    } else if (editIndex !== "") {
        imgData = posts[editIndex].image;
    }

    const data = { title, desc, map, image: imgData };
    
    if(editIndex === "") posts.push(data);
    else posts[editIndex] = data;

    localStorage.setItem('housing_data_v2', JSON.stringify(posts));
    clearForm();
    renderAll();
}

function renderAll() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = posts.map(p => `
        <div class="card">
            ${p.image ? `<img src="${p.image}" class="card-img">` : `<div class="card-img" style="display:flex;align-items:center;justify-content:center;background:#eee;color:#999;">Rasm yuklanmagan</div>`}
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
            <div style="margin-top:15px; display:flex; gap:10px;">
                <a href="https://t.me/mingbulak_im_bot" class="btn-action">Murojaat</a>
                ${p.map ? `<a href="${p.map}" target="_blank" class="btn-action" style="background:#27ae60;">Xarita</a>` : ''}
            </div>
        </div>
    `).join('');
    renderAdminList();
}

function renderAdminList() {
    const list = document.getElementById('admin-post-list');
    list.innerHTML = posts.map((p, i) => `
        <div class="admin-item" style="display:flex; justify-content:space-between; padding:10px; background:rgba(0,0,0,0.05); margin-bottom:5px; border-radius:8px;">
            <span>${p.title}</span>
            <div>
                <button onclick="editPost(${i})" style="color:orange; border:none; background:none; cursor:pointer; font-size:1.2em;">✎</button>
                <button onclick="deletePost(${i})" style="color:red; border:none; background:none; cursor:pointer; font-size:1.2em;">✖</button>
            </div>
        </div>
    `).join('');
}

function deletePost(i) {
    if(confirm("O'chirilsinmi?")) {
        posts.splice(i, 1);
        localStorage.setItem('housing_data_v2', JSON.stringify(posts));
        renderAll();
    }
}

function editPost(i) {
    const p = posts[i];
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-desc').value = p.desc;
    document.getElementById('post-map').value = p.map;
    document.getElementById('edit-index').value = i;
    document.getElementById('form-title').innerText = "E'lonni Tahrirlash";
}

function updateAdmin() {
    const u = document.getElementById('new-login').value;
    const p = document.getElementById('new-pass').value;
    if(u && p) {
        admin = { user: u, pass: p };
        localStorage.setItem('admin_data_v2', JSON.stringify(admin));
        alert("Admin yangilandi!");
    }
}

function clearForm() {
    document.getElementById('post-title').value = "";
    document.getElementById('post-desc').value = "";
    document.getElementById('post-map').value = "";
    document.getElementById('post-image').value = "";
    document.getElementById('edit-index').value = "";
    document.getElementById('form-title').innerText = "Yangi E'lon Qo'shish";
}

document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';
function closeModal() { document.getElementById('login-modal').style.display = 'none'; }
function logout() { document.getElementById('admin-panel').style.display = 'none'; }

renderAll();
