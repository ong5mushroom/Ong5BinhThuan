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

const sanXuatRef = collection(db, "san_xuat_log");
const danhMucRef = collection(db, "danh_muc");

// Tải Danh mục Loại Nấm (Sản phẩm)
async function loadDanhMucSanPham() {
    const selectLoaiNam = document.getElementById('loaiNam');
    try {
        const q = query(danhMucRef, where("loai", "==", "san_pham"));
        const snapshot = await getDocs(q);
        
        selectLoaiNam.innerHTML = '<option value="">-- Chọn Loại nấm --</option>';
        if (snapshot.empty) {
            selectLoaiNam.innerHTML = '<option value="">Chưa có danh mục Loại Nấm!</option>';
            return;
        }

        snapshot.forEach(doc => {
            selectLoaiNam.innerHTML += `<option value="${doc.data().ten}">${doc.data().ten}</option>`;
        });
    } catch (error) {
        console.error("Lỗi tải danh mục:", error);
    }
}

// Tải lịch sử Sản xuất
async function loadLichSuSanXuat() {
    const bang = document.getElementById('bangSanXuat');
    bang.innerHTML = '';

    try {
        const q = query(sanXuatRef, orderBy("thoi_gian", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            bang.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có lịch sử sản xuất.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const dateStr = data.thoi_gian ? data.thoi_gian.toDate().toLocaleDateString('vi-VN') : '';
            
            let colorTiLe = "text-success";
            if (data.tyle_hu > 5 && data.tyle_hu <= 10) colorTiLe = "text-warning";
            if (data.tyle_hu > 10) colorTiLe = "text-danger fw-bold";

            bang.innerHTML += `
                <tr>
                    <td class="small text-muted">${dateStr}</td>
                    <td class="fw-bold">${data.loai_nam}</td>
                    <td><b>${data.tong_phoi}</b> bịch</td>
                    <td class="${colorTiLe}">${data.tyle_hu.toFixed(2)}%</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Lỗi:", error);
        bang.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Lỗi kết nối cơ sở dữ liệu.</td></tr>';
    }
}

// Xử lý Ghi nhận Sản xuất
const formSanXuat = document.getElementById('formSanXuat');
if (formSanXuat) {
    formSanXuat.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnLuu = document.getElementById('btnLuuSanXuat');
        btnLuu.disabled = true;
        btnLuu.innerText = "Đang lưu...";

        const tongPhoi = Number(document.getElementById('tongPhoi').value);
        const phoiDat = Number(document.getElementById('phoiDat').value);
        const phoiHu = Number(document.getElementById('phoiHu').value);
        const phoiTanDung = Number(document.getElementById('phoiTanDung').value);
        const loaiNam = document.getElementById('loaiNam').value;

        if (!loaiNam) {
            alert("Vui lòng chọn loại nấm!");
            btnLuu.disabled = false;
            btnLuu.innerText = "Lưu Nhật Ký";
            return;
        }

        if (phoiDat + phoiHu + phoiTanDung !== tongPhoi) {
            alert("Lỗi: Tổng phôi Đạt + Hư + Tận dụng phải bằng Tổng phôi làm ra!");
            btnLuu.disabled = false;
            btnLuu.innerText = "Lưu Nhật Ký";
            return;
        }

        const tyleHu = (phoiHu / tongPhoi) * 100;

        try {
            await addDoc(sanXuatRef, {
                loai_nam: loaiNam,
                tong_phoi: tongPhoi,
                phoi_dat: phoiDat,
                phoi_hu: phoiHu,
                phoi_tan_dung: phoiTanDung,
                tyle_hu: tyleHu,
                nguoi_thuc_hien: user.ten_hien_thi,
                thoi_gian: serverTimestamp()
            });
            formSanXuat.reset();
            loadLichSuSanXuat();
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi xảy ra khi lưu!");
        } finally {
            btnLuu.disabled = false;
            btnLuu.innerText = "Lưu Nhật Ký";
        }
    });
}

// Chạy hàm khi mở trang
window.addEventListener('DOMContentLoaded', () => {
    loadDanhMucSanPham();
    loadLichSuSanXuat();
});
