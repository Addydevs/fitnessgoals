import React, { useState, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { ArrowLeft, Settings, Camera, Edit3, Share2, Eye } from 'lucide-react';

const CaptureFitProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Single API call for all user data
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': 'Bearer YOUR_API_TOKEN',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        // Fallback data for demo
        setUserData({
          name: 'John Smith',
          joinDate: '2024-06-15',
          avatar: null,
          totalPhotos: 8,
          weekStreak: 3,
          daysTracked: 21,
          recentPhotos: [
            { id: 1, date: '2025-08-03', week: 'This week' },
            { id: 2, date: '2025-07-27', week: 'Last week' },
            { id: 3, date: '2025-07-20', week: '2 weeks ago' }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set fallback data on error
      setUserData({
        name: 'User',
        joinDate: new Date().toISOString(),
        avatar: null,
        totalPhotos: 0,
        weekStreak: 0,
        daysTracked: 0,
        recentPhotos: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto bg-gray-50 min-h-screen">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-2">
          <div className="text-sm font-medium">9:41</div>
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
            <div className="ml-2 text-sm">📶</div>
            <div className="text-sm">🔋</div>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-4 pb-6">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="px-6 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {userData?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{userData?.name || 'User'}</h2>
                  <button className="p-1">
                    <Edit3 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm">
                  Joined {formatDate(userData?.joinDate || new Date().toISOString())}
                </p>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{userData?.totalPhotos || 0}</p>
                <p className="text-gray-500 text-xs">Photos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{userData?.weekStreak || 0}</p>
                <p className="text-gray-500 text-xs">Week Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{userData?.daysTracked || 0}</p>
                <p className="text-gray-500 text-xs">Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Photos */}
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Photos</h3>
            <button className="text-blue-500 text-sm font-medium">View All</button>
          </div>
          
          {userData?.recentPhotos?.length > 0 ? (
            <div className="space-y-4">
              {userData.recentPhotos.slice(0, 3).map((photo) => (
                <div key={photo.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{photo.week}</h4>
                      <p className="text-gray-500 text-sm">{formatDate(photo.date)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 bg-gray-100 rounded-full">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 bg-gray-100 rounded-full">
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Progress Photo</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">No photos yet</h4>
              <p className="text-gray-500 text-sm mb-4">Start your progress journey by taking your first photo</p>
              <button className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-medium">
                Take First Photo
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl p-4 text-white text-left">
              <Camera className="w-6 h-6 mb-2" />
              <h4 className="font-semibold text-sm">Take Photo</h4>
              <p className="text-blue-100 text-xs">Capture progress</p>
            </button>
            
            <button className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white text-left">
              <Share2 className="w-6 h-6 mb-2" />
              <h4 className="font-semibold text-sm">Share Progress</h4>
              <p className="text-purple-100 text-xs">Show your journey</p>
            </button>
          </div>
        </div>

        {/* Bottom spacing for navigation */}
        <div className="h-24"></div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm">
          <div className="bg-gray-900 mx-4 mb-6 rounded-3xl px-6 py-4">
            <div className="flex justify-around items-center">
              <button className="p-2">
                <div className="w-6 h-6 bg-gray-400 rounded-lg"></div>
              </button>
              <button className="p-2">
                <div className="w-6 h-6 border-2 border-gray-400 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                </div>
              </button>
              <button className="p-2">
                <div className="w-6 h-6 border-2 border-gray-400 rounded-lg flex flex-col gap-0.5 p-1">
                  <div className="flex-1 bg-gray-400 rounded-xs"></div>
                  <div className="flex-1 bg-gray-400 rounded-xs"></div>
                  <div className="flex-1 bg-gray-400 rounded-xs"></div>
                </div>
              </button>
              <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-900 rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptureFitProfile;

