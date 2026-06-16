import { Component, Input } from '@angular/core';
import { DialogModule, DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [DialogModule],
  template: `
    <ng-template cdkDialogContainer>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" (click)="dialogRef.close()"></div>
        <div class="relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
          <ng-content />
        </div>
      </div>
    </ng-template>
  `,
})
export class DialogComponent {
  @Input() dialogRef!: DialogRef;
}
