import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import useStore from '../../store/investigationStore';
import { ENTITY_COLORS, ENTITY_ICON_LETTERS, ENTITY_TYPE_LABELS } from '../../data/sampleCase';
import { getRiskLevel, getRiskColor } from '../../engine/riskEngine';
import {
  Plus, Minus, Focus, Lock, Unlock, Search, Filter,
  Maximize2, Minimize2, Route, Layers, RotateCcw, X, Activity, AlertOctagon
} from 'lucide-react';

const styleBlock = `
  @keyframes tacticalPulseRing {
    0% { r: 16; stroke-opacity: 0.9; stroke-width: 1.5; }
    50% { r: 26; stroke-opacity: 0.2; stroke-width: 0.8; }
    100% { r: 34; stroke-opacity: 0; stroke-width: 0; }
  }
  .pulse-ring-anomaly {
    animation: tacticalPulseRing 2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
  }
  @keyframes edgeFlow {
    to { stroke-dashoffset: -20; }
  }
  .edge-flow-active {
    stroke-dasharray: 6,4;
    animation: edgeFlow 1.2s linear infinite !important;
  }
`;

export default function GraphView() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const zoomRef = useRef(null);
  const gRef = useRef(null);
  const nodesDataRef = useRef([]);
  const linksDataRef = useRef([]);
  const simRef = useRef(null);

  const {
    entities, relationships, entityFilters, selectedEntity, setSelectedEntity,
    graphLocked, toggleGraphLock, graphSearchQuery, setGraphSearchQuery,
    highlightedNodeIds, highlightedEdgeIds,
    shortestPathActive, shortestPathNodes, shortestPathResult,
    toggleShortestPathMode, addShortestPathNode, clearHighlights,
    highlightCluster, clusterHighlightType, resetGraphLayout, graphLayoutVersion,
    toggleEntityFilter,
    
    // V2 Behavioral states
    anomalies, behaviorProfiles, relationshipConfidence, clusters, 
    selectedCluster, selectCluster, graphOverlay, setGraphOverlay, operationalPatterns
  } = useStore();

  const lastLayoutVersionRef = useRef(graphLayoutVersion);

  const [filterOpen, setFilterOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);

  const filteredEntities = useMemo(() => entities.filter(e => entityFilters[e.type]), [entities, entityFilters]);
  const filteredIds = useMemo(() => new Set(filteredEntities.map(e => e.id)), [filteredEntities]);
  const filteredRels = useMemo(() => relationships.filter(r => filteredIds.has(r.source) && filteredIds.has(r.target)), [relationships, filteredIds]);

  const searchMatches = useMemo(() => {
    if (!graphSearchQuery.trim()) return new Set();
    const q = graphSearchQuery.toLowerCase();
    return new Set(filteredEntities.filter(e => {
      if (e.name.toLowerCase().includes(q)) return true;
      if (e.type.toLowerCase().includes(q)) return true;
      if (e.metadata) {
        return Object.values(e.metadata).some(v => String(v).toLowerCase().includes(q));
      }
      return false;
    }).map(e => e.id));
  }, [graphSearchQuery, filteredEntities]);

  // Pattern highlight sets
  const patternNodeSet = useMemo(() => {
    if (!selectedPattern) return null;
    return new Set(selectedPattern.involvedEntities || []);
  }, [selectedPattern]);

  const hasHighlights = highlightedNodeIds.length > 0 || searchMatches.size > 0 || selectedCluster !== null || selectedPattern !== null;
  
  const activeHighlightSet = useMemo(() => {
    if (searchMatches.size > 0) return searchMatches;
    if (selectedPattern) return patternNodeSet;
    if (selectedCluster) {
      const c = clusters.find(cl => cl.id === selectedCluster);
      return c ? new Set(c.entities) : null;
    }
    if (highlightedNodeIds.length > 0) return new Set(highlightedNodeIds);
    return null;
  }, [searchMatches, highlightedNodeIds, selectedCluster, clusters, selectedPattern, patternNodeSet]);

  const activeEdgeSet = useMemo(() => {
    if (highlightedEdgeIds.length > 0) return new Set(highlightedEdgeIds);
    if (selectedPattern) {
      // Find relationships between pattern entities
      const pNodes = patternNodeSet;
      if (pNodes) {
        const edges = filteredRels.filter(r => pNodes.has(r.source) && pNodes.has(r.target)).map(r => r.id);
        return new Set(edges);
      }
    }
    if (selectedCluster) {
      const c = clusters.find(cl => cl.id === selectedCluster);
      if (c) {
        const cNodes = new Set(c.entities);
        const edges = filteredRels.filter(r => cNodes.has(r.source) && cNodes.has(r.target)).map(r => r.id);
        return new Set(edges);
      }
    }
    return null;
  }, [highlightedEdgeIds, selectedCluster, clusters, filteredRels, selectedPattern, patternNodeSet]);

  const renderGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);

    if (filteredEntities.length === 0) {
      svg.append('text').attr('x', width / 2).attr('y', height / 2)
        .attr('text-anchor', 'middle').attr('fill', '#4b5563')
        .attr('font-size', '12px').attr('font-family', 'JetBrains Mono, monospace')
        .text('No data loaded — ingest intelligence to populate graph.');
      return;
    }

    const layoutReset = lastLayoutVersionRef.current !== graphLayoutVersion;
    lastLayoutVersionRef.current = graphLayoutVersion;

    // Preserve node coordinate mappings from old simulation unless reset was triggered
    const oldNodeMap = layoutReset ? new Map() : new Map(nodesDataRef.current.map(n => [n.id, n]));
    const nodes = filteredEntities.map(e => {
      const old = oldNodeMap.get(e.id);
      return old ? { ...e, x: old.x, y: old.y, vx: old.vx, vy: old.vy, fx: old.fx, fy: old.fy } : { ...e };
    });
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const links = filteredRels.map(r => ({
      ...r, source: nodeMap.get(r.source), target: nodeMap.get(r.target)
    })).filter(l => l.source && l.target);

    nodesDataRef.current = nodes;
    linksDataRef.current = links;

    // Zoom
    const g = svg.append('g');
    gRef.current = g;
    const zoom = d3.zoom().scaleExtent([0.15, 5]).on('zoom', (ev) => g.attr('transform', ev.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    // Grid
    const defs = svg.append('defs');
    defs.append('pattern').attr('id', 'grid').attr('width', 40).attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('circle').attr('cx', 1).attr('cy', 1).attr('r', 0.6).attr('fill', '#0d0d0d');
    g.append('rect').attr('width', width * 6).attr('height', height * 6)
      .attr('x', -width * 3).attr('y', -height * 3).attr('fill', 'url(#grid)');

    // Pre-stabilize simulation with powerful, expansive forces
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => 160 + (d.weight || 3) * 15).strength(1))
      .force('charge', d3.forceManyBody().strength(-1800).distanceMax(1200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(75).strength(1))
      .alphaDecay(0.015).velocityDecay(0.3).stop();
      
    // Run simulation if nodes are new or layout has been reset
    if (nodes.length > 0 && (nodes[0].x === undefined || layoutReset)) {
      for (let i = 0; i < 450; i++) sim.tick();
    }
    simRef.current = sim;

    // Background cluster boundaries
    const hullsGroup = g.append('g').attr('class', 'hulls-group');
    if (graphOverlay === 'clusters' && clusters && clusters.length > 0) {
      clusters.forEach((cluster, idx) => {
        const clusterNodes = nodes.filter(n => cluster.entities.includes(n.id));
        const color = idx % 2 === 0 ? '#ff1e1e' : '#d4910a';
        const fill = idx % 2 === 0 ? 'rgba(255, 30, 30, 0.035)' : 'rgba(212, 145, 10, 0.035)';
        
        if (clusterNodes.length >= 3) {
          const points = clusterNodes.map(n => [n.x, n.y]);
          const hull = d3.polygonHull(points);
          if (hull) {
            const line = d3.line().curve(d3.curveBasisClosed);
            const center = [d3.mean(points, p => p[0]), d3.mean(points, p => p[1])];
            const paddedHull = hull.map(p => {
              const dx = p[0] - center[0];
              const dy = p[1] - center[1];
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              return [p[0] + (dx / len) * 22, p[1] + (dy / len) * 22];
            });

            hullsGroup.append('path')
              .attr('d', line(paddedHull))
              .attr('fill', fill)
              .attr('stroke', color)
              .attr('stroke-width', 1.2)
              .attr('stroke-opacity', 0.4)
              .attr('stroke-dasharray', '4,4')
              .attr('cursor', 'pointer')
              .on('click', (event) => {
                event.stopPropagation();
                selectCluster(selectedCluster === cluster.id ? null : cluster.id);
              });
            
            hullsGroup.append('text')
              .attr('x', center[0])
              .attr('y', d3.min(paddedHull, p => p[1]) - 8)
              .attr('text-anchor', 'middle')
              .attr('fill', color)
              .attr('font-size', '8px')
              .attr('font-family', 'JetBrains Mono, monospace')
              .attr('font-weight', '600')
              .attr('opacity', 0.8)
              .text(cluster.name);
          }
        } else if (clusterNodes.length === 2) {
          const [n1, n2] = clusterNodes;
          hullsGroup.append('line')
            .attr('x1', n1.x).attr('y1', n1.y)
            .attr('x2', n2.x).attr('y2', n2.y)
            .attr('stroke', color)
            .attr('stroke-width', 32)
            .attr('stroke-linecap', 'round')
            .attr('stroke-opacity', 0.04)
            .attr('cursor', 'pointer')
            .on('click', (event) => {
              event.stopPropagation();
              selectCluster(selectedCluster === cluster.id ? null : cluster.id);
            });
            
          hullsGroup.append('line')
            .attr('x1', n1.x).attr('y1', n1.y)
            .attr('x2', n2.x).attr('y2', n2.y)
            .attr('stroke', color)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.3)
            .attr('stroke-dasharray', '4,4');

          hullsGroup.append('text')
            .attr('x', (n1.x + n2.x) / 2)
            .attr('y', (n1.y + n2.y) / 2 - 14)
            .attr('text-anchor', 'middle')
            .attr('fill', color)
            .attr('font-size', '8px')
            .attr('font-family', 'JetBrains Mono, monospace')
            .attr('font-weight', '600')
            .attr('opacity', 0.8)
            .text(cluster.name);
        } else if (clusterNodes.length === 1) {
          const n = clusterNodes[0];
          hullsGroup.append('circle')
            .attr('cx', n.x).attr('cy', n.y)
            .attr('r', 28)
            .attr('fill', fill)
            .attr('stroke', color)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.3)
            .attr('stroke-dasharray', '4,4')
            .attr('cursor', 'pointer')
            .on('click', (event) => {
              event.stopPropagation();
              selectCluster(selectedCluster === cluster.id ? null : cluster.id);
            });

          hullsGroup.append('text')
            .attr('x', n.x)
            .attr('y', n.y - 32)
            .attr('text-anchor', 'middle')
            .attr('fill', color)
            .attr('font-size', '8px')
            .attr('font-family', 'JetBrains Mono, monospace')
            .attr('font-weight', '600')
            .attr('opacity', 0.8)
            .text(cluster.name);
        }
      });
    }

    // Edge and node groups
    const linkGroup = g.append('g').attr('class', 'links');
    const linkLabelGroup = g.append('g').attr('class', 'link-labels');
    const nodeGroup = g.append('g').attr('class', 'nodes');

    // Draw edges
    const link = linkGroup.selectAll('line').data(links).join('line')
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      .attr('stroke', d => {
        if (graphOverlay === 'confidence') {
          const c = relationshipConfidence[d.id]?.confidence;
          if (c !== undefined) {
            if (c >= 80) return '#ef4444';
            if (c >= 55) return '#f59e0b';
            return '#3b82f6';
          }
        }
        return d.suspicious ? '#ff1e1e' : (d.weight <= 3 ? '#d4910a' : '#222222');
      })
      .attr('stroke-width', d => {
        if (graphOverlay === 'confidence') {
          const c = relationshipConfidence[d.id]?.confidence;
          return c ? 1.0 + (c / 60) : 1;
        }
        return d.suspicious ? 1.5 : 1;
      })
      .attr('stroke-opacity', d => {
        if (graphOverlay === 'confidence') {
          const c = relationshipConfidence[d.id]?.confidence;
          return c ? 0.2 + (c / 130) : 0.2;
        }
        return d.suspicious ? 0.7 : 0.35;
      })
      .attr('stroke-dasharray', d => {
        if (graphOverlay === 'confidence') {
          const c = relationshipConfidence[d.id]?.confidence;
          return c && c < 45 ? '2,4' : 'none';
        }
        return d.suspicious ? '6,4' : (d.weight <= 3 ? '2,4' : 'none');
      })
      .attr('class', d => d.suspicious ? 'edge-flow-active' : '')
      .attr('data-id', d => d.id);

    // Edge labels
    const linkLabel = linkLabelGroup.selectAll('text').data(links).join('text')
      .attr('text-anchor', 'middle').attr('fill', '#444444').attr('font-size', '7px')
      .attr('font-family', 'JetBrains Mono, monospace').attr('pointer-events', 'none')
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2 - 4)
      .text(d => {
        if (graphOverlay === 'confidence') {
          const c = relationshipConfidence[d.id]?.confidence;
          return c ? `${d.label} [${c}%]` : d.label;
        }
        return d.label || '';
      });

    // Draw nodes
    const node = nodeGroup.selectAll('g').data(nodes).join('g')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('cursor', 'pointer')
      .attr('data-id', d => d.id);

    // Selection ring
    node.append('circle').attr('r', 20).attr('fill', 'none')
      .attr('stroke', '#ffffff').attr('stroke-width', 0).attr('class', 'selection-ring');

    // Pulsing Red Anomaly Ring (rendered behind node)
    node.each(function(d) {
      const hasAnomaly = anomalies.some(an => an.affectedEntities.includes(d.id));
      if (hasAnomaly) {
        d3.select(this).insert('circle', ':first-child')
          .attr('r', 16)
          .attr('fill', 'none')
          .attr('stroke', '#ff1e1e')
          .attr('class', 'pulse-ring-anomaly');
      }
    });

    // Outer ring
    node.append('circle').attr('r', 16).attr('fill', 'none')
      .attr('stroke', d => ENTITY_COLORS[d.type] || '#6b7280')
      .attr('stroke-width', 1).attr('stroke-opacity', 0.45);

    // Main circle
    node.append('circle')
      .attr('class', 'main-circle')
      .attr('r', 13)
      .attr('fill', d => {
        if (graphOverlay === 'behavior_heat') {
          const score = behaviorProfiles[d.id]?.behaviorScore;
          if (score !== undefined) {
            if (score >= 80) return '#ef4444';
            if (score >= 55) return '#f97316';
            if (score >= 30) return '#eab308';
            return '#10b981';
          }
        }
        return ENTITY_COLORS[d.type] || '#6b7280';
      })
      .attr('fill-opacity', 0.85).attr('stroke', '#000000').attr('stroke-width', 1.5);

    // Type letter
    node.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', '#ffffff').attr('font-size', '9px').attr('font-weight', '700')
      .attr('font-family', 'JetBrains Mono, monospace').attr('pointer-events', 'none')
      .text(d => ENTITY_ICON_LETTERS[d.type] || '?');

    // Risk dot
    node.append('circle').attr('cx', 9).attr('cy', -9).attr('r', 3.5)
      .attr('fill', d => getRiskColor(d.risk)).attr('stroke', '#000000').attr('stroke-width', 1);

    // Labels
    node.append('text').attr('dy', 26).attr('text-anchor', 'middle')
      .attr('fill', '#aaaaaa').attr('font-size', '8.5px')
      .attr('font-family', 'JetBrains Mono, monospace').attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text(d => d.name.length > 18 ? d.name.slice(0, 16) + '…' : d.name);

    // Drag behavior
    if (!graphLocked) {
      node.call(d3.drag()
        .on('start', function (event, d) {
          d3.select(this).raise();
        })
        .on('drag', function (event, d) {
          d.x = event.x; d.y = event.y;
          d.fx = event.x; d.fy = event.y;
          d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
          link.filter(l => l.source.id === d.id).attr('x1', d.x).attr('y1', d.y);
          link.filter(l => l.target.id === d.id).attr('x2', d.x).attr('y2', d.y);
          linkLabel.filter(l => l.source.id === d.id)
            .attr('x', l => (l.source.x + l.target.x) / 2)
            .attr('y', l => (l.source.y + l.target.y) / 2 - 4);
          linkLabel.filter(l => l.target.id === d.id)
            .attr('x', l => (l.source.x + l.target.x) / 2)
            .attr('y', l => (l.source.y + l.target.y) / 2 - 4);
        })
        .on('end', function () {})
      );
    }

    // Click
    node.on('click', (event, d) => {
      event.stopPropagation();
      if (shortestPathActive) {
        addShortestPathNode(d.id);
        return;
      }
      setSelectedEntity(d);
    });

    // Double click - expand (highlight connected)
    node.on('dblclick', (event, d) => {
      event.stopPropagation();
      const connIds = relationships
        .filter(r => r.source === d.id || r.target === d.id)
        .map(r => r.source === d.id ? r.target : r.source);
      const allIds = [d.id, ...connIds];
      const edgeIds = relationships
        .filter(r => allIds.includes(r.source) && allIds.includes(r.target))
        .map(r => r.id);
      useStore.getState().setHighlightedNodes(allIds);
      useStore.getState().setHighlightedEdges(edgeIds);
    });

    // Hover tooltip
    node.on('mouseenter', (event, d) => {
      if (!tooltipRef.current) return;
      const tt = tooltipRef.current;
      tt.style.display = 'block';
      
      const profile = behaviorProfiles[d.id];
      const flagsStr = profile && profile.behaviorFlags.length > 0
        ? `<div class="tt-row" style="margin-top:4px;"><span class="tt-label">Flags</span><span class="tt-value" style="color:#ff1e1e; font-size:8px;">${profile.behaviorFlags.join(', ')}</span></div>`
        : '';
        
      tt.innerHTML = `
        <div class="tt-name">${d.name}</div>
        <div class="tt-row"><span class="tt-label">Type</span><span class="tt-value">${ENTITY_TYPE_LABELS[d.type] || d.type}</span></div>
        <div class="tt-row"><span class="tt-label">Risk</span><span class="tt-value" style="color:${getRiskColor(d.risk)}">${d.risk} — ${getRiskLevel(d.risk)}</span></div>
        ${profile ? `<div class="tt-row"><span class="tt-label">Behavior</span><span class="tt-value" style="color:${getRiskColor(profile.behaviorScore)}">${profile.behaviorScore} (${profile.trend})</span></div>` : ''}
        ${d.status ? `<div class="tt-row"><span class="tt-label">Status</span><span class="tt-value">${d.status}</span></div>` : ''}
        ${flagsStr}
      `;
    }).on('mousemove', (event) => {
      if (!tooltipRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      tooltipRef.current.style.left = (event.clientX - rect.left + 14) + 'px';
      tooltipRef.current.style.top = (event.clientY - rect.top - 10) + 'px';
    }).on('mouseleave', () => {
      if (tooltipRef.current) tooltipRef.current.style.display = 'none';
    });

    // Edge hover
    link.on('mouseenter', function (event, d) {
      d3.select(this).attr('stroke-opacity', 0.9).attr('stroke-width', 2.5);
    }).on('mouseleave', function (event, d) {
      d3.select(this)
        .attr('stroke-opacity', d => {
          if (graphOverlay === 'confidence') {
            const c = relationshipConfidence[d.id]?.confidence;
            return c ? 0.2 + (c / 130) : 0.2;
          }
          return d.suspicious ? 0.7 : 0.35;
        })
        .attr('stroke-width', d => {
          if (graphOverlay === 'confidence') {
            const c = relationshipConfidence[d.id]?.confidence;
            return c ? 1.0 + (c / 60) : 1;
          }
          return d.suspicious ? 1.5 : 1;
        });
    });

    svg.on('click', () => {
      setSelectedEntity(null);
      selectCluster(null);
      setSelectedPattern(null);
      if (!shortestPathActive) clearHighlights();
    });

    // Fit view perfectly centered
    const s = 0.85;
    svg.call(zoom.transform, d3.zoomIdentity.translate(width * (1 - s) / 2, height * (1 - s) / 2).scale(s));

  }, [filteredEntities, filteredRels, graphLocked, shortestPathActive, graphLayoutVersion, graphOverlay, clusters, anomalies, behaviorProfiles, relationshipConfidence]);

  // Apply highlights reactively
  useEffect(() => {
    if (!gRef.current) return;
    const g = gRef.current;

    // Reset all opacities
    g.selectAll('.nodes g').attr('opacity', 1);
    g.selectAll('.links line').attr('opacity', 1);
    g.selectAll('.link-labels text').attr('opacity', 1);

    // Selection ring
    g.selectAll('.selection-ring')
      .attr('stroke-width', d => selectedEntity?.id === d.id ? 2.5 : 0)
      .attr('stroke', '#ff1e1e');

    // SP mode node indicator
    if (shortestPathActive && shortestPathNodes.length > 0) {
      g.selectAll('.selection-ring')
        .attr('stroke-width', d => shortestPathNodes.includes(d.id) ? 2.5 : (selectedEntity?.id === d.id ? 2.5 : 0))
        .attr('stroke', d => shortestPathNodes.includes(d.id) ? '#3b82f6' : '#ff1e1e');
    }

    if (!activeHighlightSet && !activeEdgeSet) return;

    // Dim non-highlighted elements
    if (activeHighlightSet) {
      g.selectAll('.nodes g').attr('opacity', d => activeHighlightSet.has(d.id) ? 1 : 0.12);
      g.selectAll('.links line').attr('opacity', d => {
        if (activeEdgeSet) return activeEdgeSet.has(d.id) ? 1 : 0.05;
        return (activeHighlightSet.has(d.source.id) && activeHighlightSet.has(d.target.id)) ? 0.6 : 0.05;
      });
      g.selectAll('.link-labels text').attr('opacity', d => {
        if (activeEdgeSet) return activeEdgeSet.has(d.id) ? 1 : 0.05;
        return (activeHighlightSet.has(d.source.id) && activeHighlightSet.has(d.target.id)) ? 0.6 : 0.05;
      });
    }

    // Shortest path highlights
    if (shortestPathResult.length > 1 && activeEdgeSet) {
      g.selectAll('.links line')
        .filter(d => activeEdgeSet.has(d.id))
        .attr('stroke', '#3b82f6').attr('stroke-width', 2.5).attr('stroke-opacity', 1).attr('stroke-dasharray', 'none')
        .attr('class', 'edge-flow-active');
      g.selectAll('.nodes g')
        .filter(d => activeHighlightSet?.has(d.id))
        .select('.selection-ring')
        .attr('stroke-width', 2.5).attr('stroke', '#3b82f6');
    }
  }, [activeHighlightSet, activeEdgeSet, selectedEntity, shortestPathActive, shortestPathNodes, shortestPathResult, selectedCluster, selectedPattern]);

  useEffect(() => {
    renderGraph();
    const handleResize = () => renderGraph();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderGraph]);

  const handleZoom = (factor) => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(200).call(zoomRef.current.scaleBy, factor);
    }
  };

  const handleFitView = () => {
    if (svgRef.current && zoomRef.current && containerRef.current) {
      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const s = 0.85;
      d3.select(svgRef.current).transition().duration(400)
        .call(zoomRef.current.transform, d3.zoomIdentity.translate(width * (1 - s) / 2, height * (1 - s) / 2).scale(s));
    }
  };

  const handleExpand = () => {
    if (!selectedEntity) return;
    const connIds = relationships
      .filter(r => r.source === selectedEntity.id || r.target === selectedEntity.id)
      .map(r => r.source === selectedEntity.id ? r.target : r.source);
    const allIds = [selectedEntity.id, ...connIds];
    const edgeIds = relationships
      .filter(r => allIds.includes(r.source) && allIds.includes(r.target))
      .map(r => r.id);
    useStore.getState().setHighlightedNodes(allIds);
    useStore.getState().setHighlightedEdges(edgeIds);
  };

  const handleCollapse = () => {
    clearHighlights();
    setSelectedPattern(null);
    selectCluster(null);
  };

  const handleClusterSelect = () => {
    if (!selectedEntity) return;
    const associatedCluster = clusters.find(c => c.entities.includes(selectedEntity.id));
    if (associatedCluster) {
      selectCluster(selectedCluster === associatedCluster.id ? null : associatedCluster.id);
    } else {
      highlightCluster(selectedEntity.type);
    }
  };

  const entityTypes = ['person', 'device', 'email', 'phone', 'ip', 'domain', 'location', 'organization', 'event'];

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#000000]" id="graph-intelligence-engine">
      <style dangerouslySetInnerHTML={{ __html: styleBlock }} />
      
      {/* Tooltip */}
      <div ref={tooltipRef} className="graph-tooltip" style={{ display: 'none' }} />

      {/* Top Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-[#0a0a0a]/95 backdrop-blur-sm border border-[#1a1a1a] rounded px-2 py-1 max-w-[90%]">
        <TBtn icon={Maximize2} label="Expand" onClick={handleExpand} disabled={!selectedEntity} />
        <TBtn icon={Minimize2} label="Collapse" onClick={handleCollapse} />
        
        {/* Filter Dropdown */}
        <div className="relative">
          <TBtn icon={Filter} label="Filter" onClick={() => setFilterOpen(!filterOpen)} active={filterOpen} />
          {filterOpen && (
            <div className="graph-filter-dropdown border-[#ff1e1e]/20" onClick={e => e.stopPropagation()}>
              <div className="text-[9px] uppercase tracking-widest text-[#6b7280] font-semibold mb-2 px-1">Entity Filters</div>
              {entityTypes.map(t => (
                <label key={t} className="graph-filter-item">
                  <input type="checkbox" checked={entityFilters[t]} onChange={() => toggleEntityFilter(t)}
                    className="noctis-checkbox" />
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ENTITY_COLORS[t] }} />
                  <span className="flex-1 font-mono text-[10px]">{ENTITY_TYPE_LABELS[t]}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Cluster / Community Detection overlay trigger */}
        <TBtn icon={Layers} label="Cluster" onClick={handleClusterSelect} disabled={!selectedEntity}
          active={!!clusterHighlightType || !!selectedCluster} />

        {/* Shortest Path Tool */}
        <TBtn icon={Route} label="Path" onClick={() => toggleShortestPathMode()}
          active={shortestPathActive} />
          
        <Sep />

        {/* V2 Overlays Control */}
        <div className="flex items-center gap-1 bg-[#111111] border border-[#222222] rounded px-1.5 py-0.5">
          <span className="text-[9px] font-mono text-[#6b7280] uppercase tracking-wider mr-1">OVERLAY:</span>
          {['none', 'behavior_heat', 'confidence', 'clusters'].map(o => (
            <button
              key={o}
              onClick={() => setGraphOverlay(o)}
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${
                graphOverlay === o ? 'bg-[#ff1e1e]/20 text-[#ff1e1e] border border-[#ff1e1e]/30' : 'text-[#6b7280] hover:text-white'
              }`}
            >
              {o === 'none' ? 'OFF' : o.replace('_', ' ')}
            </button>
          ))}
        </div>

        <Sep />

        {/* Operational Patterns Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPatternsOpen(!patternsOpen)}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-all font-mono border ${
              selectedPattern ? 'bg-[#ff1e1e]/15 text-[#ff1e1e] border-[#ff1e1e]/30' : 'text-[#6b7280] border-transparent hover:bg-[#111111] hover:text-[#d1d5db]'
            }`}
          >
            <Activity size={12} />
            <span>PATTERNS</span>
          </button>
          {patternsOpen && (
            <div className="graph-filter-dropdown border-[#ff1e1e]/20 min-w-[220px]" onClick={e => e.stopPropagation()}>
              <div className="text-[9px] uppercase tracking-widest text-[#6b7280] font-semibold mb-2 px-1">Detected Patterns</div>
              {operationalPatterns.length === 0 ? (
                <div className="text-[10px] font-mono text-[#4b5563] px-2 py-1">No patterns detected. Ingest data first.</div>
              ) : (
                operationalPatterns.map(pat => (
                  <button
                    key={pat.id}
                    onClick={() => {
                      setSelectedPattern(selectedPattern?.id === pat.id ? null : pat);
                      setPatternsOpen(false);
                    }}
                    className={`w-full text-left flex flex-col p-1.5 rounded transition-all mb-1 ${
                      selectedPattern?.id === pat.id ? 'bg-[#ff1e1e]/15 border border-[#ff1e1e]/20 text-white' : 'hover:bg-[#111111] text-[#a5a5a5]'
                    }`}
                  >
                    <span className="font-mono text-[10px] font-semibold text-[#ff1e1e]">{pat.name}</span>
                    <span className="text-[9px] text-[#5b5b5b] mt-0.5 leading-snug">{pat.description}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <Sep />

        <TBtn icon={Search} label="Search" onClick={() => setSearchVisible(!searchVisible)} active={searchVisible} />
        {searchVisible && (
          <div className="flex items-center gap-1">
            <input
              className="bg-[#000000] border border-[#222222] rounded px-2 py-0.5 text-[10px] text-[#e5e5e5] w-36 focus:border-[#ff1e1e] outline-none font-mono"
              placeholder="Search entities..."
              value={graphSearchQuery}
              onChange={e => setGraphSearchQuery(e.target.value)}
              autoFocus
            />
            {searchMatches.size > 0 && (
              <span className="text-[9px] font-mono text-[#ff1e1e]">{searchMatches.size}</span>
            )}
          </div>
        )}
        
        <Sep />
        <TBtn icon={graphLocked ? Lock : Unlock} label={graphLocked ? 'Unlock' : 'Lock'}
          onClick={toggleGraphLock} active={graphLocked} />
        <TBtn icon={RotateCcw} label="Reset" onClick={resetGraphLayout} />
      </div>

      {/* Top Right Badges */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        {graphLocked && <span className="graph-locked-badge border-[#ff1e1e]/20 text-[#ff1e1e] bg-[#ff1e1e]/5"><Lock size={10} /> STATIC LOCK</span>}
        {shortestPathActive && (
          <span className="graph-sp-badge border-[#3b82f6]/20 text-[#3b82f6] bg-[#3b82f6]/5">
            <Route size={10} /> PATH TRACE {shortestPathNodes.length}/2
          </span>
        )}
        {selectedCluster && (
          <span className="graph-sp-badge border-[#ff1e1e]/20 text-[#ff1e1e] bg-[#ff1e1e]/5">
            <Layers size={10} /> CELL SELECTED
          </span>
        )}
        {selectedPattern && (
          <span className="graph-sp-badge border-[#ff1e1e]/20 text-[#ff1e1e] bg-[#ff1e1e]/5">
            <AlertOctagon size={10} /> PATTERN SHOWN
          </span>
        )}
        {hasHighlights && (
          <button onClick={handleCollapse}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-[#ff1e1e] bg-[#ff1e1e]/5 border border-[#ff1e1e]/20 rounded hover:bg-[#ff1e1e]/10 transition-colors">
            <X size={10} /> Clear Focus
          </button>
        )}
      </div>

      {/* Bottom Left Stats */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 bg-[#0a0a0a]/90 backdrop-blur-sm border border-[#1a1a1a] rounded px-3 py-1.5">
        <span className="text-[10px] font-mono text-[#6b7280]">
          {filteredEntities.length} <span className="text-[#333333]">nodes</span>
        </span>
        <span className="text-[10px] font-mono text-[#6b7280]">
          {filteredRels.length} <span className="text-[#333333]">edges</span>
        </span>
        {shortestPathResult.length > 1 && (
          <span className="text-[10px] font-mono text-[#3b82f6] uppercase tracking-wider">
            PATH: {shortestPathResult.length - 1} hops
          </span>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-[#0a0a0a]/90 backdrop-blur-sm border border-[#1a1a1a] rounded p-1">
        <ZBtn icon={Plus} onClick={() => handleZoom(1.3)} />
        <ZBtn icon={Minus} onClick={() => handleZoom(0.7)} />
        <div className="w-px h-4 bg-[#1a1a1a]" />
        <ZBtn icon={Focus} onClick={handleFitView} />
      </div>

      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}

function TBtn({ icon: Icon, label, onClick, active, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-all font-mono border ${
        disabled ? 'text-[#222222] border-transparent cursor-not-allowed' :
        active ? 'bg-[#ff1e1e]/15 border-[#ff1e1e]/20 text-[#ff1e1e]' :
        'text-[#6b7280] border-transparent hover:text-[#d1d5db] hover:bg-[#111111]'
      }`}
    >
      <Icon size={12} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function ZBtn({ icon: Icon, onClick }) {
  return (
    <button onClick={onClick}
      className="p-1.5 hover:bg-[#111111] rounded text-[#6b7280] hover:text-[#ffffff] transition-colors">
      <Icon size={13} />
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-[#1a1a1a] mx-0.5" />;
}
