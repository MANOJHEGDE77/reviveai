import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AuditPage } from './pages/AuditPage';
import { SimulationPage } from './pages/SimulationPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. PUBLIC LANDING PAGE (STANDALONE, NO APPLICATION NAVBAR) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/launch-video" element={<Navigate to="/" replace />} />
        <Route path="/video" element={<Navigate to="/" replace />} />

        {/* 2. AUTHENTICATED APPLICATION CONSOLE (WITH FULL NAVIGATION & WORKSPACES) */}
        <Route element={<Layout />}>
          {/* Revenue Journey (Home of Application) */}
          <Route path="/journey" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/console" element={<DashboardPage />} />

          {/* Investigations */}
          <Route path="/investigations" element={<IncidentsPage />} />
          <Route path="/investigations/:id" element={<IncidentDetailPage />} />
          <Route path="/incidents" element={<Navigate to="/investigations" replace />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />

          {/* Recovery Operations */}
          <Route path="/recovery" element={<RecoveryPage />} />

          {/* Approvals */}
          <Route path="/approvals" element={<ApprovalsPage />} />

          {/* Audit Trail */}
          <Route path="/audit" element={<AuditPage />} />

          {/* Simulation Lab (Tools) */}
          <Route path="/simulation" element={<SimulationPage />} />

          {/* Configuration */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/:tab" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
