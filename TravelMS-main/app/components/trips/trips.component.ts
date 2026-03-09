import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Trip, User } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h2>Trips</h2>
        <button (click)="toggleForm()">{{ showForm ? 'Cancel' : '+ Add Trip' }}</button>
      </div>

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      @if (showForm) {
        <div class="form-box">
          <h3>{{ editId ? 'Edit Trip' : 'New Trip' }}</h3>
          <form (ngSubmit)="save()">
            <div class="form-row">
              @if (isAdmin) {
                <label>User
                  <select [(ngModel)]="form.user_id" name="user_id" required>
                    <option [value]="0" disabled>Select user</option>
                    @for (u of users; track u.user_id) {
                      <option [value]="u.user_id">{{ u.first_name }} {{ u.last_name }}</option>
                    }
                  </select>
                </label>
              }
              <label>Destination<input [(ngModel)]="form.destination" name="destination" required /></label>
            </div>
            <div class="form-row">
              <label>Start Date<input [(ngModel)]="form.start_date" name="start_date" type="date" /></label>
              <label>End Date<input [(ngModel)]="form.end_date" name="end_date" type="date" /></label>
            </div>
            <div class="form-row">
              <label>Purpose<input [(ngModel)]="form.purpose" name="purpose" /></label>
              <label>Budget ($)<input [(ngModel)]="form.estimated_budget" name="estimated_budget" type="number" min="0" step="0.01" /></label>
            </div>
            @if (isAdmin) {
              <label>Status
                <select [(ngModel)]="form.status" name="status">
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </label>
            }
            <div class="form-actions">
              <button type="submit">{{ editId ? 'Update' : 'Create' }}</button>
              <button type="button" (click)="toggleForm()">Cancel</button>
            </div>
          </form>
        </div>
      }

      @if (loading) {
        <p>Loading...</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              @if (isAdmin) { <th>User</th> }
              <th>Destination</th><th>Start</th><th>End</th>
              <th>Purpose</th><th>Budget</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (t of trips; track t.trip_id) {
              <tr>
                <td>{{ t.trip_id }}</td>
                @if (isAdmin) { <td>{{ t.user_name }}</td> }
                <td>{{ t.destination }}</td>
                <td>{{ t.start_date }}</td>
                <td>{{ t.end_date }}</td>
                <td>{{ t.purpose }}</td>
                <td>{{ '$' + t.estimated_budget }}</td>
                <td><span class="badge status-{{ t.status?.toLowerCase() }}">{{ t.status }}</span></td>
                <td class="actions">
                  @if (isAdmin) {
                    @if (t.status === 'Pending') {
                      <button class="btn-approve" (click)="approve(t.trip_id!)">Approve</button>
                      <button class="btn-reject" (click)="reject(t.trip_id!)">Reject</button>
                    }
                    <button class="btn-edit" (click)="edit(t)">Edit</button>
                    <button class="btn-delete" (click)="delete(t.trip_id!)">Delete</button>
                  } @else {
                    @if (t.status === 'Pending') {
                      <button class="btn-edit" (click)="edit(t)">Edit</button>
                      <button class="btn-delete" (click)="delete(t.trip_id!)">Delete</button>
                    }
                  }
                </td>
              </tr>
            } @empty {
              <tr><td [attr.colspan]="isAdmin ? 9 : 8" class="empty">No trips found.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  `
})
export class TripsComponent implements OnInit {
  trips: Trip[] = [];
  users: User[] = [];
  loading = true;
  error = '';
  showForm = false;
  editId: number | null = null;
  form: Trip = this.blank();

  get isAdmin(): boolean { return this.auth.isAdmin; }

  constructor(private api: ApiService, private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.isAdmin) {
      this.api.getUsers().subscribe({ next: (u) => { this.users = u; this.cdr.detectChanges(); } });
    }
    this.load();
  }

  load() {
    this.loading = true;
    const userId = this.isAdmin ? undefined : this.auth.user!.user_id;
    this.api.getTrips(userId).subscribe({
      next: (data) => { this.trips = data; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.error = err.message; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  blank(): Trip {
    return { user_id: 0, destination: '', start_date: '', end_date: '', purpose: '', status: 'Pending', estimated_budget: 0 };
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) { this.editId = null; this.form = this.blank(); }
  }

  edit(t: Trip) {
    this.editId = t.trip_id!;
    this.form = { ...t };
    this.showForm = true;
  }

  save() {
    if (!this.isAdmin) {
      this.form.user_id = this.auth.user!.user_id;
      this.form.status = 'Pending';
    }
    const action = this.editId
      ? this.api.updateTrip(this.editId, this.form)
      : this.api.createTrip(this.form);
    action.subscribe({
      next: () => { this.showForm = false; this.editId = null; this.form = this.blank(); this.cdr.detectChanges(); this.load(); },
      error: (err) => { this.error = err.error?.error || err.message; this.cdr.detectChanges(); }
    });
  }

  approve(id: number) {
    this.api.updateTripStatus(id, 'Approved').subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err.error?.error || err.message; this.cdr.detectChanges(); }
    });
  }

  reject(id: number) {
    this.api.updateTripStatus(id, 'Rejected').subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err.error?.error || err.message; this.cdr.detectChanges(); }
    });
  }

  delete(id: number) {
    if (confirm('Delete this trip? This will also delete its expenses.')) {
      this.api.deleteTrip(id).subscribe({
        next: () => this.load(),
        error: (err) => { this.error = err.error?.error || err.message; }
      });
    }
  }
}
