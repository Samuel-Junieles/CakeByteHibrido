import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhotoService } from '../../data/services/photo.service';
import { PRESET_PRODUCT_IMAGES, resolveProductImageUrl } from '../../domain/models/models';

@Component({
  selector: 'app-photo-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="photo-picker-box">
      <div class="photo-preview-area">
        <img [src]="previewUrl" [alt]="label" class="photo-preview-img" />
        <span class="photo-source-badge" *ngIf="sourceLabel">{{ sourceLabel }}</span>
      </div>

      <div class="photo-actions-col">
        <label class="picker-title">{{ label }}</label>
        <p class="picker-hint">
          Usa la cámara de tu dispositivo, abre la galería del teléfono/PC o elige del catálogo.
        </p>

        <div class="picker-buttons">
          <button type="button" class="cb-btn-primary btn-sm" (click)="onTakePhoto()">
            Tomar Foto (Cámara)
          </button>

          <button type="button" class="cb-btn-outline btn-sm" (click)="onOpenGallery()">
            Abrir Galería
          </button>

          <button
            type="button"
            class="cb-btn-outline btn-sm"
            (click)="fileInput.click()"
            title="Subir archivo desde el dispositivo"
          >
            Subir Archivo
          </button>
          <input
            #fileInput
            type="file"
            accept="image/*"
            capture="environment"
            style="display: none"
            (change)="onFileSelected($event)"
          />
        </div>

        <div class="preset-selector" *ngIf="showPresets">
          <label class="preset-label">O selecciona una imagen del catálogo CakeByte:</label>
          <div class="preset-thumbs">
            <button
              type="button"
              *ngFor="let preset of presets"
              class="preset-thumb-btn"
              [class.selected]="imageValue === preset.key"
              (click)="selectPreset(preset.key)"
              [title]="preset.label"
            >
              <img [src]="preset.url" [alt]="preset.label" />
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .photo-picker-box {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 16px;
      border-radius: 18px;
      background: #fff7f4;
      border: 1.5px dashed var(--cb-salmon);
      flex-wrap: wrap;
    }
    .photo-preview-area {
      position: relative;
      width: 128px;
      height: 128px;
      border-radius: 16px;
      overflow: hidden;
      background: #fff;
      border: 2px solid var(--cb-border);
      flex-shrink: 0;
    }
    .photo-preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-source-badge {
      position: absolute;
      bottom: 6px;
      left: 6px;
      right: 6px;
      background: rgba(35, 25, 23, 0.78);
      color: #fff;
      font-size: 0.68rem;
      font-weight: 700;
      text-align: center;
      padding: 3px 6px;
      border-radius: 8px;
    }
    .photo-actions-col {
      flex: 1;
      min-width: 240px;
    }
    .picker-title {
      display: block;
      font-weight: 700;
      font-size: 0.96rem;
      color: #231917;
      margin-bottom: 4px;
    }
    .picker-hint {
      margin: 0 0 12px;
      font-size: 0.82rem;
      color: var(--cb-muted);
    }
    .picker-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .btn-sm {
      padding: 9px 14px;
      font-size: 0.84rem;
      border-radius: 11px;
    }
    .preset-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      color: #5d4037;
      margin-bottom: 8px;
    }
    .preset-thumbs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .preset-thumb-btn {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      padding: 2px;
      border: 2px solid transparent;
      background: #fff;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.15s ease;
    }
    .preset-thumb-btn.selected {
      border-color: var(--cb-salmon);
      transform: scale(1.06);
    }
    .preset-thumb-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 7px;
    }
  `],
})
export class PhotoPickerComponent {
  @Input() label = 'Fotografía del Producto';
  @Input() imageValue = 'torta_de_chocolate';
  @Input() showPresets = true;
  @Output() imageChange = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  presets = PRESET_PRODUCT_IMAGES;
  sourceLabel = '';

  constructor(private photoService: PhotoService) {}

  get previewUrl(): string {
    return resolveProductImageUrl(this.imageValue);
  }

  async onTakePhoto(): Promise<void> {
    const captured = await this.photoService.takePhotoFromCamera();
    if (captured?.dataUrl) {
      this.imageValue = captured.dataUrl;
      this.sourceLabel = 'Cámara';
      this.imageChange.emit(this.imageValue);
    }
  }

  async onOpenGallery(): Promise<void> {
    const captured = await this.photoService.pickFromGallery();
    if (captured?.dataUrl) {
      this.imageValue = captured.dataUrl;
      this.sourceLabel = 'Galería';
      this.imageChange.emit(this.imageValue);
    } else if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const captured = await this.photoService.readFromFileInput(file);
    if (captured?.dataUrl) {
      this.imageValue = captured.dataUrl;
      this.sourceLabel = 'Galería';
      this.imageChange.emit(this.imageValue);
    }
  }

  selectPreset(key: string): void {
    this.imageValue = key;
    this.sourceLabel = 'Catálogo';
    this.imageChange.emit(this.imageValue);
  }
}

