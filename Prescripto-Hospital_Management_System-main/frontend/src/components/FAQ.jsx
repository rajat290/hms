import React, { useState } from 'react'

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null)

    const faqs = [
        { q: "What are the OPD timings?", a: "Our General OPD operates from 9:00 AM to 5:00 PM, Monday to Saturday. Specialist consultations may vary; please book an appointment for specific timings." },
        { q: "Is insurance accepted?", a: "Yes, we partner with all major health insurance providers. Please carry your insurance card and a valid ID for cashless processing." },
        { q: "Are walk-in appointments allowed?", a: "While we prioritize booked appointments, emergency walk-ins are always accepted. For routine consultations, we recommend booking online to avoid long wait times." },
        { q: "Do you provide 24/7 emergency services?", a: "Absolutely. Our Trauma and Emergency Center is open 24/7 with a dedicated staff and ambulance service." },
        { q: "Is there parking available?", a: "Yes, we have a dedicated multi-level parking facility for patients and visitors, accessible via the main entrance." },
    ]

    return (
        <div className='py-20 flex flex-col items-center bg-gray-50/50 rounded-3xl' id='faq'>
            <h2 className='text-3xl font-bold text-secondary mb-10'>Common Patient Queries</h2>
            <div className='w-full max-w-3xl flex flex-col gap-4 px-4'>
                {faqs.map((faq, index) => (
                    <div key={index} className='bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm'>
                        <button
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className='w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 transition-all font-medium text-secondary'
                        >
                            <span>{faq.q}</span>
                            <span className={`text-xl transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-80' : 'max-h-0'}`}>
                            <p className='p-6 pt-0 text-gray-500 leading-relaxed border-t border-gray-50'>{faq.a}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default FAQ
