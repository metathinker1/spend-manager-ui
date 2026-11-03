import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from './app/AppShell';
import { HealthGate } from './app/HealthGate';
import { NotFound } from './app/NotFound';
import { ImportPage } from './features/import/ImportPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';

// The report pages carry the chart code; load it only when needed.
const SpendingReportPage = lazy(() => import('./features/reports/SpendingReportPage'));
const MatrixReportPage = lazy(() => import('./features/reports/MatrixReportPage'));

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/transactions" replace />} />
        <Route
          path="transactions"
          element={
            <HealthGate>
              <TransactionsPage />
            </HealthGate>
          }
        />
        <Route
          path="reports/spending"
          element={
            <HealthGate>
              <SpendingReportPage />
            </HealthGate>
          }
        />
        <Route
          path="reports/matrix"
          element={
            <HealthGate>
              <MatrixReportPage />
            </HealthGate>
          }
        />
        <Route
          path="import"
          element={
            <HealthGate allowMissingDatabase>
              <ImportPage />
            </HealthGate>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
