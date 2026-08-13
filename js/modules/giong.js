import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const giongRef = collection(db, "nhat_ky_giong");
let tatCaDuLieuGiong = []; // Bộ nhớ tạm để lọc dữ liệu truy xuất

// Hàm render Timeline ra HTML
function renderTimeline(dataList) {
    const khuVucTimeline = document.getElementById('khuVucTimeline');
    khuVucTimeline.innerHTML = '';

    if (dataList.length === 0) {
        khuVucTimeline.innerHTML = '<div class="text-muted small">Không tìm thấy lịch sử lô giống.</div>';
        return;
    }

    dataList.forEach(item => {
        const dateObj = item.thoi_gian ? item.thoi_gian.toDate() : new Date();
        const dateStr = dateObj.toLocaleDateString('vi-VN');
        const timeStr = dateObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});

        // Đổi màu badge theo giai đoạn
        let badgeColor = 'bg-secondary';
        if(item.giai_doan.includes('F0')) badgeColor = 'bg-danger';
        if(item.giai_doan.includes('F1')) badgeColor = 'bg-warning text-dark';
        if(item.giai_doan.includes('F2')) badgeColor = 'bg-success';

        let htmlTruyXuat = item.ma_lo_nguon ? `<span class="badge bg-light text-dark border"><i class="small">Từ lô nguồn:</i> ${item.ma_lo_nguon}</span>` : '';

        khuVucTimeline.innerHTML += `
            <div class="timeline-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="fw-bold mb-1">Mã lô: <span class="text-primary">${item.ma_lo_hien_tai}</span></h6>
                    <small class="text-muted">${timeStr} - ${dateStr}</small>
                </div>
                <p class="mb-1">
                    <span class="badge ${badgeColor} me-2">${item.giai_doan}</span>
                    <span class="fw-bold text-success">${item.loai_nam}</span>
                </p>
                <p class="mb-1 small">
                    Sản xuất: <b>${item.sl_cay}</b> | Đạt: <b>${item.sl_dat || 'Chưa cập nhật'}</b>
                </p>
                ${htmlTruyXuat}
            </div>
        `;
    });
}

// Hàm tải toàn bộ nhật ký
async function loadNhatKyGiong() {
    try {
        const q = query(giongRef, orderBy("thoi_gian", "desc"));
        const querySnapshot = await getDocs(q);
        
        tatCaDuLieuGiong = [];
        querySnapshot.forEach((doc) => {
            tatCaDuLieuGiong.push({ id: doc.id, ...doc.data() });
        });

        renderTimeline(tatCaDuLieuGiong);
    } catch (error) {
        console.error("Lỗi khi tải nhật ký giống: ", error);
        document.getElementById('khuVucTimeline').innerHTML = '<div class="text-danger small">Lỗi kết nối cơ sở dữ liệu.</div>';
    }
}

// Xử lý Lưu Nhật Ký
document.getElementById('formGiong').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnLuu = document.getElementById('btnLuuGiong');
    btnLuu.disabled = true;
    btnLuu.innerText = "Đang lưu...";

    const logData = {
        giai_doan: document.getElementById('giaiDoan').value,
        loai_nam: document.getElementById('loaiNamGiong').value,
        ma_lo_hien_tai: document.getElementById('maLoHienTai').value.trim(),
        ma_lo_nguon: document.getElementById('maLoNguon').value.trim(),
        sl_cay: Number(document.getElementById('slCay').value),
        sl_dat: document.getElementById('slDat').value ? Number(document.getElementById('slDat').value) : null,
        nguoi_thuc_hien: "to_truong_giong", // Tạm gán quyền
        thoi_gian: serverTimestamp()
    };

    try {
        await addDoc(giongRef, logData);
        document.getElementById('formGiong').reset();
        loadNhatKyGiong(); // Cập nhật lại Timeline
    } catch (error) {
        console.error("Lỗi lưu giống: ", error);
        alert("Có lỗi xảy ra khi lưu!");
    } finally {
        btnLuu.disabled = false;
        btnLuu.innerText = "Lưu Nhật Ký";
    }
});

// Chức năng tìm kiếm lô (Lọc Timeline)
document.getElementById('btnTimKiem').addEventListener('click', () => {
    const tuKhoa = document.getElementById('timKiemLo').value.trim().toLowerCase();
    if (!tuKhoa) {
        renderTimeline(tatCaDuLieuGiong);
        return;
    }
    
    // Tìm các lô có mã hiện tại hoặc mã nguồn chứa từ khóa
    const ketQuaTimKiem = tatCaDuLieuGiong.filter(item => 
        (item.ma_lo_hien_tai && item.ma_lo_hien_tai.toLowerCase().includes(tuKhoa)) ||
        (item.ma_lo_nguon && item.ma_lo_nguon.toLowerCase().includes(tuKhoa))
    );
    renderTimeline(ketQuaTimKiem);
});

// Chạy load dữ liệu khi khởi tạo
window.onload = loadNhatKyGiong;
