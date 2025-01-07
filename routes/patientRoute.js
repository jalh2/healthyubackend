const express = require('express')
const {
  registerPatient,
  getPatient,
  getPatients,
  updatePatient,
  updateLabData,
  addProgressNote,
  updatePayment,
  getPatientByFormNumber,
  updateDoctorNotes,
  updateLabTests,
  updatePrescription,
  updateLabResults,
  getPatientBasicInfo,
  createNewVisit,
  updateVisit
} = require('../controllers/patientController')

const router = express.Router()

// Register a new patient
router.post('/', registerPatient)

// Get all patients
router.get('/', getPatients)

// Get patient by form number (this must come before /:id)
router.get('/form/:formNumber', getPatientByFormNumber)

// Get a single patient
router.get('/:id', getPatient)

// Get patient basic info (for pre-filling form)
router.get('/:id/basic-info', getPatientBasicInfo)

// Update a patient
router.put('/:id', updatePatient)
router.patch('/:id', updatePatient)

// Create a new visit for existing patient
router.post('/:id/visit', createNewVisit)

// Update lab data
router.post('/:id/visits/:visitId/lab-results', updateLabResults)
router.post('/:id/lab-tests', updateLabTests)
router.patch('/:id/lab', updateLabData)

// Add progress note
router.post('/:id/progress', addProgressNote)

// Update payment for a specific visit
router.put('/:id/visits/:visitId/payment', updatePayment)

// Update doctor notes for a specific visit
router.put('/:id/visits/:visitId/doctor-notes', updateDoctorNotes)

// Update laboratory data for a specific visit
router.patch('/:id/visits/:visitId/laboratory', updateLabData)

// Update prescription
router.post('/:id/prescription', updatePrescription)

// Update a specific visit
router.put('/:id/visits/:visitId', updateVisit)

module.exports = router
