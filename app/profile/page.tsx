'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/lib/store';
import { apiGet, apiPut } from '@/lib/api';
import { useToast } from '@/lib/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit2, 
  Save, 
  X, 
  CheckCircle2,
  Building2,
  Clock,
  Key,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const toast = useToast();

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);


  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user profile via API
      const updatedUser = await apiPut(`/api/users/${user.id}`, {
        name: formData.name,
        email: formData.email,
      });

      // Update auth store with new user data
      const currentState = useAuthStore.getState();
      const token = currentState.token;
      if (token && updatedUser) {
        setAuth(updatedUser, token);
      }

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'warehouse_staff':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'warehouse_staff':
        return 'Warehouse Staff';
      default:
        return role || 'User';
    }
  };

  if (!mounted || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Overview Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-indigo-600 -m-6 mb-6 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0 text-white">
                <h2 className="text-3xl font-bold mb-3">
                  {user.name || 'User'}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Shield className="h-4 w-4" />
                    <span className="font-semibold">
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <p className="text-sm text-gray-500">Update your personal details</p>
              </div>
            </div>
            {isEditing ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="transition-all focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="transition-all focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </label>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 group-hover:border-primary-300 transition-colors">
                    <p className="text-gray-900 font-medium">{user.name || 'Not set'}</p>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </label>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 group-hover:border-primary-300 transition-colors">
                    <p className="text-gray-900 font-medium">{user.email || 'Not set'}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Account Information */}
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                <p className="text-sm text-gray-500">View your account details</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="group">
                <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  User ID
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 group-hover:border-primary-300 transition-colors">
                  <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 group-hover:border-primary-300 transition-colors">
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    <Shield className="h-3 w-3 mr-1.5" />
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Account Status
                </label>
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 group-hover:border-primary-300 transition-colors">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1.5" />
                    Active
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-500">Manage your account and preferences</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => (window.location.href = '/settings')}
              className="group flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 group-hover:text-primary-700">Account Settings</h4>
                <p className="text-sm text-gray-500">Manage system settings</p>
              </div>
            </button>
            <button
              onClick={() => (window.location.href = '/forgot-password')}
              className="group flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
                <Key className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 group-hover:text-primary-700">Change Password</h4>
                <p className="text-sm text-gray-500">Update your password</p>
              </div>
            </button>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                window.location.href = '/login';
              }}
              className="group flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                <LogOut className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 group-hover:text-red-700">Sign Out</h4>
                <p className="text-sm text-gray-500">Logout from your account</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Statistics Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Account Created</p>
                <p className="text-2xl font-bold text-blue-900">Active</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-200 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Account Status</p>
                <p className="text-2xl font-bold text-green-900">Verified</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-200 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Access Level</p>
                <p className="text-2xl font-bold text-purple-900">{getRoleDisplayName(user.role)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-200 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </DashboardLayout>
  );
}

