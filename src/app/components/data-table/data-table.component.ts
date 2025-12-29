import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DataTableConfig {
  columns: { key: string; label: string; sortable?: boolean }[];
  data: any[];
  pageSize?: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
      <!-- Header avec recherche et filtres -->
      <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px;">
            <input 
              type="text" 
              [(ngModel)]="searchTerm" 
              (ngModelChange)="onSearch()"
              placeholder="Rechercher..."
              style="width: 100%; padding: 10px 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 0.875rem;"
            />
          </div>
          <select 
            [(ngModel)]="sortBy" 
            (ngModelChange)="onSort()"
            style="padding: 10px 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 0.875rem; cursor: pointer;">
            <option value="">Trier par...</option>
            <option *ngFor="let col of config.columns" [value]="col.key">{{ col.label }}</option>
          </select>
          <button 
            (click)="toggleSortOrder()"
            style="padding: 10px 16px; background: linear-gradient(90deg, #0066ff 0%, #00d4ff 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th *ngFor="let col of config.columns" 
                style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; font-size: 0.875rem;">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of paginatedData; let i = index" 
              [style.background]="i % 2 === 0 ? 'white' : '#f9fafb'"
              style="border-bottom: 1px solid #e5e7eb; transition: background 0.2s;">
              <td *ngFor="let col of config.columns" 
                style="padding: 12px 16px; color: #374151; font-size: 0.875rem;">
                {{ row[col.key] }}
              </td>
            </tr>
            <tr *ngIf="paginatedData.length === 0">
              <td [attr.colspan]="config.columns.length" style="padding: 24px; text-align: center; color: #9ca3af;">
                Aucune donnée trouvée
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #6b7280; font-size: 0.875rem;">
          Affichage {{ (currentPage - 1) * pageSize + 1 }} à {{ Math.min(currentPage * pageSize, filteredData.length) }} sur {{ filteredData.length }}
        </div>
        <div style="display: flex; gap: 8px;">
          <button 
            (click)="previousPage()" 
            [disabled]="currentPage === 1"
            style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; background: white; font-weight: 600;">
            ← Précédent
          </button>
          <div style="display: flex; gap: 4px; align-items: center;">
            <span *ngFor="let page of pageNumbers" 
              (click)="goToPage(page)"
              [style.background]="page === currentPage ? 'linear-gradient(90deg, #0066ff 0%, #00d4ff 100%)' : 'white'"
              [style.color]="page === currentPage ? 'white' : '#374151'"
              style="padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.875rem;">
              {{ page }}
            </span>
          </div>
          <button 
            (click)="nextPage()" 
            [disabled]="currentPage === totalPages"
            style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; background: white; font-weight: 600;">
            Suivant →
          </button>
        </div>
      </div>
    </div>
  `
})
export class DataTableComponent implements OnInit {
  @Input() config: DataTableConfig = { columns: [], data: [], pageSize: 10 };
  @Output() rowClick = new EventEmitter<any>();

  searchTerm = '';
  sortBy = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  pageSize = 10;
  filteredData: any[] = [];
  paginatedData: any[] = [];
  totalPages = 1;
  pageNumbers: number[] = [];

  ngOnInit() {
    this.pageSize = this.config.pageSize || 10;
    this.updateData();
  }

  onSearch() {
    this.currentPage = 1;
    this.updateData();
  }

  onSort() {
    this.currentPage = 1;
    this.updateData();
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.updateData();
  }

  updateData() {
    // Filtrer
    this.filteredData = this.config.data.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(this.searchTerm.toLowerCase())
      )
    );

    // Trier
    if (this.sortBy) {
      this.filteredData.sort((a, b) => {
        const aVal = a[this.sortBy];
        const bVal = b[this.sortBy];
        const comparison = aVal > bVal ? 1 : -1;
        return this.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Paginer
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    this.updatePageNumbers();
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  updatePageNumbers() {
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    this.pageNumbers = pages;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePageNumbers();
      this.updatePaginatedData();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePageNumbers();
      this.updatePaginatedData();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePageNumbers();
    this.updatePaginatedData();
  }

  Math = Math;
}
