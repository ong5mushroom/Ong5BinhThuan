import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, doc, setDoc, getDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Phân quyền
const userStr = localStorage.getItem('currentUser');
if (!userStr) window.location.href = 'login.html';
const user = JSON.parse(userStr);

const nhatKyRef = collection(db, "nhat_ky_kho");
const tonKhoRef = collection(db, "kho_vat_tu");
const danhMucRef = collection(db, "danh_muc");

// 1. TẢI DANH MỤC VẬT TƯ CHO MENU DROPDOWN
async function loadDanhMucVatTu() {
    const selectVatTu = document.getElementById('tenVatTu');
    try {
        const q = query(danhMucRef, where("loai", "==", "vat_tu"));
        const snapshot = await getDocs(q);
        
        selectVatTu.innerHTML = '<option value="">-- Chọn vật tư --</option>';
        if (snapshot.empty) {
            selectVatTu.innerHTML = '<option value="">Giám đốc chưa tạo mã vật tư nào!</option>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            selectVatTu.innerHTML += `<option value="${data.ten}">${data.ten}</option>`;
        });
    } catch (error) {
        console.error("Lỗi tải danh mục:", error);
    }
}

// 2. TẢI BẢNG TỒN KHO HIỆN TẠI
async function loadTonKho() {
    const bangTonKho = document.getElementById('bangTonKho');
    bangTonKho.innerHTML = '';

    try {
        const querySnapshot = await getDocs(tonKhoRef);
        if (querySnapshot.empty) {
            bangTonKho.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Kho đang trống.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            bangTonKho.innerHTML += `
                <tr>
                    <td class="text-secondary small">${docSnap.id}</td>
                    <td class="fw-bold">${data.ten_vat_tu}</td>
                    <td class="fw-bold text-success h5 mb-0">${data.so_ton_kho}</td>
                    <td>${data.don_vi}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Lỗi:", error);
        bangTonKho.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Lỗi tải kho.</td></tr>';
    }
}

// 3. XỬ LÝ LƯU PHIẾU NHẬP/XUẤT
const formKho = document.getElementById('formKho');
if (formKho) {
    document.getElementById('ngayThucHien').value = new Date().toLocaleDateString('en-CA');

    formKho.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnLuu = document.getElementById('btnLuuPhieu');
        btnLuu.disabled = true;
        btnLuu.innerText = "Đang xử lý...";

        const loaiPhieu = document.getElementById('loaiPhieu').value;
        const tenVatTu = document.getElementById('tenVatTu').value;
        const soLuong = Number(document.getElementById('soLuong').value);
        const donVi = document.getElementById('donVi').value;
        const ngayThucHien = document.getElementById('ngayThucHien').value;
        
        if (!tenVatTu) {
            alert("Vui lòng chọn vật tư!");
            btnLuu.disabled = false;
            btnLuu.innerText = "Lưu Phiếu";
            return;
        }

        // Tạo ID chuẩn hóa (Không dấu, bỏ khoảng trắng) để quản lý tồn kho
        const vatTuId = tenVatTu.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').toLowerCase();

        try {
            // 1. Lưu vào Nhật ký kho
            await addDoc(nhatKyRef, {
                loai_phieu: loaiPhieu,
                ngay_thuc_hien: ngayThucHien,
                ten_vat_tu: tenVatTu,
                so_luong: soLuong,
                don_vi: donVi,
                ghi_chu: document.getElementById('ghiChuKho').value.trim(),
                nguoi_thuc_hien: user.ten_hien_thi,
                thoi_gian: serverTimestamp()
            });

            // 2. Cập nhật Tồn kho
            const tonKhoDoc = doc(db, "kho_vat_tu", vatTuId);
            const tonKhoSnap = await getDoc(tonKhoDoc);
            
            let soTonMoi = soLuong;
            if (tonKhoSnap.exists()) {
                const soTonHienTai = tonKhoSnap.data().so_ton_kho;
                soTonMoi = loaiPhieu === "nhap" ? soTonHienTai + soLuong : soTonHienTai - soLuong;
            } else if (loaiPhieu === "xuat") {
                alert("Lỗi: Không thể xuất vật tư chưa có trong kho!");
                btnLuu.disabled = false;
                btnLuu.innerText = "Lưu Phiếu";
                return;
            }

            await setDoc(tonKhoDoc, {
                ten_vat_tu: tenVatTu,
                so_ton_kho: soTonMoi,
                don_vi: donVi,
                cap_nhat_cuoi: serverTimestamp()
            }, { merge: true });

            alert(`Lưu phiếu ${loaiPhieu === 'nhap' ? 'NHẬP' : 'XUẤT'} thành công!`);
            document.getElementById('soLuong').value = '';
            document.getElementById('ghiChuKho').value = '';
            loadTonKho();
            
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi xảy ra khi lưu phiếu!");
        } finally {
            btnLuu.disabled = false;
            btnLuu.innerText = "Lưu Phiếu";
        }
    });
}

// Chạy tải dữ liệu khi khởi tạo
window.addEventListener('DOMContentLoaded', () => {
    loadDanhMucVatTu();
    loadTonKho();
});
