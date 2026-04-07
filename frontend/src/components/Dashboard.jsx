import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, UploadCloud, TrendingUp, PieChart, Activity, Wallet, DollarSign, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState({ total_spent: 0, projected_end_of_month: 0, expense_count: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', merchant: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE = "http://localhost:8000";

  const loadData = async () => {
    try {
      const expensesRes = await fetch(`${API_BASE}/expenses/`);
      const insightsRes = await fetch(`${API_BASE}/insights/`);
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (insightsRes.ok) setInsights(await insightsRes.json());
    } catch (e) {
      console.error("Failed to fetch data. Is the backend running?", e);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      // Auto-categorize before saving
      const catRes = await fetch(`${API_BASE}/categorize/?description=${newExpense.merchant} ${newExpense.description}`);
      const catData = await catRes.json();
      const payload = { ...newExpense, category: catData.category };

      await fetch(`${API_BASE}/expenses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setIsModalOpen(false);
      setNewExpense({ amount: '', merchant: '', date: new Date().toISOString().split('T')[0], description: '' });
      loadData();
    } catch (err) {
      alert("Error saving expense");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/`, { method: 'POST', body: formData });
      const data = await res.json();
      
      // Pre-fill the form with OCR data
      setNewExpense({
        amount: data.amount || '',
        merchant: data.merchant || '',
        date: data.date || new Date().toISOString().split('T')[0],
        description: data.raw_text ? 'Smart OCR Extracted' : ''
      });
      alert(`OCR Successful! Extracted: £${data.amount || 'Unknown'} from ${data.merchant}`);
      setIsModalOpen(true);
    } catch (err) {
      alert("OCR failed.");
    } finally {
      setUploading(false);
      e.target.value = null; // reset 
    }
  };

  // Convert real expenses to chart data
  const chartData = expenses.length > 0 
    ? expenses.slice(-7).map(e => ({ name: e.merchant || 'Item', amount: e.amount }))
    : [
        { name: 'Loading', amount: 0 }
      ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30 relative">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            SpendSense
          </h1>
          <p className="text-slate-400 mt-1">Smart Expense Tracker with AI Insights</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 active:scale-95">
            <PlusCircle size={18} /> Add Expense
          </button>
          
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-indigo-500/50 transition-colors px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 active:scale-95 disabled:opacity-50">
            <UploadCloud size={18} /> {uploading ? 'Processing OCR...' : 'Upload Receipt'}
          </button>
        </div>
      </header>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Total Spent</h3>
            <div className="p-2 bg-slate-800/50 rounded-lg"><DollarSign size={24} className="text-cyan-400" /></div>
          </div>
          <p className="text-3xl font-bold mb-2">${insights.total_spent.toFixed(2)}</p>
          <p className="text-sm text-slate-500 flex items-center gap-1"><Activity size={14} /> Total captured</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">AI Projected (30 days)</h3>
            <div className="p-2 bg-slate-800/50 rounded-lg"><TrendingUp size={24} className="text-purple-400"/></div>
          </div>
          <p className="text-3xl font-bold mb-2">${insights.projected_end_of_month.toFixed(2)}</p>
          <p className="text-sm text-slate-500 flex items-center gap-1"><Activity size={14} /> End of month forecast</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 font-medium">Total Transactions</h3>
            <div className="p-2 bg-slate-800/50 rounded-lg"><Wallet size={24} className="text-emerald-400"/></div>
          </div>
          <p className="text-3xl font-bold mb-2">{insights.expense_count}</p>
          <p className="text-sm text-slate-500 flex items-center gap-1"><Activity size={14} /> Recorded receipts</p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PieChart size={20} className="text-indigo-400" />
              Recent Spending Velocity (Last 7)
            </h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Actionable Insights panel */}
        <div className="bg-gradient-to-b from-indigo-900/20 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-purple-400" />
            AI Insights
          </h2>
          
          <div className="space-y-4 relative z-10">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
              <h4 className="text-purple-300 font-semibold text-sm mb-1">Pacing Status</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {insights.total_spent > 0 ? `You're tracking to spend $${insights.projected_end_of_month.toFixed(2)} this month.` : "Add some expenses so the AI can build a profile."}
              </p>
            </div>
            
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50 transform transition hover:scale-[1.02]">
              <h4 className="text-cyan-300 font-semibold text-sm mb-1">Recent Activity Feed</h4>
              <ul className="text-sm mt-3 space-y-2">
                {expenses.slice(-3).reverse().map(e => (
                  <li key={e.id} className="flex justify-between items-center text-slate-400 border-b border-slate-700/50 pb-2">
                    <span>{e.merchant} <span className="text-xs ml-1 bg-indigo-950 px-2 py-0.5 rounded text-indigo-300">{e.category}</span></span> 
                    <span className="text-slate-200">${e.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Manual Expense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount ($)</label>
                <input type="number" step="0.01" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Merchant</label>
                <input type="text" required value={newExpense.merchant} onChange={e => setNewExpense({...newExpense, merchant: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Date</label>
                <input type="date" required value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <input type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg p-3 font-semibold mt-4 transition-colors">
                Save Expense (Auto-Categorize)
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
