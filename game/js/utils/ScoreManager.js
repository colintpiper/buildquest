// BuildQuest: Score Manager

import { SCORING, TIERS } from './Constants.js';

export default class ScoreManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.profitMargin = SCORING.BASE_MARGIN;
        this.jobsCompleted = 0;
        this.totalRevenue = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.hitsTaken = 0;
        this.wavesCompleted = 0;
        this.firstTimeFix = true; // no hits taken this wave
        this.opsAIActive = false;
    }

    /**
     * Streak bonus with diminishing returns.
     * Linear up to SOFT_CAP, then decays toward a ceiling.
     */
    _calcStreakBonus(streak) {
        const s = Math.min(streak, SCORING.STREAK_HARD_CAP);
        const decay = 1 / (1 + SCORING.STREAK_DECAY * Math.max(0, s - SCORING.STREAK_SOFT_CAP));
        return Math.floor(SCORING.STREAK_BONUS_BASE * s * decay);
    }

    completeJob(jobValue, waveTimeRemaining, waveTimeTotal) {
        // Faster completion = higher margin bonus
        const timeRatio = waveTimeRemaining / waveTimeTotal;
        const marginBonus = Math.floor(jobValue * timeRatio);

        this.streak++;
        if (this.streak > this.bestStreak) {
            this.bestStreak = this.streak;
        }

        const streakBonus = this._calcStreakBonus(this.streak);

        let points = jobValue + marginBonus + streakBonus;

        // Additive multiplier stacking (base 1.0)
        let multiplier = 1.0;
        if (this.firstTimeFix) multiplier += SCORING.FIRST_TIME_FIX_BONUS;
        if (this.opsAIActive) multiplier += SCORING.OPSAI_BONUS;
        points = Math.floor(points * multiplier);

        this.score += points;
        this.totalRevenue += jobValue;
        this.jobsCompleted++;

        return { points, streakBonus, marginBonus, jobValue };
    }

    takeHit() {
        this.hitsTaken++;
        this.streak = 0;
        this.firstTimeFix = false;
        this.profitMargin = Math.max(0, this.profitMargin - SCORING.MARGIN_LOSS_PER_HIT);
    }

    completeWave(waveNumber) {
        this.wavesCompleted++;
        this.firstTimeFix = true; // reset for next wave

        // Flat wave completion bonus (not subject to multipliers)
        const bonus = SCORING.WAVE_CLEAR_BASE + (waveNumber || 1) * SCORING.WAVE_CLEAR_PER_LEVEL;
        this.score += bonus;
        return bonus;
    }

    getTier() {
        for (let i = TIERS.length - 1; i >= 0; i--) {
            if (this.score >= TIERS[i].min) {
                return TIERS[i];
            }
        }
        return TIERS[0];
    }

    getRevenuePerTech() {
        return this.totalRevenue;
    }

    getFirstTimeFixRate() {
        if (this.jobsCompleted === 0) return 100;
        // Approximate: fewer hits relative to jobs = higher rate
        const rate = Math.max(0, 100 - (this.hitsTaken / Math.max(1, this.jobsCompleted)) * 50);
        return Math.round(rate);
    }

    getSummary() {
        const tier = this.getTier();
        return {
            score: this.score,
            profitMargin: Math.round(this.profitMargin),
            revenuePerTech: this.getRevenuePerTech(),
            firstTimeFixRate: this.getFirstTimeFixRate(),
            bestStreak: this.bestStreak,
            jobsCompleted: this.jobsCompleted,
            wavesCompleted: this.wavesCompleted,
            tier: tier,
        };
    }
}
