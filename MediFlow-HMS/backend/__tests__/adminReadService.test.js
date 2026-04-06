import { jest } from '@jest/globals';

const getAppointmentsPageMock = jest.fn();
const getDashboardSnapshotMock = jest.fn();

jest.unstable_mockModule('../repositories/adminReadRepository.js', () => ({
  getAppointmentsPage: getAppointmentsPageMock,
  getAuditLogsPage: jest.fn(),
  getDashboardSnapshot: getDashboardSnapshotMock,
  getDoctorsPage: jest.fn(),
  getInvoicesPage: jest.fn(),
  getPatientsPage: jest.fn(),
  getPaymentHistoryPage: jest.fn(),
  getStaffPage: jest.fn(),
}));

const {
  getAdminDashboardData,
  getPaginatedAppointmentsForAdmin,
} = await import('../services/admin/adminReadService.js');

describe('adminReadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds paginated appointment responses from repository results', async () => {
    getAppointmentsPageMock.mockResolvedValue([12, [{ _id: 'apt-1' }, { _id: 'apt-2' }]]);

    const response = await getPaginatedAppointmentsForAdmin({ page: '2', limit: '5' });

    expect(getAppointmentsPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 5,
        skip: 5,
      })
    );
    expect(response).toMatchObject({
      message: 'Appointments fetched successfully',
      itemKey: 'appointments',
      totalItems: 12,
      page: 2,
      limit: 5,
      items: [{ _id: 'apt-1' }, { _id: 'apt-2' }],
    });
  });

  it('maps dashboard aggregates into the dashboard contract used by the controller', async () => {
    getDashboardSnapshotMock.mockResolvedValue({
      doctorCount: 6,
      patientCount: 24,
      appointmentCount: 31,
      latestAppointments: [{ _id: 'apt-9' }],
    });

    const dashboard = await getAdminDashboardData();

    expect(dashboard).toEqual({
      doctors: 6,
      appointments: 31,
      patients: 24,
      latestAppointments: [{ _id: 'apt-9' }],
    });
  });
});
