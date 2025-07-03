// export const verificationEmailTemplate = (verificationLink) => `
//   <div style="font-family: Arial, sans-serif; text-align: center;">
//     <h1 style="color: #4CAF50;">Verify Your Email</h1>
//     <p>Click the button below to verify your email and complete your registration.</p>
//     <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Verify Email</a>
//     <p style="margin-top: 20px;">If the button above doesn't work, paste this link into your browser: <br> ${verificationLink}</p>
//   </div>
// `;

export const verificationEmailTemplate = (verificationLink) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 0;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <!-- Header with gradient background -->
      <tr>
        <td style="background: linear-gradient(135deg,rgba(255, 166, 0, 0.91),rgba(255, 140, 0, 0.96)); padding: 20px; text-align: center;">
          <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562821/Asset_2_msrd1v.png" alt="SHOPCART Logo" style="width: 100px; max-width: 100%;">
        </td>
      </tr>
      <!-- Body content -->
      <tr>
        <td style="padding: 40px;">
          <h1 style="color: #333; font-size: 26px; margin-bottom: 20px; text-align: center;">Verify Your Email</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.5; text-align: center;">
            Welcome to YourStore! To complete your registration, please verify your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 30px;">
            <a href="${verificationLink}" style="background-color: #FF8C00; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 24px; font-size: 18px; display: inline-block;">
              <strong>Verify Email</strong>
            </a>
          </div>
          <p style="color: #777; font-size: 14px; text-align: center;">
            If the button doesn't work, copy and paste the link below into your browser:
          </p>
          <p style="color: #000; font-size: 14px; text-align: center; word-break: break-all;">
            <a href="${verificationLink}" style="color: #FF8C00; text-decoration: none;">${verificationLink}</a>
          </p>
        </td>
      </tr>
      <!-- Social Links -->
      <tr>
        <td style="background-color: #f0f0f0; padding: 20px; text-align: center;">
          <p style="font-size: 14px; color: #555; margin-bottom: 10px;">Connect with us</p>
          <p>
            <a href="https://facebook.com/yourstore" style="margin: 0 10px; text-decoration: none;">
              <img src="https://img.icons8.com/ios-filled/50/FFA500/facebook-new.png" alt="Facebook" style="width: 30px; height: 30px;">
            </a>
            <a href="https://twitter.com/yourstore" style="margin: 0 10px; text-decoration: none;">
              <img src="https://img.icons8.com/ios-filled/50/FFA500/twitter.png" alt="Twitter" style="width: 30px; height: 30px;">
            </a>
            <a href="https://instagram.com/yourstore" style="margin: 0 10px; text-decoration: none;">
              <img src="https://img.icons8.com/ios-filled/50/FFA500/instagram-new.png" alt="Instagram" style="width: 30px; height: 30px;">
            </a>
          </p>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>&copy; ${new Date().getFullYear()} SHOPCART. All rights reserved.</p>
          <p>
            <a href="https://yourstore.com/privacy" style="color: #FF8C00; text-decoration: none;">Privacy Policy</a> |
            <a href="https://yourstore.com/terms" style="color: #FF8C00; text-decoration: none;">Terms of Service</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
`;



export const otpEmailTemplate = (otp, name) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h1 style="color: #4CAF50;">New OTP for the Shop Owner (${name})</h1>
    <p>The following OTP has been generated for a verified shop owner:</p>
    <h2 style="color: #333;">${otp}</h2>
    <p>Please notify the shop owner securely.</p>
  </div>
`;

export const encryptCodeTemplate = (encryptCode, name) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Format</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #333;
            width: 100%;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #fffffff8;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        .email-header,
        .email-footer {
            text-align: center;
            margin: 20px 0;
        }

        .email-header img {
            max-width: 50px;
            margin-bottom: 5px;
        }

        .email-header div {
            font-size: 25px;
            font-weight: bold;
            color: rgb(245, 98, 1);
        }

        .email-content {
            padding: 10px;
            text-align: center;
        }

        .email-content h1 {
            font-size: 27px;
            color: #000;
            margin: 10px 0;
        }

        .email-content p {
            font-size: 14px;
            color: #555;
            line-height: 1.5;
        }

        .verification-section,
        .security-section {
            display: table;
            width: 100%;
            margin: 10px 0;
        }

        .verification-section .text,
        .verification-section .image,
        .security-section .text,
        .security-section .image {
            display: table-cell;
            vertical-align: middle;
            padding: 10px;
        }

        .verification-section .image img,
        .security-section .image img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
        }

        .security-code-section {
            text-align: center;
            margin: 20px 0;
        }

        .security-code-section input {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 2px;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            width: 80%;
            max-width: 300px;
            margin-bottom: 10px;
        }

        .security-code-section p {
            font-size: 14px;
            color: #555;
        }

        .responsibility-section {
            background-color: #e6f3ff;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin-top: 40px;
            margin-bottom: 40px;
        }

        .responsibility-section img {
            max-width: 120px;
            height: auto;
            margin-bottom: 20px;
        }

        .responsibility-section h2 {
            font-size: 18px;
            color: #000;
            margin: 10px 0;
            font-weight: bold;
        }

        .responsibility-section p {
            font-size: 14px;
            color: #333;
            line-height: 1.6;
            margin: 5px 0;
        }

        .email-footer img {
            max-width: 40px;
            margin-bottom: 10px;
            margin-top: 10px;
        }

        hr {
            border: none;
            height: 1px;
            background-color: #a1a1a1b6;
        }

        @media only screen and (max-width: 600px) {
            .verification-section,
            .security-section {
                display: block;
            }

            .verification-section .text,
            .security-section .text {
                display: block;
                text-align: center;
                width: 100%;
            }

            .security-section .image,
            .verification-section .image {
                display: block;
                margin: 0 auto;
                width: 50%;
            }

            .security-code-section input {
                width: 100%;
            }
        }
    </style>
</head>
<body>

    <!-- Email Wrapper -->
    <div style="padding: 40px 0;">

        <!-- Email Container -->
        <div class="email-container">

            <!-- Header -->
            <div class="email-header">
                <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562821/Asset_2_msrd1v.png" alt="SHOPCART Logo">
                <div>SHOPCART</div>
            </div>

            <!-- Main Content -->
            <div class="email-content">
                <h1>Hey ${name}, and welcome on board! 🎉</h1>
                <p>Ready to embark on a new chapter in your life? Our strategic system simplifies <strong>Growth</strong>, empowering you to scale effortlessly 🙌</p>
            </div>
            <hr>
            <!-- Verification Section -->
            <div class="verification-section">
                <!-- Left Text Section -->
                <div class="text" style="text-align: left;">
                    <h2>Verify Your Account</h2>
                    <p>We have sent you a <span style="color: rgb(245, 98, 1); font-weight: bold;">security key</span> in this email. Remember to pin this email so you can access it easily during login.</p>
                </div>
                <!-- Right Image Section -->
                <div class="image">
                    <img src="https://github.com/ShopGocart/gocart-images/blob/main/email/test01.png?raw=true" alt="Verify Illustration">
                </div>
            </div>

            <!-- Security Code Section -->
            <div class="security-code-section">
                <input type="text" value="${encryptCode}" readonly>
                <p>Copy the above code and use it during login.</p>
            </div>
            <hr>
            <!-- Security Section -->
            <div class="security-section">
                <!-- Image -->
                <div class="image">
                    <img src="https://github.com/ShopGocart/gocart-images/blob/main/email/test02.png?raw=true" alt="Security Illustration">
                </div>
                <!-- Text -->
                <div class="text" style="text-align: left;">
                    <h2>Your Dashboard is Secured!</h2>
                    <p style="font-size: 12px; color: #555; margin: 5px 0 3px;">
                        Our standard security framework will ensure that your dashboard is protected.
                    </p>
                    <p style="font-size: 12px; color: #555; margin: 5px 0 3px;">
                        If you detect any suspicious activities, feel free to reach us. Make sure to block your own account if you have received an OTP without attempting to login.
                    </p>
                    <p style="font-size: 12px; color: #555; margin: 5px 0 3px;">
                        Most importantly, enter credentials correctly to avoid getting locked.
                    </p>
                    <a href="#" style="display: inline-block; background-color: rgb(245, 98, 1); color: white; text-decoration: none; padding: 10px 20px; margin: 10px 0; border-radius: 5px; font-size: 14px; font-weight: bold;">Contact Security Team</a>
                </div>
            </div>
            <hr>
            <!-- Responsibility Section -->
            <div class="responsibility-section">
                <img src="https://github.com/ShopGocart/gocart-images/blob/main/email/test04.jpg?raw=true" alt="Responsibility Illustration">
                <h2>BUT it’s your responsibility too….</h2>
                <p>Make sure 2FA verification is <strong>turned on</strong> and also avoid giving or sharing your email and password with anyone as we value security over anything.</p>
            </div>
            <hr>
            <!-- Footer -->
            <div class="email-footer">
                <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562821/Asset_2_msrd1v.png" alt="SHOPCART Logo">
                <div>SHOPCART Sri Lanka</div>
                <div style="font-size: 12px; color: #666;">&copy; shopcartit 2024. All rights reserved.</div>
            </div>
        </div>
    </div>

</body>
</html>
`;

export const otpEmailTemplateLogin = (otp, name, blockLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            padding: 10px 20px;
        }

        .email-header,
        .email-footer {
            text-align: center;
            margin: 20px 0;
        }

        .email-header{
            border-bottom: 1px solid #e0e0e0;
        }

        .email-header img {
            max-width: 50px;
            margin-bottom: 5px;
        }

        .email-header div {
            font-size: 25px;
            font-weight: bold;
            color: rgb(245, 98, 1);
            margin-bottom: 20px;
        }

        .email-footer img {
            max-width: 40px;
            margin-bottom: 10px;
            margin-top: 10px;
        }

        .email-content {
            padding: 20px;
            text-align: center;
        }

        .email-content h2 {
            font-size: 18px;
            margin: 20px 0;
        }

        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #000000;
            background-color: #f1f1f1;
            padding: 10px 50px;
            border-radius: 5px;
            display: inline-block;
            letter-spacing: 5px;
            margin: 20px 0;
        }

        .email-content p {
            color: #666666;
            margin: 10px 0;
            font-size: 14px;
        }

        .security-section {
            display: table;
            width: 100%;
            margin: 10px 0;
        }

        .security-section .text,
        .security-section .image {
            display: table-cell;
            vertical-align: middle;
        }

        .security-section .text {
            text-align: left;
        }

        .security-section .image img {
            max-width: 90%;
            height: auto;
            border-radius: 8px;
        }

        .cta-button {
            display: inline-block;
            text-align: center;
            text-decoration: none;
            background-color: rgb(245, 98, 1);
            color: #ffffff;
            font-size: 16px;
            font-weight: bold;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 10px;
        }

        .email-footer {
            background-color: #ffffff;
            text-align: center;
            padding: 20px 0;
            margin-top: 20px;
            border-top: 1px solid #ddd;
        }

        .email-footer img {
            max-width: 40px;
            margin-bottom: 10px;
        }

        .email-footer div {
            font-size: 16px;
            font-weight: bold;
            color: #000;
        }

        .email-footer span {
            font-size: 12px;
            color: #666;
        }

        hr {
            border: none;
            height: 1px;
            background-color: #a1a1a1b6;
            margin-bottom: 40px;
        }

        @media only screen and (max-width: 600px) {
            .security-section {
                display: block;
            }

            .security-section .text {
                display: block;
                text-align: center;
                width: 100%;
            }

            .security-section .image {
                display: block;
                margin: 40px auto 40px auto;
                width: 90%;
            }
        }
    </style>
</head>
<body>

    <!-- Email Container -->
    <div class="email-container">

        <!-- Header -->
        <div class="email-header">
            <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562821/Asset_2_msrd1v.png" alt="Logo">
            <div>SHOPCART</div>
        </div>

        <!-- Main Content -->
        <div class="email-content">
            <h2>Hey ${name}, refer to the OTP you requested...!</h2>
            <p>Use the code below to log in to your account.</p>
            <div class="otp-code">${otp}</div>
            <p>The code expires in 5 minutes. <span style="font-size: 16px; margin-left: 5px;">⏳</span></p>
        </div>
        <hr>
        <!-- Security Section -->
        <div class="security-section">
            <!-- Left Text Section -->
            <div class="text">
                <h2>Not you tried to login...?</h2>
                <p>We value the security of your dashboard more than anything. If you have received this code without attempting to log in, click the button below to <span style="color: #f57c00; font-weight: bold;">block your account</span>.</p>
                <a href="${blockLink}" class="cta-button">Not me!</a>
            </div>
            <!-- Right Image Section -->
            <div class="image">
                <img src="https://github.com/ShopGocart/gocart-images/blob/main/email/test05.png?raw=true" alt="Security Illustration">
            </div>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562821/Asset_2_msrd1v.png" alt="SHOPCART Logo">
            <div>SHOPCART Sri Lanka</div>
            <div style="font-size: 12px; color: #666;">&copy; shopcartit 2024. All rights reserved.</div>
        </div>

    </div>

</body>
</html>
`;

export const blockAccountTemplateLogin = (storeid, name, phone, email, storename, address, blockLink) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h1 style="color: #4CAF50;">Suspicious activity detected for Store ID: ${storeid}</h1>
    <h2 style="color: #333;">Store Details</h2>
    <p>Store Name: ${storename}</p>
    <p>Store Owner Name: ${name}</p>
    <p>Address: ${address}</p>
    <p>Phone: ${phone}</p>
    <p>Email: ${email}</p>
    <p></p>
    <p>The account has been locked after 3 failed attempts.</p>
    <a href="${blockLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Block Account</a>
    <p style="margin-top: 20px;">If the button above doesn't work, paste this link into your browser: <br> ${blockLink}</p>
  </div>
`;

export const yourAccountBlockedTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; text-align: center;">
    <h1 style="color: #4CAF50;">Hi ${name}</h1>
    <p>Your Account is Blocked</p>
  </div>
`;