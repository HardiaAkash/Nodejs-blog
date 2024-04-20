const User = require("../Model/User")
const bcrypt = require('bcrypt');
const { generateToken} = require("../Utils/jwt");
const { HttpStatus, StatusMessage } = require("../Utils/systemMsg");

exports.addUser = async (req, res) => {
    try {
      const { name, email, password} = req.body;
  
      if (!name || !email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json(StatusMessage.MISSING_DATA);
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const userData = new User({ name, email, password: hashedPassword });
  
      const result = await userData.save();
  
      console.log(result); // Log the result for debugging, avoid exposing in production
  
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error(error); // Log the error for debugging, avoid exposing in production
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email === 1) {
        return res.status(HttpStatus.BAD_REQUEST).json(StatusMessage.DUPLICATE_EMAIL);
      }
      return res.status(HttpStatus.SERVER_ERROR).json(StatusMessage.SERVER_ERROR);
    }
  };

  exports.userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: StatusMessage.INVALID_EMAIL_PASSWORD });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: StatusMessage.USER_NOT_FOUND });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (isPasswordMatch) {
            const token = generateToken({ email: user.email });  // Using email for the token
            
            await User.findByIdAndUpdate(user._id, { activeToken: token });
            return res.status(HttpStatus.OK).json({
                message: `Welcome back, ${user.email}`,  // Personalized welcome message using email
                token,
                userID: user._id
            });
        } else {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: StatusMessage.INVALID_CREDENTIALS });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(HttpStatus.SERVER_ERROR).json({ message: StatusMessage.SERVER_ERROR });
    }
};

exports.userLogout = async (req, res) => {
    try {
        const userId = req.user._id;  // Assuming req.user is populated from the token when authenticated

        const user = await User.findById(userId);
        if (!user || !user.activeToken) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: StatusMessage.NOT_LOGGED_IN });
        }

        // Clear the active token in the database
        await User.findByIdAndUpdate(userId, { activeToken: null });

        return res.status(HttpStatus.OK).json({ message: StatusMessage.LOGOUT_SUCCESS });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(HttpStatus.SERVER_ERROR).json({ message: StatusMessage.SERVER_ERROR });
    }
};