let posts = JSON.parse(localStorage.getItem('housing_db')) || [];
let admin = JSON.parse(localStorage.getItem('admin_db')) || { user: "mystra", pass: "mystra2014" };

document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
    document.getElementById('theme-toggle').innerText = document.body.classList.contains('dark-mode') ? "☀️ Kungi Rejim" : "🌙 Tungi Rejim";
};

function checkAdmin() {
    const u = document.getElementById('login').value;
    const p = document.getElementById('password').value;
    if(u === admin.user && p === admin.pass) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        renderAdminList();
    } else { alert("Xato!"); }
}

function savePost() {
    const title = document.getElementById('post-title').value;
    const desc = document.getElementById('post-desc').value;
    const map = document.getElementById('post-map').value;
    const editIndex = document.getElementById('edit-index').value;

    if(!title || !desc) return alert("To'ldiring!");

    const data = { title, desc, map };
    if(editIndex === "") posts.push(data);
    else posts[editIndex] = data;

    localStorage.setItem('housing_db', JSON.stringify(posts));
    clearForm();
    renderAll();
}

function renderAll() {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = posts.map(p => `
        <div class="card">
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
            <div style="margin-top:15px; display:flex; gap:10px;">
                <a href="https://t.me/mingbulak_im_bot" class="btn-action">Ijaraga murojaat</a>
                ${p.map ? `<a href="${p.map}" target="_blank" class="btn-action" style="background:#27ae60;">Xarita</a>` : ''}
            </div>
        </div>
    `).join('');
    renderAdminList();
}

function renderAdminList() {
    const list = document.getElementById('admin-post-list');
    list.innerHTML = posts.map((p, i) => `
        <div class="admin-item" style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.05); padding:8px; margin-bottom:5px; border-radius:5px;">
            <span>${p.title}</span>
            <div>
                <button onclick="editPost(${i})" style="color:orange; border:none; background:none; cursor:pointer;">✎</button>
                <button onclick="deletePost(${i})" style="color:red; border:none; background:none; cursor:pointer;">✖</button>
            </div>
        </div>
    `).join('');
}

function deletePost(i) {
    if(confirm("O'chirilsinmi?")) {
        posts.splice(i, 1);
        localStorage.setItem('housing_db', JSON.stringify(posts));
        renderAll();
    }
}

function editPost(i) {
    const p = posts[i];
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-desc').value = p.desc;
    document.getElementById('post-map').value = p.map;
    document.getElementById('edit-index').value = i;
    document.getElementById('form-title').innerText = "Tahrirlash";
}

function updateAdmin() {
    const u = document.getElementById('new-login').value;
    const p = document.getElementById('new-pass').value;
    if(u && p) {
        admin = { user: u, pass: p };
        localStorage.setItem('admin_db', JSON.stringify(admin));
        alert("Admin yangilandi!");
    }
}

function clearForm() {
    document.getElementById('post-title').value = "";
    document.getElementById('post-desc').value = "";
    document.getElementById('post-map').value = "";
    document.getElementById('edit-index').value = "";
    document.getElementById('form-title').innerText = "Yangi E'lon Qo'shish";
}

document.getElementById('admin-btn').onclick = () => document.getElementById('login-modal').style.display = 'flex';
function closeModal() { document.getElementById('login-modal').style.display = 'none'; }
function logout() { document.getElementById('admin-panel').style.display = 'none'; }

renderAll();
