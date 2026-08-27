export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  };
  return date.toLocaleDateString('en-US', options);
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Active':
    case 'Completed':
    case 'Paid':
    case 'Dispensed':
    case 'Available':
    case 'In Stock':
    case 'Success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'Scheduled':
    case 'Confirmed':
    case 'Inpatient':
    case 'Processing':
    case 'Partially Paid':
    case 'Partially Dispensed':
      return 'bg-blue-50 text-blue-700 border-blue-200';

    case 'Checked In':
    case 'Sample Collected':
    case 'Requested':
    case 'Pending':
    case 'Reserved':
    case 'Low Stock':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'Cancelled':
    case 'No Show':
    case 'Occupied':
    case 'Out of Stock':
    case 'Discontinued':
    case 'Critical':
    case 'High':
    case 'Failed':
      return 'bg-rose-50 text-rose-700 border-rose-200';

    case 'Discharged':
    case 'Maintenance':
    case 'Inactive':
    case 'Under Renovation':
      return 'bg-slate-100 text-slate-700 border-slate-200';

    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};
