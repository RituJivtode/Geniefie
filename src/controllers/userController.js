const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt");
const validator = require("../middleware/validation")
const nodemailer = require('nodemailer');


// Function to generate a random OTP
const generateOTP = () => {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};
console.log(generateOTP)

// Function to send the OTP to the user's email
const sendOTP = async (email, OTP) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email, // The user's email address
      subject: 'OTP Verification',
      text: `Your OTP for verification is: ${OTP}`,
    };
    console.log(mailOptions)

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
      } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send OTP via email.');
      }
    };

const createUser = async function(req, res) {
    try {

        let body = req.body
        if (!validator.isValidRequestBody(body)) {
            return res.status(400).send({ Status: false, message: " Sorry Body can't be empty" })
        }

        const { fname, lname, email, password, phone, otp } = body

        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, msg: "First name is required" })
        }
        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, msg: " Last name is required" })
        }
        // Email is Mandatory...
        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, msg: "Email is required" })
        };
        // For a Valid Email...
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, message: 'Email should be a valid' })
        };

        // Email is Unique...
        let duplicateEmail = await userModel.findOne({ email: body.email })
        if (duplicateEmail) {
            return res.status(400).send({ status: false, msg: 'Email already exist' })
        };

        // Email is Mandatory...
        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, msg: "Password is required" })
        };
        // password Number is Valid...
        let Passwordregex = /^[A-Z0-9a-z]{1}[A-Za-z0-9.@#$&]{7,14}$/
        if (!Passwordregex.test(password)) {
            return res.status(401).send({ Status: false, message: " Please enter a valid password, minlength 8, maxxlength 15" })
        }
        //generate salt to hash password
        const salt = await bcrypt.genSalt(10);
        // now we set user password to hashed password
        passwordValue = await bcrypt.hash(password, salt);

        // phone Number is Mandatory...
        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, msg: 'phone number is required' })
        };
        // phone Number is Valid...
        let Phoneregex = /^[6-9]{1}[0-9]{9}$/

        if (!Phoneregex.test(phone)) {
            return res.status(400).send({ Status: false, message: "Please enter a valid phone number" })
        }
        // phone Number is Unique...
        let duplicateMobile = await userModel.findOne({ phone: phone })
        if (duplicateMobile) {
            return res.status(400).send({ status: false, msg: 'phone number already exist' })
        };
        // Generate OTP
    const OTP = generateOTP();

    // Send OTP to the user's email
    await sendOTP(email, OTP);

        let filterBody = { fname: fname, lname: lname, email: email, password: passwordValue, phone: phone, otp: OTP }
    
        let userCreated = await userModel.create(filterBody)
        res.status(201).send({ status: true, msg: "user created successfully", data: userCreated })

    } catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }
}

const login = async function(req, res) {
    try {

        let body = req.body

        if (!validator.isValidRequestBody(body)) {
            return res.status(400).send({ Status: false, message: " Sorry Body can't be empty" })
        }

        const { email, otp } = body

        //****------------------- Email validation -------------------****** //

        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, msg: "Email is required" })
        };

        // For a Valid Email...
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            return res.status(400).send({ status: false, message: ' Email should be a valid' })
        };

        //******------------------- checking User Detail -------------------****** //

        let checkUser = await userModel.findOne({ email: email });

        if (!checkUser) {
            return res.status(401).send({ Status: false, message: "email is not correct" });
        }
        if (otp !== checkUser.otp) {
            return res.status(401).json({ message: 'Invalid OTP.' });
          }

          // Mark email as verified and remove the OTP
          checkUser.isEmailVerified = true;
          checkUser.otp = undefined;
          await checkUser.save();

        let userToken = jwt.sign({UserId: checkUser._id}, process.env.JWT_SECRET,{ expiresIn: '86400s' }); // token expiry for 24hrs

        return res.status(200).send({ status: true, message: "User login successfully", data: { userData: checkUser, authToken: userToken } });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { createUser, login }