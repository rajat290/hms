import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import AdminContextProvider from './context/AdminContext.jsx'
import DoctorContextProvider from './context/DoctorContext.jsx'
import AppContextProvider from './context/AppContext.jsx'
import StaffContextProvider from './context/StaffContext.jsx'

import NotificationContextProvider from './context/NotificationContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AdminContextProvider>
      <DoctorContextProvider>
        <StaffContextProvider>
          <AppContextProvider>
            <NotificationContextProvider>
              <App />
            </NotificationContextProvider>
          </AppContextProvider>
        </StaffContextProvider>
      </DoctorContextProvider>
    </AdminContextProvider>
  </BrowserRouter>,
)
