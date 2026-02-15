import React from 'react'

const Stats = () => {
    const stats = [
        { label: 'Patient Rating', value: '4.8/5 ⭐' },
        { label: 'Trusted Patients', value: '10,000+' },
        { label: 'Specialist Doctors', value: '100+' },
        { label: 'Years of Excellence', value: '15+' }
    ]

    return (
        <div className='py-20 bg-gradient-primary rounded-[3rem] my-20 flex flex-col items-center text-white relative overflow-hidden'>
            <div className='absolute top-0 left-0 w-full h-full bg-white/5 opacity-20 pointer-events-none'></div>

            <h2 className='text-3xl md:text-4xl font-bold mb-12 relative z-10'>Why Patients Trust Us</h2>

            <div className='flex flex-wrap justify-around items-center gap-12 px-6 w-full relative z-10'>
                {stats.map((stat, index) => (
                    <div key={index} className='text-center glass-effect bg-white/10 border-white/10 p-8 rounded-3xl min-w-[200px] hover:scale-110 transition-transform'>
                        <p className='text-4xl md:text-5xl font-extrabold mb-3'>{stat.value}</p>
                        <p className='text-sm md:text-base font-medium opacity-90 uppercase tracking-widest'>{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Stats
