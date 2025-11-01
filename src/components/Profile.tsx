import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Edit2, Save, X, Plus, UserPlus, Trophy, Loader } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  nickname: string;
  picture_url: string;
  bio: string;
  email: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  earned_at: string;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  full_name: string;
  nickname: string;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  full_name: string;
  nickname: string;
}

const badgeIcons: Record<string, any> = {
  Trophy: Trophy,
  Target: Edit2,
  Users: User,
  BookOpen: Mail,
  Zap: Trophy,
  Heart: Trophy,
  Brain: Trophy,
};

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    full_name: '',
    nickname: '',
    bio: '',
    picture_url: '',
  });

  useEffect(() => {
    loadProfile();
    loadBadges();
    loadFriends();
    loadSuggestedUsers();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setEditForm({
          full_name: data.full_name || '',
          nickname: data.nickname || '',
          bio: data.bio || '',
          picture_url: data.picture_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadBadges = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badges (
            id,
            name,
            description,
            icon,
            color,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (data) {
        const formattedBadges = data.map((item: any) => ({
          id: item.badges.id,
          name: item.badges.name,
          description: item.badges.description,
          icon: item.badges.icon,
          color: item.badges.color,
          category: item.badges.category,
          earned_at: item.earned_at,
        }));
        setBadges(formattedBadges);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;

    try {
      const { data: friendships } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          profiles:friend_id(full_name, nickname)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const friendsData = friendships?.map((f: any) => ({
        id: f.id,
        user_id: f.friend_id,
        friend_id: f.friend_id,
        full_name: f.profiles?.full_name || 'Unknown',
        nickname: f.profiles?.nickname || 'Friend',
      })) || [];

      setFriends(friendsData);

      const { data: requests } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          profiles:user_id(full_name, nickname)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      const requestsData = requests?.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        friend_id: r.friend_id,
        status: r.status,
        full_name: r.profiles?.full_name || 'Unknown',
        nickname: r.profiles?.nickname || 'Friend',
      })) || [];

      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadSuggestedUsers = async () => {
    if (!user) return;

    try {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, full_name, nickname')
        .neq('id', user.id)
        .limit(5);

      if (allUsers) {
        const { data: currentFriends } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', user.id);

        const friendIds = currentFriends?.map((f) => f.friend_id) || [];

        const suggested = allUsers.filter((u) => !friendIds.includes(u.id));
        setSuggestedUsers(suggested);
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', user.id);

      setProfile({ ...profile, ...editForm } as UserProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;

    try {
      await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });

      loadSuggestedUsers();
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, friendId: string) => {
    try {
      await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      await supabase.from('friendships').insert({
        user_id: friendId,
        friend_id: user?.id,
        status: 'accepted',
      });

      loadFriends();
      loadPendingRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await supabase.from('friendships').delete().eq('id', requestId);

      loadFriends();
      loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const loadPendingRequests = async () => {
    if (!user) return;

    try {
      const { data: requests } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          profiles:user_id(full_name, nickname)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      const requestsData = requests?.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        friend_id: r.friend_id,
        status: r.status,
        full_name: r.profiles?.full_name || 'Unknown',
        nickname: r.profiles?.nickname || 'Friend',
      })) || [];

      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  const badgesByCategory = badges.reduce((acc: any, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-300 to-secondary-500 rounded-full flex items-center justify-center text-white">
              {profile?.picture_url ? (
                <img
                  src={profile.picture_url}
                  alt={profile.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12" />
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile?.full_name}</h1>
              {profile?.nickname && (
                <p className="text-lg text-secondary-600 font-medium">
                  "{profile.nickname}"
                </p>
              )}
              {profile?.bio && (
                <p className="text-gray-600 mt-2">{profile.bio}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition"
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </button>
        </div>

        {isEditing && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, full_name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fun Nickname
              </label>
              <input
                type="text"
                value={editForm.nickname}
                onChange={(e) =>
                  setEditForm({ ...editForm, nickname: e.target.value })
                }
                placeholder="e.g., Budget Boss, Savings Guru"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Picture URL
              </label>
              <input
                type="url"
                value={editForm.picture_url}
                onChange={(e) =>
                  setEditForm({ ...editForm, picture_url: e.target.value })
                }
                placeholder="https://example.com/photo.jpg"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleUpdateProfile}
              className="flex items-center px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Email</p>
            <p className="text-lg font-medium text-gray-900 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-secondary-600" />
              {profile?.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Badges</p>
            <p className="text-lg font-medium text-gray-900 flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-primary-400" />
              {badges.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Your Achievements</h3>

        {badges.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No badges earned yet. Keep building your financial journey!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(badgesByCategory).map(([category, categoryBadges]: any) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  {category} Badges ({categoryBadges.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryBadges.map((badge: Badge) => (
                    <div
                      key={badge.id}
                      className={`${badge.color} rounded-lg p-4 text-center border-2 border-current border-opacity-20`}
                    >
                      <Trophy className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-semibold text-sm">{badge.name}</p>
                      <p className="text-xs opacity-75 mt-1">{badge.description}</p>
                      <p className="text-xs opacity-60 mt-2">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Friends ({friends.length})</h3>

          {friends.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No friends yet. Start exploring to add friends!
            </p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.user_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{friend.full_name}</p>
                    <p className="text-sm text-gray-600">"{friend.nickname}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Explore & Add Friends
          </h3>

          {pendingRequests.length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Friend Requests ({pendingRequests.length})
              </h4>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-primary-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.full_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        "{request.nickname}"
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleAcceptRequest(request.id, request.user_id)
                        }
                        className="px-3 py-1 text-sm bg-secondary-500 text-white rounded hover:bg-secondary-600 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestedUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No suggestions available right now
            </p>
          ) : (
            <div className="space-y-3">
              {suggestedUsers.map((suggestedUser) => (
                <div
                  key={suggestedUser.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {suggestedUser.full_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      "{suggestedUser.nickname || 'Friend'}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddFriend(suggestedUser.id)}
                    className="flex items-center px-3 py-1 text-sm bg-secondary-500 text-white rounded hover:bg-secondary-600 transition"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
