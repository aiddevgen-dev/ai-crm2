'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import {
  Phone,
  PhoneCall,
  MessageSquare,
  RefreshCw,
  Info,
  PhoneIncoming,
  PhoneOutgoing,
  Send,
  Inbox,
  XCircle,
  Calendar,
  Wrench,
} from 'lucide-react'

// INTERFACES
interface TelnyxNumber {
  _id: string
  phone_number: string
  telnyx_number_id: string
  status: 'available' | 'assigned' | 'inactive'
  assigned_to_user_id: string | null
  monthly_cost: number
  created_at: string
}

interface TelnyxMessage {
  id: string
  message_id: string
  cost: {
    amount: string
    currency: string
  }
  created_at: string
  direction: 'inbound' | 'outbound'
  from: string
  status: string | null
  text: string
  to: string[]
  type: 'SMS' | 'MMS'
}

interface TelnyxCallEvent {
  ts: string | null
  event_type: string
  call_status: string | null
  payload: {
    Transcript?: string
    [key: string]: any
  }
}

interface TelnyxCall {
  id: string
  call_key: string
  created_at: string
  updated_at: string
  from: string
  to: string
  duration: string
  last_status: string
  hangup_source: string
  events?: TelnyxCallEvent[]
  account_sid?: string
  call_sid?: string
  telnyx_metadata?: {
    call_session_id?: string
    [key: string]: any
  }
}

interface TelnyxRecording {
  id: string
  status: 'completed' | 'failed' | 'in_progress'
  duration_millis: number
  download_urls: {
    wav?: string
    mp3?: string
  } 
  recording_started_at: string
  recording_ended_at: string
}

interface CallSummary {
  total_calls: number
  inbound_calls: number
  outbound_calls: number
  total_duration_seconds: number
}

interface MessageSummary {
  total_messages: number
  inbound_messages: number
  outbound_messages: number
}
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ai-crm2-backend2.onrender.com'
  : 'http://127.0.0.1:5000';
// API Functions
const api = {
  getMyNumbers: async (): Promise<TelnyxNumber[]> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/user/my-numbers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Failed to fetch numbers')
    return response.json()
  },

  getCallsByNumber: async (phoneNumber: string, options: any = {}): Promise<{ calls: TelnyxCall[], pagination: any }> => {
    const token = localStorage.getItem('auth_token')
    const params = new URLSearchParams({
      phone_number: phoneNumber,
      limit: options.limit?.toString() || '20',
      ...options
    })
    const response = await fetch(`${API_BASE_URL}/api/user/calls/by-number?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Failed to fetch calls')
    return response.json()
  },

  getMessagesByNumber: async (phoneNumber: string, options: any = {}): Promise<{ messages: TelnyxMessage[], pagination: any }> => {
    const token = localStorage.getItem('auth_token')
    const params = new URLSearchParams({
      phone_number: phoneNumber,
      limit: options.limit?.toString() || '20',
      ...options
    })
    const response = await fetch(`${API_BASE_URL}/api/user/by-number?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Failed to fetch messages')
    return response.json()
  },

  getRecording: async (callSessionId: string): Promise<{ data: TelnyxRecording[] }> => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/api/user/recordings/${callSessionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('Failed to fetch recording')
    return response.json()
  }
}

export default function TenantDashboard() {
  const { user } = useAuth()
  
  // States
  const [myNumbers, setMyNumbers] = useState<TelnyxNumber[]>([])
  const [recentCalls, setRecentCalls] = useState<TelnyxCall[]>([])
  const [recentMessages, setRecentMessages] = useState<TelnyxMessage[]>([])
  const [callSummary, setCallSummary] = useState<Record<string, CallSummary>>({})
  const [messageSummary, setMessageSummary] = useState<Record<string, MessageSummary>>({})
  const [loading, setLoading] = useState(true)
  const [numbersLoading, setNumbersLoading] = useState(false)
  const [callsLoading, setCallsLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  
  // Modal states
  const [showCallsModal, setShowCallsModal] = useState(false)
  const [showMessagesModal, setShowMessagesModal] = useState(false)
  const [showCallDetailsModal, setShowCallDetailsModal] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<TelnyxCall | null>(null)
  const [callRecordingDetails, setCallRecordingDetails] = useState<TelnyxRecording | null>(null)
  const [recordingLoading, setRecordingLoading] = useState(false)
  
  // Modal data
  const [modalCalls, setModalCalls] = useState<TelnyxCall[]>([])
  const [modalMessages, setModalMessages] = useState<TelnyxMessage[]>([])

  // Helper functions
  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return ''
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      const number = cleaned.slice(1)
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    }
    return phoneNumber
  }

  const formatDuration = (secondsStr: string) => {
    const seconds = parseInt(secondsStr || '0', 10)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

 const extractTranscript = (call: TelnyxCall): string => {
  if (!call.events) return ''
  return call.events
    .filter(e => e.event_type === 'telnyx_status' && 
                 e.payload?.Transcript !== undefined && 
                 e.payload.Transcript.trim() !== '') // Only non-empty transcripts
    .map(e => e.payload.Transcript!.trim())
    .join(' ') || ''
}

  const getCallDirection = (call: TelnyxCall): 'inbound' | 'outbound' => {
    const myPhoneNumbers = new Set(myNumbers.map(n => n.phone_number))
    return myPhoneNumbers.has(call.to) ? 'inbound' : 'outbound'
  }

  // Load functions
  const loadMyNumbers = useCallback(async () => {
    try {
      setNumbersLoading(true)
      const numbers = await api.getMyNumbers()
      setMyNumbers(numbers)
    } catch (error) {
      toast.error('Failed to load your phone numbers')
    } finally {
      setNumbersLoading(false)
    }
  }, [])

  const loadRecentCalls = useCallback(async () => {
    if (myNumbers.length === 0) return
    try {
      setCallsLoading(true)
      const allCalls: TelnyxCall[] = []
      const summaries: Record<string, CallSummary> = {}
      
      for (const number of myNumbers) {
        const response = await api.getCallsByNumber(number.phone_number, { limit: 10 })
        const calls = response.calls || []
        allCalls.push(...calls)
        
        summaries[number.phone_number] = {
          total_calls: calls.length,
          inbound_calls: calls.filter(c => getCallDirection(c) === 'inbound').length,
          outbound_calls: calls.filter(c => getCallDirection(c) === 'outbound').length,
          total_duration_seconds: calls.reduce((sum, c) => sum + parseInt(c.duration || '0', 10), 0)
        }
      }
      
      allCalls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentCalls(allCalls.slice(0, 20))
      setCallSummary(summaries)
    } catch (error) {
      toast.error('Failed to load recent calls')
    } finally {
      setCallsLoading(false)
    }
  }, [myNumbers])

  const loadRecentMessages = useCallback(async () => {
    if (myNumbers.length === 0) return
    try {
      setMessagesLoading(true)
      const allMessages: TelnyxMessage[] = []
      const summaries: Record<string, MessageSummary> = {}
      
      for (const number of myNumbers) {
        const response = await api.getMessagesByNumber(number.phone_number, { limit: 10 })
        const messages = response.messages || []
        allMessages.push(...messages)
        
        summaries[number.phone_number] = {
          total_messages: messages.length,
          inbound_messages: messages.filter(m => m.direction === 'inbound').length,
          outbound_messages: messages.filter(m => m.direction === 'outbound').length
        }
      }
      
      allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentMessages(allMessages.slice(0, 20))
      setMessageSummary(summaries)
    } catch (error) {
      toast.error('Failed to load recent messages')
    } finally {
      setMessagesLoading(false)
    }
  }, [myNumbers])

  const handleViewCallDetails = useCallback(async (call: TelnyxCall) => {
    setSelectedCall(call)
    setShowCallDetailsModal(true)
    setRecordingLoading(true)
    setCallRecordingDetails(null)

    const sessionId = call.telnyx_metadata?.call_session_id
    if (!sessionId) {
      console.warn('Call Session ID is missing.')
      setRecordingLoading(false)
      return
    }

    try {
      const response = await api.getRecording(sessionId)
      if (response.data && response.data.length > 0) {
        const recording = response.data[0]
        if (recording.download_urls && (recording.download_urls.wav || recording.download_urls.mp3)) {
          setCallRecordingDetails(recording)
        }
      }
    } catch (error) {
      console.error('Failed to fetch call recording:', error)
    } finally {
      setRecordingLoading(false)
    }
  }, [])

  const loadCallsForNumber = useCallback(async (phoneNumber: string) => {
    try {
      const response = await api.getCallsByNumber(phoneNumber, { limit: 50 })
      setModalCalls(response.calls || [])
    } catch (error) {
      toast.error('Failed to load calls for this number')
    }
  }, [])

  const loadMessagesForNumber = useCallback(async (phoneNumber: string) => {
    try {
      const response = await api.getMessagesByNumber(phoneNumber, { limit: 50 })
      setModalMessages(response.messages || [])
    } catch (error) {
      toast.error('Failed to load messages for this number')
    }
  }, [])

  // Effects
  useEffect(() => {
    setLoading(true)
    loadMyNumbers().finally(() => setLoading(false))
  }, [loadMyNumbers])

  useEffect(() => {
    if (myNumbers.length > 0) {
      loadRecentCalls()
      loadRecentMessages()
    }
  }, [myNumbers, loadRecentCalls, loadRecentMessages])

  // Calculate totals
  const totalCallStats = Object.values(callSummary).reduce(
    (acc, s) => ({
      total_calls: acc.total_calls + s.total_calls,
      inbound_calls: acc.inbound_calls + s.inbound_calls,
      outbound_calls: acc.outbound_calls + s.outbound_calls
    }), 
    { total_calls: 0, inbound_calls: 0, outbound_calls: 0 }
  )

  const totalMessageStats = Object.values(messageSummary).reduce(
    (acc, s) => ({
      total_messages: acc.total_messages + s.total_messages,
      inbound_messages: acc.inbound_messages + s.inbound_messages,
      outbound_messages: acc.outbound_messages + s.outbound_messages
    }), 
    { total_messages: 0, inbound_messages: 0, outbound_messages: 0 }
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Wrench className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Tenant Dashboard</h1>
        </div>
        <p className="text-orange-100">
          Welcome back {user?.email}! Manage your communications and monitor your activity.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">My Phone Numbers</CardTitle>
            <Phone className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{myNumbers.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalCallStats.total_calls}</div>
            <p className="text-xs text-slate-500">
              {totalCallStats.inbound_calls} in / {totalCallStats.outbound_calls} out
            </p>
          </CardContent>
        </Card>
        
        {/* <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalMessageStats.total_messages}</div>
            <p className="text-xs text-slate-500">
              {totalMessageStats.inbound_messages} in / {totalMessageStats.outbound_messages} out
            </p>
          </CardContent>
        </Card> */}
        
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Numbers</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{myNumbers.filter(n => n.status === 'assigned').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* My Phone Numbers Section */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-slate-800">
            <span>My Assigned Phone Numbers</span>
            <Button size="sm" onClick={loadMyNumbers} disabled={numbersLoading} className="bg-orange-600 text-white hover:bg-orange-700">
              <RefreshCw className={`h-4 w-4 mr-2 ${numbersLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {numbersLoading ? (
            <p className="text-slate-500">Loading numbers...</p>
          ) : (
            <div className="space-y-3">
              {myNumbers.map((number) => (
                <div key={number._id} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="font-semibold text-lg text-slate-700">{formatPhoneNumber(number.phone_number)}</div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        setSelectedNumber(number.phone_number)
                        loadCallsForNumber(number.phone_number)
                        setShowCallsModal(true)
                      }}
                    >
                      <PhoneCall className="h-4 w-4 mr-1" /> Calls
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        setSelectedNumber(number.phone_number)
                        loadMessagesForNumber(number.phone_number)
                        setShowMessagesModal(true)
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" /> Messages
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1  gap-6">
        {/* Recent Calls */}
        <Card className="bg-white border-slate-200 shadow-sm col-span-1 w-full">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-slate-800">
              <span>Recent Calls</span>
              <Button size="sm" onClick={loadRecentCalls} disabled={callsLoading} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                <RefreshCw className={`h-4 w-4 mr-2 ${callsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {callsLoading ? (
              <p className="text-slate-500">Loading calls...</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {recentCalls.map((call) => {
                  const direction = getCallDirection(call)
                  return (
                    <div key={call.id} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className={`p-2 rounded-full ${direction === 'inbound' ? 'bg-slate-200' : 'bg-orange-100'}`}>
                        {direction === 'inbound' ? 
                          <PhoneIncoming className="h-4 w-4 text-slate-600" /> : 
                          <PhoneOutgoing className="h-4 w-4 text-orange-700" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm text-slate-700">
                            {direction === 'inbound' ? 
                              `From: ${formatPhoneNumber(call.from)}` : 
                              `To: ${formatPhoneNumber(call.to)}`
                            }
                          </span>
                          <span className="text-xs text-slate-500">{formatDateTime(call.created_at)}</span>
                        </div>
                        <div className="text-xs text-slate-600">Duration: {formatDuration(call.duration)}</div>
                      </div>
                      <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100" onClick={() => handleViewCallDetails(call)}>
                        <Info className="h-4 w-4 mr-1" /> Details
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
       {/* <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-slate-800">
              <span>Recent Messages</span>
              <Button size="sm" onClick={loadRecentMessages} disabled={messagesLoading} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                <RefreshCw className={`h-4 w-4 mr-2 ${messagesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <p className="text-slate-500">Loading messages...</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {recentMessages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`p-2 rounded-full ${message.direction === 'inbound' ? 'bg-slate-200' : 'bg-orange-100'}`}>
                      {message.direction === 'inbound' ? 
                        <Inbox className="h-4 w-4 text-slate-600" /> : 
                        <Send className="h-4 w-4 text-orange-700" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <span className="font-medium text-sm truncate text-slate-700">
                          {message.direction === 'inbound' ? 
                            `From: ${formatPhoneNumber(message.from)}` : 
                            `To: ${message.to.map(formatPhoneNumber).join(', ')}`
                          }
                        </span>
                        <span className="text-xs text-slate-500">{formatDateTime(message.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 truncate">{message.text || 'Media message'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>  */}
      </div>

      {/* MODALS */}

{/* Call Details Modal */}
        {showCallDetailsModal && selectedCall && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl bg-white max-h-[90vh] flex flex-col">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>Call Details</span>
                  <Button variant="ghost" size="icon" onClick={() => setShowCallDetailsModal(false)}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </CardTitle>
                <CardDescription>Details for call on {formatDateTime(selectedCall.created_at)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6 overflow-y-auto">
                <div>
                  <h4 className="font-semibold mb-2">Call Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-4 border rounded-lg bg-gray-50">
                    <div><strong>From:</strong> {formatPhoneNumber(selectedCall.from)}</div>
                    <div><strong>To:</strong> {formatPhoneNumber(selectedCall.to)}</div>
                    <div><strong>Direction:</strong> <span className="capitalize">{getCallDirection(selectedCall)}</span></div>
                    <div><strong>Duration:</strong> {formatDuration(selectedCall.duration)}</div>
                    <div><strong>Status:</strong> <span className="capitalize">{selectedCall.last_status?.replace(/_/g, ' ') || 'N/A'}</span></div>
                    <div><strong>Hangup Source:</strong> <span className="capitalize">{selectedCall.hangup_source?.replace(/_/g, ' ') || 'N/A'}</span></div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Call Recording</h4>
                  {recordingLoading ? (
                    <div className="flex items-center justify-center p-4 border rounded-md bg-gray-100">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Loading recording...</span>
                    </div>
                  ) : callRecordingDetails && (callRecordingDetails.download_urls.wav || callRecordingDetails.download_urls.mp3) ? (
                    <div className="p-4 border rounded-lg bg-gray-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><strong>Status:</strong> <span className="capitalize">{callRecordingDetails.status}</span></div>
                        <div><strong>Duration:</strong> {Math.floor(callRecordingDetails.duration_millis / 1000)}s</div>
                        <div className="col-span-2"><strong>Started:</strong> {formatDateTime(callRecordingDetails.recording_started_at)}</div>
                        <div className="col-span-2"><strong>Ended:</strong> {formatDateTime(callRecordingDetails.recording_ended_at)}</div>
                      </div>
                      <audio controls className="w-full">
                        <source src={callRecordingDetails.download_urls.wav || callRecordingDetails.download_urls.mp3} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                      <div className="flex space-x-2">
                        {callRecordingDetails.download_urls.wav && (
                          <a href={callRecordingDetails.download_urls.wav} download className="text-blue-600 hover:underline text-sm">
                            Download WAV
                          </a>
                        )}
                        {callRecordingDetails.download_urls.mp3 && (
                          <a href={callRecordingDetails.download_urls.mp3} download className="text-blue-600 hover:underline text-sm">
                            Download MP3
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 border rounded-md bg-gray-100 text-gray-500 text-sm">
                      No recording available for this call.
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Call Transcript</h4>
                  {(() => {
                    const transcript = extractTranscript(selectedCall)
                    return transcript && transcript.length > 0 ? (
                      <div className="p-4 border rounded-lg bg-gray-100 max-h-48 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                      </div>
                    ) : (
                      <div className="text-center p-4 border rounded-md bg-gray-100 text-gray-500 text-sm">
                        No transcript available for this call.
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calls Modal */}
        {showCallsModal && selectedNumber && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl bg-white max-h-[90vh] flex flex-col">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>Calls for {formatPhoneNumber(selectedNumber)}</span>
                  <Button variant="ghost" size="icon" onClick={() => setShowCallsModal(false)}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto">
                <div className="space-y-3">
                  {modalCalls.map((call) => {
                    const direction = getCallDirection(call)
                    return (
                      <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${direction === 'inbound' ? 'bg-green-100' : 'bg-blue-100'}`}>
                            {direction === 'inbound' ? 
                              <PhoneIncoming className="h-4 w-4 text-green-600" /> : 
                              <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                            }
                          </div>
                          <div>
                            <div className="font-medium">
                              {direction === 'inbound' ? 
                                `From: ${formatPhoneNumber(call.from)}` : 
                                `To: ${formatPhoneNumber(call.to)}`
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDateTime(call.created_at)} • Duration: {formatDuration(call.duration)}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleViewCallDetails(call)}>
                          <Info className="h-4 w-4 mr-1" /> Details
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Messages Modal */}
        {showMessagesModal && selectedNumber && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl bg-white max-h-[90vh] flex flex-col">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span>Messages for {formatPhoneNumber(selectedNumber)}</span>
                  <Button variant="ghost" size="icon" onClick={() => setShowMessagesModal(false)}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto">
                <div className="space-y-3">
                  {modalMessages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <div className={`p-2 rounded-full ${message.direction === 'inbound' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {message.direction === 'inbound' ? 
                          <Inbox className="h-4 w-4 text-green-600" /> : 
                          <Send className="h-4 w-4 text-blue-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">
                            {message.direction === 'inbound' ? 
                              `From: ${formatPhoneNumber(message.from)}` : 
                              `To: ${message.to.map(formatPhoneNumber).join(', ')}`
                            }
                          </span>
                          <span className="text-xs text-gray-500">{formatDateTime(message.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{message.text || 'Media message'}</p>
                        {message.type === 'MMS' && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            MMS
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    // </DashboardLayout>
  )
}

// export default withAuth(TenantDashboard, ['tenant_user'])