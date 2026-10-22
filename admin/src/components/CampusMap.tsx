'use client';

import React from 'react';
import { AlertTriangle, HardHat, MapPin } from 'lucide-react';
import type { Issue, Worker } from '../lib/api';

interface CampusMapProps {
  issues: Issue[];
  workers: Worker[];
  onSelectIssue: (issue: Issue) => void;
  onSelectWorker: (worker: Worker) => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({ issues, workers, onSelectIssue, onSelectWorker }) => {
  const activeIssues = issues.filter((issue) => issue.status !== 'resolved');
  const mappedIssues = activeIssues.filter((issue) => issue.coordinates);
  const mappedWorkers = workers.filter((worker) => worker.coordinates);
  const points = [
    ...mappedIssues.map((issue) => issue.coordinates!),
    ...mappedWorkers.map((worker) => worker.coordinates),
  ];
  const longitudes = points.map((point) => point.lng);
  const latitudes = points.map((point) => point.lat);
  const longitudeRange = Math.max(Math.max(...longitudes) - Math.min(...longitudes), 0.0001);
  const latitudeRange = Math.max(Math.max(...latitudes) - Math.min(...latitudes), 0.0001);
  const position = (coordinates: { lat: number; lng: number }) => ({
    left: `${10 + ((coordinates.lng - Math.min(...longitudes)) / longitudeRange) * 80}%`,
    top: `${10 + ((Math.max(...latitudes) - coordinates.lat) / latitudeRange) * 80}%`,
  });

  return (
    <section className="content-section map-section">
      <div className="section-heading">
        <div>
          <h2>Campus facilities</h2>
          <p>{activeIssues.length} active issues · {workers.length} technicians · {points.length} mapped records</p>
        </div>
        <div className="map-legend">
          <span><i className="legend-dot available" />Technicians</span>
          <span><i className="legend-dot critical" />Issues</span>
        </div>
      </div>
      <div className="campus-map">
        <div className="map-grid" />
        {points.length ? (
          <>
            {mappedIssues.map((issue) => (
              <button
                key={issue.id}
                className={`map-marker issue-marker${issue.priority === 'Critical' ? ' critical' : ''}`}
                style={position(issue.coordinates!)}
                onClick={() => onSelectIssue(issue)}
                title={`${issue.ticketId}: ${issue.title}`}
                aria-label={`Open issue ${issue.ticketId}: ${issue.title}`}
              >
                <AlertTriangle size={13} />
              </button>
            ))}
            {mappedWorkers.map((worker) => (
              <button
                key={worker.id}
                className={`map-marker worker-marker ${worker.status}`}
                style={position(worker.coordinates)}
                onClick={() => onSelectWorker(worker)}
                title={`${worker.name} · ${worker.status}`}
                aria-label={`Edit shift for ${worker.name}`}
              >
                <HardHat size={13} />
              </button>
            ))}
          </>
        ) : (
          <div className="map-empty">
            <MapPin size={20} />
            <strong>No location data yet</strong>
            <span>Issues and technicians appear here once records include coordinates.</span>
          </div>
        )}
      </div>
      {points.length > 0 && activeIssues.length !== mappedIssues.length && (
        <p className="map-help"><MapPin size={14} />{activeIssues.length - mappedIssues.length} active issues have no coordinates and are not shown on the map.</p>
      )}
      {points.length > 0 && (
        <p className="map-help"><MapPin size={14} />Select an issue marker to assign a technician, or a worker marker to edit their shift.</p>
      )}
    </section>
  );
};
