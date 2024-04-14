const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(bodyParser.json());

let authorisedUsers = [];

mongoose.connect('mongodb://localhost:27017/securechat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  publicKey: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  encryptedKeys: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    encryptedKey: { type: String, required: true }
  }]
});

const Message = mongoose.model('Message', messageSchema);

function encryptWithSymmetricKey(text, symmetricKey) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', symmetricKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const encryptedWithIv = iv.toString('hex') + ':' + encrypted;
  
  return encryptedWithIv;
}

function encryptWithPublicKey(publicKey, text) {
  const buffer = Buffer.from(text, 'utf8');
  const encrypted = crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
  }, buffer);
  return encrypted.toString('base64');
}


app.post('/messages', async (req, res) => {
  try {
    
    const { username, text } = req.body;

    
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    const symmetricKey = crypto.randomBytes(32);

    
    const encryptedMessage = encryptWithSymmetricKey(text, symmetricKey);

    const authorizedUserIdsArray = authorisedUsers

    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    const authorizedUsers = await User.find({
      '_id': { 
        $in: authorizedUserIdsArray.filter(isValidObjectId).map(id => new mongoose.Types.ObjectId(id))
      }
    });

    const encryptedKeys = authorizedUsers.map(user => {
      return {
        userId: user._id,
        encryptedKey: encryptWithPublicKey(user.publicKey, symmetricKey.toString('base64')),
      };
    });

    const newMessage = new Message({
      text: encryptedMessage,
      author: user._id,
      encryptedKeys: encryptedKeys,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message posted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/messages', async (req, res) => {
  try {
    
    let username = req.query.userId;

    const correctUser = await User.findOne(
      { username: username },
    ).lean()

    const userId = correctUser._id

    const messages = await Message.find()
      .populate('author', 'username')
      .lean();

    const formattedMessages = messages.map(message => {
      const userEncryptedKey = message.encryptedKeys.find(key => key.userId.equals(userId));
      return {
        ...message,
        canDecrypt: !!userEncryptedKey,
        encryptedKey: userEncryptedKey ? userEncryptedKey.encryptedKey : undefined,
      };
    });

    res.json(formattedMessages);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/newuser', async (req, res) => {
  try {
    const { username } = req.body

    const correctUser = await User.findOne(
      { username: username },
    ).lean()

    const userId = correctUser._id

    authorisedUsers.push(userId)

    console.log({authorisedUsers})
    res.json(userId)
  }
  catch {
    res.status(500).send('Internal server error');
  }
})

app.post('/register', async (req, res) => {
  try {
    const { username, password, publicKey } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword, publicKey });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
