const { body, validationResult, param, query } = require('express-validator');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Validations pour l'authentification
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validations pour les modèles
const validateCreateModel = [
  body('inputShape')
    .isArray({ min: 3, max: 3 })
    .withMessage('inputShape must be an array with 3 elements')
    .custom(value => {
      if (!value.every(v => Number.isInteger(v) && v > 0)) {
        throw new Error('All elements in inputShape must be positive integers');
      }
      return true;
    }),
  
  body('numClasses')
    .isInt({ min: 2, max: 1000 })
    .withMessage('numClasses must be between 2 and 1000'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  handleValidationErrors
];

// Validations pour les données
const validateUploadData = [
  body('datasetName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Dataset name must be between 1 and 100 characters'),
  
  handleValidationErrors
];

const validatePreprocessData = [
  body('normalization')
    .isIn(['minmax', 'zscore'])
    .withMessage('Normalization method must be either "minmax" or "zscore"'),
  
  handleValidationErrors
];

const validateAugmentData = [
  body('augmentationType')
    .isIn(['crop', 'rotation', 'flip'])
    .withMessage('Augmentation type must be crop, rotation, or flip'),
  
  body('params')
    .optional()
    .isObject()
    .withMessage('Params must be an object'),
  
  handleValidationErrors
];

const validateSplitData = [
  body('trainRatio')
    .isFloat({ min: 0.1, max: 0.9 })
    .withMessage('trainRatio must be between 0.1 and 0.9'),
  
  body('testRatio')
    .isFloat({ min: 0.1, max: 0.9 })
    .withMessage('testRatio must be between 0.1 and 0.9'),
  
  body('valRatio')
    .isFloat({ min: 0.0, max: 0.8 })
    .withMessage('valRatio must be between 0.0 and 0.8'),
  
  body()
    .custom((value) => {
      const sum = value.trainRatio + value.testRatio + value.valRatio;
      if (Math.abs(sum - 1.0) > 0.01) {
        throw new Error('Sum of ratios must equal 1.0');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validations pour l'entraînement
const validateStartTraining = [
  body('epochs')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Epochs must be between 1 and 1000'),
  
  body('batchSize')
    .isInt({ min: 1, max: 512 })
    .withMessage('Batch size must be between 1 and 512'),
  
  body('learningRate')
    .isFloat({ min: 0.00001, max: 1 })
    .withMessage('Learning rate must be between 0.00001 and 1'),
  
  body('validationSplit')
    .optional()
    .isFloat({ min: 0.1, max: 0.5 })
    .withMessage('Validation split must be between 0.1 and 0.5'),
  
  handleValidationErrors
];

const validateEvaluate = [
  body('dataset')
    .isIn(['test', 'validation'])
    .withMessage('Dataset must be either "test" or "validation"'),
  
  handleValidationErrors
];

const validatePredict = [
  body('inputData')
    .isArray()
    .withMessage('inputData must be an array')
    .custom(value => {
      if (!value.every(v => typeof v === 'number')) {
        throw new Error('All elements in inputData must be numbers');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateModel,
  validateUploadData,
  validatePreprocessData,
  validateAugmentData,
  validateSplitData,
  validateStartTraining,
  validateEvaluate,
  validatePredict
};
