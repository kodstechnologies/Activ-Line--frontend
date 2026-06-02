import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Tv, Wallet, RefreshCw, AlertCircle, Calendar } from "lucide-react";
import api from "../../api/axios";

const OTT = () => {
  const { isDark } = useTheme();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOttData = async () => {
    setLoading(true);
    try {
      const [balanceRes, txRes] = await Promise.all([
        api.get("/api/admin/ott/balance").catch(() => ({ data: { data: { balance: "Error" } } })),
        api.get("/api/admin/ott/transactions").catch(() => ({ data: { data: [] } }))
      ]);

      setBalance(balanceRes.data?.data?.balance ?? 0);
      setTransactions(txRes.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch OTT data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOttData();
  }, []);

  return (
    <div className={`flex flex-col h-full ${isDark ? "bg-slate-900 text-white" : "bg-gray-50 text-slate-800"}`}>
      {/* Header */}
      <div className={`p-6 border-b ${isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"}`}>
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tv className={`w-6 h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
              OTT Services Management
            </h1>
            <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              Monitor your PlayBoxTV wholesale wallet and customer subscription transactions.
            </p>
          </div>
          <button
            onClick={fetchOttData}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Wallet Balance Widget */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200 shadow-sm"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-xl ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}>
                <Wallet className={`w-8 h-8 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  PlayBoxTV Wallet Balance
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {loading ? "..." : `₹${Number(balance).toLocaleString('en-IN')}`}
                  </span>
                </div>
                {Number(balance) < 5000 && !loading && (
                  <div className={`mt-3 flex items-center gap-2 text-sm ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                    <AlertCircle className="w-4 h-4" />
                    <span>Low balance warning! Please recharge your partner wallet soon to avoid service disruption.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className={`rounded-2xl border ${
            isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200 shadow-sm"
          }`}>
            <div className="p-5 border-b border-inherit">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? "border-slate-700 text-slate-400" : "border-gray-200 text-gray-500"}`}>
                    <th className="p-4 font-medium text-sm">Customer</th>
                    <th className="p-4 font-medium text-sm">Pack Name</th>
                    <th className="p-4 font-medium text-sm">Amount</th>
                    <th className="p-4 font-medium text-sm">Validity</th>
                    <th className="p-4 font-medium text-sm">Status</th>
                    <th className="p-4 font-medium text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-sm text-gray-500">Loading transactions...</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-sm text-gray-500">No OTT transactions found.</td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id} className={`border-b last:border-0 ${
                        isDark ? "border-slate-700/50 hover:bg-slate-800" : "border-gray-100 hover:bg-gray-50"
                      }`}>
                        <td className="p-4">
                          <div className="font-medium">{tx.customerId?.userName || "Unknown"}</div>
                          <div className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                            {tx.customerId?.phoneNumber || "N/A"}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{tx.packName}</td>
                        <td className="p-4">₹{tx.amount}</td>
                        <td className="p-4 text-sm">{tx.validityDays} Days</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === "ACTIVE" 
                              ? isDark ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-100 text-emerald-800"
                              : isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-800"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="w-4 h-4 opacity-70" />
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OTT;
