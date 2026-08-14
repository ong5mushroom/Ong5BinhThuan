import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. Phân quyền
const userStr = localStorage.getItem('currentUser');
if (!userStr) window.location.href = 'login.html';
const user = JSON.parse(userStr);
if (user.vai_tro === 'admin') {
    const navQuanTri = document.getElementById('navQuanTri');
    if(navQuanTri) navQuanTri.style.display = 'block';
}

const inputNgay = document.getElementById('ngayDotLo');
const khuVucHienThi = document.getElementById('bangVatTuXuatNgay');

// 2. LIÊN KẾT VẬT TƯ KHO TRONG NGÀY
async function taiVatTuLienKet(ngayChon) {
    if (!khuVucHienThi) return;
    khuVucHienThi.innerHTML = '<li class="list-group-item bg-transparent text-muted px-0">Đang quét dữ liệu kho...</li>';
    try {
        const q = query(collection(db, "nhat_ky_kho"), where("loai_phieu", "==", "xuat"), where("ngay_thuc_hien", "==", ngayChon));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            khuVucHienThi.innerHTML = '<li class="list-group-item bg-transparent text-danger px-0">Chưa có phiếu xuất nguyên liệu (mùn cưa, cám...) nào trong ngày này.</li>';
            return;
        }

        khuVucHienThi.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            khuVucHienThi.innerHTML += `
                <li class="list-group-item bg-transparent d-flex justify-content-between align-items-center px-0 py-1">
                    <span class="fw-bold">${data.ten_vat_tu}</span>
                    <span class="badge bg-danger rounded-pill">- ${data.so_luong} ${data.don_vi}</span>
                </li>`;
        });
    } catch (error) {
        khuVucHienThi.innerHTML = '<li class="list-group-item bg-transparent text-danger px-0">Lỗi kết nối cơ sở dữ liệu.</li>';
    }
}

// Lắng nghe sự kiện đổi ngày
if (inputNgay) {
    const today = new Date().toLocaleDateString('en-CA');
    inputNgay.value = today;
    taiVatTuLienKet(today);
    inputNgay.addEventListener('change', (e) => taiVatTuLienKet(e.target.value));
}

// 3. TẢI LỊCH SỬ & VẼ BIỂU ĐỒ
let chartInstance = null;
async function loadLichSuVaBieuDo() {
    const bang = document.getElementById('bangDotLo');
    try {
        const q = query(collection(db, "nhat_ky_dot_lo"), orderBy("ngay_dot", "desc"));
        const snapshot = await getDocs(q);

        bang.innerHTML = '';
        let labels = [];
        let dataPhoi = [];

        if(snapshot.empty) {
            bang.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có dữ liệu đốt lò.</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const d = doc.data();
                // Nạp dữ liệu vào bảng
                bang.innerHTML += `
                    <tr>
                        <td class="text-muted">${d.ngay_dot}</td>
                        <td class="fw-bold text-danger">${d.me_lo}</td>
                        <td class="fw-bold">${d.so_luong_phoi}</td>
                        <td>${d.nguoi_thuc_hien}</td>
                    </tr>
                `;
                // Đẩy dữ liệu vào mảng cho biểu đồ (Đảo ngược để hiển thị từ cũ tới mới)
                labels.unshift(d.me_lo + " (" + d.ngay_dot.slice(5) + ")");
                dataPhoi.unshift(d.so_luong_phoi);
            });
        }

        // Vẽ biểu đồ bằng Chart.js
        const ctx = document.getElementById('bieuDoDotLo');
        if(ctx) {
            if(chartInstance) chartInstance.destroy(); // Xóa biểu đồ cũ nếu có
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels.slice(-7), // Chỉ lấy 7 mẻ gần nhất
                    datasets: [{
                        label: 'Số lượng phôi (bịch)',
                        data: dataPhoi.slice(-7),
                        backgroundColor: 'rgba(220, 53, 69, 0.7)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    } catch(e) { console.error(e); }
}

// 4. LƯU GHI NHẬN ĐỐT LÒ
const formDotLo = document.getElementById('formDotLo');
if (formDotLo) {
    formDotLo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnLuuDotLo');
        btn.disabled = true;

        try {
            await addDoc(collection(db, "nhat_ky_dot_lo"), {
                me_lo: document.getElementById('meLo').value.trim(),
                ngay_dot: document.getElementById('ngayDotLo').value,
                so_luong_phoi: Number(document.getElementById('soLuongPhoi').value),
                nguoi_thuc_hien: user.ten_hien_thi,
                ma_nv: user.ma_nv,
                thoi_gian: serverTimestamp()
            });
            alert("Lưu mẻ lò thành công!");
            formDotLo.reset();
            
            // Khôi phục ngày hiện tại và tải lại dữ liệu
            const today = new Date().toLocaleDateString('en-CA');
            inputNgay.value = today;
            taiVatTuLienKet(today);
            loadLichSuVaBieuDo();
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi khi lưu!");
        } finally {
            btn.disabled = false;
        }
    });
}

// Chạy khởi tạo khi mở trang
window.addEventListener('DOMContentLoaded', loadLichSuVaBieuDo);
