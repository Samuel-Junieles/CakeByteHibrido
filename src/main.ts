import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { addIcons } from 'ionicons';
import { defineCustomElement as defineIonIcon } from 'ionicons/components/ion-icon.js';
import {
  addCircleOutline,
  bagCheckOutline,
  bookOutline,
  calendarOutline,
  caretForwardOutline,
  cartOutline,
  cashOutline,
  checkmarkCircleOutline,
  fingerPrintOutline,
  gridOutline,
  paperPlaneOutline,
  peopleOutline,
  personOutline,
  playOutline,
  searchOutline,
  sparklesOutline,
  statsChartOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Define el Web Component <ion-icon> y registra todos los íconos utilizados
defineIonIcon();
addIcons({
  'add-circle-outline': addCircleOutline,
  'bag-check-outline': bagCheckOutline,
  'book-outline': bookOutline,
  'calendar-outline': calendarOutline,
  'caret-forward-outline': caretForwardOutline,
  'cart-outline': cartOutline,
  'cash-outline': cashOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'finger-print-outline': fingerPrintOutline,
  'grid-outline': gridOutline,
  'paper-plane-outline': paperPlaneOutline,
  'people-outline': peopleOutline,
  'person-outline': personOutline,
  'play-outline': playOutline,
  'search-outline': searchOutline,
  'sparkles-outline': sparklesOutline,
  'stats-chart-outline': statsChartOutline,
  'trending-up-outline': trendingUpOutline,
  'wallet-outline': walletOutline,
});

// Inicializa los Web Components de Capacitor Camera / PWA Elements para cámara y galería en navegador
defineCustomElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    importProvidersFrom(IonicModule.forRoot({ mode: 'md' })),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
}).catch((err) => console.error(err));
