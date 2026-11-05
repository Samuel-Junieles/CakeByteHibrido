import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  async ngOnInit(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add('plt-native-app');
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
        await StatusBar.setStyle({ style: Style.Light });
      } catch {
        // Ignorar en plataformas que no soporten StatusBar
      }
    }
  }
}
