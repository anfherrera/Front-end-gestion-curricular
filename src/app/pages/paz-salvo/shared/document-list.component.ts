import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UploadedFile } from '../../../services/paz-salvo.service';

@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  providers: [DatePipe]
})
export class DocumentListComponent {
  @Input() files: UploadedFile[] = [];
  @Output() fileAction = new EventEmitter<{file: UploadedFile, action: string}>();

  viewFile(file: UploadedFile) {
    this.fileAction.emit({ file, action: 'view' });
  }

  markFile(file: UploadedFile, status: 'correcto' | 'incorrecto') {
    this.fileAction.emit({ file, action: status });
  }
}
