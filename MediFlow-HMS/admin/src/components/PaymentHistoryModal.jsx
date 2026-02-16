import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'

const PaymentHistoryModal = ({ appointmentId, onClose, backendUrl, aToken, currency }) => {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/payment-history/${appointmentId}`, {
                headers: { aToken }
            })
            const data = await response.json()
            if (data.success) {
                setHistory(data.paymentHistory)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [appointmentId])

    return (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4'>
            <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200'>
                <div className='bg-indigo-600 p-4 flex justify-between items-center'>
                    <h2 className='text-white font-semibold flex items-center gap-2'>
                        <span className='text-xl'>🕒</span> Payment History
                    </h2>
                    <button onClick={onClose} className='text-white/80 hover:text-white transition-colors text-2xl font-light'>&times;</button>
                </div>

                <div className='p-6 max-h-[60vh] overflow-y-auto'>
                    {loading ? (
                        <div className='flex justify-center py-10'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
                        </div>
                    ) : history.length > 0 ? (
                        <div className='space-y-4'>
                            {history.map((log, index) => (
                                <div key={index} className='flex gap-4 relative'>
                                    {index !== history.length - 1 && (
                                        <div className='absolute left-[15px] top-8 w-[2px] h-[calc(100%+16px)] bg-gray-100 z-0'></div>
                                    )}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${log.type === 'payment' ? 'bg-green-100 text-green-600' :
                                            log.type === 'refund' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                        {log.type === 'refund' ? '↩️' : '💰'}
                                    </div>
                                    <div className='flex-1'>
                                        <div className='flex justify-between items-start'>
                                            <p className='font-semibold text-gray-800 capitalize'>{log.type.replace('_', ' ')}</p>
                                            <p className='font-bold text-gray-900'>{log.type === 'refund' ? '-' : '+'}{currency}{log.amount}</p>
                                        </div>
                                        <p className='text-xs text-gray-500 mb-1'>
                                            {new Date(log.timestamp).toLocaleString()} • {log.method}
                                        </p>
                                        {log.notes && (
                                            <div className='bg-gray-50 p-2 rounded text-xs text-gray-600 italic border-l-2 border-gray-200'>
                                                "{log.notes}"
                                            </div>
                                        )}
                                        <p className='text-[10px] text-gray-400 mt-1'>Processed by: {log.processedBy}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='text-center py-10 text-gray-500'>
                            <p className='text-4xl mb-2'>🔍</p>
                            <p>No transactions found for this appointment.</p>
                        </div>
                    )}
                </div>

                <div className='p-4 bg-gray-50 border-t flex justify-end'>
                    <button
                        onClick={onClose}
                        className='px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all shadow-sm'
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PaymentHistoryModal
