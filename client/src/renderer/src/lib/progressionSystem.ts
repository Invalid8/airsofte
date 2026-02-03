import type { StoryMission, WeaponType } from '../types/gameTypes'

export type Achievement = {
  id: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: number
  icon: string
  category: 'COMBAT' | 'SURVIVAL' | 'SPECIAL' | 'COLLECTION'
}

export type MissionRating = {
  missionId: number
  stars: number
  bestScore: number
  bestTime: number
  perfectRun: boolean
  completedAt: number
}

export type PlayerProgression = {
  level: number
  experience: number
  totalScore: number
  missionsCompleted: number
  enemiesDestroyed: number
  achievementsUnlocked: number
  unlockedWeapons: WeaponType[]
  missionRatings: MissionRating[]
  achievements: Achievement[]
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_victory',
    title: 'First Victory',
    description: 'Complete your first mission',
    unlocked: false,
    icon: '🎖️',
    category: 'COMBAT'
  },
  {
    id: 'ace_pilot',
    title: 'Ace Pilot',
    description: 'Complete 5 missions',
    unlocked: false,
    icon: '✈️',
    category: 'COMBAT'
  },
  {
    id: 'perfect_run',
    title: 'Perfect Run',
    description: 'Complete a mission without taking damage',
    unlocked: false,
    icon: '💎',
    category: 'SURVIVAL'
  },
  {
    id: 'combo_master',
    title: 'Combo Master',
    description: 'Reach a 10x combo multiplier',
    unlocked: false,
    icon: '🔥',
    category: 'SPECIAL'
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Defeat your first boss',
    unlocked: false,
    icon: '⚔️',
    category: 'COMBAT'
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Destroy 100 enemies',
    unlocked: false,
    icon: '💯',
    category: 'COMBAT'
  },
  {
    id: 'arsenal_collector',
    title: 'Arsenal Collector',
    description: 'Unlock all weapon types',
    unlocked: false,
    icon: '🎯',
    category: 'COLLECTION'
  },
  {
    id: 'three_star_general',
    title: 'Three Star General',
    description: 'Get 3 stars on any mission',
    unlocked: false,
    icon: '⭐',
    category: 'SPECIAL'
  }
]

export class ProgressionSystem {
  private static instance: ProgressionSystem
  private progression: PlayerProgression
  private readonly STORAGE_KEY = 'player_progression'

  private constructor() {
    this.progression = this.loadProgression()
  }

  static getInstance(): ProgressionSystem {
    if (!ProgressionSystem.instance) {
      ProgressionSystem.instance = new ProgressionSystem()
    }
    return ProgressionSystem.instance
  }

  private loadProgression(): PlayerProgression {
    const saved = localStorage.getItem(this.STORAGE_KEY)

    if (saved) {
      try {
        const data = JSON.parse(saved)
        return {
          ...data,
          achievements: ACHIEVEMENTS.map((ach) => {
            const saved = data.achievements?.find((a) => a.id === ach.id)
            return saved || ach
          })
        }
      } catch (e) {
        console.error('Failed to load progression:', e)
      }
    }

    return {
      level: 1,
      experience: 0,
      totalScore: 0,
      missionsCompleted: 0,
      enemiesDestroyed: 0,
      achievementsUnlocked: 0,
      unlockedWeapons: ['SINGLE'],
      missionRatings: [],
      achievements: ACHIEVEMENTS.map((a) => ({ ...a }))
    }
  }

  private saveProgression(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.progression))
  }

  onMissionComplete(
    mission: StoryMission,
    stats: {
      score: number
      time: number
      damageTaken: number
      enemiesDestroyed: number
    }
  ): void {
    const stars = this.calculateStars(mission, stats)

    const existingRating = this.progression.missionRatings.find((r) => r.missionId === mission.id)

    if (!existingRating || stars > existingRating.stars) {
      const rating: MissionRating = {
        missionId: mission.id,
        stars,
        bestScore: stats.score,
        bestTime: stats.time,
        perfectRun: stats.damageTaken === 0,
        completedAt: Date.now()
      }

      if (existingRating) {
        const index = this.progression.missionRatings.indexOf(existingRating)
        this.progression.missionRatings[index] = rating
      } else {
        this.progression.missionRatings.push(rating)
      }
    }

    this.progression.missionsCompleted++
    this.progression.totalScore += stats.score
    this.progression.enemiesDestroyed += stats.enemiesDestroyed

    this.addExperience(stats.score)

    if (
      mission.rewards?.unlockWeapon &&
      !this.progression.unlockedWeapons.includes(mission.rewards.unlockWeapon)
    ) {
      this.unlockWeapon(mission.rewards.unlockWeapon)
    }

    this.checkAchievements(mission, stats, stars)
    this.saveProgression()
  }

  private calculateStars(
    mission: StoryMission,
    stats: {
      score: number
      time: number
      damageTaken: number
    }
  ): number {
    let stars = 1

    const baseScore = mission?.waves?.length * 1000
    if (stats.score >= baseScore * 1.5) stars = 2
    if (stats.score >= baseScore * 2) stars = 3

    if (stats.damageTaken === 0 && stars < 3) stars++

    return Math.min(stars, 3)
  }

  private addExperience(amount: number): void {
    this.progression.experience += amount

    const xpForNextLevel = this.progression.level * 1000

    if (this.progression.experience >= xpForNextLevel) {
      this.progression.level++
      this.progression.experience -= xpForNextLevel
      console.log(`🎉 Level Up! Now level ${this.progression.level}`)
    }
  }

  private unlockWeapon(weapon: WeaponType): void {
    if (!this.progression.unlockedWeapons.includes(weapon)) {
      this.progression.unlockedWeapons.push(weapon)
      console.log(`🔓 Unlocked weapon: ${weapon}`)
    }
  }

  private checkAchievements(mission: StoryMission, stats: any, stars: number): void {
    // const achievements = this.progression.achievements

    if (this.progression.missionsCompleted === 1) {
      this.unlockAchievement('first_victory')
    }

    if (this.progression.missionsCompleted === 5) {
      this.unlockAchievement('ace_pilot')
    }

    if (stats.damageTaken === 0) {
      this.unlockAchievement('perfect_run')
    }

    if (mission.hasBoss) {
      this.unlockAchievement('boss_slayer')
    }

    if (this.progression.enemiesDestroyed >= 100) {
      this.unlockAchievement('century_club')
    }

    if (this.progression.unlockedWeapons.length >= 4) {
      this.unlockAchievement('arsenal_collector')
    }

    if (stars === 3) {
      this.unlockAchievement('three_star_general')
    }
  }

  private unlockAchievement(id: string): void {
    const achievement = this.progression.achievements.find((a) => a.id === id)

    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true
      achievement.unlockedAt = Date.now()
      this.progression.achievementsUnlocked++

      console.log(`🏆 Achievement Unlocked: ${achievement.title}`)
    }
  }

  getProgression(): PlayerProgression {
    return { ...this.progression }
  }

  getMissionRating(missionId: number): MissionRating | undefined {
    return this.progression.missionRatings.find((r) => r.missionId === missionId)
  }

  getUnlockedAchievements(): Achievement[] {
    return this.progression.achievements.filter((a) => a.unlocked)
  }

  getLockedAchievements(): Achievement[] {
    return this.progression.achievements.filter((a) => !a.unlocked)
  }

  isWeaponUnlocked(weapon: WeaponType): boolean {
    return this.progression.unlockedWeapons.includes(weapon)
  }

  resetProgression(): void {
    this.progression = {
      level: 1,
      experience: 0,
      totalScore: 0,
      missionsCompleted: 0,
      enemiesDestroyed: 0,
      achievementsUnlocked: 0,
      unlockedWeapons: ['SINGLE'],
      missionRatings: [],
      achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, unlockedAt: undefined }))
    }
    this.saveProgression()
  }
}

export const progressionSystem = ProgressionSystem.getInstance()
