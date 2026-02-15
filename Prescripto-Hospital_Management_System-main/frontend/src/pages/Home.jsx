import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import Services from '../components/Services'
import Stats from '../components/Stats'
import FAQ from '../components/FAQ'

const Home = () => {
  return (
    <div>
      <Header />
      <SpecialityMenu />
      <Services />
      <TopDoctors />
      <Stats />
      <Banner />
      <FAQ />
    </div>
  )
}

export default Home