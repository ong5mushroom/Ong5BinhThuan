import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. KIỂM TRA ĐĂNG NHẬP & PHÂN QUYỀN
const userStr = localStorage.getItem('currentUser');
if (!userStr) {
    window.location.href = 'login.html'; // Chưa đăng nhập thì đuổi ra
}
const user = JSON.parse(userStr);

// Hiển thị tên và menu
document.addEventListener('DOMContentLoaded', () => {
    const tenNhanVienEl = document.getElementById('tenNhanVien');
    const tenLoiChaoEl = document.getElementById('tenLoiChao');
    if(tenNhanVienEl) tenNhanVienEl.innerText = user.ten_hien_thi;
    if(tenLoiChaoEl) tenLoiChaoEl.innerText = user.ten_hien_thi;

    // Chỉ Admin (Giám đốc) mới thấy menu Quản trị
    if (user.vai_tro === 'admin') {
        const navQuanTri = document.getElementById('navQuanTri');
        if(navQuanTri) navQuanTri.style.display = 'block';
    }
});

// Chức năng Đăng xuất
const btnDangXuat = document.getElementById('btnDangXuat');
if (btnDangXuat) {
    btnDangXuat.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}

// 2. ĐIỂM DANH NHẬN CA
const btnNhanCa = document.getElementById('btnNhanCa');
if (btnNhanCa) {
    btnNhanCa.addEventListener('click', async () => {
        btnNhanCa.disabled = true;
        btnNhanCa.innerText = "Đang ghi nhận...";
        try {
            await addDoc(collection(db, "diem_danh"), {
                nhan_vien_id: user.ma_nv,
                nhan_vien_ten: user.ten_hien_thi, // Lấy tên người đang đăng nhập
                loai: "nhan_ca",
                thoi_gian: serverTimestamp()
            });
            btnNhanCa.classList.replace('btn-success', 'btn-secondary');
            btnNhanCa.innerText = "✅ Đã nhận ca";
        } catch (error) {
            console.error("Lỗi điểm danh:", error);
            alert("Lỗi kết nối CSDL!");
            btnNhanCa.disabled = false;
            btnNhanCa.innerText = "📍 Nhận ca làm việc";
        }
    });
}

// 3. GỬI TIN NHẮN (CHAT NHẮC NHỞ)
const btnGuiChat = document.getElementById('btnGuiChat');
const inputChat = document.getElementById('inputChat');
if (btnGuiChat && inputChat) {
    btnGuiChat.addEventListener('click', async () => {
        const noiDung = inputChat.value.trim();
        if (!noiDung) return;
        
        btnGuiChat.disabled = true;
        btnGuiChat.innerText = "...";
        try {
            await addDoc(collection(db, "bang_tin"), {
                nguoi_gui: user.ten_hien_thi,
                noi_dung: noiDung,
                thoi_gian: serverTimestamp()
            });
            inputChat.value = '';
            alert("Đã gửi thông báo thành công!");
        } catch (error) {
            console.error("Lỗi gửi tin:", error);
        } finally {
            btnGuiChat.disabled = false;
            btnGuiChat.innerText = "Gửi";
        }
    });
}
