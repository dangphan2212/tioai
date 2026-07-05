require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Cho phép mở HTML, CSS, JS
app.use(express.static(__dirname));

// Lưu OTP tạm thời
const otpStore = {};

// Gmail
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// Gửi OTP
app.post("/send-otp", async (req, res) => {

    const { email } = req.body;

    if (!email)
        return res.json({ success: false, message: "Thiếu email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
        otp,
        expires: Date.now() + 5 * 60 * 1000
    };

    try {

        await transporter.sendMail({
            from: process.env.GMAIL_EMAIL,
            to: email,
            subject: "Mã OTP",
            html: `
                <h2>Mã OTP của bạn</h2>
                <h1>${otp}</h1>
                <p>Mã có hiệu lực 5 phút.</p>
            `
        });

        res.json({
            success: true,
            message: "Đã gửi OTP"
        });

    } catch (err) {

        console.log(err);

        res.json({
            success: false,
            message: "Gửi email thất bại"
        });

    }

});

// Kiểm tra OTP
app.post("/verify-otp", (req, res) => {

    const { email, otp } = req.body;

    const data = otpStore[email];

    if (!data)
        return res.json({ success: false });

    if (Date.now() > data.expires)
        return res.json({
            success: false,
            message: "OTP hết hạn"
        });

    if (data.otp !== otp)
        return res.json({
            success: false,
            message: "OTP sai"
        });

    delete otpStore[email];

    res.json({
        success: true,
        message: "OTP đúng"
    });

});

app.listen(process.env.PORT || 3000, () => {

    console.log("Server chạy: http://localhost:3000");

});