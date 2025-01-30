const mongoose = require('mongoose')
const Schema = mongoose.Schema

const paymentSchema = new Schema({
  LRD: { type: Number, default: 0 },
  USD: { type: Number, default: 0 },
  percentagePaid: { type: Number, default: 0 },
  totalAmount: {
    LRD: { type: Number, default: 0 },
    USD: { type: Number, default: 0 }
  },
  paid: { type: Boolean, default: false },
  partialPayment: { type: Boolean, default: false },
  lastPaymentDate: { type: Date }
});

const visitSchema = new Schema({
  visitDate: {
    type: Date,
    default: Date.now
  },
  formNumber: {
    type: String,
    required: true
  },
  isEyeDoctor: {
    type: Boolean,
  },
  eyeDoctorData: {
    notes: String,
    medication: String,
    glasses: String
  },
  vitals: {
    temperature: {
      type: Number
    },
    bloodPressure: {
      type: String
    },
    respiration: {
      type: Number
    },
    pulse: {
      type: Number
    },
    pregnancy: {
      type: Boolean,
      default: false
    }
  },
  symptomsA: {
    fever: { type: Boolean, default: false },
    nausea: { type: Boolean, default: false },
    vomiting: { type: Boolean, default: false },
    wateryDiarrhea: { type: Boolean, default: false },
    bloodyDiarrhea: { type: Boolean, default: false },
    redEyes: { type: Boolean, default: false },
    difficultyBreathing: { type: Boolean, default: false },
    boneMusclepain: { type: Boolean, default: false },
    lossOfAppetite: { type: Boolean, default: false },
    weakness: { type: Boolean, default: false },
    abdominalPain: { type: Boolean, default: false },
    difficultySwallowing: { type: Boolean, default: false }
  },
  laboratoryData: {
    ward: String,
    hospitalNo: String,
    orderedBy: String,

    hematologyLab: { type: Boolean, default: false },
    serologyLab: { type: Boolean, default: false },
    urineTestStripLab: { type: Boolean, default: false },
    urineMicroscopyLab: { type: Boolean, default: false },
    wbcCbcLab: { type: Boolean, default: false },
    bloodChemistryLab: { type: Boolean, default: false },
    csfTestMeningitisLab: { type: Boolean, default: false },
    therapy: { type: Boolean, default: false },
    ultraSound: { type: Boolean, default: false },
    xRay: { type: Boolean, default: false },
    shortStay: { type: Boolean, default: false },
    minorSurgery: { type: Boolean, default: false },
    bodyScan: { type: Boolean, default: false },
   
    hematology: {
      hemoglobin: Number,  // Hb(g/dl)
      hematocrit: Number,  // Hct(%)
      ms: String,          // M/S
      wbc: Number,         // WBC(/mm3)
      bloodType: String,
      rh: String,
      sickleCellPrep: String,
      esr: Number,         // ESR(mm/hr)
      syphilis: String
    },

    serology: {
      widal: String,
      vctPict: String,
      hepatitisBC: String
    },

    urineTestStrip: {
      appearance: String,
      color: String,
      nitrite: String,
      blood: String,
      urobilinogen: String,
      ketones: String,
      protein: String,
      glucose: String,
      ph: Number,
      specificGravity: Number,
      leucocyte: String,
      leucocytes: String
    },

    urineMicroscopy: {
      wbc: String,
      rbc: String,
      epithCells: String,
      parasite: String,
      crystals: String,
      casts: String
    },

    wbcCbc: {
      poly: Number,
      lymph: Number,
      mono: Number,
      eosi: Number,
      baso: Number,
      rcMorph: String
    },

    bloodChemistry: {
      creatinine: Number,
      randomGlucose: Number,    // mg/dl
      urea: Number,             // mg/dl
      fbs: Number,              // mg/dl
      cpk: Number,              // Ul
      amylase: Number,          // Ul
      totalBilirubin: Number,   // mg/dl
      prostphosp: Number,       // Ul
      cholesterol: Number,      // mg/dl
      directBilirubin: Number,  // mg/dl
      gammaGt: Number,          // Ul
      potassium: Number,        // mg/dl
      gotAst: Number,           // mg/dl
      grpAlt: Number,           // Ul
      uricAcid: Number,         // mg/dl
      alkphosp: Number,         // mg/dl
      totalProtein: Number,     // mg/dl
      triglycerides: Number,    // mg/dl
      calcium: Number           // mg/dl
    },

    csfTestMeningitis: {
      protein: String,
      glucose: String,
      pandyTest: String,
      wbc: String,
      leucocytes: String
    }
  },
  payments: {
    registration: paymentSchema,
    laboratory: paymentSchema,
    medication: paymentSchema
  },
  medicalNotes: {
    doctorNote: String,
    prescription: String
  },
  progress: {
    type: String,
    default: "Registration complete - awaiting cashier",
    enum: [
      "Registration complete - awaiting cashier",
      "Registration payment completed",
      "Registration payment partial",
      "Laboratory tests ordered",
      "Laboratory payment completed",
      "Laboratory payment partial",
      "Laboratory tests completed",
      "Doctor consultation completed",
      "Doctor prescription updated - awaiting medical payment",
      "Medication payment completed",
      "Medication payment partial",
      "Treatment completed"
    ]
  }
}, { timestamps: true })

const patientSchema = new Schema({
  // Basic Information
  formNumber: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  sex: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  address: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  visits: [visitSchema]
}, { timestamps: true })

module.exports = mongoose.model('Patient', patientSchema)
