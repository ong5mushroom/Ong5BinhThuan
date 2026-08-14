import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. KIỂM TRA ĐĂNG NHẬP & PHÂN QUYỀN
const userStr = localStorage.getItem('currentUser');
if (!userStr) {
    window.location.href = 'login.html'; 
}
const user = JSON.parse(userStr);

document.addEventListener('DOMContentLoaded', () => {
    const tenNhanVienEl = document.getElementById('tenNhanVien');
    const tenLoiChaoEl = document.getElementById('tenLoiChao');
    if(tenNhanVienEl) tenNhanVienEl.innerText = user.ten_hien_thi;
    if(tenLoiChaoEl) tenLoiChaoEl.innerText = user.ten_hien_thi;

    // Chỉ Admin mới thấy menu Quản trị
    if (user.vai_tro === 'admin') {
        const navQuanTri = document.getElementById('navQuanTri');
        if(navQuanTri) navQuanTri.style.display = 'block';
    }
});

// Chức năng Đăng xuất
document.getElementById('btnDangXuat')?.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
});


// 2. KHU VỰC ĐIỂM DANH (CHỐNG TRÙNG LẶP)
const btnNhanCa = document.getElementById('btnNhanCa');

// Hàm kiểm tra xem hôm nay nhân viên này đã nhận ca chưa
async function kiemTraNhanCa() {
    if (!btnNhanCa) return;
    try {
        const q = query(collection(db, "diem_danh"), where("nhan_vien_id", "==", user.ma_nv));
        const snapshot = await getDocs(q);
        const todayStr = new Date().toLocaleDateString('vi-VN');
        let daNhanCaHomNay = false;

        snapshot.forEach(doc => {
            const data = doc.data();
            if(data.thoi_gian) {
                const dateStr = data.thoi_gian.toDate().toLocaleDateString('vi-VN');
                if(dateStr === todayStr && data.loai === "nhan_ca") {
                    daNhanCaHomNay = true;
                }
            }
        });

        if (daNhanCaHomNay) {
            btnNhanCa.disabled = true;
            btnNhanCa.classList.replace('btn-success', 'btn-secondary');
            btnNhanCa.innerText = "✅ Đã nhận ca hôm nay";
        }
    } catch (error) {
        console.error("Lỗi kiểm tra điểm danh:", error);
    }
}

// Chạy kiểm tra ngay khi mở web
kiemTraNhanCa();

if (btnNhanCa) {
    btnNhanCa.addEventListener('click', async () => {
        btnNhanCa.disabled = true;
        btnNhanCa.innerText = "Đang ghi nhận...";
        try {
            await addDoc(collection(db, "diem_danh"), {
                nhan_vien_id: user.ma_nv,
                nhan_vien_ten: user.ten_hien_thi, 
                loai: "nhan_ca",
                thoi_gian: serverTimestamp()
            });
            btnNhanCa.classList.replace('btn-success', 'btn-secondary');
            btnNhanCa.innerText = "✅ Đã nhận ca hôm nay";
        } catch (error) {
            alert("Lỗi kết nối CSDL!");
            btnNhanCa.disabled = false;
            btnNhanCa.innerText = "📍 Nhận ca làm việc";
        }
    });
}


// 3. KHU VỰC BẢNG TIN & CHAT
const btnGuiChat = document.getElementById('btnGuiChat');
const inputChat = document.getElementById('inputChat');
const khuVucChat = document.getElementById('khuVucChat');

// Hàm tải toàn bộ tin nhắn từ kho về để hiển thị
async function loadChat() {
    if (!khuVucChat) return;
    try {
        const q = query(collection(db, "bang_tin"), orderBy("thoi_gian", "asc"));
        const snapshot = await getDocs(q);
        
        khuVucChat.innerHTML = '';
        if (snapshot.empty) {
            khuVucChat.innerHTML = '<div class="text-muted small text-center">Chưa có thông báo nào.</div>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            khuVucChat.innerHTML += `
                <div class="alert alert-info small border-0 py-2 mb-2">
                    <strong class="text-primary">[${data.nguoi_gui}]:</strong> ${data.noi_dung}
                </div>
            `;
        });
        
        // Tự động cuộn xuống tin nhắn mới nhất
        khuVucChat.scrollTop = khuVucChat.scrollHeight;
    } catch (error) {
        console.error("Lỗi tải chat:", error);
    }
}

// Chạy tải tin nhắn khi mở web
loadChat();

// Khi bấm Gửi tin nhắn
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
            inputChat.value = ''; // Xóa trắng ô nhập
            loadChat(); // Tải lại bảng chat để hiện tin vừa gửi
        } catch (error) {
            console.error("Lỗi gửi tin:", error);
        } finally {
            btnGuiChat.disabled = false;
            btnGuiChat.innerText = "Gửi";
        }
    });
}
