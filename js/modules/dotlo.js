import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. Phân quyền
const userStr = localStorage.getItem('currentUser');
if (!userStr) window.location.href = 'login.html';
const user = JSON.parse(userStr);
if (user.vai_tro === 'admin') {
    const navQuanTri = document.getElementById('navQuanTri');
    if(navQuanTri) navQuanTri.style.display = 'block';
}

const inputNgay = document.getElementById('ngayDotLo');
const inputMaLo = document.getElementById('maLo');
const inputSoLuong = document.getElementById('soLuong');
const inputThoiTiet = document.getElementById('thoiTiet');
const inputLoaiCui = document.getElementById('loaiCui');
const btnKetThucMe = document.getElementById('btnKetThucMe');
let chartInstance = null;

// --- TÍNH NĂNG KHÓA MẺ HẤP ---
function thietLapTrangThaiMeHop(isLocked, data = null) {
    if (isLocked && data) {
        inputMaLo.value = data.maLo;
        inputSoLuong.value = data.soLuong;
        inputThoiTiet.value = data.thoiTiet;
        inputLoaiCui.value = data.loaiCui;

        // Chuyển sang chế độ chỉ đọc và làm mờ nền
        inputMaLo.readOnly = true; inputMaLo.classList.add('bg-light');
        inputSoLuong.readOnly = true; inputSoLuong.classList.add('bg-light');
        inputThoiTiet.readOnly = true; inputThoiTiet.classList.add('bg-light');
        inputLoaiCui.readOnly = true; inputLoaiCui.classList.add('bg-light');
        
        btnKetThucMe.classList.remove('d-none');
    } else {
        // Xóa trắng để nhập mẻ mới
        inputMaLo.value = '';
        inputSoLuong.value = '';
        inputThoiTiet.value = '';
        inputLoaiCui.value = '';

        inputMaLo.readOnly = false; inputMaLo.classList.remove('bg-light');
        inputSoLuong.readOnly = false; inputSoLuong.classList.remove('bg-light');
        inputThoiTiet.readOnly = false; inputThoiTiet.classList.remove('bg-light');
        inputLoaiCui.readOnly = false; inputLoaiCui.classList.remove('bg-light');
        
        btnKetThucMe.classList.add('d-none');
    }
}

// Kiểm tra khi vừa mở trang web xem có mẻ nào đang hấp dở không
const meDangDo = JSON.parse(localStorage.getItem('ongoingBatch_DotLo'));
thietLapTrangThaiMeHop(!!meDangDo, meDangDo);

// Xử lý nút Kết thúc mẻ
if (btnKetThucMe) {
    btnKetThucMe.addEventListener('click', () => {
        if(confirm("Xác nhận KẾT THÚC mẻ hấp này? Các thông tin chung sẽ được làm mới.")) {
            localStorage.removeItem('ongoingBatch_DotLo');
            thietLapTrangThaiMeHop(false);
        }
    });
}
// -----------------------------

// 2. HÀM TẢI LỊCH SỬ & BIỂU ĐỒ
async function loadLichSuVaBieuDo(ngayChon) {
    const bang = document.getElementById('bangLichSuNhietDo');
    if (!bang) return;

    try {
        const q = query(collection(db, "nhat_ky_dot_lo"), where("ngay_dot", "==", ngayChon));
        const snapshot = await getDocs(q);

        let bangDuLieu = [];
        snapshot.forEach(doc => { bangDuLieu.push(doc.data()); });

        bangDuLieu.sort((a, b) => {
            const timeA = a.thoi_gian ? a.thoi_gian.toMillis() : 0;
            const timeB = b.thoi_gian ? b.thoi_gian.toMillis() : 0;
            return timeA - timeB;
        });

        bang.innerHTML = '';
        let labelsGio = [];
        let dataCont1 = [];
        let dataCont2 = [];

        if(bangDuLieu.length === 0) {
            bang.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có dữ liệu nhiệt độ trong ngày này.</td></tr>';
        } else {
            bangDuLieu.forEach(d => {
                let gioGhi = "N/A";
                if(d.thoi_gian) {
                    const dateObj = d.thoi_gian.toDate();
                    gioGhi = dateObj.getHours() + ":" + String(dateObj.getMinutes()).padStart(2, '0');
                }

                let tbC1 = (d.c1_1 + d.c1_2 + d.c1_3 + d.c1_4) / 4 || 0;
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

        const ctx = document.getElementById('bieuDoNhietDo');
        if(ctx) {
            if(chartInstance) chartInstance.destroy();
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labelsGio,
                    datasets: [
                        { label: 'TB Cont 1 (°C)', data: dataCont1, borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.1)', borderWidth: 2, tension: 0.3, fill: true },
                        { label: 'TB Cont 2 (°C)', data: dataCont2, borderColor: '#ffc107', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderWidth: 2, tension: 0.3, fill: true }
                    ]
                },
                options: { responsive: true, scales: { y: { beginAtZero: false } } }
            });
        }
    } catch(e) { 
        console.error("Lỗi:", e); 
        bang.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu.</td></tr>';
    }
}

if (inputNgay) {
    const today = new Date().toLocaleDateString('en-CA');
    if(!inputNgay.value) inputNgay.value = today; // Chỉ set mặc định nếu trống
    loadLichSuVaBieuDo(inputNgay.value);
    inputNgay.addEventListener('change', (e) => { loadLichSuVaBieuDo(e.target.value); });
}

// 3. LƯU GHI NHẬN NHIỆT ĐỘ
const formDotLo = document.getElementById('formDotLo');
if (formDotLo) {
    formDotLo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnLuuDotLo');
        btn.disabled = true;
        btn.innerText = "Đang lưu...";

        const thongTinMe = {
            maLo: inputMaLo.value.trim(),
            soLuong: Number(inputSoLuong.value),
            thoiTiet: inputThoiTiet.value.trim(),
            loaiCui: inputLoaiCui.value.trim()
        };

        try {
            await addDoc(collection(db, "nhat_ky_dot_lo"), {
                ngay_dot: inputNgay.value,
                ma_lo: thongTinMe.maLo,
                so_luong: thongTinMe.soLuong,
                thoi_tiet: thongTinMe.thoiTiet,
                loai_cui: thongTinMe.loaiCui,
                
                c1_1: Number(document.getElementById('c1_1').value) || 0,
                c1_2: Number(document.getElementById('c1_2').value) || 0,
                c1_3: Number(document.getElementById('c1_3').value) || 0,
                c1_4: Number(document.getElementById('c1_4').value) || 0,

                c2_1: Number(document.getElementById('c2_1').value) || 0,
                c2_2: Number(document.getElementById('c2_2').value) || 0,
                c2_3: Number(document.getElementById('c2_3').value) || 0,
                c2_4: Number(document.getElementById('c2_4').value) || 0,

                nguoi_thuc_hien: user.ten_hien_thi,
                thoi_gian: serverTimestamp()
            });

            // Ghi nhớ mẻ hiện tại vào máy
            localStorage.setItem('ongoingBatch_DotLo', JSON.stringify(thongTinMe));
            thietLapTrangThaiMeHop(true, thongTinMe);

            alert("Ghi nhận nhiệt độ thành công!");
            
            // Xóa trắng đồng hồ
            for(let i=1; i<=4; i++) {
                document.getElementById(`c1_${i}`).value = '';
                document.getElementById(`c2_${i}`).value = '';
            }

            loadLichSuVaBieuDo(inputNgay.value);
            
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi khi lưu!");
        } finally {
            btn.disabled = false;
            btn.innerText = "Ghi Nhận Nhiệt Độ";
        }
    });
}
