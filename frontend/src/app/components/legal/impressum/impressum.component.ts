import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './impressum.component.html',
  styleUrl: './impressum.component.scss'
})
export class ImpressumComponent implements OnInit {
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
