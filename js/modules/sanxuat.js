import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const sanXuatRef = collection(db, "san_xuat_log");

// Hàm tải lịch sử sản xuất
async function loadLichSuSanXuat() {
    const bangSanXuat = document.getElementById('bangSanXuat');
    bangSanXuat.innerHTML = '';

    try {
        // Lấy dữ liệu sắp xếp theo thời gian mới nhất
        const q = query(sanXuatRef, orderBy("thoi_gian", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            bangSanXuat.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Chưa có dữ liệu sản xuất.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const date = data.thoi_gian ? data.thoi_gian.toDate().toLocaleDateString('vi-VN') : 'N/A';
            
            // Cảnh báo nếu tỷ lệ hư hỏng > 5%
            const tyLeHuClass = data.tyle_hu > 5 ? 'text-danger fw-bold' : 'text-success';

            bangSanXuat.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td class="fw-bold">${data.loai_nam}</td>
                    <td>${data.tong_phoi}</td>
                    <td class="text-success fw-bold">${data.phoi_dat}</td>
                    <td class="text-danger">${data.phoi_hu}</td>
                    <td class="${tyLeHuClass}">${data.tyle_hu.toFixed(2)}%</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu sản xuất: ", error);
        bangSanXuat.innerHTML = '<tr><td colspan="6" class="text-danger">Lỗi kết nối cơ sở dữ liệu.</td></tr>';
    }
}

// Xử lý lưu lô mới
document.getElementById('formSanXuat').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnLuu = document.getElementById('btnLuuLo');
    btnLuu.disabled = true;
    btnLuu.innerText = "Đang lưu...";

    const loaiNam = document.getElementById('loaiNam').value;
    const tongPhoi = parseInt(document.getElementById('tongPhoi').value);
    const phoiDat = parseInt(document.getElementById('phoiDat').value);
    const phoiHu = parseInt(document.getElementById('phoiHu').value);
    const phoiTanDung = parseInt(document.getElementById('phoiTanDung').value);

    // Kiểm tra logic cơ bản
    if (phoiDat + phoiHu + phoiTanDung !== tongPhoi) {
        alert("Lỗi: Tổng số phôi Đạt + Hư + Tận dụng phải bằng Tổng số phôi thực hiện!");
        btnLuu.disabled = false;
        btnLuu.innerText = "Lưu & Tính tỷ lệ";
        return;
    }

    // Tính tỷ lệ hư hỏng
    const tyLeHu = (phoiHu / tongPhoi) * 100;

    try {
        await addDoc(sanXuatRef, {
            loai_nam: loaiNam,
            tong_phoi: tongPhoi,
            phoi_dat: phoiDat,
            phoi_hu: phoiHu,
            phoi_tan_dung: phoiTanDung,
            tyle_hu: tyLeHu,
            nguoi_thuc_hien: "nv_001", // Tạm gán
            thoi_gian: serverTimestamp()
        });

        alert(`Lưu thành công! Tỷ lệ hư hỏng của lô này là ${tyLeHu.toFixed(2)}%`);
        document.getElementById('formSanXuat').reset();
        
        // Tải lại bảng ngay lập tức
        loadLichSuSanXuat();

    } catch (error) {
        console.error("Lỗi khi lưu: ", error);
        alert("Có lỗi xảy ra, không thể lưu.");
    } finally {
        btnLuu.disabled = false;
        btnLuu.innerText = "Lưu & Tính tỷ lệ";
    }
});

// Chạy hàm load khi mở trang
window.onload = loadLichSuSanXuat;
