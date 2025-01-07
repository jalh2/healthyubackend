const mongoose = require('mongoose')
const crypto = require('crypto')

const Schema = mongoose.Schema

// Encryption settings
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || ''); // 32 bytes key
const IV_LENGTH = 16;

// Helper function to validate key length
function validateKey() {
  if (ENCRYPTION_KEY.length !== 32) {
    throw Error(`Encryption key must be exactly 32 characters long (current length: ${ENCRYPTION_KEY.length})`);
  }
}

function encrypt(text) {
  if (!text) throw Error('Text to encrypt cannot be empty');
  validateKey();

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) throw Error('Text to decrypt cannot be empty');
  validateKey();
  
  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) throw Error('Invalid encrypted text format');

  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const employeeSchema = new Schema({
  userType: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'registrar', 'cashier', 'lab', 'doctor', 'eye-doctor']
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true })

// static signup method
employeeSchema.statics.signup = async function(employeeData) {
  const { userType, password } = employeeData

  // validation
  if (!userType || !password) {
    throw Error('All fields must be filled')
  }

  // validate userType
  if (!['admin', 'registrar', 'cashier', 'lab', 'doctor', 'eye-doctor'].includes(userType)) {
    throw Error('Invalid user type')
  }

  const exists = await this.findOne({ userType })
  if (exists) {
    throw Error('This user type already exists')
  }

  const encryptedPassword = encrypt(password)

  const employee = await this.create({ 
    userType,
    password: encryptedPassword
  })

  return employee
}

// static login method
employeeSchema.statics.login = async function(userType, password) {
  if (!userType || !password) {
    throw Error('All fields must be filled')
  }

  const employee = await this.findOne({ userType })
  if (!employee) {
    throw Error('Invalid user type')
  }

  try {
    const decryptedPassword = decrypt(employee.password)
    if (decryptedPassword !== password) {
      throw Error('Incorrect password')
    }
  } catch (error) {
    throw Error('Incorrect password')
  }

  return employee
}

module.exports = mongoose.model('Employee', employeeSchema)
