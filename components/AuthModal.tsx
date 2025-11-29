
import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2, User, Calendar, Phone, Globe, Camera } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // 1. Validation
        if (!firstName || !lastName || !dob || !email || !password) {
           throw new Error("Please fill in all mandatory fields (*).");
        }
        
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        // 2. Prepare Data
        // Ensure empty optional strings are null to avoid SQL casting issues if triggers are strict
        const metaData = {
          first_name: firstName.trim(),
          second_name: secondName.trim() || null,
          last_name: lastName.trim(),
          dob: dob, // Date input ensures YYYY-MM-DD or empty (caught by validation above)
          country: country.trim() || null,
          phone: phone.trim() || null,
        };

        // 3. Sign Up the user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metaData
          }
        });

        if (signUpError) throw signUpError;

        // 4. Upload Avatar if file selected and user created successfully
        if (data.user && avatarFile) {
          try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${data.user.id}/${Date.now()}.${fileExt}`;
            
            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, avatarFile);

            if (uploadError) {
              console.error('Avatar upload failed:', uploadError);
            } else {
              // Get Public URL
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

              // Update User Metadata with the new Avatar URL
              await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
              });
              
              // Also update the public profiles table (best effort)
              await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', data.user.id);
            }
          } catch (uploadErr) {
            console.error('Error handling avatar:', uploadErr);
          }
        }
        
      } else {
        // Sign In Logic
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      
      // Close on success
      onClose();
      // Optional: Reset form or keep it cached
    } catch (err: any) {
      console.error("Auth Error:", err);
      
      const msg = err.message || '';
      
      // Handle specific Supabase configuration errors
      if (msg.includes("Signups not allowed")) {
         setError("Signups are currently disabled. Please enable 'Email Provider' in your Supabase Dashboard > Authentication > Providers.");
      } else if (err.status === 422) {
         // 422 usually means validation failed on the server (password too short, bad email)
         setError("Unable to create account. Ensure password is 6+ chars and email is valid.");
      } else {
         setError(msg || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAvatarFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-rugby-900 border border-rugby-800 rounded-2xl w-full shadow-2xl relative overflow-hidden transition-all duration-300 my-8 flex flex-col ${isSignUp ? 'max-w-2xl h-[85vh]' : 'max-w-md'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-rugby-800 flex justify-between items-center bg-rugby-950/50">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isSignUp ? 'Join Keyboard Rugby' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isSignUp ? 'Create your profile to join the fantasy league.' : 'Sign in to manage your team.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-3 bg-red-900/30 border border-red-800 text-red-200 text-sm rounded-lg flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isSignUp && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Profile Photo UI */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-rugby-800 border-2 border-dashed border-rugby-600 flex items-center justify-center text-gray-400 overflow-hidden relative group cursor-pointer">
                    {avatarFile ? (
                      <img 
                        src={URL.createObjectURL(avatarFile)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Profile Photo</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rugby-800 file:text-rugby-accent hover:file:bg-rugby-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">First Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-rugby-950 border border-rugby-800 rounded-lg py-2 pl-8 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rugby-accent"
                        placeholder="Baguma"
                      />
                      <User className="absolute left-2.5 top-2.5 text-gray-600" size={14} />
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Second Name</label>
                    <input
                      type="text"
                      value={secondName}
                      onChange={(e) => setSecondName(e.target.value)}
                      className="w-full bg-rugby-950 border border-rugby-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rugby-accent"
                      placeholder="Middle"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-rugby-950 border border-rugby-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rugby-accent"
                      placeholder="Victor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Date of Birth <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-rugby-950 border border-rugby-800 rounded-lg py-2 pl-8 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rugby-accent"
                      />
                      <Calendar className="absolute left-2.5 top-2.5 text-gray-600" size={14} />
                    </div>
                   </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Country</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-rugby-950 border border-rugby-800 rounded-lg py-2 pl-8 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rugby-accent"
                        placeholder="South Africa"
                      />
                      <Globe className="absolute left-2.5 top-2.5 text-gray-600" size={14} />
                    </div>
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Contact Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-rugby-950 border border-rugby-800 rounded-lg py-2 pl-8 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rugby-accent"
                      placeholder="+27 12 345 6789"
                    />
                    <Phone className="absolute left-2.5 top-2.5 text-gray-600" size={14} />
                  </div>
                </div>
                
                <div className="border-t border-rugby-800 my-4"></div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Email Address <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-rugby-950 border border-rugby-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-rugby-accent transition-all text-sm"
                  placeholder="you@example.com"
                />
                <Mail className="absolute left-3 top-2.5 text-gray-500" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-rugby-950 border border-rugby-800 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-rugby-accent transition-all text-sm"
                  placeholder="Min 6 characters"
                />
                <Lock className="absolute left-3 top-2.5 text-gray-500" size={18} />
              </div>
              {isSignUp && (
                <p className="text-[10px] text-gray-500 mt-1 ml-1">Must be at least 6 characters long</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rugby-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={toggleMode}
              className="text-rugby-accent hover:text-white font-semibold transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
