import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Lấy thông tin user đăng nhập
const userStr = localStorage.getItem('currentUser');
if (!userStr) window.location.href = 'login.html';
const user = JSON.parse(userStr);

const giongRef = collection(db, "nhat_ky_giong");
let tatCaDuLieuGiong = [];

// Hàm in dữ liệu ra trục thời gian
function renderTimeline(dataList) {
    const khuVucTimeline = document.getElementById('khuVucTimeline');
    if (!khuVucTimeline) return;
    khuVucTimeline.innerHTML = '';

    if (dataList.length === 0) {
        khuVucTimeline.innerHTML = '<div class="text-muted small">Không tìm thấy lịch sử lô giống.</div>';
        return;
    }

    dataList.forEach(item => {
        const dateObj = item.thoi_gian ? item.thoi_gian.toDate() : new Date();
        const dateStr = dateObj.toLocaleDateString('vi-VN');

        let badgeColor = 'bg-secondary';
        if(item.giai_doan.includes('F0')) badgeColor = 'bg-danger';
        if(item.giai_doan.includes('F1')) badgeColor = 'bg-warning text-dark';
        if(item.giai_doan.includes('F2')) badgeColor = 'bg-success';

        let htmlTruyXuat = item.ma_lo_nguon ? `<span class="badge bg-light text-dark border"><i class="small">Từ:</i> ${item.ma_lo_nguon}</span>` : '';

        khuVucTimeline.innerHTML += `
            <div class="timeline-item mb-3 p-3 border rounded shadow-sm bg-white">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="fw-bold mb-1">Mã Lô: <span class="text-primary">${item.ma_lo_hien_tai}</span></h6>
                    <small class="text-muted">${dateStr}</small>
                </div>
                <p class="mb-1">
                    <span class="badge ${badgeColor} me-2">${item.giai_doan}</span>
                    <span class="fw-bold text-success">${item.loai_nam}</span>
                </p>
                <p class="mb-1 small">Số lượng: <b>${item.sl_cay}</b> | Thực hiện: <b>${item.nguoi_thuc_hien}</b></p>
                ${htmlTruyXuat}
            </div>
        `;
    });
}

// Tải dữ liệu ban đầu
async function loadNhatKyGiong() {
    try {
        const q = query(giongRef, orderBy("thoi_gian", "desc"));
        const snapshot = await getDocs(q);
        tatCaDuLieuGiong = [];
        snapshot.forEach((doc) => tatCaDuLieuGiong.push({ id: doc.id, ...doc.data() }));
        renderTimeline(tatCaDuLieuGiong);
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

// Xử lý lưu form
const formGiong = document.getElementById('formGiong');
if (formGiong) {
    formGiong.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnLuu = document.getElementById('btnLuuGiong');
        btnLuu.disabled = true;
        btnLuu.innerText = "Đang lưu...";

        try {
            await addDoc(giongRef, {
                giai_doan: document.getElementById('giaiDoan').value,
                loai_nam: document.getElementById('loaiNamGiong').value.trim(), // Lấy từ ô nhập tay
                ma_lo_hien_tai: document.getElementById('maLoHienTai').value.trim(),
                ma_lo_nguon: document.getElementById('maLoNguon').value.trim(),
                sl_cay: Number(document.getElementById('slCay').value),
                nguoi_thuc_hien: user.ten_hien_thi, // Lưu chính xác người làm
                thoi_gian: serverTimestamp()
            });
            formGiong.reset();
            loadNhatKyGiong();
        } catch (error) {
            console.error(error);
            alert("Lỗi lưu dữ liệu!");
        } finally {
            btnLuu.disabled = false;
            btnLuu.innerText = "Lưu Nhật Ký";
        }
    });
}

window.addEventListener('DOMContentLoaded', loadNhatKyGiong);
