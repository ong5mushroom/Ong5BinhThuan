import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Lấy thông tin user đăng nhập
const userStr = localStorage.getItem('currentUser');
if (!userStr) window.location.href = 'login.html';
const user = JSON.parse(userStr);

// 1. LOGIC LIÊN KẾT VẬT TƯ XUẤT KHO
const inputNgay = document.getElementById('ngayDotLo');
const khuVucHienThi = document.getElementById('bangVatTuXuatNgay');

async function taiVatTuLienKet(ngayChon) {
    if (!khuVucHienThi) return;
    khuVucHienThi.innerHTML = '<li class="list-group-item bg-transparent text-muted px-0">Đang quét dữ liệu kho...</li>';
    
    try {
        const q = query(
            collection(db, "nhat_ky_kho"), 
            where("loai_phieu", "==", "xuat"),
            where("ngay_thuc_hien", "==", ngayChon) 
        );
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

// Chạy tự động lấy ngày hiện tại (Định dạng YYYY-MM-DD)
if (inputNgay) {
    const today = new Date().toLocaleDateString('en-CA');
    inputNgay.value = today;
    taiVatTuLienKet(today);
    
    inputNgay.addEventListener('change', (e) => {
        taiVatTuLienKet(e.target.value);
    });
}

// 2. LƯU MẺ ĐỐT LÒ
const formDotLo = document.getElementById('formDotLo');
if (formDotLo) {
    formDotLo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnLuuDotLo');
        btn.disabled = true;

        try {
            await addDoc(collection(db, "nhat_ky_dot_lo"), {
                me_lo: document.getElementById('meLo') ? document.getElementById('meLo').value.trim() : "Không rõ",
                ngay_dot: document.getElementById('ngayDotLo').value,
                so_luong_phoi: Number(document.getElementById('soLuongPhoi').value),
                nguoi_thuc_hien: user.ten_hien_thi, // Ai đăng nhập thì ghi tên người đó
                ma_nv: user.ma_nv,
                thoi_gian: serverTimestamp()
            });
            alert("Lưu mẻ lò thành công!");
            formDotLo.reset();
            inputNgay.value = new Date().toLocaleDateString('en-CA');
            taiVatTuLienKet(inputNgay.value);
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi khi lưu!");
        } finally {
            btn.disabled = false;
        }
    });
}
