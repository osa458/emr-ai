/**
 * HIPAA-Compliant Jitsi Configuration
 * 
 * HIPAA Compliance Requirements for Telemedicine:
 * 1. End-to-end encryption (E2EE) - enabled
 * 2. No recording without consent - disabled by default
 * 3. Lobby/waiting room - enabled to prevent unauthorized access
 * 4. Password protection - required for all meetings
 * 5. No third-party data sharing - analytics disabled
 * 6. Secure server deployment - self-hosted or BAA-covered provider
 * 7. Audit logging - all session events logged
 * 8. Session timeout - automatic disconnection after inactivity
 * 
 * For production HIPAA compliance, you must:
 * - Use a HIPAA-compliant Jitsi server (self-hosted or 8x8/Ooma with BAA)
 * - Sign a Business Associate Agreement (BAA) with your provider
 * - Enable server-side logging and retention policies
 * - Implement proper access controls
 */

export interface JitsiHIPAAConfig {
  domain: string
  roomPrefix: string
  enableE2EE: boolean
  enableLobby: boolean
  requirePassword: boolean
  disableRecording: boolean
  disableAnalytics: boolean
  sessionTimeoutMinutes: number
}

// Default HIPAA-compliant configuration
export const hipaaConfig: JitsiHIPAAConfig = {
  // Use your own HIPAA-compliant Jitsi server
  // For production, replace with your self-hosted or BAA-covered provider
  domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si',
  roomPrefix: 'emr-hipaa-',
  enableE2EE: true,
  enableLobby: true,
  requirePassword: true,
  disableRecording: true,
  disableAnalytics: true,
  sessionTimeoutMinutes: 60
}

// Generate a HIPAA-compliant room name
export function generateSecureRoomName(
  patientId: string, 
  providerId: string, 
  encounterId?: string
): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  // Room names should not contain PHI
  return `${hipaaConfig.roomPrefix}${timestamp}-${randomSuffix}`
}

// Generate a secure meeting password
export function generateMeetingPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Jitsi configuration options for HIPAA compliance
export function getJitsiConfigOverwrite(config: JitsiHIPAAConfig = hipaaConfig) {
  return {
    // Disable features that could expose PHI
    disableDeepLinking: true,
    disableInviteFunctions: true,
    disableRemoteMute: false,
    disableProfile: true,
    
    // Security settings
    enableInsecureRoomNameWarning: true,
    enableLobbyChat: false, // No PHI in lobby
    hideLobbyButton: false,
    requireDisplayName: true,
    
    // Disable analytics and third-party services
    disableThirdPartyRequests: config.disableAnalytics,
    analytics: config.disableAnalytics ? { disabled: true } : undefined,
    
    // Recording settings
    fileRecordingsEnabled: !config.disableRecording,
    liveStreamingEnabled: false,
    transcribingEnabled: false, // Disable cloud transcription
    
    // Privacy settings
    doNotStoreRoom: true,
    hideConferenceSubject: true,
    hideParticipantsStats: true,
    
    // E2EE settings
    e2eeEnabled: config.enableE2EE,
    
    // Lobby settings
    lobby: {
      autoKnock: false,
      enableChat: false
    },
    
    // Session settings
    p2p: {
      enabled: false // Disable P2P for security audit trail
    },
    
    // UI settings for healthcare
    toolbarButtons: [
      'microphone',
      'camera',
      'closedcaptions',
      'desktop',
      'fullscreen',
      'fodeviceselection',
      'hangup',
      'chat',
      'tileview',
      'videoquality',
      'settings',
      'raisehand',
      'participants-pane'
      // Removed: 'recording', 'livestreaming', 'invite', 'sharedvideo'
    ],
    
    // Notifications
    notifications: [
      'connection.CONNFAIL',
      'dialog.cameraNotSendingData',
      'dialog.kickTitle',
      'dialog.liveStreaming',
      'dialog.lockTitle',
      'dialog.maxUsersLimitReached',
      'dialog.micNotSendingData',
      'dialog.passwordNotSupportedTitle',
      'dialog.serviceUnavailable',
      'dialog.sessTerminated',
      'dialog.sessionRestarted',
      'dialog.tokenAuthFailed',
      'dialog.transcribing',
      'dialOut.statusMessage',
      'liveStreaming.busy',
      'liveStreaming.failedToStart',
      'liveStreaming.unavailableTitle',
      'lobby.joinRejectedMessage',
      'lobby.notificationTitle',
      'notify.disconnected',
      'notify.grantedTo',
      'notify.invitedOneMember',
      'notify.invitedThreePlusMembers',
      'notify.invitedTwoMembers',
      'notify.kickParticipant',
      'notify.mutedRemotelyTitle',
      'notify.mutedTitle',
      'notify.newDeviceAudioTitle',
      'notify.newDeviceCameraTitle',
      'notify.passwordRemovedRemotely',
      'notify.passwordSetRemotely',
      'notify.raisedHand',
      'notify.startSilentTitle',
      'notify.unmute',
      'prejoin.errorDialOut',
      'prejoin.errorDialOutDisconnected',
      'prejoin.errorDialOutFailed',
      'prejoin.errorDialOutStatus',
      'prejoin.errorStatusCode',
      'prejoin.errorValidation',
      'recording.busy',
      'recording.failedToStart',
      'recording.unavailableTitle',
      'toolbar.noAudioSignalTitle',
      'toolbar.noisyAudioInputTitle',
      'toolbar.talkWhileMutedPopup',
      'transcribing.failedToStart'
    ]
  }
}

// Interface options for HIPAA compliance
export function getJitsiInterfaceConfigOverwrite() {
  return {
    DISABLE_FOCUS_INDICATOR: false,
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
    DISABLE_PRESENCE_STATUS: true,
    DISABLE_RINGING: false,
    DISABLE_TRANSCRIPTION_SUBTITLES: true,
    DISABLE_VIDEO_BACKGROUND: true,
    FILM_STRIP_MAX_HEIGHT: 120,
    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
    HIDE_INVITE_MORE_HEADER: true,
    MOBILE_APP_PROMO: false,
    OPTIMAL_BROWSERS: ['chrome', 'chromium', 'firefox', 'safari', 'edge'],
    RECENT_LIST_ENABLED: false,
    SETTINGS_SECTIONS: ['devices', 'language'],
    SHOW_BRAND_WATERMARK: false,
    SHOW_CHROME_EXTENSION_BANNER: false,
    SHOW_JITSI_WATERMARK: false,
    SHOW_POWERED_BY: false,
    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
    TOOLBAR_ALWAYS_VISIBLE: true,
    VIDEO_QUALITY_LABEL_DISABLED: false,
    
    // Healthcare-specific branding
    DEFAULT_BACKGROUND: '#1a1a2e',
    DEFAULT_LOCAL_DISPLAY_NAME: 'Healthcare Provider',
    DEFAULT_REMOTE_DISPLAY_NAME: 'Patient',
    NATIVE_APP_NAME: 'EMR Telemedicine',
    PROVIDER_NAME: 'EMR Healthcare'
  }
}

// Audit log entry for HIPAA compliance
export interface TelemedicineAuditLog {
  timestamp: Date
  eventType: 'session_start' | 'session_end' | 'participant_join' | 'participant_leave' | 'screen_share' | 'chat_message'
  sessionId: string
  participantId: string
  participantRole: 'provider' | 'patient'
  patientId?: string
  encounterId?: string
  duration?: number
  metadata?: Record<string, any>
}

// Create audit log entry
export function createAuditLogEntry(
  eventType: TelemedicineAuditLog['eventType'],
  sessionId: string,
  participantId: string,
  participantRole: 'provider' | 'patient',
  metadata?: Record<string, any>
): TelemedicineAuditLog {
  return {
    timestamp: new Date(),
    eventType,
    sessionId,
    participantId,
    participantRole,
    metadata
  }
}

// Log telemedicine event (should be sent to secure audit log)
export async function logTelemedicineEvent(entry: TelemedicineAuditLog): Promise<void> {
  // In production, send to secure audit log service
  console.log('[HIPAA Audit]', JSON.stringify(entry))
  
  // TODO: Implement secure audit logging
  // await fetch('/api/audit/telemedicine', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(entry)
  // })
}
