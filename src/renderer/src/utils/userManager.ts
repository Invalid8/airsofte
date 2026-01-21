import { writable, derived } from 'svelte/store'
import type { UserProfile, UserSession } from '../types/userTypes'
import { StorageManager } from './storageManager'

const USERS_KEY = 'airsofte_users'
const SESSION_KEY = 'airsofte_session'

class UserManager {
  private static instance: UserManager
  private usersStore = writable<UserProfile[]>([])
  private sessionStore = writable<UserSession>({
    currentUser: null,
    isLocked: false
  })

  private constructor() {
    this.loadUsers()
    this.loadSession()
  }

  static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager()
    }
    return UserManager.instance
  }

  private loadUsers(): void {
    const users = this.getUsersFromStorage()
    this.usersStore.set(users)
  }

  private loadSession(): void {
    const sessionData = sessionStorage.getItem(SESSION_KEY)
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData)
        this.sessionStore.set(session)
      } catch (e) {
        console.error('Failed to load session:', e)
      }
    }
  }

  async createUser(username: string, password?: string): Promise<UserProfile | null> {
    if (!/^[a-zA-Z0-9 ]{3,20}$/.test(username)) {
      return null
    }

    const users = this.getUsersFromStorage()

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return null
    }

    const newUser: UserProfile = {
      id: crypto.randomUUID(),
      username,
      passwordHash: password ? await this.hashPassword(password) : undefined,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      settings: StorageManager.getSettings(),
      stats: {
        totalPlayTime: 0,
        gamesPlayed: 0,
        totalScore: 0,
        highestCombo: 0
      },
      achievements: []
    }

    users.push(newUser)
    this.saveUsersToStorage(users)
    this.usersStore.set(users)

    return newUser
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async verifyPassword(user: UserProfile, password: string): Promise<boolean> {
    if (!user.passwordHash) return true
    const hash = await this.hashPassword(password)
    return hash === user.passwordHash
  }

  async switchUser(userId: string, password?: string): Promise<boolean> {
    const users = this.getUsersFromStorage()
    const user = users.find(u => u.id === userId)

    if (!user) return false

    if (user.passwordHash) {
      if (!password || !(await this.verifyPassword(user, password))) {
        return false
      }
    }

    user.lastPlayedAt = Date.now()
    this.saveUsersToStorage(users)
    this.usersStore.set(users)

    this.sessionStore.update(session => ({
      ...session,
      currentUser: user,
      isLocked: false
    }))

    this.saveSession({ currentUser: user, isLocked: false })
    return true
  }

  lockSession(): void {
    this.sessionStore.update(session => ({
      ...session,
      isLocked: true
    }))
  }

  logout(): void {
    this.sessionStore.set({
      currentUser: null,
      isLocked: false
    })
    this.saveSession({ currentUser: null, isLocked: false })
  }

  deleteUser(userId: string): boolean {
    const users = this.getUsersFromStorage()
    const filteredUsers = users.filter(u => u.id !== userId)

    if (filteredUsers.length === users.length) return false

    this.saveUsersToStorage(filteredUsers)
    this.usersStore.set(filteredUsers)

    const currentSession = this.getSession()
    if (currentSession.currentUser?.id === userId) {
      this.logout()
    }

    return true
  }

  updateUserStats(userId: string, stats: Partial<UserProfile['stats']>): boolean {
    const users = this.getUsersFromStorage()
    const user = users.find(u => u.id === userId)

    if (!user) return false

    user.stats = { ...user.stats, ...stats }
    this.saveUsersToStorage(users)
    this.usersStore.set(users)

    const currentSession = this.getSession()
    if (currentSession.currentUser?.id === userId) {
      this.sessionStore.update(session => ({
        ...session,
        currentUser: user
      }))
    }

    return true
  }

  private getUsersFromStorage(): UserProfile[] {
    const data = localStorage.getItem(USERS_KEY)
    if (!data) return []
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  private saveUsersToStorage(users: UserProfile[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  private saveSession(session: UserSession): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  private getSession(): UserSession {
    const data = sessionStorage.getItem(SESSION_KEY)
    if (!data) return { currentUser: null, isLocked: false }
    try {
      return JSON.parse(data)
    } catch {
      return { currentUser: null, isLocked: false }
    }
  }

  get users() {
    return this.usersStore
  }

  get session() {
    return this.sessionStore
  }
}

export const userManager = UserManager.getInstance()

export const currentUser = derived(
  userManager.session,
  $session => $session.currentUser
)

export const isSessionLocked = derived(
  userManager.session,
  $session => $session.isLocked
)
