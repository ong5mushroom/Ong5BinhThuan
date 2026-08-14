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

// 3. TẢI LỊCH SỬ & VẼ BIỂU ĐỒ NHIỆT ĐỘ
let chartInstance = null;
async function loadLichSuVaBieuDo() {
    const bang = document.getElementById('bangDotLo');
    try {
        const q = query(collection(db, "nhat_ky_dot_lo"), orderBy("ngay_dot", "desc"));
        const snapshot = await getDocs(q);

        bang.innerHTML = '';
        let labels = [];
        let dataNhietDo = [];

        if(snapshot.empty) {
            bang.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có dữ liệu đốt lò.</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const d = doc.data();
                const nhietDoHienThi = d.nhiet_do ? `${d.nhiet_do}°C` : 'N/A';
                
                // Nạp dữ liệu vào bảng
                bang.innerHTML += `
                    <tr>
                        <td class="text-muted">${d.ngay_dot}</td>
                        <td class="fw-bold text-danger">${d.me_lo}</td>
                        <td class="fw-bold">${d.so_luong_phoi}</td>
                        <td class="fw-bold text-warning">${nhietDoHienThi}</td>
                    </tr>
                `;
                // Đẩy dữ liệu vào mảng cho biểu đồ (Đảo ngược để hiển thị từ cũ tới mới)
                labels.unshift(d.me_lo + " (" + d.ngay_dot.slice(5) + ")");
                dataNhietDo.unshift(d.nhiet_do || 0); // Lấy nhiệt độ, nếu không có thì để 0
            });
        }

        // Vẽ biểu đồ Đường (Line Chart) thể hiện Nhiệt độ
        const ctx = document.getElementById('bieuDoDotLo');
        if(ctx) {
            if(chartInstance) chartInstance.destroy(); // Xóa biểu đồ cũ nếu có
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels.slice(-7), // Chỉ lấy 7 mẻ gần nhất
                    datasets: [{
                        label: 'Nhiệt độ (°C)',
                        data: dataNhietDo.slice(-7),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        tension: 0.3, // Tạo đường cong mềm mại
                        fill: true,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    scales: { 
                        y: { 
                            beginAtZero: false // Không bắt đầu từ 0 để đồ thị dao động nhiệt nhìn rõ hơn
                        } 
                    }
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
                nhiet_do: Number(document.getElementById('nhietDo').value), // Lưu thêm Nhiệt độ
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
