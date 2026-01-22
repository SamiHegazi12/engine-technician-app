import React, { useState, useEffect } from 'react';
import ControlPanel from '@/components/layout/ControlPanel';
import RepairAgreementForm from '@/features/agreements/RepairAgreementForm';
import { RepairAgreement, RepairStatus } from '@/types';
import { supabase } from '@/lib/supabase';

type ViewState = 'CONTROL_PANEL' | 'NEW_AGREEMENT' | 'EDIT_AGREEMENT';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('CONTROL_PANEL');
  const [agreements, setAgreements] = useState<RepairAgreement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAgreements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('repair_agreements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agreements:', error);
    } else if (data) {
      const mappedData: RepairAgreement[] = data.map(item => ({
        id: item.id,
        serialNumber: item.serial_number,
        createdAt: item.created_at,
        expectedDeliveryDate: item.expected_delivery_date,
        jobCardNumber: item.job_card_number,
        vehicle: item.vehicle,
        customer: item.customer,
        claims: item.claims,
        discountPercent: item.discount_percent,
        photos: item.photos,
        signature: item.signature,
        status: item.status as RepairStatus,
        termsAccepted: item.terms_accepted
      }));
      setAgreements(mappedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    const initApp = async () => {
      // 1. Migrate Data from LocalStorage if exists
      const saved = localStorage.getItem('repair_history');
      if (saved) {
        try {
          const localAgreements: RepairAgreement[] = JSON.parse(saved);
          console.log('Migrating local data to Supabase...');
          
          for (const agreement of localAgreements) {
            await supabase.from('repair_agreements').upsert({
              id: agreement.id,
              serial_number: agreement.serialNumber,
              created_at: agreement.createdAt,
              expected_delivery_date: agreement.expectedDeliveryDate,
              job_card_number: agreement.jobCardNumber,
              vehicle: agreement.vehicle,
              customer: agreement.customer,
              claims: agreement.claims,
              discount_percent: agreement.discountPercent,
              photos: agreement.photos,
              signature: agreement.signature,
              status: agreement.status,
              terms_accepted: agreement.termsAccepted
            });
          }
          localStorage.removeItem('repair_history');
        } catch (e) {
          console.error('Migration failed', e);
        }
      }

      // 2. Fetch from Supabase
      await fetchAgreements();

      // 3. Kill "Zombie" Service Workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
      }
    };

    initApp();
  }, []);

  const handleSave = async (data: RepairAgreement) => {
    try {
      const payload = {
        id: data.id,
        serial_number: data.serialNumber,
        created_at: data.createdAt,
        expected_delivery_date: data.expectedDeliveryDate,
        job_card_number: data.jobCardNumber || null,
        vehicle: data.vehicle,
        customer: data.customer,
        claims: data.claims,
        discount_percent: data.discountPercent,
        photos: data.photos,
        signature: data.signature || null,
        status: data.status,
        terms_accepted: data.termsAccepted
      };

      console.log('Saving payload to Supabase:', payload);
      const { error, status, statusText } = await supabase.from('repair_agreements').upsert(payload);

      if (error) {
        console.error('Supabase Error:', error, 'Status:', status, statusText);
        throw new Error(error.message || 'Database connection error');
      }

      await fetchAgreements();
      setView('CONTROL_PANEL');
      setEditingId(null);
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(`Error saving agreement: ${err.message || 'Unknown error'}. Please check your internet connection and try again.`);
    }
  };

  const handleStatusChange = async (id: string, status: RepairStatus) => {
    const { error } = await supabase
      .from('repair_agreements')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      setAgreements(agreements.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  const currentYear = new Date().getFullYear();
  const yearlyCount = agreements.filter(a => a.serialNumber.startsWith(currentYear.toString())).length;

  return (
    <div className="min-h-screen">
      <div style={{ 
        backgroundColor: '#2563eb', 
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
        v5.0 - CLOUD SYNC ACTIVE (Supabase)
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {view === 'CONTROL_PANEL' && (
            <ControlPanel 
              agreements={agreements} 
              onNew={() => setView('NEW_AGREEMENT')} 
              onEdit={(id) => { setEditingId(id); setView('EDIT_AGREEMENT'); }} 
              onStatusChange={handleStatusChange} 
            />
          )}
          {(view === 'NEW_AGREEMENT' || view === 'EDIT_AGREEMENT') && (
            <RepairAgreementForm 
              initialData={agreements.find(a => a.id === editingId)} 
              onSave={handleSave} 
              onBack={() => { setView('CONTROL_PANEL'); setEditingId(null); }} 
              agreementsCount={yearlyCount} 
            />
          )}
        </>
      )}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t px-4 py-2 text-[10px] text-gray-400 text-center md:hidden pointer-events-none z-30 no-print">
        مركز تقني المحركات © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
