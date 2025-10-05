import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User as UserIcon, Mail, Phone, Save } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '@/utils/storage';
import { toast } from 'react-hot-toast';
import { authApi, handleApiError } from '@/utils/api';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(getCurrentUser());
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            navigate('/login');
            return;
        }

        setUser(currentUser);
        setFirstName(currentUser.first_name || '');
        setLastName(currentUser.last_name || '');
        setPhoneNumber(currentUser.phone_number || '');

        // Fetch latest profile from backend
        fetchProfile();
    }, [navigate]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const response = await authApi.getProfile();
            console.log('Profile API response:', response);

            // Handle response - check if data is nested in 'user' property
            const profileData = response.user || response;

            // Update local storage with latest data
            const updatedUser = {
                ...user!,
                id: profileData.id || user!.id,
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                phone_number: profileData.phone_number || '',
                email: profileData.email || user!.email,
                created_at: profileData.created_at,
                updated_at: profileData.updated_at,
            };

            setCurrentUser(updatedUser);
            setUser(updatedUser);
            setFirstName(profileData.first_name || '');
            setLastName(profileData.last_name || '');
            setPhoneNumber(profileData.phone_number || '');
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            // Continue with local data if fetch fails
            toast.error('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!firstName.trim()) {
            toast.error('First name is required');
            return;
        }

        if (!lastName.trim()) {
            toast.error('Last name is required');
            return;
        }

        if (phoneNumber && !/^\+?[\d\s\-()]+$/.test(phoneNumber)) {
            toast.error('Invalid phone number format');
            return;
        }

        setIsSaving(true);

        try {
            // Update profile on backend
            const response = await authApi.updateProfile(
                firstName.trim(),
                lastName.trim(),
                phoneNumber.trim() || undefined
            );

            console.log('Update profile response:', response);

            // Handle response - profile data might be nested
            const updatedProfile = response.user || response;

            // Update local storage
            const updatedUser = {
                ...user!,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone_number: phoneNumber.trim(),
                updated_at: updatedProfile.updated_at || new Date().toISOString(),
            };

            setCurrentUser(updatedUser);
            setUser(updatedUser);

            toast.success('Profile updated successfully! 🔥');
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link to="/dashboard">
                        <Button variant="ghost">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <Card className="p-8 bg-card border-border">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <UserIcon className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading profile...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            {/* Email (Read-only) */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="bg-secondary border-border text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>

                            {/* First Name */}
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-foreground flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    First Name
                                </Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="bg-input border-border text-foreground"
                                    required
                                />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-foreground flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    Last Name
                                </Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="bg-input border-border text-foreground"
                                    required
                                />
                            </div>

                            {/* Phone Number */}
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="text-foreground flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Phone Number (Optional)
                                </Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="bg-input border-border text-foreground"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Include country code (e.g., +1 for US)
                                </p>
                            </div>

                            {/* Account Info */}
                            <div className="bg-secondary border border-border rounded-lg p-4 space-y-2">
                                <h3 className="font-semibold text-foreground">Account Information</h3>
                                <div className="text-sm space-y-1">
                                    <p className="text-muted-foreground">
                                        <span className="font-medium">User ID:</span> {user.id}
                                    </p>
                                    {user.created_at && (
                                        <p className="text-muted-foreground">
                                            <span className="font-medium">Member since:</span>{' '}
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                    )}
                                    {user.updated_at && (
                                        <p className="text-muted-foreground">
                                            <span className="font-medium">Last updated:</span>{' '}
                                            {new Date(user.updated_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Save Button */}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Profile
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Profile;

