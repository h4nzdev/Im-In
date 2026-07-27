import { supabase, isSupabaseConfigured } from './supabaseClient';

const CHANNEL_NAME = 'realynk_enterprise_live_v1';
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

let listeners = [];
let presenceListeners = [];

function handleIncomingPayload(payload) {
  if (!payload) return;
  try {
    const notifs = JSON.parse(localStorage.getItem('realynk_admin_notifications')) || [];
    if (!notifs.some(n => n.id === payload.id)) {
      notifs.unshift(payload);
      localStorage.setItem('realynk_admin_notifications', JSON.stringify(notifs.slice(0, 50)));
    }

    if (payload.type === 'CLOCK_IN' && payload.userId) {
      const shifts = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
      shifts[payload.userId] = {
        startTime: Date.now(),
        userName: payload.userName || payload.userId,
        userId: payload.userId,
        department: payload.department || 'Shared Services'
      };
      localStorage.setItem('realynk_live_active_shifts', JSON.stringify(shifts));
    } else if (payload.type === 'CLOCK_OUT' && payload.userId) {
      const shifts = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
      delete shifts[payload.userId];
      localStorage.setItem('realynk_live_active_shifts', JSON.stringify(shifts));
    }
  } catch (err) {
    console.error('Payload processing error:', err);
  }

  listeners.forEach(cb => {
    try { cb(payload); } catch (e) {}
  });
}

let supaChannel = null;
let initPromise = null;

async function initChannel() {
  if (!isSupabaseConfigured || !supabase) return;

  const existing = supabase.getChannels().find(c => c.topic === `realtime:${CHANNEL_NAME}`);
  if (existing) {
    await supabase.removeChannel(existing);
  }

  supaChannel = supabase.channel(CHANNEL_NAME, {
    config: { 
      broadcast: { self: true },
      presence: { key: 'temp_key' } // will be overridden in track()
    }
  });

  supaChannel
    .on('broadcast', { event: 'realynk_alert' }, (res) => {
      handleIncomingPayload(res.payload);
    })
    .on('presence', { event: 'sync' }, () => {
      const state = supaChannel.presenceState();
      const onlineMap = {};
      for (const [key, presences] of Object.entries(state)) {
        if (presences.length > 0 && presences[0].userId) {
          onlineMap[presences[0].userId] = presences[0];
        }
      }
      presenceListeners.forEach(cb => cb(onlineMap));
    })
    .subscribe();
}

initPromise = initChannel();

if (bc) {
  bc.addEventListener('message', (e) => {
    if (e.data) handleIncomingPayload(e.data);
  });
}

export const realtimeBus = {
  broadcast: async (eventData) => {
    handleIncomingPayload(eventData);
    if (bc) {
      try { bc.postMessage(eventData); } catch (e) {}
    }
    await initPromise;
    if (supaChannel && isSupabaseConfigured) {
      supaChannel.send({
        type: 'broadcast',
        event: 'realynk_alert',
        payload: eventData
      }).catch(err => console.error('Supabase broadcast send failed:', err));
    }
  },

  subscribe: (callback) => {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(cb => cb !== callback);
    };
  },

  trackPresence: async (userId, userInfo) => {
    await initPromise;
    if (supaChannel && isSupabaseConfigured) {
      try {
        await supaChannel.track({
          userId: userId,
          name: userInfo.name || userId,
          department: userInfo.department || 'Shared Services',
          onlineAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to track presence:', err);
      }
    }
  },

  onPresenceSync: (callback) => {
    presenceListeners.push(callback);
    
    // Check if already connected and send state immediately
    initPromise.then(() => {
      if (supaChannel && isSupabaseConfigured) {
        const state = supaChannel.presenceState();
        const onlineMap = {};
        for (const [key, presences] of Object.entries(state)) {
          if (presences.length > 0 && presences[0].userId) {
            onlineMap[presences[0].userId] = presences[0];
          }
        }
        callback(onlineMap);
      }
    });

    return () => {
      presenceListeners = presenceListeners.filter(cb => cb !== callback);
    };
  }
};
