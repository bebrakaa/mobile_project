import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent вызывает AppRegistry.registerComponent('main', () => App);
// и обеспечивает корректную работу приложения как в Expo Go, так и в сборке.
registerRootComponent(App);
