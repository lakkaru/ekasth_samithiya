const mongoose = require("mongoose");

const SystemSettingsSchema = new mongoose.Schema(
  {
    settingName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    settingValue: {
      type: mongoose.Schema.Types.Mixed, // Can store numbers, strings, etc.
      required: true
    },
    settingType: {
      type: String,
      enum: ['financial', 'fine', 'general'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true
    },
    lastUpdateDate: {
      type: Date,
      default: Date.now
    },
    // When the setting becomes effective (optional). If set, the setting's value
    // is considered active only when current date >= effectiveFrom.
    effectiveFrom: {
      type: Date,
      required: false
    },
    updateHistory: [{
      previousValue: mongoose.Schema.Types.Mixed,
      previousEffectiveFrom: Date,
      newValue: mongoose.Schema.Types.Mixed,
      newEffectiveFrom: Date,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminUser"
      },
      updateDate: {
        type: Date,
        default: Date.now
      },
      updateReason: String
    }]
  },
  {
    timestamps: true
  }
);

// Static method to get setting value
// Returns the setting value only if it's effective now. If the document has an
// `effectiveFrom` in the future, this will return `defaultValue`.
SystemSettingsSchema.statics.getSettingValue = async function(settingName, defaultValue = null) {
  try {
    const setting = await this.findOne({ settingName });
    if (!setting) return defaultValue;
    if (setting.effectiveFrom && new Date() < new Date(setting.effectiveFrom)) {
      return defaultValue;
    }
    return setting.settingValue;
  } catch (error) {
    console.error(`Error getting setting ${settingName}:`, error);
    return defaultValue;
  }
};

// Static method to update setting value
// Update setting value and optionally its effectiveFrom date. Pass
// `effectiveFrom` (Date) as the fifth argument to update when the new value
// should start taking effect.
SystemSettingsSchema.statics.updateSetting = async function(settingName, newValue, updatedBy, updateReason = '', effectiveFrom = undefined) {
  try {
    const existingSetting = await this.findOne({ settingName });
    
    if (existingSetting) {
      // Add to update history
      existingSetting.updateHistory.push({
        previousValue: existingSetting.settingValue,
        previousEffectiveFrom: existingSetting.effectiveFrom,
        newValue: newValue,
        newEffectiveFrom: effectiveFrom,
        updatedBy: updatedBy,
        updateDate: new Date(),
        updateReason: updateReason
      });

      existingSetting.settingValue = newValue;
      if (effectiveFrom !== undefined) {
        existingSetting.effectiveFrom = effectiveFrom;
      }
      existingSetting.updatedBy = updatedBy;
      existingSetting.lastUpdateDate = new Date();

      return await existingSetting.save();
    } else {
      throw new Error(`Setting ${settingName} not found`);
    }
  } catch (error) {
    console.error(`Error updating setting ${settingName}:`, error);
    throw error;
  }
};

module.exports = mongoose.model("SystemSettings", SystemSettingsSchema);
