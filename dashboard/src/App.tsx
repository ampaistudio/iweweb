import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { ToastProvider } from './core/ui/ToastContext';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import { DashboardLayout } from './core/layout/DashboardLayout';

// Core Pages (Generic)
import { LoginPage } from './core/auth/LoginPage';
import { OverviewPage } from './core/overview/OverviewPage';
import { MediaPage } from './core/media/MediaPage';
import { ContentEditorPage } from './core/content/ContentEditorPage';
import { PostsListPage } from './core/posts/PostsListPage';
import { PostEditorPage } from './core/posts/PostEditorPage';

// Domain Pages & Widgets (iWE Tourism Specific)
import { ActivityListPage } from './activities/ActivityListPage';
import { ActivityEditorPage } from './activities/ActivityEditorPage';
import {
  ActivityOverviewMetric,
  ActivityQuickAction,
  ActivityRecentEdit,
} from './activities/ActivityOverviewWidget';

export const App: React.FC = () => {
  return (
    <BrowserRouter basename="/dashboard">
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Dashboard Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <OverviewPage
                    renderDomainMetrics={(data) => <ActivityOverviewMetric data={data} />}
                    renderDomainQuickActions={() => <ActivityQuickAction />}
                    renderDomainRecentEdits={(data) => <ActivityRecentEdit data={data} />}
                  />
                }
              />

              {/* Domain: Tourism Activities */}
              <Route path="activities" element={<ActivityListPage />} />
              <Route path="activities/new" element={<ActivityEditorPage />} />
              <Route path="activities/:id" element={<ActivityEditorPage />} />

              {/* Core: Site Content (Institutional Texts) */}
              <Route path="content" element={<ContentEditorPage />} />

              {/* Core: Posts / News & Meta Social Sync */}
              <Route path="posts" element={<PostsListPage />} />
              <Route path="posts/new" element={<PostEditorPage />} />
              <Route path="posts/:id" element={<PostEditorPage />} />

              {/* Core: Media Library */}
              <Route path="media" element={<MediaPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};
