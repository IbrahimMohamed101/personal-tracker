const mongoose = require('mongoose');

const TrackerDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    energy: { type: Number, default: 5 },
    dayType: { type: String, default: 'normal' },
    habits: [{
        id: String,
        name: String,
        done: [String] // Array of date strings ISO
    }],
    expenses: [{
        id: Number,
        amt: Number,
        cat: String,
        note: String,
        date: String,
        createdAt: String
    }],
    savingsGoal: { type: Number, default: 5000 },
    problems: [{
        id: Number,
        title: String,
        solution: String,
        duration: String,
        status: String,
        note: String,
        createdAt: String
    }],
    goals: [{
        id: Number,
        icon: String,
        title: String,
        detail: String,
        pct: Number,
        deadline: String
    }],
    tasks: [{
        id: Number,
        title: String,
        priority: String,
        repeatType: String,
        goalId: Number,
        done: Boolean,
        date: String,
        createdAt: String
    }],
    journal: [{
        id: Number,
        date: String,
        content: String,
        gratitude1: String,
        gratitude2: String,
        gratitude3: String,
        energy: Number,
        mood: Number,
        createdAt: String
    }],
    budgets: { type: Map, of: {
        id: String,
        category: String,
        limit: Number
    }, default: {} },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    weeklyChallenge: { type: String, default: null },
    weeklyChallengeDone: { type: Boolean, default: false },
    weeklyChallengeProgress: { type: Number, default: 0 },
    energyHistory: [{
        date: String,
        value: Number
    }],
    mvdDone: { type: Map, of: [Number], default: {} },
    weekly: {
        w1: String,
        w2: String,
        w3: String,
        w4: String
    },
    weeklyHistory: [{
        id: Number,
        date: String,
        w1: String,
        w2: String,
        w3: String,
        w4: String,
        createdAt: String
    }],
    moodLog: [{
        id: Number,
        date: String,
        mood: Number,
        note: String,
        createdAt: String
    }],
    settings: {
        fontScale: { type: Number, default: 1 },
        language: { type: String, default: 'ar' }
    },
    pomodoro: {
        mode: { type: String, default: 'focus' },
        remainingSec: { type: Number, default: 1500 },
        running: { type: Boolean, default: false },
        lastTickAt: { type: String, default: null },
        sessionsToday: { type: Map, of: Number, default: {} },
        totalSessions: { type: Number, default: 0 }
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrackerData', TrackerDataSchema);
