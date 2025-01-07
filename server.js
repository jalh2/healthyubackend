require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

// import routes
const patientRoutes = require('./routes/patientRoute')
const employeeRoutes = require('./routes/employeeRoute')

const app = express()

// middleware
app.use(express.json())
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use((req, res, next) => {
  console.log(req.path, req.method)
  next()
})

// routes
app.use('/api/patients', patientRoutes)
app.use('/api/employee', employeeRoutes)

// connect to db
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    // listen for requests
    app.listen(process.env.PORT, () => {
      console.log('Connected to DB & listening on port', process.env.PORT)
    })
  })
  .catch((error) => {
    console.log(error)
  })
