import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { CapturedPhoto } from '../../domain/models/models';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly PROFILE_PHOTO_PREFIX = 'cakebyte_profile_photo_';
  private readonly RECENT_PHOTOS_KEY = 'cakebyte_recent_photos';

  public recentPhotos: CapturedPhoto[] = [];

  constructor() {
    this.loadRecentPhotos();
  }

  /**
   * Toma una fotografía directamente desde la cámara del dispositivo o webcam del navegador
   */
  async takePhotoFromCamera(): Promise<CapturedPhoto | null> {
    try {
      const photo: Photo = await Camera.getPhoto({
        quality: 82,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 900,
        height: 900,
        correctOrientation: true,
      });

      if (!photo.dataUrl) return null;
      const optimizedDataUrl = await this.compressDataUrl(photo.dataUrl, 720, 0.82);

      const captured: CapturedPhoto = {
        dataUrl: optimizedDataUrl,
        format: photo.format || 'jpeg',
        source: 'camera',
        createdAt: new Date().toISOString(),
      };

      await this.saveToRecentPhotos(captured);
      return captured;
    } catch (error) {
      console.warn('Cámara cancelada o no disponible, usando selector alternativo:', error);
      return null;
    }
  }

  /**
   * Abre la galería del teléfono o el explorador de imágenes del sistema
   */
  async pickFromGallery(): Promise<CapturedPhoto | null> {
    try {
      const photo: Photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 900,
        height: 900,
        correctOrientation: true,
      });

      if (!photo.dataUrl) return null;
      const optimizedDataUrl = await this.compressDataUrl(photo.dataUrl, 720, 0.82);

      const captured: CapturedPhoto = {
        dataUrl: optimizedDataUrl,
        format: photo.format || 'jpeg',
        source: 'gallery',
        createdAt: new Date().toISOString(),
      };

      await this.saveToRecentPhotos(captured);
      return captured;
    } catch (error) {
      console.warn('Selección de galería cancelada:', error);
      return null;
    }
  }

  /**
   * Permite elegir mediante un archivo HTML <input type="file"> como respaldo directo en escritorio/móvil
   */
  async readFromFileInput(file: File): Promise<CapturedPhoto | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const rawDataUrl = reader.result as string;
        const optimizedDataUrl = await this.compressDataUrl(rawDataUrl, 720, 0.82);
        const captured: CapturedPhoto = {
          dataUrl: optimizedDataUrl,
          format: file.type.replace('image/', '') || 'jpeg',
          source: 'gallery',
          createdAt: new Date().toISOString(),
        };
        await this.saveToRecentPhotos(captured);
        resolve(captured);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Guarda la foto de perfil asociada al correo del usuario (en Capacitor Preferences)
   */
  async saveUserProfilePhoto(email: string, dataUrl: string): Promise<void> {
    if (!email) return;
    await Preferences.set({
      key: `${this.PROFILE_PHOTO_PREFIX}${email.toLowerCase()}`,
      value: dataUrl,
    });
  }

  /**
   * Obtiene la foto de perfil guardada del usuario
   */
  async getUserProfilePhoto(email: string): Promise<string | null> {
    if (!email) return null;
    const { value } = await Preferences.get({
      key: `${this.PROFILE_PHOTO_PREFIX}${email.toLowerCase()}`,
    });
    return value;
  }

  private async saveToRecentPhotos(photo: CapturedPhoto): Promise<void> {
    this.recentPhotos = [photo, ...this.recentPhotos.slice(0, 7)];
    await Preferences.set({
      key: this.RECENT_PHOTOS_KEY,
      value: JSON.stringify(this.recentPhotos),
    });
  }

  private async loadRecentPhotos(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.RECENT_PHOTOS_KEY });
      if (value) {
        this.recentPhotos = JSON.parse(value);
      }
    } catch {
      this.recentPhotos = [];
    }
  }

  /**
   * Redimensiona y comprime imágenes en DataURL para optimizar almacenamiento en Supabase y preferencias
   */
  private compressDataUrl(dataUrl: string, maxDim = 720, quality = 0.82): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}

