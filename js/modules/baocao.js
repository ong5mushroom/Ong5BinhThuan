import { db } from '../firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Tiện ích: Tạo tên file kèm ngày giờ hiện tại
function generateFileName(prefix) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('vi-VN').replace(/\//g, '-');
    return `${prefix}_${dateStr}.xlsx`;
}

// Hàm dùng chung để xuất Excel
function xuatFileExcel(dataArray, columnWidths, fileName, sheetName) {
    if(dataArray.length === 0) {
        alert("Không có dữ liệu để xuất báo cáo!");
        return;
    }
    const ws = XLSX.utils.json_to_sheet(dataArray);
    ws['!cols'] = columnWidths; // Căn chỉnh độ rộng cột
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
}

// 1. XUẤT CHẤM CÔNG
document.getElementById('btnXuatChamCong').addEventListener('click', async (e) => {
    const btn = e.target;
    btn.innerText = "Đang xử lý...";
    try {
        const q = query(collection(db, "diem_danh"), orderBy("thoi_gian", "desc"));
        const snapshot = await getDocs(q);
        const exportData = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const timeObj = data.thoi_gian ? data.thoi_gian.toDate() : new Date();
            exportData.push({
                "Mã NV": data.nhan_vien_id || "",
                "Họ và Tên": data.nhan_vien_ten || "",
                "Ngày": timeObj.toLocaleDateString('vi-VN'),
                "Giờ": timeObj.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}),
                "Trạng Thái": data.loai === "nhan_ca" ? "Nhận ca" : "Kết ca"
            });
        });

        const widths = [{ wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
        xuatFileExcel(exportData, widths, generateFileName("BaoCao_ChamCong"), "Cham Cong");
    } catch (error) {
        console.error(error); alert("Lỗi kết xuất Chấm công!");
    } finally { btn.innerText = "📥 Xuất Excel Chấm Công"; }
});

// 2. XUẤT TỒN KHO
document.getElementById('btnXuatTonKho').addEventListener('click', async (e) => {
    const btn = e.target;
    btn.innerText = "Đang xử lý...";
    try {
        const snapshot = await getDocs(collection(db, "kho_vat_tu"));
        const exportData = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            exportData.push({
                "Mã Vật Tư": data.ma_vat_tu || doc.id,
                "Tên Vật Tư": data.ten_vat_tu || "",
                "Đơn Vị Tính": data.don_vi || "",
                "Số Lượng Tồn": data.so_ton_kho || 0
            });
        });

        const widths = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
        xuatFileExcel(exportData, widths, generateFileName("BaoCao_TonKho"), "Ton Kho");
    } catch (error) {
        console.error(error); alert("Lỗi kết xuất Kho!");
    } finally { btn.innerText = "📥 Xuất Excel Tồn Kho"; }
});

// 3. XUẤT SẢN XUẤT
document.getElementById('btnXuatSanXuat').addEventListener('click', async (e) => {
    const btn = e.target;
    btn.innerText = "Đang xử lý...";
    try {
        const q = query(collection(db, "san_xuat_log"), orderBy("thoi_gian", "desc"));
        const snapshot = await getDocs(q);
        const exportData = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const timeObj = data.thoi_gian ? data.thoi_gian.toDate() : new Date();
            exportData.push({
                "Ngày Sản Xuất": timeObj.toLocaleDateString('vi-VN'),
                "Loại Nấm": data.loai_nam || "",
                "Tổng Phôi (bịch)": data.tong_phoi || 0,
                "Phôi Đạt": data.phoi_dat || 0,
                "Phôi Hư Hỏng": data.phoi_hu || 0,
                "Phôi Tận Dụng": data.phoi_tan_dung || 0,
                "Tỷ Lệ Hư (%)": data.tyle_hu ? data.tyle_hu.toFixed(2) : 0
            });
        });

        const widths = [{ wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        xuatFileExcel(exportData, widths, generateFileName("BaoCao_SanXuat"), "San Xuat");
    } catch (error) {
        console.error(error); alert("Lỗi kết xuất Sản xuất!");
    } finally { btn.innerText = "📥 Xuất Excel Sản Xuất"; }
});
