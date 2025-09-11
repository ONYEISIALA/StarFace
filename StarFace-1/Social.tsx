
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface Post {
  id: number;
  username: string;
  avatar: string;
  content: string;
  media?: string;
  mediaType?: 'image' | 'video';
  timestamp: string;
  likes: number;
  views: number;
  shares: number;
  comments: { user: string; text: string; timestamp: string }[];
  tags: string[];
  location?: string;
  visibility: 'public' | 'friends' | 'private';
}

interface User {
  username: string;
  avatar: string;
  followers: string[];
  following: string[];
  bio: string;
  verified: boolean;
  joinDate: string;
  postsCount: number;
  totalLikes: number;
  isOnline: boolean;
  lastSeen: string;
}

interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'share';
  from: string;
  postId?: number;
  message: string;
  timestamp: string;
  read: boolean;
}

const Social: React.FC = () => {
  const navigate = useNavigate();
  const myUsername = localStorage.getItem("myUsername") || "Guest";
  const [avatar, setAvatar] = useState(localStorage.getItem("myAvatar") || "🙂");

  // Core state
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // UI state
  const [newPost, setNewPost] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [filterUser, setFilterUser] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('newest');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'following' | 'notifications'>('feed');
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [sharedPosts, setSharedPosts] = useState<Set<number>>(new Set());
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const availableTags = ['#fun', '#learning', '#gaming', '#art', '#music', '#sports', '#tech', '#nature', '#food', '#travel', '#life', '#work', '#family', '#friends'];

  // Memory optimization with useMemo
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by user
    if (filterUser) {
      filtered = filtered.filter(p => p.username === filterUser);
    }

    // Filter by tab
    if (activeTab === 'following') {
      const following = users[myUsername]?.following || [];
      filtered = filtered.filter(p => following.includes(p.username) || p.username === myUsername);
    }

    // Filter by visibility
    if (activeTab !== 'notifications') {
      const following = users[myUsername]?.following || [];
      filtered = filtered.filter(p => {
        if (p.username === myUsername) return true;
        if (p.visibility === 'public') return true;
        if (p.visibility === 'friends' && following.includes(p.username)) return true;
        return false;
      });
    }

    // Sort posts
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.likes + b.comments.length + b.shares) - (a.likes + a.comments.length + a.shares));
        break;
      case 'trending':
        filtered.sort((a, b) => {
          const aScore = (a.likes * 2 + a.comments.length * 3 + a.views + a.shares * 4) / ((Date.now() - new Date(a.timestamp).getTime()) / 3600000 + 1);
          const bScore = (b.likes * 2 + b.comments.length * 3 + b.views + b.shares * 4) / ((Date.now() - new Date(b.timestamp).getTime()) / 3600000 + 1);
          return bScore - aScore;
        });
        break;
      default:
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return filtered;
  }, [posts, searchQuery, filterUser, activeTab, sortBy, users, myUsername]);

  // Initialize data with useCallback for performance
  const initializeData = useCallback(() => {
    // Load posts
    const saved = localStorage.getItem("social_posts");
    if (saved) setPosts(JSON.parse(saved));

    // Load users
    const savedUsers = localStorage.getItem("social_users");
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const currentUser: User = {
        username: myUsername,
        avatar,
        followers: [],
        following: [],
        bio: "Welcome to my profile!",
        verified: false,
        joinDate: new Date().toISOString(),
        postsCount: 0,
        totalLikes: 0,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      };
      const initialUsers = { [myUsername]: currentUser };
      setUsers(initialUsers);
      localStorage.setItem("social_users", JSON.stringify(initialUsers));
    }

    // Load interactions
    const savedLikes = localStorage.getItem(`liked_posts_${myUsername}`);
    if (savedLikes) setLikedPosts(new Set(JSON.parse(savedLikes)));

    const savedShares = localStorage.getItem(`shared_posts_${myUsername}`);
    if (savedShares) setSharedPosts(new Set(JSON.parse(savedShares)));

    // Load notifications
    const savedNotifications = localStorage.getItem(`notifications_${myUsername}`);
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
  }, [myUsername, avatar]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Auto-save with debouncing for performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("social_posts", JSON.stringify(posts));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [posts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("social_users", JSON.stringify(users));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`liked_posts_${myUsername}`, JSON.stringify(Array.from(likedPosts)));
  }, [likedPosts, myUsername]);

  useEffect(() => {
    localStorage.setItem(`shared_posts_${myUsername}`, JSON.stringify(Array.from(sharedPosts)));
  }, [sharedPosts, myUsername]);

  useEffect(() => {
    localStorage.setItem(`notifications_${myUsername}`, JSON.stringify(notifications));
  }, [notifications, myUsername]);

  const addNotification = useCallback((type: Notification['type'], from: string, postId?: number) => {
    if (from === myUsername) return;
    
    const messages = {
      like: `${from} liked your post`,
      follow: `${from} started following you`,
      comment: `${from} commented on your post`,
      share: `${from} shared your post`
    };

    const notification: Notification = {
      id: Date.now().toString(),
      type,
      from,
      postId,
      message: messages[type],
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep only 50 notifications
  }, [myUsername]);

  const handlePost = useCallback(() => {
    if (!newPost.trim() && !media) return;
    const url = media ? URL.createObjectURL(media) : undefined;

    const post: Post = {
      id: Date.now(),
      username: myUsername,
      avatar,
      content: newPost.trim(),
      media: url,
      mediaType: media?.type.startsWith("video") ? "video" : "image",
      timestamp: new Date().toISOString(),
      likes: 0,
      views: 0,
      shares: 0,
      comments: [],
      tags: selectedTags,
      location: location.trim() || undefined,
      visibility: postVisibility,
    };

    setPosts(prev => [post, ...prev]);
    
    // Update user stats
    setUsers(prev => ({
      ...prev,
      [myUsername]: {
        ...prev[myUsername],
        postsCount: prev[myUsername].postsCount + 1
      }
    }));

    // Reset form
    setNewPost("");
    setMedia(null);
    setMediaPreview(null);
    setSelectedTags([]);
    setLocation("");
    setPostVisibility('public');
    setShowCreatePost(false);
  }, [newPost, media, myUsername, avatar, selectedTags, location, postVisibility]);

  const handleLike = useCallback((id: number, postUser: string) => {
    if (postUser === myUsername) return;
    
    const newLikedPosts = new Set(likedPosts);
    const isLiked = likedPosts.has(id);
    
    if (isLiked) {
      newLikedPosts.delete(id);
    } else {
      newLikedPosts.add(id);
      addNotification('like', myUsername, id);
    }
    
    setLikedPosts(newLikedPosts);
    
    setPosts(prev =>
      prev.map(p => (p.id === id ? { 
        ...p, 
        likes: isLiked ? p.likes - 1 : p.likes + 1 
      } : p))
    );

    // Update user total likes
    if (!isLiked) {
      setUsers(prev => ({
        ...prev,
        [postUser]: {
          ...prev[postUser],
          totalLikes: prev[postUser].totalLikes + 1
        }
      }));
    }
  }, [likedPosts, myUsername, addNotification]);

  const handleShare = useCallback((id: number, postUser: string) => {
    const newSharedPosts = new Set(sharedPosts);
    const isShared = sharedPosts.has(id);
    
    if (isShared) {
      newSharedPosts.delete(id);
    } else {
      newSharedPosts.add(id);
      addNotification('share', myUsername, id);
    }
    
    setSharedPosts(newSharedPosts);
    
    setPosts(prev =>
      prev.map(p => (p.id === id ? { 
        ...p, 
        shares: isShared ? p.shares - 1 : p.shares + 1 
      } : p))
    );
  }, [sharedPosts, myUsername, addNotification]);

  const handleView = useCallback((id: number) => {
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, views: p.views + 1 } : p))
    );
  }, []);

  const handleComment = useCallback((id: number, postUser: string) => {
    const text = commentInputs[id];
    if (!text?.trim()) return;

    setPosts(prev =>
      prev.map(p =>
        p.id === id ? { 
          ...p, 
          comments: [...p.comments, { 
            user: myUsername, 
            text: text.trim(),
            timestamp: new Date().toISOString()
          }] 
        } : p
      )
    );
    
    setCommentInputs(prev => ({ ...prev, [id]: "" }));
    addNotification('comment', myUsername, id);
  }, [commentInputs, myUsername, addNotification]);

  const handleFollow = useCallback((username: string) => {
    if (username === myUsername) return;
    
    setUsers(prev => {
      const updated = { ...prev };
      const currentUser = updated[myUsername];
      const targetUser = updated[username];
      
      if (!currentUser || !targetUser) return prev;
      
      const isFollowing = currentUser.following.includes(username);
      
      if (isFollowing) {
        currentUser.following = currentUser.following.filter(u => u !== username);
        targetUser.followers = targetUser.followers.filter(u => u !== myUsername);
      } else {
        currentUser.following.push(username);
        targetUser.followers.push(myUsername);
        addNotification('follow', myUsername);
      }
      
      return updated;
    });
  }, [myUsername, addNotification]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div style={containerStyle}>
      {/* Enhanced Header */}
      <div style={headerStyle}>
        <button onClick={() => navigate("/")} style={backButtonStyle}>
          ⬅️ Home
        </button>
        <h2 style={titleStyle}>🌍 StarFace Social</h2>
        <div style={headerActionsStyle}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              ...notificationButtonStyle,
              backgroundColor: unreadNotifications > 0 ? '#ff4757' : 'transparent'
            }}
          >
            🔔 {unreadNotifications > 0 && <span style={badgeStyle}>{unreadNotifications}</span>}
          </button>
          <button 
            onClick={() => setShowCreatePost(true)} 
            style={createPostButtonStyle}
          >
            ✨ Create Post
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={tabsStyle}>
        {(['feed', 'explore', 'following', 'notifications'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...tabButtonStyle,
              backgroundColor: activeTab === tab ? '#007bff' : 'transparent',
              color: activeTab === tab ? 'white' : '#666'
            }}
          >
            {tab === 'feed' && '🏠 Feed'}
            {tab === 'explore' && '🔍 Explore'}
            {tab === 'following' && '👥 Following'}
            {tab === 'notifications' && `🔔 Notifications ${unreadNotifications > 0 ? `(${unreadNotifications})` : ''}`}
          </button>
        ))}
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div style={notificationsStyle}>
          <h3>📬 Notifications</h3>
          {notifications.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center' }}>No notifications yet</p>
          ) : (
            notifications.slice(0, 10).map(notification => (
              <div 
                key={notification.id} 
                style={{
                  ...notificationItemStyle,
                  backgroundColor: notification.read ? '#f8f9fa' : '#e3f2fd'
                }}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div style={notificationContentStyle}>
                  <span>{notification.message}</span>
                  <small style={notificationTimeStyle}>
                    {formatTimeAgo(notification.timestamp)}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div style={filtersStyle}>
        <input
          type="text"
          placeholder="Search posts, users, hashtags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={selectStyle}
        >
          <option value="newest">🕒 Newest</option>
          <option value="popular">🔥 Popular</option>
          <option value="trending">📈 Trending</option>
        </select>
      </div>

      {/* User Profile Card - Enhanced */}
      <div style={profileCardStyle}>
        <div style={profileHeaderStyle}>
          <div style={avatarContainerStyle}>
            {avatar.startsWith("http") ? (
              <img src={avatar} alt="avatar" style={avatarImageStyle} />
            ) : (
              <div style={avatarEmojiStyle}>{avatar}</div>
            )}
            <label style={avatarUploadLabelStyle}>
              📷
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    localStorage.setItem("myAvatar", url);
                    setAvatar(url);
                    setUsers(prev => ({
                      ...prev,
                      [myUsername]: { ...prev[myUsername], avatar: url }
                    }));
                  }
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div style={profileInfoStyle}>
            <h3 style={usernameStyle}>
              {myUsername} 
              {users[myUsername]?.verified && <span style={verifiedBadgeStyle}>✓</span>}
              <span style={onlineStatusStyle}>🟢 Online</span>
            </h3>
            <p style={bioStyle}>{users[myUsername]?.bio}</p>
            <div style={statsStyle}>
              <span>📝 {users[myUsername]?.postsCount || 0} posts</span>
              <span>👥 {users[myUsername]?.followers.length || 0} followers</span>
              <span>➡️ {users[myUsername]?.following.length || 0} following</span>
              <span>❤️ {users[myUsername]?.totalLikes || 0} likes received</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Create Post Modal */}
      {showCreatePost && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h3>✨ Create New Post</h3>
              <button 
                onClick={() => setShowCreatePost(false)}
                style={closeButtonStyle}
              >
                ✕
              </button>
            </div>
            
            <textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              style={textareaStyle}
            />
            
            <div style={postOptionsStyle}>
              <label style={mediaUploadLabelStyle}>
                📷 Add Media
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMedia(file);
                      setMediaPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
              
              <input
                type="text"
                placeholder="📍 Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={locationInputStyle}
              />

              <select
                value={postVisibility}
                onChange={(e) => setPostVisibility(e.target.value as any)}
                style={visibilitySelectStyle}
              >
                <option value="public">🌍 Public</option>
                <option value="friends">👥 Friends Only</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>

            {mediaPreview && (
              <div style={mediaPreviewStyle}>
                {media?.type.startsWith("video") ? (
                  <video src={mediaPreview} controls style={previewMediaStyle} />
                ) : (
                  <img src={mediaPreview} alt="preview" style={previewMediaStyle} />
                )}
                <button 
                  onClick={() => {
                    setMedia(null);
                    setMediaPreview(null);
                  }}
                  style={removeMediaButtonStyle}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={tagsContainerStyle}>
              <p style={tagsLabelStyle}>Add hashtags:</p>
              <div style={tagsGridStyle}>
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    style={{
                      ...tagButtonStyle,
                      backgroundColor: selectedTags.includes(tag) ? '#007bff' : '#f0f0f0',
                      color: selectedTags.includes(tag) ? 'white' : '#333'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={modalActionsStyle}>
              <button onClick={handlePost} style={postButtonStyle}>
                🚀 Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Posts Feed */}
      <div style={feedStyle}>
        {filteredPosts.length === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>📝</div>
            <h3>No posts found!</h3>
            <p>Try adjusting your search or filters, or create the first post!</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              onMouseEnter={() => handleView(post.id)}
              style={postStyle}
            >
              {/* Post Header */}
              <div style={postHeaderStyle}>
                <div style={postAuthorStyle}>
                  {post.avatar.startsWith("http") ? (
                    <img src={post.avatar} alt="avatar" style={postAvatarStyle} />
                  ) : (
                    <div style={postAvatarEmojiStyle}>{post.avatar}</div>
                  )}
                  <div>
                    <div style={postUsernameStyle}>
                      {post.username}
                      {users[post.username]?.verified && (
                        <span style={verifiedBadgeStyle}>✓</span>
                      )}
                      <span style={visibilityBadgeStyle}>
                        {post.visibility === 'friends' ? '👥' : post.visibility === 'private' ? '🔒' : '🌍'}
                      </span>
                    </div>
                    <div style={postTimestampStyle}>
                      {formatTimeAgo(post.timestamp)}
                      {post.location && <span> • 📍 {post.location}</span>}
                    </div>
                  </div>
                </div>
                
                {post.username !== myUsername && (
                  <button
                    onClick={() => handleFollow(post.username)}
                    style={{
                      ...followButtonStyle,
                      backgroundColor: users[myUsername]?.following.includes(post.username) 
                        ? '#dc3545' : '#007bff',
                    }}
                  >
                    {users[myUsername]?.following.includes(post.username) ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Post Content */}
              <div style={postContentStyle}>
                <p>{post.content}</p>
                
                {post.tags.length > 0 && (
                  <div style={postTagsStyle}>
                    {post.tags.map(tag => (
                      <span key={tag} style={postTagStyle}>{tag}</span>
                    ))}
                  </div>
                )}

                {post.media && (
                  <div style={postMediaStyle}>
                    {post.mediaType === "video" ? (
                      <video src={post.media} controls style={mediaStyle} />
                    ) : (
                      <img src={post.media} alt="media" style={mediaStyle} />
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Post Actions */}
              <div style={postActionsStyle}>
                <div style={postStatsStyle}>
                  <button
                    onClick={() => handleLike(post.id, post.username)}
                    style={{
                      ...actionButtonStyle,
                      color: likedPosts.has(post.id) ? '#e74c3c' : '#666'
                    }}
                    disabled={post.username === myUsername}
                  >
                    {likedPosts.has(post.id) ? '❤️' : '🤍'} {post.likes}
                  </button>
                  
                  <span style={statStyle}>💬 {post.comments.length}</span>
                  
                  <button
                    onClick={() => handleShare(post.id, post.username)}
                    style={{
                      ...actionButtonStyle,
                      color: sharedPosts.has(post.id) ? '#3498db' : '#666'
                    }}
                  >
                    {sharedPosts.has(post.id) ? '🔄' : '↗️'} {post.shares}
                  </button>
                  
                  <span style={statStyle}>👁️ {post.views}</span>
                </div>
              </div>

              {/* Enhanced Comments Section */}
              <div style={commentsStyle}>
                {post.comments.slice(-3).map((comment, idx) => (
                  <div key={idx} style={commentStyle}>
                    <strong>{comment.user}</strong>: {comment.text}
                    <span style={commentTimeStyle}>
                      {formatTimeAgo(comment.timestamp)}
                    </span>
                  </div>
                ))}
                
                {post.comments.length > 3 && (
                  <button style={viewAllCommentsStyle}>
                    View all {post.comments.length} comments
                  </button>
                )}

                <div style={commentInputContainerStyle}>
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs({ 
                      ...commentInputs, 
                      [post.id]: e.target.value 
                    })}
                    style={commentInputStyle}
                  />
                  <button 
                    onClick={() => handleComment(post.id, post.username)} 
                    style={commentButtonStyle}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Enhanced and new styles
const containerStyle: React.CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  backgroundColor: '#f8f9fa',
  minHeight: '100vh',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
  padding: '15px 20px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const backButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  background: '#f0f0f0',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 'bold',
  background: 'linear-gradient(45deg, #007bff, #6f42c1)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
};

const notificationButtonStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: '50%',
  border: '1px solid #ddd',
  cursor: 'pointer',
  fontSize: '16px',
  position: 'relative',
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  background: '#ff4757',
  color: 'white',
  borderRadius: '50%',
  padding: '2px 6px',
  fontSize: '10px',
  fontWeight: 'bold',
};

const createPostButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '25px',
  background: 'linear-gradient(45deg, #007bff, #0056b3)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  boxShadow: '0 2px 8px rgba(0,123,255,0.3)',
};

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  marginBottom: '20px',
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '5px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
};

const notificationsStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  maxHeight: '300px',
  overflowY: 'auto',
};

const notificationItemStyle: React.CSSProperties = {
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '8px',
  cursor: 'pointer',
  border: '1px solid #eee',
  transition: 'all 0.2s ease',
};

const notificationContentStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const notificationTimeStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '12px',
};

const filtersStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  marginBottom: '20px',
  alignItems: 'center',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  borderRadius: '25px',
  border: '1px solid #ddd',
  fontSize: '14px',
  backgroundColor: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};

const selectStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  backgroundColor: 'white',
  cursor: 'pointer',
};

const profileCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const profileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
};

const avatarContainerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
};

const avatarImageStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '3px solid #007bff',
};

const avatarEmojiStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  backgroundColor: '#f0f0f0',
  border: '3px solid #007bff',
};

const avatarUploadLabelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '-5px',
  right: '-5px',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: '#007bff',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '12px',
  border: '2px solid white',
};

const profileInfoStyle: React.CSSProperties = {
  flex: 1,
};

const usernameStyle: React.CSSProperties = {
  margin: '0 0 5px 0',
  fontSize: '20px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const verifiedBadgeStyle: React.CSSProperties = {
  color: '#007bff',
  fontSize: '16px',
};

const onlineStatusStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#10b981',
};

const bioStyle: React.CSSProperties = {
  margin: '0 0 10px 0',
  color: '#666',
  fontSize: '14px',
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  fontSize: '14px',
  color: '#666',
  flexWrap: 'wrap',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '500px',
  maxHeight: '80vh',
  overflow: 'auto',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 20px 0 20px',
  borderBottom: '1px solid #eee',
  paddingBottom: '15px',
  marginBottom: '20px',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: '#666',
  padding: '5px',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '120px',
  padding: '15px 20px',
  border: 'none',
  fontSize: '16px',
  resize: 'vertical',
  fontFamily: 'inherit',
  outline: 'none',
};

const postOptionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '15px',
  padding: '0 20px',
  marginBottom: '15px',
  flexWrap: 'wrap',
};

const mediaUploadLabelStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  backgroundColor: '#f0f0f0',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  border: '1px solid #ddd',
};

const locationInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  minWidth: '150px',
};

const visibilitySelectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  cursor: 'pointer',
};

const mediaPreviewStyle: React.CSSProperties = {
  position: 'relative',
  margin: '15px 20px',
};

const previewMediaStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '300px',
  objectFit: 'cover',
  borderRadius: '8px',
};

const removeMediaButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0,0,0,0.7)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
};

const tagsContainerStyle: React.CSSProperties = {
  padding: '0 20px',
  marginBottom: '20px',
};

const tagsLabelStyle: React.CSSProperties = {
  margin: '0 0 10px 0',
  fontSize: '14px',
  fontWeight: '500',
  color: '#666',
};

const tagsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const tagButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '15px',
  border: '1px solid #ddd',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
};

const modalActionsStyle: React.CSSProperties = {
  padding: '20px',
  borderTop: '1px solid #eee',
  display: 'flex',
  justifyContent: 'flex-end',
};

const postButtonStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '25px',
  background: 'linear-gradient(45deg, #007bff, #0056b3)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  boxShadow: '0 2px 8px rgba(0,123,255,0.3)',
};

const feedStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 20px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '20px',
};

const postStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  overflow: 'hidden',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const postHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '15px 20px',
  borderBottom: '1px solid #f0f0f0',
};

const postAuthorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const postAvatarStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  objectFit: 'cover',
};

const postAvatarEmojiStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  backgroundColor: '#f0f0f0',
};

const postUsernameStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

const visibilityBadgeStyle: React.CSSProperties = {
  fontSize: '12px',
  opacity: 0.7,
};

const postTimestampStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#666',
  marginTop: '2px',
};

const followButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: '20px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
  color: 'white',
  transition: 'all 0.2s ease',
};

const postContentStyle: React.CSSProperties = {
  padding: '15px 20px',
};

const postTagsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '10px',
};

const postTagStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '12px',
  backgroundColor: '#e3f2fd',
  color: '#1976d2',
  fontSize: '12px',
  fontWeight: '500',
};

const postMediaStyle: React.CSSProperties = {
  marginTop: '15px',
};

const mediaStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '400px',
  objectFit: 'cover',
  borderRadius: '8px',
};

const postActionsStyle: React.CSSProperties = {
  padding: '15px 20px',
  borderTop: '1px solid #f0f0f0',
};

const postStatsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const actionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '4px 8px',
  borderRadius: '6px',
  transition: 'background-color 0.2s ease',
};

const statStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#666',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

const commentsStyle: React.CSSProperties = {
  padding: '15px 20px',
  borderTop: '1px solid #f0f0f0',
  backgroundColor: '#fafafa',
};

const commentStyle: React.CSSProperties = {
  fontSize: '14px',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const commentTimeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#999',
  marginLeft: 'auto',
};

const viewAllCommentsStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#666',
  cursor: 'pointer',
  fontSize: '12px',
  marginBottom: '10px',
  textDecoration: 'underline',
};

const commentInputContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginTop: '10px',
};

const commentInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: '20px',
  border: '1px solid #ddd',
  fontSize: '14px',
  backgroundColor: 'white',
};

const commentButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
};

export default Social;
