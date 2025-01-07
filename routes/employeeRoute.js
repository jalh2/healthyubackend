const express = require('express')
const {
  loginEmployee,
  signupEmployee
} = require('../controllers/employeeController')

const router = express.Router()

// Login route
router.post('/login', loginEmployee)

// Signup route
router.post('/signup', signupEmployee)

module.exports = router
