// ─── Data Layer for Dashboard Features ─────────────────────────
// All functions are lightweight — store only IDs, strings, numbers, timestamps.

// ─── Activity ──────────────────────────────────────────────────
function trackActivity(userId, type, text, refId, refType) {
  if (!userId) return;
  try {
    db.collection('activity').add({
      userId: userId,
      type: type || 'general',
      text: text || '',
      referenceId: refId || '',
      referenceType: refType || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(){});
  } catch(e) {}
}

function getActivity(userId, maxItems) {
  maxItems = maxItems || 20;
  if (!userId) return Promise.resolve([]);
  return db.collection('activity')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(maxItems)
    .get()
    .then(function(snap) {
      var items = [];
      snap.forEach(function(doc) {
        items.push({ id: doc.id, data: doc.data() });
      });
      return items;
    })
    .catch(function() { return []; });
}

// ─── Continue Learning ─────────────────────────────────────────
function trackContinueLearning(userId, resourceId, resourceType, title) {
  if (!userId || !resourceId) return;
  try {
    db.collection('continue_learning').doc(userId + '_' + resourceId).set({
      userId: userId,
      resourceId: resourceId,
      resourceType: resourceType || 'unknown',
      title: title || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(){});
  } catch(e) {}
}

function getContinueLearning(userId, maxItems) {
  maxItems = maxItems || 5;
  if (!userId) return Promise.resolve([]);
  return db.collection('continue_learning')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(maxItems)
    .get()
    .then(function(snap) {
      var items = [];
      snap.forEach(function(doc) {
        items.push({ id: doc.id, data: doc.data() });
      });
      return items;
    })
    .catch(function() { return []; });
}

// ─── Bookmarks (Saved Resources) ──────────────────────────────
function toggleBookmark(userId, resourceId, resourceType, title) {
  if (!userId || !resourceId) return Promise.resolve(false);
  var docId = userId + '_' + resourceId;
  return db.collection('bookmarks').doc(docId).get()
    .then(function(doc) {
      if (doc.exists) {
        return db.collection('bookmarks').doc(docId).delete().then(function() { return false; });
      } else {
        return db.collection('bookmarks').doc(docId).set({
          userId: userId,
          resourceId: resourceId,
          resourceType: resourceType || 'unknown',
          title: title || '',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function() { return true; });
      }
    })
    .catch(function() { return false; });
}

function isBookmarked(userId, resourceId) {
  if (!userId || !resourceId) return Promise.resolve(false);
  return db.collection('bookmarks').doc(userId + '_' + resourceId).get()
    .then(function(doc) { return doc.exists; })
    .catch(function() { return false; });
}

function getBookmarks(userId, maxItems) {
  maxItems = maxItems || 50;
  if (!userId) return Promise.resolve([]);
  return db.collection('bookmarks')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(maxItems)
    .get()
    .then(function(snap) {
      var items = [];
      snap.forEach(function(doc) {
        items.push({ id: doc.id, data: doc.data() });
      });
      return items;
    })
    .catch(function() { return []; });
}

function getBookmarkCount(userId) {
  if (!userId) return Promise.resolve(0);
  return db.collection('bookmarks')
    .where('userId', '==', userId)
    .get()
    .then(function(snap) { return snap.size; })
    .catch(function() { return 0; });
}

// ─── Downloads ─────────────────────────────────────────────────
function trackDownload(userId, resourceId, resourceType, title) {
  if (!userId || !resourceId) return;
  try {
    db.collection('downloads').add({
      userId: userId,
      resourceId: resourceId,
      resourceType: resourceType || 'unknown',
      title: title || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(){});
    // Also increment resource download counter
    trackResourceStat(resourceId, 'download');
  } catch(e) {}
}

function getDownloads(userId, maxItems) {
  maxItems = maxItems || 10;
  if (!userId) return Promise.resolve([]);
  return db.collection('downloads')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(maxItems)
    .get()
    .then(function(snap) {
      var items = [];
      snap.forEach(function(doc) {
        items.push({ id: doc.id, data: doc.data() });
      });
      return items;
    })
    .catch(function() { return []; });
}

function getDownloadCount(userId) {
  if (!userId) return Promise.resolve(0);
  return db.collection('downloads')
    .where('userId', '==', userId)
    .get()
    .then(function(snap) { return snap.size; })
    .catch(function() { return 0; });
}

// ─── Recently Viewed ──────────────────────────────────────────
function trackRecentlyViewed(userId, resourceId, resourceType, title) {
  if (!userId || !resourceId) return;
  try {
    db.collection('recently_viewed').doc(userId + '_' + resourceId).set({
      userId: userId,
      resourceId: resourceId,
      resourceType: resourceType || 'unknown',
      title: title || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(){});
  } catch(e) {}
}

function getRecentlyViewed(userId, maxItems) {
  maxItems = maxItems || 20;
  if (!userId) return Promise.resolve([]);
  return db.collection('recently_viewed')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(maxItems)
    .get()
    .then(function(snap) {
      var items = [];
      snap.forEach(function(doc) {
        items.push({ id: doc.id, data: doc.data() });
      });
      return items;
    })
    .catch(function() { return []; });
}

// ─── Notifications ────────────────────────────────────────────
function getNotifications(maxItems) {
  maxItems = maxItems || 20;
  return db.collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(maxItems)
    .get()
    .then(function(snap) {
      var items = [];
      snap.forEach(function(doc) {
        items.push({ id: doc.id, data: doc.data() });
      });
      return items;
    })
    .catch(function() { return []; });
}

function markNotificationRead(userId, notificationId) {
  if (!userId || !notificationId) return;
  try {
    db.collection('notifications').doc(notificationId).update({
      readBy: firebase.firestore.FieldValue.arrayUnion(userId)
    }).catch(function(){});
  } catch(e) {}
}

function markAllNotificationsRead(userId) {
  if (!userId) return;
  getNotifications().then(function(items) {
    var batch = db.batch();
    items.forEach(function(item) {
      var ref = db.collection('notifications').doc(item.id);
      batch.update(ref, {
        readBy: firebase.firestore.FieldValue.arrayUnion(userId)
      });
    });
    batch.commit().catch(function(){});
  }).catch(function(){});
}

function getUnreadCount(userId) {
  if (!userId) return Promise.resolve(0);
  return db.collection('notifications')
    .where('readBy', 'not-in', [[userId]])
    .get()
    .then(function(snap) { return snap.size; })
    .catch(function() { return 0; });
}

// ─── Achievements ─────────────────────────────────────────────
var ACHIEVEMENT_DEFS = [
  { id: 'first_login', title: 'First Login', desc: 'Logged in for the first time', icon: '🚀' },
  { id: 'first_note', title: 'Note Taker', desc: 'Downloaded your first note', icon: '📄' },
  { id: 'first_sat', title: 'SAT Starter', desc: 'Completed your first SAT practice test', icon: '📝' },
  { id: 'week_active', title: 'Week Warrior', desc: 'Active for 7 consecutive days', icon: '🔥' },
  { id: 'comp_participant', title: 'Competitor', desc: 'Participated in a competition', icon: '🏅' },
  { id: 'first_bookmark', title: 'Bookmarker', desc: 'Saved your first resource', icon: '🔖' },
  { id: 'ten_downloads', title: 'Collector', desc: 'Downloaded 10 resources', icon: '📚' },
  { id: 'five_sats', title: 'SAT Grinder', desc: 'Completed 5 SAT practice tests', icon: '🎯' }
];

function checkAndAwardAchievement(userId, badgeId) {
  if (!userId || !badgeId) return Promise.resolve(false);
  return db.collection('achievements').doc(userId + '_' + badgeId).get()
    .then(function(doc) {
      if (doc.exists) return false;
      return db.collection('achievements').doc(userId + '_' + badgeId).set({
        userId: userId,
        badgeId: badgeId,
        earnedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() { return true; });
    })
    .catch(function() { return false; });
}

function getUserAchievements(userId) {
  if (!userId) return Promise.resolve([]);
  return db.collection('achievements')
    .where('userId', '==', userId)
    .get()
    .then(function(snap) {
      var earned = {};
      snap.forEach(function(doc) { earned[doc.data().badgeId] = doc.data().earnedAt; });
      var list = [];
      ACHIEVEMENT_DEFS.forEach(function(def) {
        list.push({
          id: def.id,
          title: def.title,
          desc: def.desc,
          icon: def.icon,
          earned: !!earned[def.id],
          earnedAt: earned[def.id] || null
        });
      });
      return list;
    })
    .catch(function() { return []; });
}

// ─── Feedback ─────────────────────────────────────────────────
function submitFeedback(userId, category, message) {
  if (!userId || !category || !message) return Promise.resolve(false);
  return db.collection('feedback').add({
    userId: userId,
    category: category,
    message: message,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'open'
  }).then(function() { return true; })
  .catch(function() { return false; });
}

// ─── Resource Stats ───────────────────────────────────────────
function trackResourceStat(resourceId, field) {
  if (!resourceId) return;
  try {
    db.collection('resource_stats').doc(resourceId).set({
      lastAccessed: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(function() {
      db.collection('resource_stats').doc(resourceId).update({
        [field]: firebase.firestore.FieldValue.increment(1)
      }).catch(function(){});
    }).catch(function(){});
  } catch(e) {}
}

function getResourceStats(resourceId) {
  if (!resourceId) return Promise.resolve(null);
  return db.collection('resource_stats').doc(resourceId).get()
    .then(function(doc) { return doc.exists ? doc.data() : null; })
    .catch(function() { return null; });
}

// ─── Profile ──────────────────────────────────────────────────
function updateProfile(userId, data) {
  if (!userId) return Promise.reject('Not logged in');
  return db.collection('users').doc(userId).update(data)
    .catch(function() { return db.collection('users').doc(userId).set(data); });
}

function getProfile(userId) {
  if (!userId) return Promise.resolve(null);
  return db.collection('users').doc(userId).get()
    .then(function(doc) { return doc.exists ? doc.data() : null; })
    .catch(function() { return null; });
}

// ─── Admin: Dashboard Stats ───────────────────────────────────
function getAdminStats() {
  var stats = {};
  return db.collection('users').get().then(function(snap) {
    stats.totalUsers = snap.size;
    var active = 0;
    snap.forEach(function(doc) {
      var d = doc.data();
      if (d.lastLogin) active++;
    });
    stats.activeUsers = active;
    return db.collection('notes').get();
  }).then(function(snap) {
    stats.notes = snap.size;
    return db.collection('lectures').get();
  }).then(function(snap) {
    stats.lectures = snap.size;
    return db.collection('games').get();
  }).then(function(snap) {
    stats.games = snap.size;
    return db.collection('news').get();
  }).then(function(snap) {
    stats.news = snap.size;
    return db.collection('feedback').where('status', '==', 'open').get();
  }).then(function(snap) {
    stats.openFeedback = snap.size;
    return db.collection('activity').orderBy('timestamp', 'desc').limit(10).get();
  }).then(function(snap) {
    stats.recentActivity = snap.size;
    return stats;
  }).catch(function() { return {}; });
}

// ─── Admin: Users with search ────────────────────────────────
function searchUsers(query, field) {
  field = field || 'username';
  // Firestore doesn't support native text search, so get all and filter client-side
  return db.collection('users').get()
    .then(function(snap) {
      var results = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        var val = String(d[field] || '').toLowerCase();
        if (val.indexOf(query.toLowerCase()) !== -1) {
          results.push({ id: doc.id, data: d });
        }
      });
      return results;
    })
    .catch(function() { return []; });
}

function getRecentRegistrations(limitCount) {
  limitCount = limitCount || 10;
  return db.collection('users')
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get()
    .then(function(snap) {
      var users = [];
      snap.forEach(function(doc) { users.push({ id: doc.id, data: doc.data() }); });
      return users;
    })
    .catch(function() { return []; });
}

// ─── Admin: Resource Analytics ────────────────────────────────
function getResourceAnalytics() {
  return db.collection('resource_stats').get()
    .then(function(snap) {
      var items = [];
      var mostDownloaded = null;
      var maxDownloads = 0;
      snap.forEach(function(doc) {
        var d = doc.data();
        items.push({ id: doc.id, data: d });
        if ((d.downloads || 0) > maxDownloads) {
          maxDownloads = d.downloads || 0;
          mostDownloaded = { id: doc.id, downloads: maxDownloads };
        }
      });
      return { items: items, mostDownloaded: mostDownloaded };
    })
    .catch(function() { return { items: [], mostDownloaded: null }; });
}

// ─── Admin: Broadcast Announcements ──────────────────────────
function createAnnouncement(title, message, priority, startDate, endDate) {
  return db.collection('announcements').add({
    title: title,
    message: message,
    priority: priority || 'normal',
    startDate: startDate || null,
    endDate: endDate || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(e) { console.error(e); });
}

function getAnnouncements() {
  return db.collection('announcements')
    .orderBy('createdAt', 'desc')
    .get()
    .then(function(snap) {
      var items = [];
      snap.forEach(function(doc) { items.push({ id: doc.id, data: doc.data() }); });
      return items;
    })
    .catch(function() { return []; });
}

function deleteAnnouncement(id) {
  return db.collection('announcements').doc(id).delete().catch(function(){});
}

// ─── Admin: Feedback Management ──────────────────────────────
function getFeedback(status) {
  var query = db.collection('feedback').orderBy('timestamp', 'desc');
  if (status) query = query.where('status', '==', status);
  return query.get()
    .then(function(snap) {
      var items = [];
      snap.forEach(function(doc) { items.push({ id: doc.id, data: doc.data() }); });
      return items;
    })
    .catch(function() { return []; });
}

function updateFeedbackStatus(feedbackId, status) {
  return db.collection('feedback').doc(feedbackId).update({ status: status }).catch(function(){});
}
