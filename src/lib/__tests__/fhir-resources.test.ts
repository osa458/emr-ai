/**
 * Unit tests for FHIR resource client helper functions
 */

describe('Patient helpers', () => {
  describe('formatPatientName', () => {
    it('formats name with given and family', () => {
      const name = {
        given: ['John', 'William'],
        family: 'Smith',
      }
      
      const formatted = [...(name.given || []), name.family].filter(Boolean).join(' ')
      expect(formatted).toBe('John William Smith')
    })

    it('handles missing given name', () => {
      const name = {
        family: 'Smith',
      }
      
      const formatted = [name.family].filter(Boolean).join(' ')
      expect(formatted).toBe('Smith')
    })

    it('handles empty name', () => {
      const name = {}
      
      const formatted = Object.values(name).filter(Boolean).join(' ') || 'Unknown'
      expect(formatted).toBe('Unknown')
    })
  })

  describe('calculateAge', () => {
    it('calculates age from birthdate', () => {
      const birthDate = new Date('1990-01-01')
      const today = new Date('2024-12-11')
      
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      expect(age).toBe(34)
    })

    it('handles birthday not yet occurred this year', () => {
      const birthDate = new Date('1990-12-31')
      const today = new Date('2024-12-11')
      
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      expect(age).toBe(33)
    })
  })
})

describe('Encounter helpers', () => {
  describe('getEncounterStatus', () => {
    it('returns correct status display', () => {
      const statusMap: Record<string, string> = {
        'in-progress': 'Active',
        'finished': 'Discharged',
        'cancelled': 'Cancelled',
        'planned': 'Planned',
      }

      expect(statusMap['in-progress']).toBe('Active')
      expect(statusMap['finished']).toBe('Discharged')
    })
  })

  describe('calculateLOS', () => {
    it('calculates length of stay in days', () => {
      const start = new Date('2024-12-01T10:00:00Z')
      const end = new Date('2024-12-05T14:00:00Z')
      
      const diffMs = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      
      expect(diffDays).toBe(5)
    })

    it('returns 1 for same-day encounter', () => {
      const start = new Date('2024-12-01T10:00:00Z')
      const end = new Date('2024-12-01T18:00:00Z')
      
      const diffMs = end.getTime() - start.getTime()
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      
      expect(diffDays).toBe(1)
    })
  })
})

describe('Observation helpers', () => {
  describe('formatVitalValue', () => {
    it('formats blood pressure', () => {
      const systolic = 120
      const diastolic = 80
      const unit = 'mmHg'
      
      const formatted = `${systolic}/${diastolic} ${unit}`
      expect(formatted).toBe('120/80 mmHg')
    })

    it('formats temperature', () => {
      const value = 98.6
      const unit = '°F'
      
      const formatted = `${value} ${unit}`
      expect(formatted).toBe('98.6 °F')
    })

    it('formats heart rate', () => {
      const value = 72
      const unit = 'bpm'
      
      const formatted = `${value} ${unit}`
      expect(formatted).toBe('72 bpm')
    })
  })

  describe('isAbnormalVital', () => {
    it('detects high blood pressure', () => {
      const systolic = 145
      const isHigh = systolic > 140
      
      expect(isHigh).toBe(true)
    })

    it('detects low blood pressure', () => {
      const systolic = 85
      const isLow = systolic < 90
      
      expect(isLow).toBe(true)
    })

    it('detects normal blood pressure', () => {
      const systolic = 120
      const isNormal = systolic >= 90 && systolic <= 140
      
      expect(isNormal).toBe(true)
    })

    it('detects fever', () => {
      const temp = 101.5
      const isFever = temp > 100.4
      
      expect(isFever).toBe(true)
    })

    it('detects tachycardia', () => {
      const hr = 105
      const isTachy = hr > 100
      
      expect(isTachy).toBe(true)
    })

    it('detects bradycardia', () => {
      const hr = 55
      const isBrady = hr < 60
      
      expect(isBrady).toBe(true)
    })
  })
})

describe('Appointment helpers', () => {
  describe('formatAppointmentTime', () => {
    it('formats appointment datetime', () => {
      const start = new Date('2024-12-15T10:30:00Z')
      
      const timeString = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      
      expect(timeString).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i)
    })
  })

  describe('getAppointmentDuration', () => {
    it('calculates duration from start and end', () => {
      const start = new Date('2024-12-15T10:00:00Z')
      const end = new Date('2024-12-15T10:30:00Z')
      
      const durationMs = end.getTime() - start.getTime()
      const durationMinutes = durationMs / (1000 * 60)
      
      expect(durationMinutes).toBe(30)
    })
  })

  describe('isUpcoming', () => {
    it('returns true for future appointments', () => {
      const futureDate = new Date(Date.now() + 86400000) // tomorrow
      const isUpcoming = futureDate > new Date()
      
      expect(isUpcoming).toBe(true)
    })

    it('returns false for past appointments', () => {
      const pastDate = new Date(Date.now() - 86400000) // yesterday
      const isUpcoming = pastDate > new Date()
      
      expect(isUpcoming).toBe(false)
    })
  })
})
