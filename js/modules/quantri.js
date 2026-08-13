import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const usersRef = collection(db, "users");
const donTuRef = collection(db, "don_tu");

// Tải danh sách nhân viên
async function loadNhanVien() {
    const bang = document.getElementById('bangNhanVien');
    bang.innerHTML = '';

    try {
        const querySnapshot = await getDocs(usersRef);
        if (querySnapshot.empty) {
            bang.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có nhân sự nào.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Format màu sắc quyền hạn
            let roleBadge = 'bg-secondary';
            let roleText = 'Nhân viên';
            if(data.vai_tro === 'admin') { roleBadge = 'bg-danger'; roleText = 'Admin'; }
            if(data.vai_tro === 'to_truong') { roleBadge = 'bg-success'; roleText = 'Tổ trưởng'; }
            if(data.vai_tro === 'to_giong') { roleBadge = 'bg-warning text-dark'; roleText = 'Tổ Giống'; }

            bang.innerHTML += `
                <tr>
                    <td class="fw-bold">${data.ma_nv}</td>
                    <td>${data.ten_hien_thi}</td>
                    <td><span class="badge ${roleBadge}">${roleText}</span></td>
                    <td><span class="text-success">Đang làm việc</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="xoaNhanVien('${id}')">Xóa</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Lỗi tải nhân viên: ", error);
        bang.innerHTML = '<tr><td colspan="5" class="text-danger">Lỗi kết nối CSDL</td></tr>';
    }
}

// Hàm Xóa nhân viên (Gắn vào window để gọi từ HTML nội tuyến)
window.xoaNhanVien = async function(docId) {
    if(confirm("Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống?")) {
        try {
            await deleteDoc(doc(db, "users", docId));
            alert("Đã xóa nhân viên!");
            loadNhanVien();
        } catch (error) {
            console.error("Lỗi xóa:", error);
            alert("Không thể xóa. Vui lòng kiểm tra quyền.");
        }
    }
}

// Xử lý tạo nhân viên mới
document.getElementById('formNhanVien').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLuuNV');
    btn.disabled = true;

    try {
        await addDoc(usersRef, {
            ma_nv: document.getElementById('maNV').value.trim(),
            ten_hien_thi: document.getElementById('tenNV').value.trim(),
            vai_tro: document.getElementById('quyenNV').value,
            mat_khau: document.getElementById('matKhau').value, // Thực tế nên dùng Firebase Auth thay vì lưu plain text
            ngay_tao: serverTimestamp()
        });

        alert("Đã tạo tài khoản thành công!");
        document.getElementById('formNhanVien').reset();
        bootstrap.Modal.getInstance(document.getElementById('modalNhanVien')).hide();
        loadNhanVien();
    } catch (error) {
        console.error("Lỗi tạo tài khoản:", error);
    } finally {
        btn.disabled = false;
    }
});

// Tải danh sách đơn từ / đề xuất
async function loadDonTu() {
    const bang = document.getElementById('bangDonTu');
    bang.innerHTML = '';

    try {
        const q = query(donTuRef, orderBy("thoi_gian", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            bang.innerHTML = '<tr><td colspan="4" class="text-center">Không có đề xuất nào.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dateStr = data.thoi_gian ? data.thoi_gian.toDate().toLocaleDateString('vi-VN') : '';
            
            bang.innerHTML += `
                <tr>
                    <td>${dateStr}</td>
                    <td class="fw-bold">${data.nguoi_gui}</td>
                    <td><span class="badge bg-info text-dark">${data.loai_don}</span></td>
                    <td>${data.noi_dung}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Lỗi tải đơn từ:", error);
    }
}

// Khởi chạy khi tải trang
window.onload = () => {
    loadNhanVien();
    loadDonTu();
};

// Chức năng xuất Excel (Mô phỏng báo cáo chấm công)
document.getElementById('btnXuatChamCong').addEventListener('click', () => {
    alert("Chức năng kết xuất dữ liệu chấm công ra file Excel/CSV đang được chuẩn bị!");
});
