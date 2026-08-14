import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Phân quyền & Hiển thị Menu Admin
const userStr = localStorage.getItem('currentUser');
if (!userStr) window.location.href = 'login.html';
const user = JSON.parse(userStr);
if (user.vai_tro === 'admin') {
    const navQuanTri = document.getElementById('navQuanTri');
    if(navQuanTri) navQuanTri.style.display = 'block';
}

const giongRef = collection(db, "nhat_ky_giong");
const danhMucRef = collection(db, "danh_muc");
let tatCaDuLieuGiong = [];

// Tải Danh mục Giai Đoạn và Loại Nấm
async function loadDanhMucGiong() {
    const selectGiaiDoan = document.getElementById('giaiDoan');
    const selectLoaiNam = document.getElementById('loaiNamGiong');
    
    try {
        const snapshot = await getDocs(danhMucRef);
        selectGiaiDoan.innerHTML = '<option value="">-- Chọn Giai đoạn --</option>';
        selectLoaiNam.innerHTML = '<option value="">-- Chọn Loại nấm --</option>';

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.loai === 'giai_doan') {
                selectGiaiDoan.innerHTML += `<option value="${data.ten}">${data.ten}</option>`;
            }
            if (data.loai === 'san_pham') {
                selectLoaiNam.innerHTML += `<option value="${data.ten}">${data.ten}</option>`;
            }
        });
    } catch (error) {
        console.error("Lỗi tải danh mục:", error);
    }
}

// Render Timeline
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

        let htmlTruyXuat = item.ma_lo_nguon ? `<span class="badge bg-light text-dark border"><i class="small">Từ lô nguồn:</i> ${item.ma_lo_nguon}</span>` : '';

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
                <p class="mb-1 small">Sản xuất: <b>${item.sl_cay}</b> | Đạt: <b>${item.sl_dat || 'Chưa cập nhật'}</b></p>
                <p class="mb-1 small text-muted">Thực hiện: <i>${item.nguoi_thuc_hien}</i></p>
                ${htmlTruyXuat}
            </div>
        `;
    });
}

// Load dữ liệu
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

// Lưu Form Giống
const formGiong = document.getElementById('formGiong');
if (formGiong) {
    formGiong.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnLuu = document.getElementById('btnLuuGiong');
        btnLuu.disabled = true;

        const giaiDoan = document.getElementById('giaiDoan').value;
        const loaiNam = document.getElementById('loaiNamGiong').value;
        
        if (!giaiDoan || !loaiNam) {
            alert("Vui lòng chọn Giai đoạn và Loại nấm!");
            btnLuu.disabled = false;
            return;
        }

        try {
            await addDoc(giongRef, {
                giai_doan: giaiDoan,
                loai_nam: loaiNam,
                ma_lo_hien_tai: document.getElementById('maLoHienTai').value.trim(),
                ma_lo_nguon: document.getElementById('maLoNguon').value.trim(),
                sl_cay: Number(document.getElementById('slCay').value),
                sl_dat: document.getElementById('slDat').value ? Number(document.getElementById('slDat').value) : null,
                nguoi_thuc_hien: user.ten_hien_thi,
                thoi_gian: serverTimestamp()
            });
            formGiong.reset();
            loadNhatKyGiong();
            alert("Đã lưu nhật ký giống thành công!");
        } catch (error) {
            console.error(error);
            alert("Lỗi lưu dữ liệu!");
        } finally {
            btnLuu.disabled = false;
        }
    });
}

// Tìm kiếm Traceability
document.getElementById('btnTimKiem')?.addEventListener('click', () => {
    const tuKhoa = document.getElementById('timKiemLo').value.trim().toLowerCase();
    if (!tuKhoa) {
        renderTimeline(tatCaDuLieuGiong);
        return;
    }
    const ketQua = tatCaDuLieuGiong.filter(item => 
        (item.ma_lo_hien_tai && item.ma_lo_hien_tai.toLowerCase().includes(tuKhoa)) ||
        (item.ma_lo_nguon && item.ma_lo_nguon.toLowerCase().includes(tuKhoa))
    );
    renderTimeline(ketQua);
});

window.addEventListener('DOMContentLoaded', () => {
    loadDanhMucGiong();
    loadNhatKyGiong();
});
