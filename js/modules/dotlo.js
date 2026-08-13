import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const dotLoRef = collection(db, "nhat_ky_dot_lo");
let chartNhietDo; // Biến lưu trữ biểu đồ

// Hàm vẽ/cập nhật biểu đồ
async function loadBieuDo() {
    try {
        // Lấy 10 lần cập nhật gần nhất
        const q = query(dotLoRef, orderBy("thoi_gian", "desc"), limit(12));
        const querySnapshot = await getDocs(q);
        
        const labels = [];
        const dataCont1 = [];
        const dataCont2 = [];

        // Đọc dữ liệu (do order desc nên cần đảo ngược lại mảng để vẽ từ cũ -> mới)
        const reversedDocs = [];
        querySnapshot.forEach((doc) => reversedDocs.unshift(doc));

        reversedDocs.forEach((docSnap) => {
            const data = docSnap.data();
            
            // Lấy giờ:phút
            const timeString = data.thoi_gian ? data.thoi_gian.toDate().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '';
            labels.push(timeString);
            
            // Tính trung bình 4 đồng hồ cho mỗi Cont
            const tbC1 = (data.c1_1 + data.c1_2 + data.c1_3 + data.c1_4) / 4;
            const tbC2 = (data.c2_1 + data.c2_2 + data.c2_3 + data.c2_4) / 4;
            
            dataCont1.push(tbC1);
            dataCont2.push(tbC2);
        });

        // Cấu hình Chart.js
        const ctx = document.getElementById('bieuDoNhietDo').getContext('2d');
        
        // Hủy biểu đồ cũ nếu đã tồn tại để vẽ lại
        if (chartNhietDo) {
            chartNhietDo.destroy();
        }

        chartNhietDo = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Trung bình Cont 1 (°C)',
                        data: dataCont1,
                        borderColor: '#0d6efd', // Màu xanh dương
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Trung bình Cont 2 (°C)',
                        data: dataCont2,
                        borderColor: '#ffc107', // Màu vàng
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        suggestedMin: 80, // Nhiệt độ thanh trùng thường cao
                        suggestedMax: 105
                    }
                }
            }
        });

    } catch (error) {
        console.error("Lỗi khi tải biểu đồ: ", error);
    }
}

// Xử lý Ghi nhận nhiệt độ
document.getElementById('formDotLo').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnLuu = document.getElementById('btnLuuNhietDo');
    btnLuu.disabled = true;
    btnLuu.innerText = "Đang ghi...";

    // Thu thập dữ liệu
    const logData = {
        thoi_tiet: document.getElementById('thoiTiet').value,
        cui_dot: document.getElementById('cuiDot').value,
        c1_1: Number(document.getElementById('c1_1').value),
        c1_2: Number(document.getElementById('c1_2').value),
        c1_3: Number(document.getElementById('c1_3').value),
        c1_4: Number(document.getElementById('c1_4').value),
        c2_1: Number(document.getElementById('c2_1').value),
        c2_2: Number(document.getElementById('c2_2').value),
        c2_3: Number(document.getElementById('c2_3').value),
        c2_4: Number(document.getElementById('c2_4').value),
        nguoi_thuc_hien: "nv_001",
        thoi_gian: serverTimestamp()
    };

    try {
        await addDoc(dotLoRef, logData);
        document.getElementById('formDotLo').reset();
        loadBieuDo(); // Vẽ lại biểu đồ ngay lập tức
    } catch (error) {
        console.error("Lỗi khi lưu nhiệt độ: ", error);
        alert("Lưu thất bại. Vui lòng thử lại!");
    } finally {
        btnLuu.disabled = false;
        btnLuu.innerText = "Ghi Nhận Nhiệt Độ";
    }
});

// Khởi tạo
window.onload = loadBieuDo;
