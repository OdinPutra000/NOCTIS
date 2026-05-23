// ===== NOCTIS V2 PREDICTIVE PREPARATION MEMORY =====
// Prepares and structures internal state memory layers to support V3 predictive models

export class BehaviorMemoryStore {
  constructor() {
    this.memory = {}; // entityId -> Array of historic behavior profiles
  }

  recordSnapshot(entityId, profile) {
    if (!this.memory[entityId]) {
      this.memory[entityId] = [];
    }
    this.memory[entityId].push({
      timestamp: new Date().toISOString(),
      score: profile.behaviorScore,
      flags: [...profile.behaviorFlags],
      dimensions: { ...profile.dimensions }
    });

    // Limit memory history to last 50 snapshots
    if (this.memory[entityId].length > 50) {
      this.memory[entityId].shift();
    }
  }

  getBaseline(entityId) {
    const history = this.memory[entityId] || [];
    if (history.length === 0) return 0;
    const total = history.reduce((sum, h) => sum + h.score, 0);
    return Math.round(total / history.length);
  }
}

export class AnomalyTrendStore {
  constructor() {
    this.history = []; // Array of anomaly occurrences with timestamps
  }

  recordAnomalyOccurrence(anomaly) {
    this.history.push({
      timestamp: anomaly.timestamp || new Date().toISOString(),
      anomalyId: anomaly.id,
      type: anomaly.type,
      severity: anomaly.severity
    });
  }

  getFrequencyTrend(days = 7) {
    const cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - days);
    
    const activeHistory = this.history.filter(h => new Date(h.timestamp) >= cutOff);
    
    const counts = {};
    activeHistory.forEach(h => {
      counts[h.type] = (counts[h.type] || 0) + 1;
    });

    return counts;
  }
}

export class EscalationTracker {
  constructor() {
    this.escalations = {}; // entityId -> tracking state
  }

  updateTrack(entityId, currentScore) {
    if (!this.escalations[entityId]) {
      this.escalations[entityId] = {
        initialScore: currentScore,
        maxScore: currentScore,
        history: [],
        alertTriggered: false
      };
    }

    const track = this.escalations[entityId];
    track.history.push(currentScore);
    track.maxScore = Math.max(track.maxScore, currentScore);

    // Alert triggers if score rises by 30+ points from baseline
    if (currentScore - track.initialScore >= 30 && !track.alertTriggered) {
      track.alertTriggered = true;
      return true; // Trigger alert flag
    }
    return false;
  }
}

export class PatternMemory {
  constructor() {
    this.recognizedSignatures = []; // List of signature occurrences
  }

  recordPattern(pattern) {
    this.recognizedSignatures.push({
      timestamp: new Date().toISOString(),
      patternId: pattern.id,
      type: pattern.type,
      confidence: pattern.confidence
    });
  }
}

export const PREDICTIVE_MEMORY = {
  behaviorMemory: new BehaviorMemoryStore(),
  anomalyTrends: new AnomalyTrendStore(),
  escalations: new EscalationTracker(),
  patterns: new PatternMemory()
};
