// API to update doctor profile from Admin Panel
const updateDoctor = async (req, res) => {
    try {
        const { docId, name, email, experience, fees, about, speciality, degree, address } = req.body;
        const imageFile = req.file;

        // Validate required fields
        if (!docId || !name || !email || !experience || !fees || !about || !speciality || !degree || !address) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        // Validate email format
        const validator = require('validator');
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Check if doctor exists
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Prepare update data
        const updateData = {
            name,
            email,
            experience,
            fees: Number(fees),
            about,
            speciality,
            degree,
            address: typeof address === 'string' ? JSON.parse(address) : address
        };

        // Handle image upload if provided
        if (imageFile) {
            const { v2: cloudinary } = require('cloudinary');
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            updateData.image = imageUpload.secure_url;
        }

        // Update doctor in database
        await doctorModel.findByIdAndUpdate(docId, updateData, { new: true });

        res.json({ success: true, message: 'Doctor updated successfully' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Export the function
module.exports = { updateDoctor };