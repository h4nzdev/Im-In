import Swal from 'sweetalert2';

export const showDeleteConfirm = async ({
  title = 'Are you sure?',
  text = "You won't be able to revert this!",
  confirmButtonText = 'Yes, delete it!'
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
    background: '#ffffff',
    color: '#0f172a',
    backdrop: 'rgba(15, 23, 42, 0.65)',
    customClass: {
      popup: 'swal-custom-popup',
      confirmButton: 'swal-custom-btn swal-btn-danger',
      cancelButton: 'swal-custom-btn swal-btn-cancel',
      title: 'swal-custom-title'
    }
  });
  return result.isConfirmed;
};

export const showPurgeConfirm = async ({ totalCount }) => {
  const result = await Swal.fire({
    title: '⚠️ EXTREME CAUTION Required',
    html: `
      <div style="text-align: left; background: #fffbeb; border: 1.5px solid #fde047; padding: 14px 16px; border-radius: 16px; color: #92400e; margin-top: 10px;">
        <p style="font-size: 0.92rem; font-weight: 700; margin: 0 0 8px; color: #b45309;">
          You are about to permanently purge ALL (${totalCount}) attendance records!
        </p>
        <p style="font-size: 0.82rem; line-height: 1.4; margin: 0; color: #78350f;">
          Every biometric check-in/out log across all employees will be completely wiped from both system cache and the Supabase database. This action CANNOT be undone.
        </p>
      </div>
    `,
    icon: 'error',
    showCancelButton: true,
    confirmButtonColor: '#881337',
    cancelButtonColor: '#64748b',
    confirmButtonText: '💥 Yes, Purge Entire Database',
    cancelButtonText: 'Cancel / Abort',
    reverseButtons: true,
    focusCancel: true,
    backdrop: 'rgba(136, 19, 55, 0.45)',
    customClass: {
      popup: 'swal-custom-popup',
      confirmButton: 'swal-custom-btn swal-btn-purge',
      cancelButton: 'swal-custom-btn swal-btn-cancel'
    }
  });
  return result.isConfirmed;
};

export const showSuccess = (title, text = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    timer: 2600,
    timerProgressBar: true,
    showConfirmButton: false,
    position: 'top-end',
    toast: true,
    background: '#ecfdf5',
    color: '#065f46',
    customClass: {
      popup: 'swal-custom-toast'
    }
  });
};

export const showAlert = (title, text, icon = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#054daf',
    background: '#ffffff',
    color: '#0f172a',
    backdrop: 'rgba(15, 23, 42, 0.65)',
    customClass: {
      popup: 'swal-custom-popup',
      confirmButton: 'swal-custom-btn swal-btn-primary'
    }
  });
};

export const showToast = (title, icon = 'success') => {
  return Swal.fire({
    title,
    icon,
    timer: 2600,
    timerProgressBar: true,
    showConfirmButton: false,
    position: 'top-end',
    toast: true,
    background: icon === 'success' ? '#ecfdf5' : '#eff6ff',
    color: icon === 'success' ? '#065f46' : '#1e3a8a',
    customClass: {
      popup: 'swal-custom-toast'
    }
  });
};
