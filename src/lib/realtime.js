import { supabase, isSupabaseConfigured } from './supabaseClient';

const CHANNEL_NAME = 'realynk_enterprise_live_v1';
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;
let supaChannel = null;

if (isSupabaseConfigured && supabase) {
  supaChannel = supabase.channel(CHANNEL_NAME, {
    config: { broadcast: { self: true } }
  });
  supaChannel.subscribe();
}

export const realtimeBus = {
  broadcast: (eventData) => {
    // 1. Local Storage update (for same window / tab sync)
    try {
      const notifs = JSON.parse(localStorage.getItem('realynk_admin_notifications')) || [];
      notifs.unshift(eventData);
      localStorage.setItem('realynk_admin_notifications', JSON.stringify(notifs.slice(0, 50)));

      if (eventData.userId) {
        const activeUsers = JSON.parse(localStorage.getItem('realynk_live_online_users')) || {};
        if (eventData.isActive || eventData.type === 'LOGIN' || eventData.type === 'CLOCK_IN') {
          activeUsers[eventData.userId] = {
            userId: eventData.userId,
            name: eventData.userName || eventData.userId,
            department: eventData.department || 'Shared Services',
            loginTime: Date.now()
          };
        } else if (eventData.isActive === false || eventData.type === 'LOGOUT') {
          delete activeUsers[eventData.userId];
        }
        localStorage.setItem('realynk_live_online_users', JSON.stringify(activeUsers));
      }

      if (eventData.type === 'CLOCK_IN' && eventData.userId) {
        const shifts = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
        shifts[eventData.userId] = {
          startTime: Date.now(),
          userName: eventData.userName || eventData.userId,
          userId: eventData.userId,
          department: eventData.department || 'Shared Services'
        };
        localStorage.setItem('realynk_live_active_shifts', JSON.stringify(shifts));
      } else if (eventData.type === 'CLOCK_OUT' && eventData.userId) {
        const shifts = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
        delete shifts[eventData.userId];
        localStorage.setItem('realynk_live_active_shifts', JSON.stringify(shifts));
      }
    } catch (e) {
      console.error('Local storage broadcast error:', e);
    }

    // 2. BroadcastChannel (cross-tab in same browser)
    if (bc) {
      try {
        bc.postMessage(eventData);
      } catch (e) {}
    }

    // 3. Supabase Cloud Broadcast (cross-browser / cross-device across internet)
    if (supaChannel && isSupabaseConfigured) {
      supaChannel.send({
        type: 'broadcast',
        event: 'realynk_alert',
        payload: eventData
      }).catch(() => {});
    }
  },

  subscribe: (callback) => {
    const handler = (e) => {
      if (e.data) callback(e.data);
    };

    if (bc) bc.addEventListener('message', handler);

    let supaSub = null;
    if (isSupabaseConfigured && supabase) {
      supaSub = supabase.channel('realynk_listener_' + Math.random().toString(36).slice(2))
        .on('broadcast', { event: 'realynk_alert' }, (res) => {
          if (res.payload) {
            // Write received cloud packet into local storage so UI updates
            try {
              const notifs = JSON.parse(localStorage.getItem('realynk_admin_notifications')) || [];
              if (!notifs.some(n => n.id === res.payload.id)) {
                notifs.unshift(res.payload);
                localStorage.setItem('realynk_admin_notifications', JSON.stringify(notifs.slice(0, 50)));
              }

              if (res.payload.userId) {
                const activeUsers = JSON.parse(localStorage.getItem('realynk_live_online_users')) || {};
                if (res.payload.isActive || res.payload.type === 'LOGIN' || res.payload.type === 'CLOCK_IN') {
                  activeUsers[res.payload.userId] = {
                    userId: res.payload.userId,
                    name: res.payload.userName || res.payload.userId,
                    department: res.payload.department || 'Shared Services',
                    loginTime: Date.now()
                  };
                } else if (res.payload.isActive === false || res.payload.type === 'LOGOUT') {
                  delete activeUsers[res.payload.userId];
                }
                localStorage.setItem('realynk_live_online_users', JSON.stringify(activeUsers));
              }

              if (res.payload.type === 'CLOCK_IN' && res.payload.userId) {
                const shifts = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
                shifts[res.payload.userId] = {
                  startTime: Date.now(),
                  userName: res.payload.userName || res.payload.userId,
                  userId: res.payload.userId,
                  department: res.payload.department || 'Shared Services'
                };
                localStorage.setItem('realynk_live_active_shifts', JSON.stringify(shifts));
              } else if (res.payload.type === 'CLOCK_OUT' && res.payload.userId) {
                const shifts = JSON.parse(localStorage.getItem('realynk_live_active_shifts')) || {};
                delete shifts[res.payload.userId];
                localStorage.setItem('realynk_live_active_shifts', JSON.stringify(shifts));
              }
            } catch (err) {}

            callback(res.payload);
          }
        })
        .subscribe();
    }

    return () => {
      if (bc) bc.removeEventListener('message', handler);
      if (supaSub) supabase.removeChannel(supaSub);
    };
  }
};
