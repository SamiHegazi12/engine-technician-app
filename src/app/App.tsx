import React, { useState, useEffect } from 'react';
import ControlPanel from '@/components/layout/ControlPanel';
import RepairAgreementForm from '@/features/agreements/RepairAgreementForm';
import { RepairAgreement, RepairStatus } from '@/types';

type ViewState = 'CONTROL_PANEL' | 'NEW_AGREEMENT' | 'EDIT_AGREEMENT';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('CONTROL_PANEL');
  const [agreements, setAgreements] = useState<RepairAgreement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Load Data from LocalStorage
    const saved = localStorage.getItem('repair_history');
    if (saved) setAgreements(JSON.parse(saved));

    // 2. 💀 FORCE UPDATE: Kill "Zombie" Service Workers 💀
    // This forces mobile browsers/Brave to stop using the old cached version
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          console.log('Force unregistering Service Worker to fix mobile sync...');
          registration.unregister();
        }
      });
    }
  }, []);

  const saveToHistory = (newAgreements: RepairAgreement[]) => {
    setAgreements(newAgreements);
    localStorage.setItem('repair_history', JSON.stringify(newAgreements));
  };

  const handleSave = (data: RepairAgreement) => {
    if (view === 'NEW_AGREEMENT') {
      saveToHistory([data, ...agreements]);
    } else {
      saveToHistory(agreements.map(a => a.id === data.id ? { ...data, createdAt: a.createdAt, serialNumber: a.serialNumber } : a));
    }
    setView('CONTROL_PANEL');
    setEditingId(null);
  };

  const handleStatusChange = (id: string, status: RepairStatus) => { saveToHistory(agreements.map(a => a.id === id ? { ...a, status } : a)); };
  const currentYear = new Date().getFullYear();
  const yearlyCount = agreements.filter(a => a.serialNumber.startsWith(currentYear.toString())).length;

  return (
    <div className="min-h-screen">
      {/* --- VERSION DEBUG BANNER (Verify Update) --- */}
      <div style={{ 
        backgroundColor: '#dc2626', // Red color
        color: 'white', 
        textAlign: 'center', 
        padding: '8px', 
        fontSize: '14px', 
        fontWeight: 'bold',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        borderBottom: '1px solid white'
      }}>
        v4.0 - FIX ACTIVE (Check OCR Now)
      </div>
      {/* ------------------------------------------- */}

      {view === 'CONTROL_PANEL' && (<ControlPanel agreements={agreements} onNew={() => setView('NEW_AGREEMENT')} onEdit={(id) => { setEditingId(id); setView('EDIT_AGREEMENT'); }} onStatusChange={handleStatusChange} />)}
      {(view === 'NEW_AGREEMENT' || view === 'EDIT_AGREEMENT') && (<RepairAgreementForm initialData={agreements.find(a => a.id === editingId)} onSave={handleSave} onBack={() => { setView('CONTROL_PANEL'); setEditingId(null); }} agreementsCount={yearlyCount} />)}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t px-4 py-2 text-[10px] text-gray-400 text-center md:hidden pointer-events-none z-30 no-print">مركز تقني المحركات © {new Date().getFullYear()}</footer>
    </div>
  );
};

export default App;