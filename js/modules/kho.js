import { db } from '../firebase-config.js';
import { collection, getDocs, doc, updateDoc, addDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const khoRef = collection(db, "kho_vat_tu");
const giaoDichRef = collection(db, "kho_giao_dich");

// Hàm tải dữ liệu tồn kho lên bảng và lên thẻ Select trong Modal
async function loadKho() {
    const bangTonKho = document.getElementById('bangTonKho');
    const chonVatTu = document.getElementById('chonVatTu');
    
    bangTonKho.innerHTML = '';
    chonVatTu.innerHTML = '<option value="">-- Chọn vật tư --</option>';

    try {
        const querySnapshot = await getDocs(khoRef);
        if (querySnapshot.empty) {
            bangTonKho.innerHTML = '<tr><td colspan="4" class="text-center">Chưa có vật tư trong kho. Xin hãy thêm trên Firebase.</td></tr>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id; // Dùng Document ID của Firestore làm khóa

            // Render bảng
            bangTonKho.innerHTML += `
                <tr>
                    <td class="fw-bold text-secondary">${data.ma_vat_tu || docId}</td>
                    <td>${data.ten_vat_tu}</td>
                    <td>${data.don_vi}</td>
                    <td class="fw-bold fs-5 ${data.so_ton_kho < 10 ? 'text-danger' : 'text-success'}">${data.so_ton_kho}</td>
                </tr>
            `;

            // Render Dropdown Modal
            chonVatTu.innerHTML += `<option value="${docId}">${data.ten_vat_tu} (Tồn: ${data.so_ton_kho} ${data.don_vi})</option>`;
        });
    } catch (error) {
        console.error("Lỗi khi tải kho: ", error);
        bangTonKho.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Lỗi kết nối cơ sở dữ liệu.</td></tr>';
    }
}

// Xử lý Form Nhập / Xuất Kho
document.getElementById('formGiaoDich').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSubmit = document.getElementById('btnSubmitGiaoDich');
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Đang xử lý...";

    const loaiGiaoDich = document.getElementById('loaiGiaoDich').value;
    const vatTuId = document.getElementById('chonVatTu').value;
    const soLuong = parseFloat(document.getElementById('soLuong').value);
    const ghiChu = document.getElementById('ghiChu').value;

    try {
        // 1. Lấy số tồn hiện tại của vật tư đó
        const vatTuRef = doc(db, "kho_vat_tu", vatTuId);
        const vatTuSnap = await getDoc(vatTuRef);
        const tonHienTai = vatTuSnap.data().so_ton_kho;

        // 2. Tính toán số tồn mới
        let tonMoi = tonHienTai;
        if (loaiGiaoDich === 'nhap') {
            tonMoi = tonHienTai + soLuong;
        } else if (loaiGiaoDich === 'xuat') {
            if (soLuong > tonHienTai) {
                alert("Số lượng xuất vượt quá tồn kho!");
                btnSubmit.disabled = false;
                btnSubmit.innerText = "Xác nhận";
                return;
            }
            tonMoi = tonHienTai - soLuong;
        }

        // 3. Cập nhật số tồn mới vào bảng kho_vat_tu
        await updateDoc(vatTuRef, { so_ton_kho: tonMoi });

        // 4. Ghi lại lịch sử giao dịch vào bảng kho_giao_dich
        await addDoc(giaoDichRef, {
            vat_tu_id: vatTuId,
            ten_vat_tu: vatTuSnap.data().ten_vat_tu,
            loai_giao_dich: loaiGiaoDich,
            so_luong: soLuong,
            ton_cuoi: tonMoi,
            ghi_chu: ghiChu,
            nguoi_thuc_hien: "nv_001", // Tạm thời gán cứng, sau này tích hợp Auth sẽ lấy UID
            thoi_gian: serverTimestamp()
        });

        alert("Thao tác thành công!");
        document.getElementById('formGiaoDich').reset();
        
        // Đóng modal bootstrap
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalGiaoDich'));
        modal.hide();

        // Tải lại bảng dữ liệu
        loadKho();

    } catch (error) {
        console.error("Lỗi giao dịch: ", error);
        alert("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Xác nhận";
    }
});

// Khởi chạy khi load trang
window.onload = loadKho;
