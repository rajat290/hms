import { jsPDF } from 'jspdf';
import { formatSlotDate } from '@shared/utils/date.js';

export const downloadInvoicePdf = (appointment, currencySymbol) => {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('INVOICE', 105, 20, null, null, 'center');

  doc.setFontSize(10);
  doc.text(`Invoice ID: INV-${appointment._id.slice(-6).toUpperCase()}`, 132, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 132, 36);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Billed To:', 20, 52);
  doc.setFont(undefined, 'normal');
  doc.text(`Patient Name: ${appointment.userData?.name || 'Patient'}`, 20, 60);
  doc.text(`Phone: ${appointment.userData?.phone || 'N/A'}`, 20, 66);

  doc.setFont(undefined, 'bold');
  doc.text('Service Provider:', 120, 52);
  doc.setFont(undefined, 'normal');
  doc.text(`Dr. ${appointment.docData?.name || 'Doctor'}`, 120, 60);
  doc.text(`${appointment.docData?.speciality || 'Consultation'}`, 120, 66);
  doc.text(`${appointment.docData?.address?.line1 || ''}`, 120, 72);

  doc.line(20, 84, 190, 84);
  doc.setFont(undefined, 'bold');
  doc.text('Description', 20, 92);
  doc.text('Amount', 160, 92);
  doc.line(20, 95, 190, 95);

  doc.setFont(undefined, 'normal');
  doc.text('Medical appointment consultation', 20, 106);
  doc.text(`Date: ${formatSlotDate(appointment.slotDate)} Time: ${appointment.slotTime}`, 20, 112);
  doc.text(`${currencySymbol}${appointment.amount}`, 160, 106);

  doc.line(20, 122, 190, 122);
  doc.setFont(undefined, 'bold');
  doc.text('Total Paid:', 124, 130);
  doc.text(`${currencySymbol}${appointment.amount}`, 160, 130);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text('Thank you for choosing MediFlow.', 105, 150, null, null, 'center');

  doc.save(`Invoice_${appointment._id}.pdf`);
};

export const downloadPrescriptionPdf = (prescription, appointment) => {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('Prescription', 105, 20, null, null, 'center');

  doc.setFontSize(12);
  doc.text(`Doctor: ${appointment.docData?.name || 'Doctor'}`, 20, 40);
  doc.text(`Speciality: ${appointment.docData?.speciality || 'General Consultation'}`, 20, 50);
  doc.text(`Date: ${formatSlotDate(appointment.slotDate)}`, 20, 60);

  doc.line(20, 70, 190, 70);
  doc.setFontSize(16);
  doc.text('Medicines', 20, 84);

  doc.setFontSize(12);
  let yPos = 98;
  prescription.medicines.forEach((medicine, index) => {
    doc.text(`${index + 1}. ${medicine.name} - ${medicine.dosage} (${medicine.duration})`, 20, yPos);
    if (medicine.instruction) {
      doc.text(`Instruction: ${medicine.instruction}`, 24, yPos + 7);
      yPos += 18;
      return;
    }

    yPos += 14;
  });

  doc.save(`Prescription_${appointment.slotDate}.pdf`);
};
