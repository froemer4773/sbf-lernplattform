import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './datenschutz.component.html',
  styleUrl: './datenschutz.component.scss'
})
export class DatenschutzComponent implements OnInit {
  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
}
