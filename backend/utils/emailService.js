const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

/**
 * Send attendance notification email
 * @param {Object} student - Student object
 * @param {Object} attendance - Attendance object
 */
const sendAttendanceEmail = async (student, attendance) => {
  try {
    if (!student.studentEmail) {
      console.log('No email address for student:', student.name);
      return;
    }

    const mailOptions = {
      from: `"Student Security System" <${process.env.EMAIL_USER}>`,
      to: student.studentEmail,
      subject: `Attendance Marked: ${student.name} - Present`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Attendance Confirmation</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hello <strong>${student.name}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.5; margin-bottom: 20px;">
              Your attendance has been successfully marked for today. Here are the details:
            </p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Student Name:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${student.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Reg. Number:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${student.studentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Section:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${student.section}</td>
                </tr>
                 <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Department:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${student.department}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Date:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${new Date().toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Time:</td>
                  <td style="padding: 8px 0; color: #111827; text-align: right;">${new Date().toLocaleTimeString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Status:</td>
                  <td style="padding: 8px 0; color: #059669; font-weight: bold; text-align: right;">PRESENT</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Marked By:</td>
                  <td style="padding: 8px 0; color: #4b5563; text-align: right;">RFID Tag</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; color: #888; margin-top: 30px; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">Student Security System &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Attendance email sent to:', student.studentEmail, 'Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending attendance email:', error);
    return false;
  }
};

module.exports = {
  sendAttendanceEmail
};
