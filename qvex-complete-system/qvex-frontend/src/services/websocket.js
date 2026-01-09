// import Echo from 'laravel-echo';
// import Pusher from 'pusher-js';

// window.Pusher = Pusher;

// const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:6001';
// const WS_KEY = import.meta.env.VITE_WS_KEY || 'local';

// // Initialize Laravel Echo WITH cluster (this fixes the error)
// export const echo = new Echo({
//   broadcaster: 'pusher',
//   key: WS_KEY,
//   wsHost: WS_URL.replace('ws://', '').replace('wss://', '').split(':')[0], // Remove port from host
//   wsPort: 6001,
//   wssPort: 6001,
//   forceTLS: false,
//   disableStats: true,
//   enabledTransports: ['ws', 'wss'],
//   cluster: 'mt1',  // ← ADD THIS LINE - this is what's missing!
//   encrypted: false,
// });

// // Display subscription
// export const subscribeToDisplay = (callback) => {
//   return echo.channel('display-updates')
//     .listen('DisplayUpdated', (data) => callback(data));
// };

// // Queue and CSO subscriptions
// export const subscribeToQueue = (callback) => {
//   return echo.channel('queue-updates')
//     .listen('QueueCreated', (data) => callback('created', data))
//     .listen('QueueUpdated', (data) => callback('updated', data));
// };

// export const subscribeToCso = (csoId, callback) => {
//   return echo.channel(`cso-${csoId}`)
//     .listen('CustomerCalled', (data) => callback('called', data));
// };

// export default echo;