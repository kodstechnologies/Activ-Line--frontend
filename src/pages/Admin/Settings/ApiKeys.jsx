import { Copy, RefreshCcw, Check } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";

const ApiKeys = () => {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(null);

  const integrations = [
    {
      name: "Razorpay Payment Gateway",
      description:
        "Secure API key used for processing online payments and transactions.",
      key: "rzp_live_98sd7f****A12",
    },
   
  ];

  const copyKey = (key, name) => {
    navigator.clipboard.writeText(key);
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Integration Configuration
        </h2>
        <p
          className={`text-sm mt-1 ${
            isDark ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Securely manage API keys for critical third-party services and system
          integrations.
        </p>
      </div>

      {/* Integration Cards */}
      {integrations.map((item) => (
        <div
          key={item.name}
          className={`rounded-xl border p-5 transition-all ${
            isDark
              ? "bg-slate-800 border-slate-700 hover:border-slate-600"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div>
              <h3
                className={`font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {item.name}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-slate-400" : "text-gray-500"
                }`}
              >
                {item.description}
              </p>
            </div>

            <button
              className={`flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-full border transition flex-shrink-0 w-fit ${
                isDark
                  ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <RefreshCcw className="w-3 h-3 flex-shrink-0" />
              Regenerate
            </button>
          </div>

          {/* Key Section */}
          <div
            className={`mt-4 flex items-center justify-between rounded-lg px-4 py-3 font-mono text-sm ${
              isDark
                ? "bg-slate-900 text-blue-400"
                : "bg-gray-50 text-blue-600"
            }`}
          >
            <span className="break-all pr-2">{item.key}</span>

            <button
              onClick={() => copyKey(item.key, item.name)}
              className={`p-2 rounded-md transition flex-shrink-0 ${
                isDark
                  ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                  : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
              }`}
            >
              {copied === item.name ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Copy className="w-4 h-4 flex-shrink-0" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApiKeys;
