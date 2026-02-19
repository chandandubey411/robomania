import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Issue from "../components/Issue";
import ReportMap from "../components/ReportMap";
import HeroSection from '../components/HeroSection'
import HowItWorks from '../components/Working'
import FeaturesSection from '../components/FeaturesSection'
import ReportCategories from '../components/ReportCategories'
import "leaflet/dist/leaflet.css";


const UserDashboard = () => {
  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-screen-xl mx-auto px-4">
        <HeroSection />
         <Issue />
        <HowItWorks />
        <FeaturesSection />
        <ReportCategories />
        <ReportMap />
      </div>
    </div>
  );
};


export default UserDashboard;
