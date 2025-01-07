const Patient = require('../models/patientModel')
const mongoose = require('mongoose')

// Register a new patient
const registerPatient = async (req, res) => {
  const { 
    firstName, lastName, age, sex, address, contactNumber,
    formNumber, vitals, symptomsA, isEyeDoctor 
  } = req.body

  try {
    // Check required fields
    if (!firstName || !lastName || !age || !sex || !address || !contactNumber || !formNumber) {
      throw Error('Please fill in all required fields')
    }

    // Check if form number already exists
    const exists = await Patient.findOne({ formNumber })
    if (exists) {
      throw Error('Form number already in use')
    }

    // Create patient with initial visit data
    const patient = await Patient.create({
      formNumber,
      firstName,
      lastName,
      age,
      sex,
      address,
      contactNumber,
      visits: [{
        visitDate: new Date(),
        formNumber,
        vitals: vitals || {},
        symptomsA: symptomsA || {},
        isEyeDoctor: isEyeDoctor
      }]
    })

    res.status(201).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Get a single patient
const getPatient = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such patient' })
  }

  const patient = await Patient.findById(id)

  if (!patient) {
    return res.status(404).json({ error: 'No such patient' })
  }

  res.status(200).json(patient)
}

// Get patient by form number
const getPatientByFormNumber = async (req, res) => {
  const { formNumber } = req.params

  try {
    const patient = await Patient.findOne({ formNumber })
    if (!patient) {
      return res.status(404).json({ error: 'No such patient' })
    }
    res.status(200).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Get all patients
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({}).sort({ createdAt: -1 })
    res.status(200).json(patients)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Update patient basic info
const updatePatient = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such patient' })
  }

  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: id },
      { ...req.body },
      { new: true }
    )

    if (!patient) {
      return res.status(404).json({ error: 'No such patient' })
    }

    res.status(200).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Update laboratory data
const updateLabData = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such patient' })
  }

  try {
    const patient = await Patient.findById(id)
    if (!patient) {
      return res.status(404).json({ error: 'No such patient' })
    }

    patient.laboratoryData = {
      ...patient.laboratoryData,
      ...req.body
    }

    await patient.save()
    res.status(200).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Add progress note
const addProgressNote = async (req, res) => {
  const { id } = req.params
  const { note, updatedBy } = req.body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such patient' })
  }

  try {
    const patient = await Patient.findById(id)
    if (!patient) {
      return res.status(404).json({ error: 'No such patient' })
    }

    patient.progress.push({
      date: new Date(),
      note,
      updatedBy
    })

    await patient.save()
    res.status(200).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Update payment for a specific visit
const updatePayment = async (req, res) => {
  const { id, visitId } = req.params;
  const { type, LRD, USD, totalAmount, percentagePaid } = req.body;

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const visitIndex = patient.visits.findIndex(visit => visit._id.toString() === visitId);
    if (visitIndex === -1) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const visit = patient.visits[visitIndex];
    const payment = visit.payments[type];
    const currentPercentage = payment.percentagePaid || 0;
    const remainingPercentage = 100 - currentPercentage;

    // Don't allow updates if payment is already complete
    if (currentPercentage >= 100) {
      return res.status(400).json({ 
        error: 'Payment is already complete. No further updates allowed.' 
      });
    }

    // Validate the new percentage payment
    if (percentagePaid > remainingPercentage) {
      return res.status(400).json({ 
        error: `Invalid percentage. Only ${remainingPercentage}% remaining to be paid.` 
      });
    }

    // Increment payment amounts
    if (LRD !== undefined) {
      payment.LRD = (payment.LRD || 0) + Number(LRD);
    }
    if (USD !== undefined) {
      payment.USD = (payment.USD || 0) + Number(USD);
    }
    
    // Update total amount if provided (don't increment this)
    if (totalAmount) {
      payment.totalAmount = {
        LRD: totalAmount.LRD || 0,
        USD: totalAmount.USD || 0
      };
    } else if (!payment.totalAmount) {
      // If no total amount exists, set it based on the first payment
      payment.totalAmount = {
        LRD: payment.LRD || 0,
        USD: payment.USD || 0
      };
    }

    // Increment percentage
    if (percentagePaid !== undefined) {
      const newTotalPercentage = currentPercentage + Number(percentagePaid);
      payment.percentagePaid = Math.min(100, newTotalPercentage);
    }

    // Update payment status
    payment.paid = payment.percentagePaid === 100;
    payment.partialPayment = payment.percentagePaid > 0 && payment.percentagePaid < 100;
    payment.lastPaymentDate = new Date();

    // Update visit progress based on payments
    if (type === 'registration') {
      if (payment.paid) {
        visit.progress = 'Registration payment completed';
      } else if (payment.partialPayment) {
        visit.progress = 'Registration payment partial';
      }
    } else if (type === 'laboratory') {
      if (payment.paid) {
        visit.progress = 'Laboratory payment completed';
      } else if (payment.partialPayment) {
        visit.progress = 'Laboratory payment partial';
      }
    } else if (type === 'medication') {
      if (payment.paid) {
        visit.progress = 'Medication payment completed';
      } else if (payment.partialPayment) {
        visit.progress = 'Medication payment partial';
      }
    }

    await patient.save();
    
    // Return the entire updated patient document
    const updatedPatient = await Patient.findById(id);
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update doctor notes for a specific visit
const updateDoctorNotes = async (req, res) => {
  const { id, visitId } = req.params;
  const { doctorNote, prescription } = req.body;

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const visitIndex = patient.visits.findIndex(visit => visit._id.toString() === visitId);
    if (visitIndex === -1) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Update the medical notes for the specific visit
    patient.visits[visitIndex].medicalNotes = {
      doctorNote,
      prescription
    };

    await patient.save();
    res.json(patient.visits[visitIndex]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update laboratory data for a specific visit
const updateLaboratoryData = async (req, res) => {
  const { id, visitId } = req.params;
  const { laboratoryData } = req.body;

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const visitIndex = patient.visits.findIndex(visit => visit._id.toString() === visitId);
    if (visitIndex === -1) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Update the laboratory data for the specific visit
    patient.visits[visitIndex].laboratoryData = {
      ...patient.visits[visitIndex].laboratoryData,
      ...laboratoryData
    };

    await patient.save();
    res.json(patient.visits[visitIndex]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update lab tests
const updateLabTests = async (req, res) => {
  const { id } = req.params;
  const { laboratoryData, progress } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such patient' });
  }

  try {
    const updateData = { laboratoryData };
    
    if (progress) {
      updateData.progress = progress;
    }

    const patient = await Patient.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'No such patient' });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update laboratory results
const updateLabResults = async (req, res) => {
  const { id, visitId } = req.params;
  const laboratoryData = req.body;

  try {
    console.log('Updating lab results:', {
      patientId: id,
      visitId,
      laboratoryData
    });

    // Find the patient first
    const patient = await Patient.findById(id);
    if (!patient) {
      console.error('Patient not found:', id);
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Find the visit
    if (!Array.isArray(patient.visits)) {
      console.error('Patient visits data is corrupted:', {
        patientId: id,
        visits: patient.visits
      });
      return res.status(500).json({ error: 'Patient visits data is corrupted' });
    }

    const visit = patient.visits.id(visitId);
    if (!visit) {
      console.error('Visit not found:', {
        patientId: id,
        visitId
      });
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Verify we got the right visit
    if (visit._id.toString() !== visitId) {
      console.error('Visit ID mismatch:', {
        patientId: id,
        visitId,
        foundVisitId: visit._id.toString()
      });
      return res.status(500).json({ error: 'Visit ID mismatch' });
    }

    // Initialize laboratoryData if it doesn't exist
    if (!visit.laboratoryData) {
      visit.laboratoryData = {};
    }

    // Update admin data
    visit.laboratoryData.ward = laboratoryData.ward ?? '';
    visit.laboratoryData.hospitalNo = laboratoryData.hospitalNo ?? '';
    visit.laboratoryData.orderedBy = laboratoryData.orderedBy ?? '';

    // Update lab test flags
    visit.laboratoryData.hematologyLab = laboratoryData.hematologyLab ?? false;
    visit.laboratoryData.serologyLab = laboratoryData.serologyLab ?? false;
    visit.laboratoryData.urineTestStripLab = laboratoryData.urineTestStripLab ?? false;
    visit.laboratoryData.urineMicroscopyLab = laboratoryData.urineMicroscopyLab ?? false;
    visit.laboratoryData.wbcCbcLab = laboratoryData.wbcCbcLab ?? false;
    visit.laboratoryData.bloodChemistryLab = laboratoryData.bloodChemistryLab ?? false;
    visit.laboratoryData.csfTestMeningitisLab = laboratoryData.csfTestMeningitisLab ?? false;
    visit.laboratoryData.therapy = laboratoryData.therapy ?? false;
    visit.laboratoryData.ultraSound = laboratoryData.ultraSound ?? false;
    visit.laboratoryData.xRay = laboratoryData.xRay ?? false;
    visit.laboratoryData.shortStay = laboratoryData.shortStay ?? false;
    visit.laboratoryData.minorSurgery = laboratoryData.minorSurgery ?? false;
    visit.laboratoryData.bodyScan = laboratoryData.bodyScan ?? false;

    // Update lab results data
    visit.laboratoryData = {
      ...visit.laboratoryData,
      ...laboratoryData
    };

    // Update progress status if any lab tests are ordered
    const hasLabTests = Object.keys(laboratoryData).some(key => 
      key.endsWith('Lab') && laboratoryData[key]
    );

    if (hasLabTests) {
      // Check if any lab test results are filled
      const hasLabResults = Object.keys(laboratoryData).some(key => 
        ['hematology', 'serology', 'urineTestStrip', 'urineMicroscopy', 'wbcCbc', 'bloodChemistry', 'csfTestMeningitis'].includes(key) &&
        Object.values(laboratoryData[key]).some(value => value !== '' && value !== 0)
      );

      if (hasLabResults) {
        visit.progress = 'Laboratory tests completed';
      } else {
        visit.progress = 'Laboratory tests ordered';
      }
    }

    try {
      // Validate the document before saving
      const validationError = patient.validateSync();
      if (validationError) {
        console.error('Validation error:', {
          patientId: id,
          visitId,
          error: validationError
        });
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validationError.errors 
        });
      }

      // Save the updated patient document
      await patient.save();
      console.log('Lab results updated successfully');
      res.json(patient);
    } catch (error) {
      console.error('Error saving patient:', {
        patientId: id,
        visitId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  } catch (error) {
    console.error('Error in updateLabResults:', {
      patientId: id,
      visitId,
      error: error.message,
      stack: error.stack
    });
    res.status(400).json({ error: error.message });
  }
};

// Update prescription
const updatePrescription = async (req, res) => {
  const { id } = req.params
  const { prescription } = req.body

  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: id },
      { 
        'medicalNotes.prescription': prescription,
        'progress': 'doctor prescriptions submitted - awaiting medication payment'
      },
      { new: true }
    )

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    res.status(200).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Update progress
const updateProgress = async (req, res) => {
  const { id } = req.params
  const { progress } = req.body

  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: id },
      { progress },
      { new: true }
    )

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }

    res.status(200).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Create a new visit for existing patient
const createNewVisit = async (req, res) => {
  const { id } = req.params
  const { formNumber, vitals, symptomsA, isEyeDoctor } = req.body

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'No such patient' })
    }

    if (!formNumber) {
      throw Error('Form number is required')
    }

    // Check if form number already exists in any visit
    const formNumberExists = await Patient.findOne({ 'visits.formNumber': formNumber })
    if (formNumberExists) {
      throw Error('Form number already in use')
    }

    const patient = await Patient.findById(id)
    if (!patient) {
      return res.status(404).json({ error: 'No such patient' })
    }

    patient.visits.push({
      visitDate: new Date(),
      formNumber,
      vitals: vitals || {},
      symptomsA: symptomsA || {},
      isEyeDoctor: isEyeDoctor
    })

    await patient.save()
    res.status(200).json(patient)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// Get a single patient with basic info
const getPatientBasicInfo = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such patient' })
  }

  const patient = await Patient.findById(id).select('firstName lastName age sex address contactNumber formNumber')
  
  if (!patient) {
    return res.status(404).json({ error: 'No such patient' })
  }

  res.status(200).json(patient)
}

// Update a specific visit
const updateVisit = async (req, res) => {
  const { id, visitId } = req.params;
  const updates = req.body;

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const visitIndex = patient.visits.findIndex(visit => visit._id.toString() === visitId);
    if (visitIndex === -1) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Update the specific visit
    Object.assign(patient.visits[visitIndex], updates);

    await patient.save();
    res.json(patient.visits[visitIndex]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  registerPatient,
  getPatient,
  getPatients,
  updatePatient,
  updateLabData: updateLaboratoryData,
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
}
