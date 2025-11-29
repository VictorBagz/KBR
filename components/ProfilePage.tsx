import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { User, LogOut, Settings, CreditCard, Bell, Shield, Trophy, Activity, Calendar, Globe, Phone, Mail, Camera, Loader2, LayoutDashboard } from 'lucide-react';

interface ProfilePageProps {
  onNavigate?: (page: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Extract metadata
  const meta = user.user_metadata || {};
  const fullName = meta.first_name ? `${meta.first_name} ${meta.second_name || ''} ${meta.last_name}` : user.email?.split('@')[0];
  const initials = meta.first_name ? meta.first_name.charAt(0) : user.email?.charAt(0).toUpperCase();
  
  // Check if user is admin
  const adminEmails = ['victorbaguma339@gmail.com', 'vibingdev5@gmail.com'];
  const isAdmin = user.email && adminEmails.includes(user.email);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. Update Auth User Metadata (triggers session update in AuthContext)
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateAuthError) throw updateAuthError;

      // 4. Update Profiles Table (for public record)
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert('Error updating profile photo: ' + error.message);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-rugby-950 min-h-screen pb-16">
      
      {/* Header / Banner */}
      <div className="bg-gradient-to-r from-rugby-900 to-blue-950 h-48 relative">
         <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          
          {/* User Info */}
          <div className="flex items-end gap-6">
            <div className="relative group">
              <div 
                onClick={handleAvatarClick}
                className="w-32 h-32 rounded-2xl bg-rugby-800 border-4 border-rugby-950 shadow-xl flex items-center justify-center overflow-hidden relative cursor-pointer"
              >
                {meta.avatar_url ? (
                  <img src={meta.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-gradient-to-br from-rugby-accent to-blue-400 w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                    {initials}
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera size={24} />
                  <span className="text-xs font-medium mt-1">Change</span>
                </div>

                {/* Loading Overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                    <Loader2 size={24} className="text-rugby-accent animate-spin" />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="mb-2">
               <h1 className="text-3xl font-bold text-white">{fullName}</h1>
               <p className="text-gray-400 text-sm flex items-center gap-2">
                 <Shield size={14} className="text-green-400" /> Premium Member
               </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-2">
             {isAdmin && (
               <button 
                 onClick={() => onNavigate && onNavigate('admin')}
                 className="px-4 py-2 bg-rugby-accent hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 border border-blue-500 shadow-lg shadow-blue-900/20"
               >
                 <LayoutDashboard size={16} /> Admin Dashboard
               </button>
             )}

             <button className="px-4 py-2 bg-rugby-800 hover:bg-rugby-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 border border-rugby-700">
               <Settings size={16} /> Edit Profile
             </button>
             <button 
               onClick={signOut}
               className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
             >
               <LogOut size={16} /> Sign Out
             </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
           
           {/* Left Column: Stats & Personal Info */}
           <div className="space-y-6">
              
              {/* Personal Details Card */}
              <div className="bg-rugby-900 rounded-xl border border-rugby-800 p-6">
                 <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <User size={18} className="text-rugby-accent" /> Personal Details
                 </h3>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                       <Mail size={16} className="text-gray-500" />
                       <span className="text-gray-300 truncate">{user.email}</span>
                    </div>
                    {meta.phone && (
                      <div className="flex items-center gap-3 text-sm">
                         <Phone size={16} className="text-gray-500" />
                         <span className="text-gray-300">{meta.phone}</span>
                      </div>
                    )}
                    {meta.country && (
                      <div className="flex items-center gap-3 text-sm">
                         <Globe size={16} className="text-gray-500" />
                         <span className="text-gray-300">{meta.country}</span>
                      </div>
                    )}
                    {meta.dob && (
                      <div className="flex items-center gap-3 text-sm">
                         <Calendar size={16} className="text-gray-500" />
                         <span className="text-gray-300">Born: {meta.dob}</span>
                      </div>
                    )}
                 </div>
              </div>

              {/* Stats Card */}
              <div className="bg-rugby-900 rounded-xl border border-rugby-800 p-6">
                 <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-rugby-accent" /> Activity Overview
                 </h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-rugby-800">
                       <span className="text-gray-400 text-sm">Articles Read</span>
                       <span className="text-white font-bold">124</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-rugby-800">
                       <span className="text-gray-400 text-sm">Comments Posted</span>
                       <span className="text-white font-bold">18</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                       <span className="text-gray-400 text-sm">Member Since</span>
                       <span className="text-white font-bold">
                         {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                       </span>
                    </div>
                 </div>
              </div>

              {/* Fantasy Card */}
              <div className="bg-gradient-to-br from-blue-900/40 to-rugby-900 rounded-xl border border-blue-500/20 p-6">
                 <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-500" /> Fantasy League
                 </h3>
                 <div className="text-center py-4">
                    <div className="text-4xl font-black text-white mb-1">#428</div>
                    <div className="text-blue-300 text-xs uppercase tracking-wider font-semibold">Global Rank</div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-blue-500/20 flex justify-between text-sm">
                    <span className="text-gray-400">Total Points</span>
                    <span className="text-white font-bold">1,240 pts</span>
                 </div>
              </div>
           </div>

           {/* Middle Column: Recent Activity / Saved */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-rugby-900 rounded-xl border border-rugby-800 p-6">
                 <h3 className="text-xl font-bold text-white mb-6">Account Settings</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="flex items-center gap-3 p-4 rounded-lg bg-rugby-950/50 border border-rugby-800 hover:border-rugby-600 hover:bg-rugby-800 transition-all text-left group">
                       <div className="bg-rugby-800 p-2 rounded-full group-hover:bg-rugby-700 text-gray-300 group-hover:text-white">
                          <Bell size={20} />
                       </div>
                       <div>
                          <div className="text-white font-medium">Notifications</div>
                          <div className="text-gray-500 text-xs">Manage email alerts</div>
                       </div>
                    </button>

                    <button className="flex items-center gap-3 p-4 rounded-lg bg-rugby-950/50 border border-rugby-800 hover:border-rugby-600 hover:bg-rugby-800 transition-all text-left group">
                       <div className="bg-rugby-800 p-2 rounded-full group-hover:bg-rugby-700 text-gray-300 group-hover:text-white">
                          <CreditCard size={20} />
                       </div>
                       <div>
                          <div className="text-white font-medium">Subscription</div>
                          <div className="text-gray-500 text-xs">Manage billing & plan</div>
                       </div>
                    </button>
                    
                    <button className="flex items-center gap-3 p-4 rounded-lg bg-rugby-950/50 border border-rugby-800 hover:border-rugby-600 hover:bg-rugby-800 transition-all text-left group">
                       <div className="bg-rugby-800 p-2 rounded-full group-hover:bg-rugby-700 text-gray-300 group-hover:text-white">
                          <Calendar size={20} />
                       </div>
                       <div>
                          <div className="text-white font-medium">Team Sync</div>
                          <div className="text-gray-500 text-xs">Sync fixtures to calendar</div>
                       </div>
                    </button>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};