// ===== NOCTIS V2 TIMELINE INTELLIGENCE ENGINE =====
// Client-side chronosequential event analysis and threat escalation tracking

/**
 * Analyzes event streams for triggers, escalation chains, anomalies, and operational density.
 * @param {Array} events 
 * @param {Array} entities 
 * @returns {Object} Comprehensive timeline intelligence report
 */
export function analyzeTimeline(events, entities) {
  if (!events || events.length === 0) {
    return {
      spikes: [],
      escalations: [],
      suspiciousPeriods: [],
      correlatedGroups: [],
      activityDensity: { hourly: Array(24).fill(0), daily: {} },
      heatIntensity: {}
    };
  }

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // 1. DENSITY SPIKE DETECTION
  // Look for clusters of events occurring in narrow windows
  const spikes = [];
  const timeThresholdMs = 24 * 3600 * 1000; // 24 hours window
  
  for (let i = 0; i < sortedEvents.length; i++) {
    const windowStart = new Date(sortedEvents[i].timestamp);
    const windowEvents = [sortedEvents[i]];
    
    for (let j = i + 1; j < sortedEvents.length; j++) {
      const t = new Date(sortedEvents[j].timestamp);
      if (t - windowStart <= timeThresholdMs) {
        windowEvents.push(sortedEvents[j]);
      } else {
        break;
      }
    }
    
    if (windowEvents.length >= 3) {
      // Find average risk and severity
      const hasCritical = windowEvents.some(e => e.severity === 'critical');
      const hasHigh = windowEvents.some(e => e.severity === 'high');
      
      let severity = 'LOW';
      if (hasCritical) severity = 'CRITICAL';
      else if (hasHigh) severity = 'HIGH';
      else if (windowEvents.some(e => e.severity === 'medium')) severity = 'MEDIUM';

      spikes.push({
        timestamp: windowEvents[0].timestamp,
        count: windowEvents.length,
        events: windowEvents.map(e => e.id),
        severity
      });
      
      // Advance counter to skip overlapping spikes
      i += windowEvents.length - 1;
    }
  }

  // 2. ESCALATION CHAIN TRACKING
  // Find sequences where severity of events linked to the same entity or network rises over time.
  const escalations = [];
  
  // Group events by entity
  const entityEventMap = {};
  sortedEvents.forEach(ev => {
    (ev.entities || []).forEach(entId => {
      if (!entityEventMap[entId]) entityEventMap[entId] = [];
      entityEventMap[entId].push(ev);
    });
  });

  const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };

  Object.entries(entityEventMap).forEach(([entId, entEvs]) => {
    if (entEvs.length < 3) return; // Need at least 3 events to track progression
    
    let currentChain = [entEvs[0]];
    
    for (let i = 1; i < entEvs.length; i++) {
      const prevEv = entEvs[i - 1];
      const currEv = entEvs[i];
      
      const prevWeight = severityOrder[prevEv.severity] || 1;
      const currWeight = severityOrder[currEv.severity] || 1;
      
      // Check if severity is equal or escalating
      if (currWeight >= prevWeight) {
        currentChain.push(currEv);
      } else {
        if (currentChain.length >= 3 && currentChain[currentChain.length - 1].severity === 'critical') {
          escalations.push({
            entityId: entId,
            entityName: entities.find(e => e.id === entId)?.name || 'Unknown Subject',
            chain: currentChain.map(c => c.id),
            startTime: currentChain[0].timestamp,
            endTime: currentChain[currentChain.length - 1].timestamp,
            progression: currentChain.map(c => c.severity.toUpperCase()).join(' → ')
          });
        }
        currentChain = [currEv];
      }
    }
    
    // Check trailing chain
    if (currentChain.length >= 3 && currentChain[currentChain.length - 1].severity === 'critical') {
      escalations.push({
        entityId: entId,
        entityName: entities.find(e => e.id === entId)?.name || 'Unknown Subject',
        chain: currentChain.map(c => c.id),
        startTime: currentChain[0].timestamp,
        endTime: currentChain[currentChain.length - 1].timestamp,
        progression: currentChain.map(c => c.severity.toUpperCase()).join(' → ')
      });
    }
  });

  // 3. SUSPICIOUS OPERATIONAL WINDOWS
  // Mark specific calendar periods where anomalies or critical operations clustered.
  const suspiciousPeriods = [];
  let currentWindow = null;

  sortedEvents.forEach(ev => {
    const isSusp = ev.severity === 'critical' || ev.severity === 'high' || ev.type === 'alert' || ev.category === 'incident';
    
    if (isSusp) {
      const t = new Date(ev.timestamp);
      if (!currentWindow) {
        currentWindow = {
          start: ev.timestamp,
          end: ev.timestamp,
          events: [ev],
          reason: ev.title
        };
      } else {
        const lastT = new Date(currentWindow.end);
        const diffHrs = Math.abs(t - lastT) / 3600000;
        
        if (diffHrs <= 48) { // group within 48 hours
          currentWindow.end = ev.timestamp;
          currentWindow.events.push(ev);
        } else {
          if (currentWindow.events.length >= 2) {
            suspiciousPeriods.push(currentWindow);
          }
          currentWindow = {
            start: ev.timestamp,
            end: ev.timestamp,
            events: [ev],
            reason: ev.title
          };
        }
      }
    }
  });

  if (currentWindow && currentWindow.events.length >= 2) {
    suspiciousPeriods.push(currentWindow);
  }

  // 4. TEMPORAL CORRELATION GROUPING
  // Group events involving overlapping entities within 12 hours of each other
  const correlatedGroups = [];
  const overlapWindowMs = 12 * 3600 * 1000;

  for (let i = 0; i < sortedEvents.length; i++) {
    const baseEv = sortedEvents[i];
    const group = [baseEv];
    const sharedSet = new Set(baseEv.entities || []);
    
    if (sharedSet.size === 0) continue;

    for (let j = i + 1; j < sortedEvents.length; j++) {
      const compareEv = sortedEvents[j];
      const diff = Math.abs(new Date(compareEv.timestamp) - new Date(baseEv.timestamp));
      
      if (diff <= overlapWindowMs) {
        const intersects = (compareEv.entities || []).some(ent => sharedSet.has(ent));
        if (intersects) {
          group.push(compareEv);
          (compareEv.entities || []).forEach(ent => sharedSet.add(ent));
        }
      } else {
        break;
      }
    }

    if (group.length >= 2) {
      correlatedGroups.push({
        id: `corr_group_${i}`,
        events: group.map(g => g.id),
        sharedEntities: Array.from(sharedSet),
        timeWindow: `${Math.round(Math.abs(new Date(group[group.length - 1].timestamp) - new Date(group[0].timestamp)) / 3600000)}h`
      });
      i += group.length - 1;
    }
  }

  // 5. ACTIVITY DENSITY & HEAT MAPS
  const hourly = Array(24).fill(0);
  const daily = {};

  sortedEvents.forEach(ev => {
    const date = new Date(ev.timestamp);
    
    // Hourly distribution
    const hr = date.getUTCHours();
    hourly[hr] = (hourly[hr] || 0) + 1;

    // Daily distribution
    const dateString = date.toISOString().split('T')[0];
    daily[dateString] = (daily[dateString] || 0) + 1;
  });

  // Convert daily counts to heat intensity scores (normalized 0 to 1)
  const maxEvents = Math.max(...Object.values(daily), 1);
  const heatIntensity = {};
  Object.entries(daily).forEach(([day, count]) => {
    heatIntensity[day] = count / maxEvents;
  });

  return {
    spikes: spikes.slice(0, 5),
    escalations,
    suspiciousPeriods: suspiciousPeriods.map(p => ({
      start: p.start,
      end: p.end,
      count: p.events.length,
      explanation: `Concentrated threat envelope containing ${p.events.length} high-severity events over a ${Math.round(Math.abs(new Date(p.end) - new Date(p.start)) / 3600000)}h operational span. Initiated by "${p.reason}".`,
      events: p.events.map(e => e.id)
    })),
    correlatedGroups,
    activityDensity: { hourly, daily },
    heatIntensity
  };
}
