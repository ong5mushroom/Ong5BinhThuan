import { db } from '../firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btnLogin');
    const errorText = document.getElementById('loginError');
    
    btn.disabled = true;
    btn.innerText = "Đang kiểm tra...";
    errorText.classList.add('d-none');

    const maNV = document.getElementById('maNV').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
        // Tìm trong bảng 'users' xem có tài khoản nào khớp Mã NV và Mật khẩu không
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("ma_nv", "==", maNV), where("mat_khau", "==", password));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Lấy thông tin user đầu tiên tìm thấy
            const userData = querySnapshot.docs[0].data();
            
            // Lưu thông tin đăng nhập vào Local Storage của trình duyệt
            localStorage.setItem('currentUser', JSON.stringify({
                ma_nv: userData.ma_nv,
                ten_hien_thi: userData.ten_hien_thi,
                vai_tro: userData.vai_tro
            }));
            
            // Chuyển hướng vào Trang chủ
            window.location.href = 'index.html';
        } else {
            // Không tìm thấy tài khoản hợp lệ
            errorText.classList.remove('d-none');
        }
    } catch (error) {
        console.error("Lỗi truy vấn đăng nhập:", error);
        errorText.innerText = "Lỗi kết nối cơ sở dữ liệu!";
        errorText.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btn.innerText = "Đăng Nhập";
    }
});
