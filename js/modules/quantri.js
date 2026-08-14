import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Xác thực Admin
const userStr = localStorage.getItem('currentUser');
if (!userStr) window.location.href = 'login.html';
const user = JSON.parse(userStr);
if (user.vai_tro !== 'admin') {
    alert("Chỉ Giám Đốc mới có quyền truy cập trang này!");
    window.location.href = 'index.html';
}

const usersRef = collection(db, "users");
const danhMucRef = collection(db, "danh_muc");

// --- 1. QUẢN LÝ NHÂN VIÊN ---
async function loadNhanVien() {
    const bang = document.getElementById('bangNhanVien');
    bang.innerHTML = '';
    try {
        const querySnapshot = await getDocs(usersRef);
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let roleBadge = 'bg-secondary';
            if(data.vai_tro === 'admin') roleBadge = 'bg-danger';
            
            bang.innerHTML += `
                <tr>
                    <td class="fw-bold">${data.ma_nv}</td>
                    <td>${data.ten_hien_thi}</td>
                    <td>${data.mat_khau}</td>
                    <td><span class="badge ${roleBadge}">${data.vai_tro}</span></td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="xoaDuLieu('users', '${docSnap.id}')">Xóa</button></td>
                </tr>`;
        });
    } catch (error) { console.error(error); }
}

document.getElementById('formNhanVien').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLuuNV');
    btn.disabled = true;
    try {
        await addDoc(usersRef, {
            ma_nv: document.getElementById('maNV').value.trim(),
            ten_hien_thi: document.getElementById('tenNV').value.trim(),
            vai_tro: document.getElementById('quyenNV').value,
            mat_khau: document.getElementById('matKhau').value
        });
        document.getElementById('formNhanVien').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalNhanVien')).hide();
        loadNhanVien();
    } catch (error) { console.error(error); } finally { btn.disabled = false; }
});


// --- 2. QUẢN LÝ DANH MỤC ---
async function loadDanhMuc() {
    const bang = document.getElementById('bangDanhMuc');
    bang.innerHTML = '';
    try {
        const querySnapshot = await getDocs(danhMucRef);
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let tenLoai = "";
            if(data.loai === "vat_tu") tenLoai = '<span class="text-primary fw-bold">Vật tư</span>';
            if(data.loai === "san_pham") tenLoai = '<span class="text-success fw-bold">Loại Nấm</span>';
            if(data.loai === "giai_doan") tenLoai = '<span class="text-warning fw-bold">Giai đoạn</span>';

            bang.innerHTML += `
                <tr>
                    <td>${tenLoai}</td>
                    <td class="fw-bold">${data.ten}</td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="xoaDuLieu('danh_muc', '${docSnap.id}')">Xóa</button></td>
                </tr>`;
        });
    } catch (error) { console.error(error); }
}

document.getElementById('formDanhMuc').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLuuDanhMuc');
    btn.disabled = true;
    try {
        await addDoc(danhMucRef, {
            loai: document.getElementById('loaiDanhMuc').value,
            ten: document.getElementById('tenDanhMuc').value.trim(),
            ngay_tao: serverTimestamp()
        });
        document.getElementById('tenDanhMuc').value = '';
        loadDanhMuc();
    } catch (error) { console.error(error); } finally { btn.disabled = false; }
});

// Hàm xóa dùng chung gắn vào window
window.xoaDuLieu = async function(collectionName, docId) {
    if(confirm("Bạn có chắc chắn muốn xóa dữ liệu này?")) {
        try {
            await deleteDoc(doc(db, collectionName, docId));
            if(collectionName === 'users') loadNhanVien();
            if(collectionName === 'danh_muc') loadDanhMuc();
        } catch (error) { alert("Lỗi khi xóa!"); }
    }
}

window.onload = () => { loadNhanVien(); loadDanhMuc(); };
