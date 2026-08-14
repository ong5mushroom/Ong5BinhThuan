import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Phân quyền
const userStr = localStorage.getItem('currentUser');
if (!userStr) window.location.href = 'login.html';
const user = JSON.parse(userStr);
if (user.vai_tro === 'admin') {
    const navQuanTri = document.getElementById('navQuanTri');
    if(navQuanTri) navQuanTri.style.display = 'block';
}

const inputNgay = document.getElementById('ngayDotLo');
let chartInstance = null;

// Hàm tải lịch sử và vẽ biểu đồ THEO NGÀY ĐANG CHỌN
async function loadLichSuVaBieuDo(ngayChon) {
    const bang = document.getElementById('bangLichSuNhietDo');
    if (!bang) return;

    try {
        const q = query(
            collection(db, "nhat_ky_dot_lo"), 
            where("ngay_dot", "==", ngayChon),
            orderBy("thoi_gian", "asc") // Xếp theo giờ tăng dần để vẽ biểu đồ
        );
        const snapshot = await getDocs(q);

        bang.innerHTML = '';
        let labelsGio = [];
        let dataCont1 = [];
        let dataCont2 = [];

        if(snapshot.empty) {
            bang.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có dữ liệu nhiệt độ trong ngày này.</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const d = doc.data();
                
                // Trích xuất giờ ghi nhận từ serverTimestamp
                let gioGhi = "N/A";
                if(d.thoi_gian) {
                    const dateObj = d.thoi_gian.toDate();
                    gioGhi = dateObj.getHours() + ":" + String(dateObj.getMinutes()).padStart(2, '0');
                }

                // Tính trung bình cộng nhiệt độ Container 1
                let tbC1 = (d.c1_1 + d.c1_2 + d.c1_3 + d.c1_4) / 4 || 0;
                // Tính trung bình cộng nhiệt độ Container 2
                let tbC2 = (d.c2_1 + d.c2_2 + d.c2_3 + d.c2_4) / 4 || 0;

                bang.innerHTML += `
                    <tr>
                        <td class="fw-bold">${gioGhi}</td>
                        <td>${d.ma_lo}</td>
                        <td class="text-primary fw-bold">${tbC1.toFixed(1)}°C</td>
                        <td class="text-warning fw-bold">${tbC2.toFixed(1)}°C</td>
                        <td class="text-muted">${d.nguoi_thuc_hien}</td>
                    </tr>
                `;

                labelsGio.push(gioGhi);
                dataCont1.push(tbC1);
                dataCont2.push(tbC2);
            });
        }

        // Vẽ biểu đồ Đường
        const ctx = document.getElementById('bieuDoNhietDo');
        if(ctx) {
            if(chartInstance) chartInstance.destroy();
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labelsGio,
                    datasets: [
                        {
                            label: 'TB Container 1 (°C)',
                            data: dataCont1,
                            borderColor: '#0d6efd', // Màu xanh Primary
                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'TB Container 2 (°C)',
                            data: dataCont2,
                            borderColor: '#ffc107', // Màu vàng Warning
                            backgroundColor: 'rgba(255, 193, 7, 0.1)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: { 
                        y: { beginAtZero: false } 
                    }
                }
            });
        }
    } catch(e) { console.error("Lỗi vẽ biểu đồ:", e); }
}

// Khởi tạo ngày hôm nay và gọi dữ liệu
if (inputNgay) {
    const today = new Date().toLocaleDateString('en-CA');
    inputNgay.value = today;
    loadLichSuVaBieuDo(today);

    // Khi người dùng đổi ngày, tải lại biểu đồ của ngày đó
    inputNgay.addEventListener('change', (e) => {
        loadLichSuVaBieuDo(e.target.value);
    });
}

// Lưu Ghi nhận
const formDotLo = document.getElementById('formDotLo');
if (formDotLo) {
    formDotLo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnLuuDotLo');
        btn.disabled = true;

        try {
            await addDoc(collection(db, "nhat_ky_dot_lo"), {
                ngay_dot: document.getElementById('ngayDotLo').value,
                ma_lo: document.getElementById('maLo').value.trim(),
                so_luong: Number(document.getElementById('soLuong').value),
                thoi_tiet: document.getElementById('thoiTiet').value.trim(),
                loai_cui: document.getElementById('loaiCui').value.trim(),
                
                // Dữ liệu 4 đồng hồ Container 1
                c1_1: Number(document.getElementById('c1_1').value) || 0,
                c1_2: Number(document.getElementById('c1_2').value) || 0,
                c1_3: Number(document.getElementById('c1_3').value) || 0,
                c1_4: Number(document.getElementById('c1_4').value) || 0,

                // Dữ liệu 4 đồng hồ Container 2
                c2_1: Number(document.getElementById('c2_1').value) || 0,
                c2_2: Number(document.getElementById('c2_2').value) || 0,
                c2_3: Number(document.getElementById('c2_3').value) || 0,
                c2_4: Number(document.getElementById('c2_4').value) || 0,

                nguoi_thuc_hien: user.ten_hien_thi,
                thoi_gian: serverTimestamp()
            });

            alert("Ghi nhận nhiệt độ thành công!");
            
            // Chỉ xóa các ô nhiệt độ, giữ nguyên Mã Lô, Ngày, Số lượng để nhập giờ tiếp theo cho nhanh
            document.getElementById('c1_1').value = ''; document.getElementById('c1_2').value = '';
            document.getElementById('c1_3').value = ''; document.getElementById('c1_4').value = '';
            document.getElementById('c2_1').value = ''; document.getElementById('c2_2').value = '';
            document.getElementById('c2_3').value = ''; document.getElementById('c2_4').value = '';

            // Tải lại biểu đồ
            loadLichSuVaBieuDo(document.getElementById('ngayDotLo').value);
            
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi khi lưu!");
        } finally {
            btn.disabled = false;
        }
    });
}
