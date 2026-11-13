import React, { useState, useEffect } from "react";
import MasterLayout from "../components/Layout";
import "../App.css";
import { getAgencies } from "../services/agencyService";
import { getExportReceipts } from "../services/exportReceiptService";
import { getRevenueReport } from "../services/reportService";

function General({ user, onLogout, onNavigate }) {
  const [stats, setStats] = useState({
    activeAgencies: 0,
    exportReceipts: 0,
    totalRevenue: 0,
    outstandingDebt: 0,
    loading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...');
        
        // Fetch agencies
        const agenciesData = await getAgencies();
        console.log('Agencies data:', agenciesData);
        const activeAgencies = Array.isArray(agenciesData) ? agenciesData.length : 0;
        
        // Calculate total outstanding debt (field is currentDebt, not debt)
        const totalDebt = Array.isArray(agenciesData) 
          ? agenciesData.reduce((sum, agency) => sum + (agency.currentDebt || 0), 0)
          : 0;
        
        // Fetch export receipts
        const receiptsData = await getExportReceipts();
        console.log('Export receipts data:', receiptsData);
        const exportReceipts = Array.isArray(receiptsData) ? receiptsData.length : 0;
        
        // Calculate total revenue directly from export receipts
        const totalRevenue = Array.isArray(receiptsData)
          ? receiptsData.reduce((sum, receipt) => sum + (receipt.totalAmount || 0), 0)
          : 0;
        
        console.log('Final stats:', { activeAgencies, exportReceipts, totalRevenue, outstandingDebt: totalDebt });
        
        setStats({
          activeAgencies,
          exportReceipts,
          totalRevenue,
          outstandingDebt: totalDebt,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        console.error('Error details:', error.message, error.stack);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <MasterLayout currentPage="general" user={user} onLogout={onLogout} onNavigate={onNavigate}>
      <div className="page-header">
        <h1>Welcome to Agency Management System</h1>
        <p>Select a module from the sidebar to get started</p>
      </div>

      <div className="welcome-card">
          <div className="welcome-icon">
            <img src="/company.png" alt="Company Logo" width="64" height="64" style={{ display: 'block', margin: '0 auto' }} />
          </div>
        <h2>Dashboard</h2>
        <p>Access all your agency management tools from the sidebar</p>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <img src="/company.png" alt="Organization" width="32" height="32" style={{ display: 'block', margin: '0 auto' }} />
            </div>
            <div className="stat-value">{stats.loading ? '...' : stats.activeAgencies}</div>
            <div className="stat-label">Active Agencies</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#0ea5e9' }}>
              <div className="stat-icon">
              <img src="/receipt.png" alt="Organization" width="32" height="32" style={{ display: 'block', margin: '0 auto' }} />
            </div>
            </div>
            <div className="stat-value">{stats.loading ? '...' : stats.exportReceipts}</div>
            <div className="stat-label">Export Receipts</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#10b981' }}>
              <div className="stat-icon">
              <img src="/revenue.png" alt="Revenue" width="32" height="32" style={{ display: 'block', margin: '0 auto' }} />
            </div>
            </div>
            <div className="stat-value">{stats.loading ? '...' : formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: '#ef4444' }}>
              <div className="stat-icon">
              <img src="/debt.png" alt="Debt" width="32" height="32" style={{ display: 'block', margin: '0 auto' }} />
            </div>
            </div>
            <div className="stat-value">{stats.loading ? '...' : formatCurrency(stats.outstandingDebt)}</div>
            <div className="stat-label">Outstanding Debt</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn action-btn-export" onClick={() => onNavigate('export-receipt')}>
            <span className="action-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, margin: '0 auto' }}>
              <img src="/receipt_quick.png" alt="Export Receipt" width="32" height="32" style={{ display: 'block' }} />
            </span>
            <span>Export Receipt</span>
          </button>
          <button className="action-btn action-btn-payment" onClick={() => onNavigate('payment-receipt')}>
            <span className="action-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, margin: '0 auto' }}>
              <img src="/credit-card.png" alt="Payment" width="32" height="32" style={{ display: 'block' }} />
            </span>
            <span>Payment Receipt</span>
          </button>
          <button className="action-btn action-btn-debt" onClick={() => onNavigate('debt-report')}>
            <span className="action-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, margin: '0 auto' }}>
              <img src="/debt_quick.png" alt="Debt" width="32" height="32" style={{ display: 'block' }} />
            </span>
            <span>Debt Report</span>
          </button>
          <button className="action-btn action-btn-revenue" onClick={() => onNavigate('revenue-report')}>
            <span className="action-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, margin: '0 auto' }}>
              <img src="/revenue.png" alt="Revenue" width="32" height="32" style={{ display: 'block' }} />
            </span>
            <span>Revenue Report</span>
          </button>
          <button className="action-btn" style={{ borderColor: '#6366f1' }} onClick={() => onNavigate('products')}>
            <span className="action-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, margin: '0 auto', color: '#6366f1' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
              </svg>
            </span>
            <span>Products</span>
          </button>
        </div>
      </div>
    </MasterLayout>
  );
}

export default General;
