const CalorieSubmission = require('../models/CalorieSubmission');
const ProgramSave = require('../models/ProgramSave');

/**
 * Calorie Calculator Controller
 * Calculates BMR, daily calories, and macronutrients using Mifflin-St Jeor formula
 */

const calculateCalories = async (req, res) => {
  try {
    const { gender, height, weight, age, activityLevel } = req.body;

    // Validation
    if (!gender || !['male', 'female'].includes(gender.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Gender is required and must be "male" or "female"'
      });
    }

    if (!height || isNaN(height) || height <= 0 || height > 250) {
      return res.status(400).json({
        success: false,
        message: 'Height must be a valid number between 1 and 250 cm'
      });
    }

    if (!weight || isNaN(weight) || weight <= 0 || weight > 300) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be a valid number between 1 and 300 kg'
      });
    }

    if (age && (isNaN(age) || age < 1 || age > 120)) {
      return res.status(400).json({
        success: false,
        message: 'Age must be a valid number between 1 and 120 years'
      });
    }

    // Calculate BMR using Mifflin-St Jeor formula
    // Default age to 25 if not provided
    const ageValue = age || 25;
    let bmr;

    if (gender.toLowerCase() === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * ageValue) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * ageValue) - 161;
    }

    // Calculate daily calories based on activity level
    let calories;
    if (!activityLevel || activityLevel === 'none') {
      // Default maintenance estimate
      calories = bmr * 1.4;
    } else {
      const multipliers = {
        low: 1.2,
        moderate: 1.55,
        high: 1.75
      };
      calories = bmr * (multipliers[activityLevel.toLowerCase()] || 1.4);
    }

    // Calculate macronutrients
    // Protein: 2g per kg bodyweight
    const protein = Math.round(weight * 2);
    const proteinCalories = protein * 4; // 4 kcal per gram

    // Fat: 0.8g per kg bodyweight
    const fat = Math.round(weight * 0.8);
    const fatCalories = fat * 9; // 9 kcal per gram

    // Remaining calories for carbohydrates
    const remainingCalories = calories - proteinCalories - fatCalories;
    const carbs = Math.max(0, Math.round(remainingCalories / 4)); // 4 kcal per gram

    // Fiber: 14g per 1000 kcal
    const fiber = Math.round((calories / 1000) * 14);

    // Round values
    bmr = Math.round(bmr);
    calories = Math.round(calories);

    res.status(200).json({
      success: true,
      data: {
        bmr,
        calories,
        protein,
        carbs,
        fat,
        fiber
      },
      meta: {
        formula: 'Mifflin-St Jeor',
        ageUsed: ageValue,
        activityLevel: activityLevel || 'default (1.4x BMR)'
      }
    });

  } catch (error) {
    console.error('Error calculating calories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate calories',
      error: error.message
    });
  }
};

/**
 * Save calorie calculation (inputs + results) with optional userName and deviceId
 * If userName is provided and not "None", update any ProgramSave with same deviceId and userName "None"
 */
const saveCalorieSubmission = async (req, res) => {
  try {
    const {
      userName,
      deviceId,
      gender,
      height,
      weight,
      age,
      activityLevel,
      bmr,
      calories,
      protein,
      carbs,
      fat,
      fiber
    } = req.body;

    const name = (userName && String(userName).trim()) ? String(userName).trim() : 'None';
    const doc = await CalorieSubmission.create({
      userName: name,
      deviceId: deviceId || undefined,
      gender,
      height: Number(height),
      weight: Number(weight),
      age: age != null ? Number(age) : undefined,
      activityLevel: activityLevel || 'none',
      bmr: Number(bmr),
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      fiber: fiber != null ? Number(fiber) : undefined
    });

    if (deviceId && name !== 'None') {
      await ProgramSave.updateMany(
        { deviceId, userName: 'None' },
        { $set: { userName: name } }
      );
    }

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Error saving calorie submission:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to save',
      error: error.message
    });
  }
};

module.exports = {
  calculateCalories,
  saveCalorieSubmission
};
