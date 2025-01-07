const Employee = require('../models/employeeModel')
const jwt = require('jsonwebtoken')

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: '3d' })
}

// Login employee
const loginEmployee = async (req, res) => {
  const { userType, password } = req.body

  try {
    const employee = await Employee.login(userType, password)
    const token = createToken(employee._id)

    res.status(200).json({ 
      userType,
      token
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Signup employee
const signupEmployee = async (req, res) => {
  try {
    const employee = await Employee.signup(req.body)
    const token = createToken(employee._id)

    res.status(201).json({ 
      userType: employee.userType,
      token
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  loginEmployee,
  signupEmployee
}
