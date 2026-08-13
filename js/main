
import { db, auth } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Dummy: Xử lý hiển thị lời chào theo giờ
const hour = new Date().getHours();
const greetingEl = document.getElementById('dailyGreeting');
if(hour < 11) greetingEl.innerText = "Chào buổi sáng năng lượng! 🌞";
else if (hour < 14) greetingEl.innerText = "Chào buổi trưa! Nghỉ ngơi ăn uống đầy đủ nhé 🍲";
else if (hour < 18) greetingEl.innerText = "Chào buổi chiều! Cố gắng hoàn thành công việc nha 💪";
else greetingEl.innerText = "Chào buổi tối! 🌙";

// Xử lý sự kiện điểm danh
document.getElementById('btnCheckIn').addEventListener('click', async () => {
    const statusEl = document.getElementById('checkInStatus');
    statusEl.innerText = "Đang ghi nhận...";
    
    try {
        // Lưu dữ liệu vào Firestore collection 'diem_danh'
        // Tạm thời hardcode UID nhân viên, sau này ghép Auth sẽ lấy từ auth.currentUser.uid
        await addDoc(collection(db, "diem_danh"), {
            nhan_vien_id: "nv_001",
            nhan_vien_ten: "Nguyễn Văn A",
            thoi_gian: serverTimestamp(),
            loai: "nhan_ca"
        });
        
        statusEl.innerHTML = `<span class="text-success fw-bold">✔️ Nhận ca thành công lúc ${new Date().toLocaleTimeString('vi-VN')}</span>`;
        document.getElementById('btnCheckIn').disabled = true;
        document.getElementById('btnCheckIn').classList.replace('btn-success', 'btn-secondary');
    } catch (e) {
        console.error("Lỗi điểm danh: ", e);
        statusEl.innerHTML = `<span class="text-danger">❌ Có lỗi xảy ra. Vui lòng thử lại.</span>`;
    }
});
