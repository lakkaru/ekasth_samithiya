import api from "./api"

const baseUrl = process.env.GATSBY_API_BASE_URL

// Cache for settings
const settingsCache = new Map()
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Get setting value from database with fallback
export const getSettingValue = async (settingName, fallbackValue = null) => {
  try {
    // Check cache first
    const cached = settingsCache.get(settingName)
    if (cached && (Date.now() - cached.timestamp) < CACHE_EXPIRY) {
      return cached.value
    }

    // Get from API
    const response = await api.get(`${baseUrl}/system-settings/${settingName}`)
    const value = response.data.setting.settingValue

    // Cache the result
    settingsCache.set(settingName, {
      value: value,
      timestamp: Date.now()
    })

    return value
  } catch (error) {
    console.warn(`Could not get setting ${settingName}, using fallback:`, error.message)
    return fallbackValue
  }
}

// Get fine settings
export const getFineSettings = async () => {
  try {
    // Use the new bulk fine settings endpoint
    const response = await api.get(`${baseUrl}/system-settings/fines`)
    
    if (response.data.success) {
      const settings = response.data.fineSettings
      
      // Cache each setting individually for the individual getSettingValue calls
      settingsCache.set('FUNERAL_WORK_FINE_VALUE', {
        value: settings.funeralWorkFine,
        timestamp: Date.now()
      })
      settingsCache.set('CEMETERY_WORK_FINE_VALUE', {
        value: settings.cemeteryWorkFine,
        timestamp: Date.now()
      })
      settingsCache.set('FUNERAL_ATTENDANCE_FINE_VALUE', {
        value: settings.funeralAttendanceFine,
        timestamp: Date.now()
      })
      
      return settings
    }
    
    throw new Error('API response indicates failure')
  } catch (error) {
    console.warn('Could not get fine settings from bulk endpoint, trying individual calls:', error.message)
    
    // Fallback to individual calls
    try {
      const [funeralWorkFine, cemeteryWorkFine, funeralAttendanceFine] = await Promise.all([
        getSettingValue('FUNERAL_WORK_FINE_VALUE', 1000),
        getSettingValue('CEMETERY_WORK_FINE_VALUE', 1000),
        getSettingValue('FUNERAL_ATTENDANCE_FINE_VALUE', 100)
      ])

      return {
        funeralWorkFine: parseInt(funeralWorkFine) || 1000,
        cemeteryWorkFine: parseInt(cemeteryWorkFine) || 1000,
        funeralAttendanceFine: parseInt(funeralAttendanceFine) || 100
      }
    } catch (fallbackError) {
      console.warn('Individual calls also failed, using defaults:', fallbackError.message)
      return {
        funeralWorkFine: 1000,
        cemeteryWorkFine: 1000,
        funeralAttendanceFine: 100
      }
    }
  }
}

// Get financial settings
export const getFinancialSettings = async () => {
  try {
    const [initialCash, initialBank] = await Promise.all([
      getSettingValue('INITIAL_CASH_ON_HAND', 0),
      getSettingValue('INITIAL_BANK_DEPOSIT', 0)
    ])

    return {
      initialCashOnHand: parseFloat(initialCash) || 0,
      initialBankDeposit: parseFloat(initialBank) || 0
    }
  } catch (error) {
    console.warn('Could not get financial settings, using defaults:', error.message)
    return {
      initialCashOnHand: 0,
      initialBankDeposit: 0
    }
  }
}

// Clear cache (useful when settings are updated)
export const clearSettingsCache = () => {
  settingsCache.clear()
}
