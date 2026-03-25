const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Kết nối Cơ sở dữ liệu (Database)
mongoose.connect('mongodb://localhost:27017/chat-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Đã kết nối Database thành công!"))
  .catch(err => console.error("Lỗi kết nối DB:", err));

// Định nghĩa cấu trúc tin nhắn để lưu vào máy
const MessageSchema = new mongoose.Schema({
    user: String,
    content: String,
    time: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Chức năng: Xem lịch sử tin nhắn (Read)
app.get('/messages', async (req, res) => {
    const messages = await Message.find().sort({time: 1});
    res.json(messages);
});

// Chức năng: Xóa tin nhắn (Delete)
app.delete('/messages/:id', async (req, res) => {
    await Message.findByIdAndDelete(req.params.id);
    res.json({status: "Đã xóa tin nhắn"});
});

// Chức năng: Chat thời gian thực (Real-time)
io.on('connection', (socket) => {
    socket.on('chatMessage', async (data) => {
        const newMessage = new Message(data);
        await newMessage.save(); // Thêm vào Database
        io.emit('message', { ...data, _id: newMessage._id }); // Gửi cho mọi người dùng
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));