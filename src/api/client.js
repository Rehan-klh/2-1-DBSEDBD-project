const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const getToken = () => localStorage.getItem('access_token')
export const setToken = (token) => localStorage.setItem('access_token', token)
export const clearToken = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('auth_user')
}

export const getAuthUser = () => {
  try {
    const raw = localStorage.getItem('auth_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const setAuthUser = (user) => {
  localStorage.setItem('auth_user', JSON.stringify(user))
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed with status ${response.status}`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  return data
}

export const api = {
  auth: {
    login: async (email, password, role) => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      })
      if (res?.access_token) {
        setToken(res.access_token)
        setAuthUser(res)
      }
      return res
    },
    getMe: () => request('/auth/me'),
    logout: () => {
      clearToken()
    },
  },
  students: {
    getMyProfile: () => request('/students/me'),
    updateMyProfile: (data) => request('/students/me', { method: 'PUT', body: JSON.stringify(data) }),
    getDashboard: () => request('/students/me/dashboard'),
    list: () => request('/students'),
    get: (id) => request(`/students/${id}`),
    create: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  },
  hostels: {
    list: () => request('/hostels'),
    getBlocks: (id) => request(`/hostels/${id}/blocks`),
  },
  rooms: {
    list: () => request('/rooms'),
    listAvailable: () => request('/rooms/available'),
    get: (id) => request(`/rooms/${id}`),
    create: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
  },
  allocations: {
    getMine: () => request('/allocations/me'),
    selectRoom: (roomId) => request('/allocations', { method: 'POST', body: JSON.stringify({ room_id: roomId }) }),
    list: () => request('/allocations'),
    adminAllocate: (studentId, roomId) => request('/allocations/admin', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, room_id: roomId }),
    }),
    transfer: (id, newRoomId) => request(`/allocations/${id}/transfer`, {
      method: 'PATCH',
      body: JSON.stringify({ new_room_id: newRoomId }),
    }),
    release: (id) => request(`/allocations/${id}`, { method: 'DELETE' }),
  },
  roomChanges: {
    submit: (requestedRoomId, reason) => request('/room-changes', {
      method: 'POST',
      body: JSON.stringify({ requested_room_id: requestedRoomId, reason }),
    }),
    getMine: () => request('/room-changes/me'),
    list: () => request('/room-changes'),
    updateStatus: (id, status, adminComment) => request(`/room-changes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_comment: adminComment }),
    }),
  },
  leave: {
    submit: (data) => request('/leave', { method: 'POST', body: JSON.stringify(data) }),
    getMine: () => request('/leave/me'),
    list: () => request('/leave'),
    updateStatus: (id, status, adminComment) => request(`/leave/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_comment: adminComment }),
    }),
  },
  complaints: {
    submit: (data) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
    getMine: () => request('/complaints/me'),
    list: () => request('/complaints'),
    updateStatus: (id, status, adminResponse) => request(`/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_response: adminResponse }),
    }),
  },
  mess: {
    getMenu: () => request('/mess/menu'),
    createMenu: (data) => request('/mess/menu', { method: 'POST', body: JSON.stringify(data) }),
    updateMenu: (id, data) => request(`/mess/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMenu: (id) => request(`/mess/menu/${id}`, { method: 'DELETE' }),
    submitFeedback: (data) => request('/mess/feedback', { method: 'POST', body: JSON.stringify(data) }),
    getMyFeedback: () => request('/mess/feedback/me'),
    listFeedback: () => request('/mess/feedback'),
  },
  fees: {
    getMine: () => request('/fees/me'),
    list: () => request('/fees'),
    create: (data) => request('/fees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/fees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  visitors: {
    submit: (data) => request('/visitors', { method: 'POST', body: JSON.stringify(data) }),
    getMine: () => request('/visitors/me'),
    list: () => request('/visitors'),
    updateStatus: (id, status, adminComment) => request(`/visitors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_comment: adminComment }),
    }),
  },
  announcements: {
    list: () => request('/announcements'),
    create: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    list: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  },
  activityLogs: {
    list: (limit = 50) => request(`/activity-logs?limit=${limit}`),
  },
}
