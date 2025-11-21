import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-chapter-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './chapter-list.component.html',
  styleUrl: './chapter-list.component.scss'
})
export class ChapterListComponent {

}
