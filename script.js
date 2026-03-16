// Tungi va kungi rejim
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.innerText = document.body.classList.contains('dark-mode') ? "☀️ Kungi Rejim" : "🌙 Tungi Rejim";
});

// Modal boshqaruvi
const adminBtn = document.getElementById('admin-btn');
const loginModal = document.getElementById('login-modal');
const adminPanel = document.getElementById('admin-panel');

adminBtn.onclick = () => loginModal.style.display = 'flex';

function closeModal() { loginModal.style.display = 'none'; }

// Admin Login (Siz bergan ma'lumotlar)
let adminLogin = "mystra";
let adminPass = "mystra2014";

function checkAdmin() {
    const l = document.getElementById('login').value;
    const p = document.getElementById('password').value;

    if(l === adminLogin && p === adminPass) {
        loginModal.style.display = 'none';
        adminPanel.style.display = 'flex';
    } else {
        alert("Xato login yoki parol!");
    }
}

function logout() {
    adminPanel.style.display = 'none';
}
