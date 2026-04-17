import {
    getAppointmentsPage,
    getAuditLogsPage,
    getDashboardSnapshot,
    getDoctorsPage,
    getInvoicesPage,
    getPatientsPage,
    getPaymentHistoryPage,
    getStaffPage,
} from '../../repositories/adminReadRepository.js';
import { parsePaginationQuery } from '../../utils/pagination.js';
import {
    sanitizeAppointmentForClient,
    sanitizeDoctorForClient,
    sanitizeStaffForClient,
    sanitizeUserForClient,
} from '../../utils/clientSanitizers.js';

const getPaginatedAppointmentsForAdmin = async (query) => {
    const pagination = parsePaginationQuery(query, { defaultLimit: 50 });
    const [totalItems, appointments] = await getAppointmentsPage(pagination);

    return {
        message: 'Appointments fetched successfully',
        itemKey: 'appointments',
        items: appointments.map((appointment) => sanitizeAppointmentForClient(appointment)),
        totalItems,
        ...pagination,
    };
};

const getPaginatedDoctorsForAdmin = async (query) => {
    const pagination = parsePaginationQuery(query, { defaultLimit: 50 });
    const [totalItems, doctors] = await getDoctorsPage(pagination);

    return {
        message: 'Doctors fetched successfully',
        itemKey: 'doctors',
        items: doctors.map((doctor) => sanitizeDoctorForClient(doctor)),
        totalItems,
        ...pagination,
    };
};

const getPaginatedPatientsForAdmin = async (query) => {
    const pagination = parsePaginationQuery(query, { defaultLimit: 50 });
    const [totalItems, patients] = await getPatientsPage(pagination);

    return {
        message: 'Patients fetched successfully',
        itemKey: 'patients',
        items: patients.map((patient) => sanitizeUserForClient(patient, { viewer: 'admin' })),
        totalItems,
        ...pagination,
    };
};

const getPaginatedInvoicesForAdmin = async (query) => {
    const pagination = parsePaginationQuery(query, { defaultLimit: 50 });
    const [totalItems, invoices] = await getInvoicesPage(pagination);

    return {
        message: 'Invoices fetched successfully',
        itemKey: 'invoices',
        items: invoices,
        totalItems,
        ...pagination,
    };
};

const getPaginatedPaymentHistory = async ({ appointmentId, query }) => {
    const pagination = parsePaginationQuery(query, { defaultLimit: 20 });
    const [totalItems, paymentHistory] = await getPaymentHistoryPage({ appointmentId, ...pagination });

    return {
        message: 'Payment history fetched successfully',
        itemKey: 'paymentHistory',
        items: paymentHistory,
        totalItems,
        ...pagination,
    };
};

const getPaginatedAuditLogs = async (query) => {
    const pagination = parsePaginationQuery(query, { defaultLimit: 25 });
    const [totalItems, logs] = await getAuditLogsPage(pagination);

    return {
        message: 'Audit logs fetched successfully',
        itemKey: 'logs',
        items: logs,
        totalItems,
        ...pagination,
    };
};

const getPaginatedStaffForAdmin = async (query) => {
    const pagination = parsePaginationQuery(query, { defaultLimit: 50 });
    const [totalItems, staff] = await getStaffPage(pagination);

    return {
        message: 'Staff fetched successfully',
        itemKey: 'staff',
        items: staff.map((staffMember) => sanitizeStaffForClient(staffMember)),
        totalItems,
        ...pagination,
    };
};

const getAdminDashboardData = async () => {
    const dashboardSnapshot = await getDashboardSnapshot();

    return {
        doctors: dashboardSnapshot.doctorCount,
        appointments: dashboardSnapshot.appointmentCount,
        patients: dashboardSnapshot.patientCount,
        latestAppointments: dashboardSnapshot.latestAppointments.map((appointment) => sanitizeAppointmentForClient(appointment)),
    };
};

export {
    getAdminDashboardData,
    getPaginatedAppointmentsForAdmin,
    getPaginatedAuditLogs,
    getPaginatedDoctorsForAdmin,
    getPaginatedInvoicesForAdmin,
    getPaginatedPatientsForAdmin,
    getPaginatedPaymentHistory,
    getPaginatedStaffForAdmin,
};
