import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return null;
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return '#dc2626'; // Red
      case 'PlaygroupLeader':
        return '#d97706'; // Orange
      case 'User':
        return '#059669'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #4a9eff 0%, #1e40af 100%)' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '1rem 0'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#1e40af', fontSize: '1.5rem', fontWeight: '700' }}>
              🏌️ MBGolfers2
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: getRoleColor(user.role),
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {user.role}
            </div>
            <span style={{ color: '#374151' }}>
              Welcome, {user.email}!
            </span>
            <button
              onClick={handleSignOut}
              className="btn btn-secondary"
              disabled={loading}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              {loading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card">
          <h2 style={{ color: '#1f2937', marginBottom: '1rem' }}>
            🎯 MVP Dashboard - Phase 1 Complete!
          </h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
              ✅ Authentication System Implemented
            </h3>
            <ul style={{ color: '#6b7280', marginLeft: '1.5rem' }}>
              <li>✅ AWS Cognito user authentication setup (mock implementation)</li>
              <li>✅ Role-based access control (Admin, PlaygroupLeader, User)</li>
              <li>✅ Login and registration UI components</li>
              <li>✅ Authentication state management</li>
              <li>✅ Protected route structure</li>
            </ul>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
              🚧 Next Phase: Core Data Layer
            </h3>
            <ul style={{ color: '#6b7280', marginLeft: '1.5rem' }}>
              <li>🔲 Deploy DynamoDB tables for Users, Playgroups, Tee Times</li>
              <li>🔲 Configure AWS infrastructure with Terraform</li>
              <li>🔲 Set up Lambda functions for API endpoints</li>
              <li>🔲 Replace mock authentication with real Cognito integration</li>
            </ul>
          </div>

          {/* Role-specific features preview */}
          <div style={{ 
            background: '#f0f9ff', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid #bfdbfe'
          }}>
            <h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>
              🔑 Your Role: {user.role}
            </h3>
            
            {user.role === 'Admin' && (
              <div>
                <p style={{ color: '#1e40af', marginBottom: '0.5rem' }}>
                  <strong>Admin Features (Coming Soon):</strong>
                </p>
                <ul style={{ color: '#3730a3', marginLeft: '1.5rem' }}>
                  <li>Manage all playgroups and users</li>
                  <li>System configuration and settings</li>
                  <li>User role assignment</li>
                  <li>Platform analytics and reporting</li>
                </ul>
              </div>
            )}
            
            {user.role === 'PlaygroupLeader' && (
              <div>
                <p style={{ color: '#1e40af', marginBottom: '0.5rem' }}>
                  <strong>Playgroup Leader Features (Coming Soon):</strong>
                </p>
                <ul style={{ color: '#3730a3', marginLeft: '1.5rem' }}>
                  <li>Create and manage your playgroups</li>
                  <li>Schedule tee times for group members</li>
                  <li>Manage group member invitations</li>
                  <li>View group scoring and statistics</li>
                </ul>
              </div>
            )}
            
            {user.role === 'User' && (
              <div>
                <p style={{ color: '#1e40af', marginBottom: '0.5rem' }}>
                  <strong>User Features (Coming Soon):</strong>
                </p>
                <ul style={{ color: '#3730a3', marginLeft: '1.5rem' }}>
                  <li>Join playgroups</li>
                  <li>View scheduled tee times</li>
                  <li>Enter and track your scores</li>
                  <li>View your golf statistics</li>
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              🚀 Ready to proceed to Phase 2: Infrastructure deployment with Terraform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;