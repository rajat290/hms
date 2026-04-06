const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatSlotDate = (slotDate) => {
    if (typeof slotDate !== 'string' || !slotDate.includes('_')) {
        return slotDate || '';
    }

    const [day, month, year] = slotDate.split('_');
    const monthIndex = Number(month) - 1;

    if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex >= MONTHS.length) {
        return slotDate.replace(/_/g, '/');
    }

    return `${day} ${MONTHS[monthIndex]} ${year}`;
};

const calculateAgeFromDob = (dob) => {
    const birthDate = new Date(dob);

    if (Number.isNaN(birthDate.getTime())) {
        return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
    }

    return age;
};

export { MONTHS, calculateAgeFromDob, formatSlotDate };
