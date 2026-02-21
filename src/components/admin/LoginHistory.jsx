import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Globe, MapPin, Clock, Smartphone } from "lucide-react";

export default function LoginHistory() {
  const [loading, setLoading] = useState(true);
  const [logins, setLogins] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadLoginHistory();
  }, [filter]);

  const loadLoginHistory = async () => {
    setLoading(true);
    try {
      let query = {};
      const allLogins = await base44.entities.LoginHistory.list("-loginTime", 100);
      
      setLogins(allLogins);
    } catch (error) {
      console.error("Failed to load login history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading login history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Login History & IP Tracking</h2>
        <button
          type="button"
          onClick={loadLoginHistory}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Logins</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{logins.length}</p>
            </div>
            <Globe className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Countries</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {new Set(logins.map(l => l.country)).size}
              </p>
            </div>
            <MapPin className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Logins</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {logins.filter(l => {
                  const loginDate = new Date(l.loginTime).toDateString();
                  return loginDate === new Date().toDateString();
                }).length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Login Records Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Logins</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timezone</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logins.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No login records yet
                    </td>
                  </tr>
              ) : (
                logins.map((login) => (
                  <tr key={login.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{login.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-900">
                        {login.ipAddress}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {login.city && login.country && login.city !== 'Unknown' && login.country !== 'Unknown' ? (
                          <>
                            <div className="font-medium">
                              {login.city}{login.region && login.region !== 'Unknown' ? `, ${login.region}` : ''}
                            </div>
                            <div className="text-xs text-gray-500">{login.country}</div>
                          </>
                        ) : (
                          <span className="text-gray-500">Unknown</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap max-w-xs">
                      <div className="text-sm text-gray-900 truncate" title={login.deviceInfo}>
                        {login.deviceInfo.substring(0, 40)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(login.loginTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {login.timezone || 'Unknown'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
          <div className="space-y-3">
            {Object.entries(
              logins.reduce((acc, login) => {
                const country = login.country || 'Unknown';
                acc[country] = (acc[country] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([country, count]) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-gray-900">{country}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / logins.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Cities</h3>
          <div className="space-y-3">
            {Object.entries(
              logins.reduce((acc, login) => {
                const city = login.city ? `${login.city}, ${login.country}` : 'Unknown';
                acc[city] = (acc[city] || 0) + 1;
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([city, count]) => (
                <div key={city} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{city}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(count / logins.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}